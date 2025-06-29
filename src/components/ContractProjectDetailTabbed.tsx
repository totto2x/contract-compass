import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Tag, 
  FileText, 
  Clock, 
  TrendingUp, 
  BarChart3,
  Building2,
  Plus,
  Download,
  Eye,
  GitBranch,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Minus,
  ChevronDown,
  ChevronRight,
  Info,
  Upload,
  Trash2
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import clsx from 'clsx';
import { ContractProject } from '../types';
import ContractSummaryTab from './summary/ContractSummaryTab';
import { useDocumentMerging } from '../hooks/useDocumentMerging';
import { useDocuments } from '../hooks/useDocuments';
import { useProjects } from '../hooks/useProjects';
import toast from 'react-hot-toast';

interface ContractProjectDetailTabbedProps {
  project: ContractProject;
  onBack: () => void;
  onAddDocument?: () => void;
}

// Helper function to safely format dates
const safeFormatDate = (dateString: string, formatString: string = 'MMMM dd, yyyy'): string => {
  if (!dateString) return 'Not available';
  
  const date = new Date(dateString);
  if (!isValid(date)) return 'Invalid date';
  
  return format(date, formatString);
};

// Helper function to render GitHub-style diff
const renderGitHubStyleDiff = (oldText: string, newText: string) => {
  if (!oldText && !newText) return null;
  
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];
  
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
        <span className="text-xs font-mono text-gray-600">Diff</span>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {/* Removed lines */}
        {oldLines.map((line, index) => (
          <div key={`old-${index}`} className="flex">
            <div className="w-8 bg-red-100 text-red-600 text-xs font-mono text-center py-1 border-r border-red-200">
              -
            </div>
            <div className="flex-1 bg-red-50 px-3 py-1 text-sm font-mono text-red-800 border-r border-red-200">
              {line || ' '}
            </div>
          </div>
        ))}
        {/* Added lines */}
        {newLines.map((line, index) => (
          <div key={`new-${index}`} className="flex">
            <div className="w-8 bg-green-100 text-green-600 text-xs font-mono text-center py-1 border-r border-green-200">
              +
            </div>
            <div className="flex-1 bg-green-50 px-3 py-1 text-sm font-mono text-green-800">
              {line || ' '}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ContractProjectDetailTabbed: React.FC<ContractProjectDetailTabbedProps> = ({ 
  project, 
  onBack, 
  onAddDocument 
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullContract, setShowFullContract] = useState(false);
  const [expandedDiffs, setExpandedDiffs] = useState<Set<string>>(new Set());

  const { documents, refetch: refetchDocuments } = useDocuments(project.id);
  const { deleteProject } = useProjects();
  const {
    mergeResult,
    isMerging,
    loadMergeResultFromDatabase,
    refreshMergeResult,
    downloadFinalContract
  } = useDocumentMerging();

  // Load merge result when component mounts
  useEffect(() => {
    const loadExistingResult = async () => {
      try {
        await loadMergeResultFromDatabase(project.id);
      } catch (error) {
        console.error('Failed to load existing merge result:', error);
      }
    };

    loadExistingResult();
  }, [project.id, loadMergeResultFromDatabase]);

  // Watch for document changes and refresh merge result
  useEffect(() => {
    const handleDocumentChange = async () => {
      if (documents.length > 0) {
        console.log('📄 Documents changed, checking if merge result needs refresh...');
        
        // Check if we have a merge result and if the document count matches
        if (mergeResult && mergeResult.document_incorporation_log) {
          const mergeDocumentCount = mergeResult.document_incorporation_log.length;
          const currentDocumentCount = documents.length;
          
          if (currentDocumentCount !== mergeDocumentCount) {
            console.log(`🔄 Document count mismatch (current: ${currentDocumentCount}, merge: ${mergeDocumentCount}), refreshing merge result...`);
            try {
              await refreshMergeResult(project.id);
              toast.success('Contract analysis updated with new documents');
            } catch (error) {
              console.error('Failed to refresh merge result:', error);
              toast.error('Failed to update contract analysis');
            }
          }
        } else if (!mergeResult && documents.length > 0) {
          // No merge result but we have documents, try to load or create one
          console.log('🔄 No merge result found but documents exist, attempting to create merge result...');
          try {
            await refreshMergeResult(project.id);
            toast.success('Contract analysis generated for existing documents');
          } catch (error) {
            console.error('Failed to create merge result:', error);
          }
        }
      }
    };

    // Debounce the document change handler to avoid excessive API calls
    const timeoutId = setTimeout(handleDocumentChange, 1000);
    return () => clearTimeout(timeoutId);
  }, [documents.length, mergeResult, project.id, refreshMergeResult]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleDiff = (diffId: string) => {
    const newExpanded = new Set(expandedDiffs);
    if (newExpanded.has(diffId)) {
      newExpanded.delete(diffId);
    } else {
      newExpanded.add(diffId);
    }
    setExpandedDiffs(newExpanded);
  };

  // Use real data from OpenAI API if available, otherwise return empty/zero values
  const getRealOrMockStats = () => {
    if (mergeResult) {
      return {
        totalClauses: mergeResult.clause_change_log?.length || 0,
        amendmentsApplied: mergeResult.amendment_summaries?.length || 0,
        changesDetected: mergeResult.clause_change_log?.filter(change => 
          change.change_type === 'modified' || change.change_type === 'added'
        ).length || 0,
        lastProcessed: project.lastUpdated
      };
    }
    
    // Return empty values instead of mock data
    return {
      totalClauses: 0,
      amendmentsApplied: 0,
      changesDetected: 0,
      lastProcessed: project.lastUpdated
    };
  };

  const getRealOrMockChangeSummary = () => {
    if (mergeResult?.base_summary) {
      return mergeResult.base_summary;
    }
    
    // Return empty string instead of mock data
    return '';
  };

  const getRealOrMockTimeline = () => {
    if (mergeResult?.document_incorporation_log && mergeResult.document_incorporation_log.length > 0) {
      return mergeResult.document_incorporation_log.map((doc, index) => {
        // Parse the document incorporation log entry
        // Format: "filename (role, date)"
        const match = doc.match(/^(.+?)\s*\((.+?),\s*(.+?)\)$/);
        if (match) {
          const [, filename, role, date] = match;
          return {
            id: `doc-${index}`,
            title: filename.trim(),
            date: date.trim(),
            type: role.trim().toLowerCase().includes('base') ? 'base' as const : 'amendment' as const,
            description: `${role.trim()} document processed`
          };
        }
        
        // Fallback parsing
        return {
          id: `doc-${index}`,
          title: doc,
          date: project.contractEffectiveStart,
          type: index === 0 ? 'base' as const : 'amendment' as const,
          description: `Document ${index + 1}`
        };
      });
    }
    
    // Return empty array instead of mock data
    return [];
  };

  const getRealOrMockChangeAnalysis = () => {
    if (mergeResult?.clause_change_log && mergeResult.clause_change_log.length > 0) {
      return {
        summary: getRealOrMockChangeSummary(),
        sections: mergeResult.clause_change_log.map((change, index) => ({
          id: `change-${index}`,
          title: change.section,
          changeType: change.change_type as 'added' | 'modified' | 'deleted',
          description: change.summary,
          details: [
            ...(change.old_text ? [{ type: 'deleted' as const, text: change.old_text }] : []),
            ...(change.new_text ? [{ type: 'added' as const, text: change.new_text }] : [])
          ]
        }))
      };
    }
    
    // Return empty data instead of mock data
    return {
      summary: '',
      sections: []
    };
  };

  const getRealOrMockFinalContract = () => {
    if (mergeResult?.final_contract) {
      return mergeResult.final_contract;
    }
    
    // Return empty string instead of mock data
    return '';
  };

  // Get the actual data (real or empty)
  const stats = getRealOrMockStats();
  const changeSummary = getRealOrMockChangeSummary();
  const timeline = getRealOrMockTimeline();
  const finalContract = getRealOrMockFinalContract();
  const changeAnalysis = getRealOrMockChangeAnalysis();

  const getChangeTypeColor = (type: 'added' | 'modified' | 'deleted') => {
    switch (type) {
      case 'added': return 'text-green-700 bg-green-50 border-green-200';
      case 'modified': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'deleted': return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  const getChangeTypeIcon = (type: 'added' | 'modified' | 'deleted') => {
    switch (type) {
      case 'added': return <Plus className="w-4 h-4" />;
      case 'modified': return <RefreshCw className="w-4 h-4" />;
      case 'deleted': return <Minus className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'amendment': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ancillary': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'status-complete';
      case 'processing': return 'status-processing';
      case 'error': return 'status-error';
      default: return 'status-pending';
    }
  };

  const handleProcessDocuments = async () => {
    try {
      await refreshMergeResult(project.id);
      toast.success('Documents processed successfully');
    } catch (error) {
      console.error('Failed to process documents:', error);
      toast.error('Failed to process documents');
    }
  };

  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true);
      await deleteProject(project.id);
      setShowDeleteConfirm(false);
      // Navigate back to projects list
      onBack();
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle download with format selection
  const handleDownloadContract = (format: 'txt' | 'pdf' | 'docx') => {
    downloadFinalContract(`${project.name}-merged`, format);
  };

  const tabs = [
    { name: '📋 Summary', id: 'summary' },
    { name: '📊 Change Log', id: 'changelog' },
    { name: '📄 Source Documents', id: 'documents' },
    { name: '📘 Final Contract', id: 'contract' }
  ];

  // Component for "No Data" message
  const NoDataMessage: React.FC<{ 
    title: string; 
    description: string; 
    icon: React.ReactNode;
    showProcessButton?: boolean;
  }> = ({ title, description, icon, showProcessButton = true }) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {showProcessButton && documents.length > 0 && (
        <button
          onClick={handleProcessDocuments}
          disabled={isMerging}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {isMerging ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <BarChart3 className="w-5 h-5" />
          )}
          <span>{isMerging ? 'Processing Documents...' : 'Process Documents with AI'}</span>
        </button>
      )}
      {documents.length === 0 && onAddDocument && (
        <button
          onClick={onAddDocument}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Documents First</span>
        </button>
      )}
    </div>
  );

  // Generate documents data from real database documents
  const generateDocumentsData = () => {
    return documents.map(doc => ({
      id: doc.document_id,
      name: doc.name,
      uploadDate: doc.creation_date,
      type: doc.mime_type.includes('pdf') ? 'PDF' : 'DOCX',
      size: `${(doc.file_size / (1024 * 1024)).toFixed(1)} MB`,
      status: doc.upload_status as 'complete' | 'processing' | 'error'
    }));
  };

  const documentsData = generateDocumentsData();

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 legal-heading">{project.name}</h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                <CheckCircle className="w-4 h-4 mr-1" />
                Complete
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="font-medium">{project.client}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span className="font-medium">{project.documentCount} Document{project.documentCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Created {safeFormatDate(project.uploadDate, 'MMM dd, yyyy')}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Add Document Button */}
          {onAddDocument && (
            <button 
              onClick={onAddDocument}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add Document</span>
            </button>
          )}

          {/* Process Documents Button */}
          {documents.length > 0 && (
            <button 
              onClick={handleProcessDocuments}
              disabled={isMerging}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {isMerging ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              <span>{isMerging ? 'Processing...' : 'Refresh Analysis'}</span>
            </button>
          )}

          {/* Delete Project Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Delete project"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tab.Group>
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200 mb-8 rounded-t-xl">
          <Tab.List className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                className={({ selected }) =>
                  clsx(
                    'py-4 px-1 border-b-2 font-semibold text-sm transition-colors focus:outline-none',
                    selected
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
        </div>

        <Tab.Panels>
          {/* 📋 Summary Tab */}
          <Tab.Panel>
            {!mergeResult ? (
              <NoDataMessage
                title="No AI Analysis Available"
                description="Upload documents and run AI analysis to see a comprehensive contract summary with extracted parties, dates, and key terms."
                icon={<FileText className="w-8 h-8 text-gray-400" />}
              />
            ) : (
              <ContractSummaryTab
                project={project}
                stats={stats}
                changeSummary={changeSummary}
                timeline={timeline}
                mergeResult={mergeResult}
              />
            )}
          </Tab.Panel>

          {/* 📊 Change Log Tab */}
          <Tab.Panel className="space-y-6">
            <div className="card p-6">
              {/* Header with subtitle */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 legal-heading mb-2">Change Log</h2>
                <p className="text-sm text-gray-600 font-medium">Detailed contract changes and clause-level analysis</p>
              </div>

              {!mergeResult || (!mergeResult.clause_change_log?.length && !mergeResult.amendment_summaries?.length) ? (
                <NoDataMessage
                  title="No Clause Changes Detected"
                  description="Run AI analysis on your uploaded documents to detect and analyze clause-level changes, additions, and deletions."
                  icon={<AlertCircle className="w-8 h-8 text-gray-400" />}
                />
              ) : (
                <div className="space-y-6">
                  {/* AI-Generated Change Summary */}
                  {changeSummary && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-blue-900 mb-2">AI-Generated Summary</h3>
                      <p className="text-sm text-blue-800 leading-relaxed">{changeSummary}</p>
                    </div>
                  )}

                  {/* Nested Tab Group for By Document / By Section */}
                  <Tab.Group>
                    <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
                      <Tab
                        className={({ selected }) =>
                          clsx(
                            'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all',
                            'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                            selected
                              ? 'bg-white text-blue-700 shadow'
                              : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
                          )
                        }
                      >
                        By Document
                      </Tab>
                      <Tab
                        className={({ selected }) =>
                          clsx(
                            'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all',
                            'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                            selected
                              ? 'bg-white text-blue-700 shadow'
                              : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
                          )
                        }
                      >
                        By Section
                      </Tab>
                    </Tab.List>

                    <Tab.Panels className="mt-6">
                      {/* By Document View */}
                      <Tab.Panel className="space-y-4">
                        <h3 className="text-base font-semibold text-gray-900">Changes by Document</h3>
                        
                        {mergeResult.amendment_summaries && mergeResult.amendment_summaries.length > 0 ? (
                          mergeResult.amendment_summaries.map((amendment, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg">
                              <button
                                onClick={() => toggleSection(`amendment-${index}`)}
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(amendment.role)}`}>
                                    {amendment.role}
                                  </span>
                                  <span className="font-medium text-gray-900">{amendment.document}</span>
                                  <span className="text-sm text-gray-500">
                                    ({amendment.changes.length} change{amendment.changes.length !== 1 ? 's' : ''})
                                  </span>
                                </div>
                                {expandedSections.has(`amendment-${index}`) ? 
                                  <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                }
                              </button>
                              
                              {expandedSections.has(`amendment-${index}`) && (
                                <div className="px-4 pb-4 border-t border-gray-100">
                                  <div className="space-y-2 mt-3">
                                    {amendment.changes.map((change, changeIndex) => (
                                      <div key={changeIndex} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                        <span className="text-sm text-gray-700">{change}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <p>No amendment summaries available</p>
                          </div>
                        )}
                      </Tab.Panel>

                      {/* By Section View */}
                      <Tab.Panel className="space-y-4">
                        <h3 className="text-base font-semibold text-gray-900">Changes by Section</h3>
                        
                        {mergeResult.clause_change_log?.map((change, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg">
                            <button
                              onClick={() => toggleSection(`change-${index}`)}
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getChangeTypeColor(change.change_type)}`}>
                                  {getChangeTypeIcon(change.change_type)}
                                  <span className="ml-1 capitalize">{change.change_type}</span>
                                </span>
                                <span className="font-medium text-gray-900">{change.section}</span>
                              </div>
                              {expandedSections.has(`change-${index}`) ? 
                                <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              }
                            </button>
                            
                            {expandedSections.has(`change-${index}`) && (
                              <div className="px-4 pb-4 border-t border-gray-100">
                                <p className="text-sm text-gray-600 mb-3">{change.summary}</p>
                                
                                {change.old_text && change.new_text && change.old_text !== change.new_text && (
                                  <div className="space-y-3">
                                    <button
                                      onClick={() => toggleDiff(`diff-${index}`)}
                                      className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                      {expandedDiffs.has(`diff-${index}`) ? 
                                        <ChevronDown className="w-4 h-4" /> : 
                                        <ChevronRight className="w-4 h-4" />
                                      }
                                      <span>View diff</span>
                                    </button>
                                    
                                    {expandedDiffs.has(`diff-${index}`) && (
                                      <div className="mt-3">
                                        {renderGitHubStyleDiff(change.old_text, change.new_text)}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                </div>
              )}
            </div>
          </Tab.Panel>

          {/* 📄 Source Documents Tab */}
          <Tab.Panel className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2 legal-heading">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span>Source Documents ({project.documentCount} files)</span>
                </h2>
                <div className="flex space-x-3">
                  {onAddDocument && (
                    <button 
                      onClick={onAddDocument}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Document
                    </button>
                  )}
                  {documents.length > 0 && (
                    <button 
                      onClick={handleProcessDocuments}
                      disabled={isMerging}
                      className="btn-secondary"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reprocess Documents
                    </button>
                  )}
                </div>
              </div>

              {documents.length === 0 ? (
                <NoDataMessage
                  title="No Documents Uploaded"
                  description="Upload your contract documents to begin analysis and see detailed document information."
                  icon={<FileText className="w-8 h-8 text-gray-400" />}
                  showProcessButton={false}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Upload Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Size</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {documentsData.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <span className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                                {doc.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                            {safeFormatDate(doc.uploadDate)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                              {doc.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-medium">{doc.size}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(doc.status)}`}>
                              {doc.status === 'complete' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {doc.status === 'processing' && <Clock className="w-3 h-3 mr-1" />}
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <button className="text-primary-600 hover:text-primary-700 transition-colors" title="Preview">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={handleProcessDocuments}
                                disabled={isMerging}
                                className="text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50" 
                                title="Reprocess"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button className="text-error-600 hover:text-error-700 transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Tab.Panel>

          {/* 📘 Final Contract Tab */}
          <Tab.Panel className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2 legal-heading">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span>Final Merged Contract</span>
                </h2>
                
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => handleDownloadContract('pdf')}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download as PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownloadContract('docx')}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download as DOCX</span>
                  </button>
                  <button
                    onClick={() => handleDownloadContract('txt')}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download as TXT</span>
                  </button>
                </div>
              </div>

              {!mergeResult || !finalContract ? (
                <NoDataMessage
                  title="No Final Contract Available"
                  description="Process your documents with AI to generate a unified final contract that merges all amendments and changes."
                  icon={<CheckCircle className="w-8 h-8 text-gray-400" />}
                />
              ) : (
                <>
                  {showFullContract ? (
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                        {finalContract}
                      </pre>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Contract preview (first 300 characters):</p>
                      <p className="text-sm text-gray-700 font-mono">
                        {finalContract.substring(0, 300)}...
                      </p>
                      <button
                        onClick={() => setShowFullContract(true)}
                        className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Click to view full contract
                      </button>
                    </div>
                  )}

                  {/* Contract Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-primary-50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <p className="text-2xl font-bold text-primary-900">{Math.ceil(finalContract.length / 2000)}</p>
                      <p className="text-xs text-primary-700 font-semibold">Est. Pages</p>
                    </div>
                    
                    <div className="bg-success-50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle className="w-5 h-5 text-success-600" />
                      </div>
                      <p className="text-2xl font-bold text-success-900">{stats.totalClauses}</p>
                      <p className="text-xs text-success-700 font-semibold">Clauses</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <AlertCircle className="w-5 h-5 text-gray-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{stats.amendmentsApplied}</p>
                      <p className="text-xs text-gray-700 font-semibold">Amendments</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete <strong>"{project.name}"</strong>?
              </p>
              <p className="text-gray-700">
                This will permanently remove:
              </p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li>• All {project.documentCount} uploaded document{project.documentCount !== 1 ? 's' : ''}</li>
                <li>• Contract analysis results</li>
                <li>• Project metadata and settings</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractProjectDetailTabbed;