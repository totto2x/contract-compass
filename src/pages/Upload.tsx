import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { FolderPlus, ArrowLeft, Upload as UploadIcon } from 'lucide-react';
import { useUpload } from '../hooks/useUpload';
import { useProjects } from '../hooks/useProjects';
import { useDocuments } from '../hooks/useDocuments';
import { useAuth } from '../hooks/useAuth';
import { useDocumentClassification } from '../hooks/useDocumentClassification';
import { useDocumentMerging } from '../hooks/useDocumentMerging';
import { ContractProject } from '../types';
import ProjectSetup from '../components/upload/ProjectSetup';
import FileDropzone from '../components/upload/FileDropzone';
import UploadProgress from '../components/upload/UploadProgress';
import UploadSummary from '../components/upload/UploadSummary';
import DocumentClassificationPanel from '../components/upload/DocumentClassificationPanel';
import DocumentMergePanel from '../components/upload/DocumentMergePanel';
import toast from 'react-hot-toast';

interface UploadPageProps {
  onGoToDashboard: () => void;
  uploadContext: { type: 'new-project' | 'add-to-project'; projectId?: string };
  selectedProject?: ContractProject;
  onViewProject?: (project: ContractProject) => void;
}

const UploadPage: React.FC<UploadPageProps> = ({ 
  onGoToDashboard, 
  uploadContext, 
  selectedProject,
  onViewProject 
}) => {
  const { user } = useAuth();
  const { createProject, refetch: refetchProjects } = useProjects(); // Add refetch function
  const [currentStep, setCurrentStep] = useState<'setup' | 'upload'>(
    uploadContext.type === 'add-to-project' ? 'upload' : 'setup'
  );
  const [projectData, setProjectData] = useState<{
    name: string;
    client: string;
    tags: string[];
  } | null>(
    uploadContext.type === 'add-to-project' && selectedProject ? {
      name: selectedProject.name,
      client: selectedProject.client,
      tags: selectedProject.tags
    } : null
  );
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(
    uploadContext.type === 'add-to-project' ? uploadContext.projectId || null : null
  );
  const [createdProject, setCreatedProject] = useState<ContractProject | null>(selectedProject || null);

  const { uploadDocument } = useDocuments(createdProjectId);
  const { 
    isClassifying, 
    classificationResult, 
    classifyDocuments, 
    clearResults: clearClassificationResults,
    rawApiResponse: classificationApiResponse,
    error: classificationError
  } = useDocumentClassification();
  
  const {
    isMerging,
    mergeResult,
    refreshMergeResult,
    clearResults: clearMergeResults,
    downloadFinalContract,
    rawApiResponse: mergeApiResponse,
    error: mergeError
  } = useDocumentMerging();

  const {
    files,
    isUploading,
    stats,
    addFiles,
    removeFile,
    uploadFiles: simulateUploadFiles,
    retryFile,
    clearFiles,
    updateFileStatus,
  } = useUpload();

  const handleProjectCreate = async (data: { name: string; client: string; tags: string[] }) => {
    try {
      // Create the project in the database
      const newProject = await createProject({
        project_name: data.name,
        counterparty: data.client || undefined,
        tags: data.tags
      });

      setProjectData(data);
      setCreatedProjectId(newProject.id);
      
      // Create a ContractProject object for the created project
      const contractProject: ContractProject = {
        id: newProject.id,
        name: newProject.project_name,
        client: newProject.counterparty || 'Unknown',
        documentCount: 0,
        uploadDate: newProject.created_at,
        lastUpdated: newProject.updated_at,
        contractEffectiveStart: newProject.created_at,
        contractEffectiveEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        tags: newProject.tags || [],
        baseContract: {
          id: 'default-contract',
          title: 'Default Contract',
          type: 'license',
          status: 'active',
          client: newProject.counterparty || 'Unknown',
          startDate: newProject.created_at,
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Default contract',
          tags: newProject.tags || [],
          projectId: newProject.id
        },
        amendments: [],
        totalDocuments: 0,
        status: 'complete'
      };
      
      setCreatedProject(contractProject);
      setCurrentStep('upload');
      // Removed duplicate toast notification here - createProject already shows a success toast
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project. Please try again.');
    }
  };

  const handleFilesAdded = async (newFiles: File[]) => {
    // Add files to the upload queue
    addFiles(newFiles);
    
    // Automatically classify the documents
    try {
      await classifyDocuments(newFiles);
    } catch (error) {
      console.error('Classification failed:', error);
      // Continue with upload even if classification fails
    }
  };

  const handleBackToSetup = () => {
    if (uploadContext.type === 'add-to-project') {
      // If adding to existing project, go back to project detail
      onGoToDashboard(); // This should ideally go back to project detail
    } else {
      // If creating new project, go back to setup
      setCurrentStep('setup');
      clearFiles();
      clearClassificationResults();
      clearMergeResults();
    }
  };

  const handleRetryAll = () => {
    const failedFiles = files.filter(f => f.status === 'error');
    failedFiles.forEach(file => retryFile(file.id));
  };

  const handleViewProject = () => {
    if (createdProject && onViewProject) {
      onViewProject(createdProject);
    } else {
      onGoToDashboard();
    }
  };

  const handleUploadMore = () => {
    // Clear current files and allow user to upload more
    clearFiles();
    clearClassificationResults();
    clearMergeResults();
    // Stay on the upload page to add more files
  };

  // Real upload function that saves to database with text extraction and classification
  const handleRealUpload = async () => {
    if (!createdProjectId) {
      toast.error('No project selected for upload');
      return;
    }

    if (files.length === 0) {
      toast.error('No files to upload');
      return;
    }

    try {
      // Upload each file to the database with text extraction and classification
      for (const uploadFile of files) {
        if (uploadFile.status === 'pending' || uploadFile.status === 'error') {
          try {
            // Update status to uploading
            updateFileStatus(uploadFile.id, 'uploading', 0);

            // Find the classification for this file
            const classification = classificationResult?.documents.find(
              doc => doc.filename === uploadFile.file.name
            );

            // Determine document type from classification or fallback
            let documentType: 'base' | 'amendment' = 'base';
            if (classification) {
              documentType = classification.role === 'amendment' ? 'amendment' : 'base';
            } else {
              // Fallback: first file is base, rest are amendments
              const isFirstFile = files.indexOf(uploadFile) === 0;
              documentType = isFirstFile ? 'base' : 'amendment';
            }

            // Prepare classification data for database
            const classificationData = classification ? {
              classification_role: classification.role,
              execution_date: classification.execution_date,
              effective_date: classification.effective_date,
              amends_document: classification.amends
            } : undefined;

            // Upload to database with progress tracking, text extraction, and classification
            await uploadDocument(
              uploadFile.file,
              documentType,
              (progress) => {
                updateFileStatus(uploadFile.id, 'uploading', progress);
              },
              classificationData
            );

            // Mark as successful
            updateFileStatus(uploadFile.id, 'success', 100);
          } catch (error) {
            console.error('Failed to upload file:', uploadFile.file.name, error);
            updateFileStatus(uploadFile.id, 'error', 0, 'Upload failed');
          }
        }
      }

      const successCount = files.filter(f => f.status === 'success').length;
      const errorCount = files.filter(f => f.status === 'error').length;

      if (errorCount === 0) {
        toast.success(`All ${successCount} files uploaded successfully with text extraction!`);
        
        // CRITICAL: Refresh project data to update document counts
        console.log('🔄 Refreshing project data to update document counts...');
        await refetchProjects();
        
        // After successful upload, trigger the merge using stored text from database
        await handleDocumentMerging();
        
      } else {
        toast.error(`${errorCount} file${errorCount > 1 ? 's' : ''} failed to upload`);
      }
    } catch (error) {
      console.error('Upload process failed:', error);
      toast.error('Upload process encountered errors');
    }
  };

  // Handle document merging after successful upload using stored text from database
  const handleDocumentMerging = async () => {
    if (!createdProjectId) {
      console.log('No project ID available for merging');
      return;
    }

    try {
      // Use the refresh function to force a new merge with all documents
      console.log('🔄 Triggering fresh contract merge with all documents...');
      await refreshMergeResult(createdProjectId);
      
    } catch (error) {
      console.error('Document merging failed:', error);
      // Don't show error toast as upload was successful
    }
  };

  // Handle download with format selection
  const handleDownloadContract = (format: 'txt' | 'pdf' | 'docx') => {
    const filename = `${projectData?.name || 'contract'}-merged`;
    downloadFinalContract(filename, format);
  };

  const getSuggestedProjectName = () => {
    if (files.length > 0) {
      const firstFile = files[0].file.name;
      return firstFile.replace(/\.(pdf|docx)$/i, '').replace(/[-_]/g, ' ');
    }
    return '';
  };

  const isNewProject = uploadContext.type === 'new-project';
  const isAddingToProject = uploadContext.type === 'add-to-project';

  return (
    <div className="p-8">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }}
      />
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={handleBackToSetup}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            {isNewProject ? (
              <FolderPlus className="w-5 h-5 text-blue-600" />
            ) : (
              <UploadIcon className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNewProject ? 'Create New Project' : 'Add Documents to Project'}
            </h1>
            <p className="text-gray-600">
              {isNewProject 
                ? (currentStep === 'setup' 
                    ? 'Set up your contract project details before uploading documents'
                    : `Upload documents for "${projectData?.name}" with automatic text extraction`)
                : `Add new documents to "${selectedProject?.name}" with automatic text extraction`
              }
            </p>
          </div>
        </div>

        {/* Progress Indicator - Only show for new projects */}
        {isNewProject && (
          <div className="flex items-center space-x-4 mb-6">
            <div className={`flex items-center space-x-2 ${currentStep === 'setup' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === 'setup' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Project Setup</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'upload' ? 'bg-blue-200' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === 'upload' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Upload & Extract Text</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-4xl space-y-8">
        {currentStep === 'setup' && isNewProject ? (
          <>
            {/* Getting Started Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">
                Getting Started
              </h2>
              <div className="text-sm text-blue-800 space-y-2">
                <p>• Create a project container to organize your contract documents</p>
                <p>• Add counterparty information and tags for better organization</p>
                <p>• Upload your base contract and any amendments or related documents</p>
                <p>• Text will be automatically extracted and stored for instant analysis</p>
                <p>• Our AI will classify, analyze, and merge documents using stored text</p>
              </div>
            </div>

            <ProjectSetup 
              onProjectCreate={handleProjectCreate}
              suggestedName={getSuggestedProjectName()}
            />
          </>
        ) : (
          <>
            {/* Project Info */}
            {projectData && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {isAddingToProject ? 'Adding Documents to Project' : 'Project Information'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Project Name</p>
                    <p className="text-gray-900">{projectData.name}</p>
                  </div>
                  {projectData.client && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Counterparty</p>
                      <p className="text-gray-900">{projectData.client}</p>
                    </div>
                  )}
                  {projectData.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Tags</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {projectData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {isAddingToProject && selectedProject && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Current project has {selectedProject.documentCount} existing document{selectedProject.documentCount !== 1 ? 's' : ''}. 
                      New documents will be added to this project with automatic text extraction and the contract analysis will be refreshed.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Upload Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">
                {isAddingToProject ? 'Add New Documents' : 'Upload Your Contract Documents'}
              </h2>
              <div className="text-sm text-blue-800 space-y-2">
                {isAddingToProject ? (
                  <>
                    <p>• Upload additional documents like amendments, addendums, or related contracts</p>
                    <p>• Supported formats: PDF and DOCX files only</p>
                    <p>• Maximum file size: 10MB per file</p>
                    <p>• Documents will be extracted, analyzed and processed to give you changelog and final contract</p>
                  </>
                ) : (
                  <>
                    <p>• Upload your base contract and any amendments or related documents</p>
                    <p>• Text will be automatically extracted once and stored in the database</p>
                    <p>• Documents will be automatically classified as base contracts, amendments, or ancillary</p>
                    <p>• AI will analyze relationships and merge all changes using stored text</p>
                    <p>• Supported formats: PDF and DOCX files only</p>
                    <p>• Maximum file size: 10MB per file</p>
                    <p>• Text extraction happens during upload - no duplicate processing!</p>
                  </>
                )}
              </div>
            </div>

            {/* File Dropzone */}
            <FileDropzone 
              onFilesAdded={handleFilesAdded}
              disabled={isUploading || isClassifying || isMerging}
            />

            {/* Document Classification Panel with Debug Info */}
            <DocumentClassificationPanel
              classificationResult={classificationResult}
              isClassifying={isClassifying}
              rawApiResponse={classificationApiResponse}
              classificationError={classificationError}
            />

            {/* Upload Progress */}
            <UploadProgress
              files={files}
              onRemoveFile={removeFile}
              onRetryFile={retryFile}
              disabled={isUploading || isMerging}
            />

            {/* Document Merge Panel with Debug Info */}
            <DocumentMergePanel
              mergeResult={mergeResult}
              isMerging={isMerging}
              onDownloadContract={handleDownloadContract}
              rawApiResponse={mergeApiResponse}
              mergeError={mergeError}
            />

            {/* Upload Summary */}
            <UploadSummary
              stats={stats}
              isUploading={isUploading || isMerging}
              onUpload={handleRealUpload}
              onRetryAll={handleRetryAll}
              onGoToDashboard={onGoToDashboard}
              onProcessFiles={() => {}} // Legacy prop, not used anymore
              onViewProject={handleViewProject}
              onUploadMore={handleUploadMore}
              projectName={projectData?.name}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default UploadPage;