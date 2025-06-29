import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, RotateCcw, Eye, Plus } from 'lucide-react';

interface UploadSummaryProps {
  stats: {
    total: number;
    pending: number;
    uploading: number;
    success: number;
    error: number;
  };
  isUploading: boolean;
  onUpload: () => void;
  onRetryAll: () => void;
  onGoToDashboard: () => void;
  onProcessFiles: () => void;
  onViewProject?: () => void;
  onUploadMore?: () => void;
  projectName?: string;
  classificationResult?: {
    documents: Array<{
      filename: string;
      role: 'base' | 'amendment' | 'ancillary';
    }>;
  } | null;
  files?: Array<{
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
  }>;
}

const UploadSummary: React.FC<UploadSummaryProps> = ({
  stats,
  isUploading,
  onUpload,
  onRetryAll,
  onGoToDashboard,
  onProcessFiles,
  onViewProject,
  onUploadMore,
  projectName,
  classificationResult,
  files = [],
}) => {
  const hasFiles = stats.total > 0;
  const hasErrors = stats.error > 0;
  const allComplete = stats.success === stats.total && stats.total > 0;
  const canUpload = (stats.pending > 0 || stats.error > 0) && !isUploading;

  // Get the storage key for this project
  const getStorageKey = () => `uploadCounts_${projectName || 'default'}`;

  // Get stored cumulative counts
  const getStoredCounts = () => {
    const stored = localStorage.getItem(getStorageKey());
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored counts:', e);
      }
    }
    return { baseCount: 0, amendmentCount: 0, ancillaryCount: 0, processedFiles: [] };
  };

  // DEBUG: Log current stored counts
  useEffect(() => {
    const currentCounts = getStoredCounts();
    console.log('🔍 CURRENT STORED COUNTS:', {
      storageKey: getStorageKey(),
      counts: currentCounts,
      projectName: projectName || 'default'
    });
  }, [projectName]);

  // Update counts immediately when files are successfully uploaded
  useEffect(() => {
    if (!classificationResult || !files.length) return;

    const storedData = getStoredCounts();
    let hasNewSuccessfulUploads = false;
    let newBaseCount = storedData.baseCount;
    let newAmendmentCount = storedData.amendmentCount;
    let newAncillaryCount = storedData.ancillaryCount;
    const processedFiles = new Set(storedData.processedFiles || []);

    console.log('📊 Processing files for counts update:', {
      classificationResult: classificationResult.documents,
      files: files.map(f => ({ name: f.file.name, status: f.status })),
      currentStoredData: storedData
    });

    // Check each classified document
    classificationResult.documents.forEach(classifiedDoc => {
      const correspondingFile = files.find(file => file.file.name === classifiedDoc.filename);
      
      console.log(`🔍 Checking file: ${classifiedDoc.filename}`, {
        role: classifiedDoc.role,
        fileFound: !!correspondingFile,
        fileStatus: correspondingFile?.status,
        alreadyProcessed: processedFiles.has(classifiedDoc.filename)
      });
      
      // If file is successfully uploaded and we haven't counted it yet
      if (correspondingFile && 
          correspondingFile.status === 'success' && 
          !processedFiles.has(classifiedDoc.filename)) {
        
        hasNewSuccessfulUploads = true;
        processedFiles.add(classifiedDoc.filename);
        
        console.log(`✅ Adding ${classifiedDoc.filename} to ${classifiedDoc.role} count`);
        
        switch (classifiedDoc.role) {
          case 'base':
            newBaseCount++;
            break;
          case 'amendment':
            newAmendmentCount++;
            break;
          case 'ancillary':
            newAncillaryCount++;
            break;
        }
      }
    });

    // Update localStorage if we have new successful uploads
    if (hasNewSuccessfulUploads) {
      const updatedData = {
        baseCount: newBaseCount,
        amendmentCount: newAmendmentCount,
        ancillaryCount: newAncillaryCount,
        processedFiles: Array.from(processedFiles)
      };
      
      localStorage.setItem(getStorageKey(), JSON.stringify(updatedData));
      console.log('💾 Updated cumulative counts in localStorage:', updatedData);
    }
  }, [files, classificationResult, projectName]);

  // Get current cumulative counts for display
  const getCurrentCounts = () => {
    return getStoredCounts();
  };

  const { baseCount, amendmentCount, ancillaryCount } = getCurrentCounts();
  const totalClassified = baseCount + amendmentCount + ancillaryCount;

  // Clear counts when starting a new project (only if no project name)
  useEffect(() => {
    if (!projectName) {
      localStorage.removeItem('uploadCounts_default');
    }
  }, [projectName]);

  // Clear counts when "Upload More" is clicked to reset for new session
  const handleUploadMore = () => {
    if (onUploadMore) {
      onUploadMore();
    }
  };

  if (!hasFiles) return null;

  // Generate status message
  const getStatusMessage = () => {
    if (allComplete && classificationResult) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        text: `Files uploaded successfully`,
        subtext: `All ${stats.total} file${stats.total !== 1 ? 's' : ''} have been added to ${projectName || 'the project'}. You can now review contract data and track changes.`,
        className: 'text-green-700'
      };
    } else if (hasErrors && stats.success > 0) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        text: `${stats.success} of ${stats.total} file${stats.total !== 1 ? 's' : ''} uploaded successfully`,
        subtext: `Some files encountered errors during upload. You can retry the failed uploads or continue with the successfully uploaded files.`,
        className: 'text-yellow-700'
      };
    } else if (hasErrors && stats.success === 0) {
      return {
        icon: <XCircle className="w-5 h-5 text-red-600" />,
        text: `Upload failed for ${stats.error} file${stats.error !== 1 ? 's' : ''}`,
        subtext: `All files failed to upload. Please check your files and try again.`,
        className: 'text-red-700'
      };
    } else if (isUploading) {
      return {
        icon: <RotateCcw className="w-5 h-5 text-blue-600 animate-spin" />,
        text: `Uploading ${stats.uploading} file${stats.uploading !== 1 ? 's' : ''}...`,
        subtext: `Please wait while your files are being uploaded and processed.`,
        className: 'text-blue-700'
      };
    } else {
      return {
        icon: <CheckCircle className="w-5 h-5 text-gray-600" />,
        text: `Start Analysis of ${stats.pending} file${stats.pending !== 1 ? 's' : ''}`,
        subtext: `Click the process documents below to start analysis.`,
        className: 'text-gray-700'
      };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Analyze Documents</h3>

      {/* DEBUG INFO - Show current stored counts */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg border">
        <h4 className="text-xs font-bold text-gray-700 mb-2">🔍 DEBUG: Current Stored Counts</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Storage Key:</strong> {getStorageKey()}</p>
          <p><strong>Base Count:</strong> {baseCount}</p>
          <p><strong>Amendment Count:</strong> {amendmentCount}</p>
          <p><strong>Ancillary Count:</strong> {ancillaryCount}</p>
          <p><strong>Total Classified:</strong> {totalClassified}</p>
          <p><strong>Processed Files:</strong> {JSON.stringify(getStoredCounts().processedFiles)}</p>
        </div>
      </div>

      {/* Status Message */}
      <div className="mb-6">
        <div className={`flex items-center space-x-2 mb-2`}>
          {statusMessage.icon}
          <p className={`text-lg font-medium ${statusMessage.className}`}>
            {statusMessage.text}
          </p>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {statusMessage.subtext}
        </p>
      </div>

      {/* Cumulative Upload Summary - Show running totals that never reset */}
      {totalClassified > 0 && (
        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Project Upload Summary</h4>
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="font-medium text-gray-700">
                  {baseCount} Base contract{baseCount !== 1 ? 's' : ''} uploaded
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span className="font-medium text-gray-700">
                  {amendmentCount} Amendment{amendmentCount !== 1 ? 's' : ''} uploaded
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                <span className="font-medium text-gray-700">
                  {ancillaryCount} Ancillary doc{ancillaryCount !== 1 ? 's' : ''} uploaded
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {canUpload && (
          <button
            onClick={onUpload}
            disabled={isUploading}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <span>Process Documents</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {hasErrors && !isUploading && (
          <button
            onClick={onRetryAll}
            className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Failed</span>
          </button>
        )}

        {allComplete && (
          <>
            {/* Primary Action - View Project */}
            <button
              onClick={onViewProject || onGoToDashboard}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Eye className="w-4 h-4" />
              <span>View Project</span>
            </button>
            
            {/* Secondary Action - Upload More Documents */}
            {onUploadMore && (
              <button
                onClick={handleUploadMore}
                className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Upload More Documents</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UploadSummary;