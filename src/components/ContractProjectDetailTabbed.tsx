import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, RefreshCw, Minus, AlertCircle, CheckCircle, Eye, Download, Calendar, User, Tag, FileText, Clock, TrendingUp, BarChart3, Building2 } from 'lucide-react';
import { Tab } from '@headlessui/react';
import { 
  ArrowLeft, 
  GitBranch,
  Info,
  Upload,
  Trash2,
  X
} from 'lucide-react';
import { Menu } from '@headlessui/react';
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

// Helper function to extract section number for sorting
const getSectionSortKey = (sectionString: string): number => {
  // Remove common prefixes and clean the string
  const cleaned = sectionString
    .toLowerCase()
    .replace(/^(section|article|clause|paragraph|part|schedule|exhibit|appendix)\s*/i, '')
    .trim();
  
  // Try to extract the first number (including decimals)
  const numberMatch = cleaned.match(/^(\d+(?:\.\d+)*)/);
  
  if (numberMatch) {
    const numberStr = numberMatch[1];
    // Convert to float for proper sorting (e.g., "4.2" becomes 4.2)
    return parseFloat(numberStr);
  }
  
  // Handle special cases
  if (cleaned.includes('preamble') || cleaned.includes('recital')) {
    return 0; // Sort preambles and recitals first
  }
  
  if (cleaned.includes('signature') || cleaned.includes('execution')) {
    return 9999; // Sort signature sections last
  }
  
  // For sections without clear numbers, try to extract any number
  const anyNumberMatch = cleaned.match(/(\d+)/);
  if (anyNumberMatch) {
    return parseInt(anyNumberMatch[1]);
  }
  
  // Default fallback - use a high number to sort unknown sections towards the end
  return 1000;
};

// Helper function to safely format dates
const safeFormatDate = (dateString: string, formatString: string = 'MMMM dd, yyyy'): string => {
  if (!dateString) return 'Not available';
  
  const date = new Date(dateString);
  if (!isValid(date)) return 'Invalid date';
  
  return format(date, formatString);
};

// Helper function to format file sizes
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Helper function to render GitHub-style diff
const renderGitHubStyleDiff = (oldText: string, newText: string) => {
  if (!oldText && !newText) return null;
  
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];
  
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
        <span className="text-xs font-mono text-gray-600">Changes</span>
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
  const [expandedDiffs, setExpandedDiffs] = useState<Set<string>>(new Set());
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [deletingDocuments, setDeletingDocuments] = useState<Set<string>>(new Set());
  
  // Document text viewer state
  const [showDocumentText, setShowDocumentText] = useState(false);
  const [selectedDocumentText, setSelectedDocumentText] = useState<{
    name: string;
    text: string | null;
    extractionStatus: string;
    extractionError?: string | null;
  } | null>(null);

  const { documents, deleteDocument, refetch: refetchDocuments } = useDocuments(project.id);
  const { deleteProject, refetch: refetchProjects } = useProjects();
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'amendment': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ancillary': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const handleDeleteDocument = async (documentId: string) => {
    try {
      setDeletingDocuments(prev => new Set(prev).add(documentId));
      await deleteDocument(documentId);
      setDocumentToDelete(null);
      
      // Refresh both documents and projects to update counts
      await Promise.all([
        refetchDocuments(),
        refetchProjects()
      ]);
      
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error('Failed to delete document');
    } finally {
      setDeletingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handleViewDocumentText = (document: any) => {
    const dbDocument = documents.find(doc => doc.document_id === document.id);
    
    setSelectedDocumentText({
      name: document.name,
      text: dbDocument?.extracted_text || null,
      extractionStatus: dbDocument?.text_extraction_status || 'unknown',
      extractionError: dbDocument?.text_extraction_error || null
    });
    setShowDocumentText(true);
  };
// Two-level grouping: major sections → sub-clauses
type SubGroup = {
  section: string;
  changes: any[];
};
type NestedGroup = {
  section: string;
  subsections: SubGroup[];
};

const getNestedGroupedClauseChanges = (clauseChangeLog: any[]): NestedGroup[] => {
  if (!clauseChangeLog?.length) return [];

  // 1) Group all changes by their major section number
  const byMajor: Record<number, any[]> = {};
  clauseChangeLog.forEach(change => {
    const major = Math.floor(getSectionSortKey(change.section));
    (byMajor[major] ||= []).push(change);
  });

  // 2) Sort the major section keys numerically
  const sortedMajors = Object.keys(byMajor)
    .map(k => parseInt(k))
    .sort((a, b) => a - b);

  // 3) Build the nested groups
  return sortedMajors.map(major => {
    const allChanges = byMajor[major];

    // Find a “Section X – Title” entry for the heading, or fallback
    const primary = allChanges.find(
      c => Math.floor(getSectionSortKey(c.section)) === getSectionSortKey(c.section)
    );
    const majorLabel = primary ? primary.section : `Section ${major}`;

    // 4) Within this major, group by the full sub-clause string
    const bySub: Record<string, any[]> = {};
    allChanges.forEach(c => (bySub[c.section] ||= []).push(c));

    // 5) Sort sub-clauses by their numeric key
    const sortedSubs = Object.keys(bySub).sort((a, b) =>
      getSectionSortKey(a) - getSectionSortKey(b)
    );

    // 6) Build the SubGroup array
    const subsections: SubGroup[] = sortedSubs.map(sub => ({
      section: sub,
      changes: bySub[sub]
    }));

    return { section: majorLabel, subsections };
  });
};


  // Sort clause change log by section number
  const sortedClauseChangeLog = mergeResult?.clause_change_log 
    ? [...mergeResult.clause_change_log].sort((a, b) => {
        const sectionA = getSectionSortKey(a.section);
        const sectionB = getSectionSortKey(b.section);
        
        // Primary sort by section number
        if (sectionA !== sectionB) {
          return sectionA - sectionB;
        }
        
        // Secondary sort by change type (added, modified, deleted)
        const changeTypeOrder = { 'added': 1, 'modified': 2, 'deleted': 3 };
        return (changeTypeOrder[a.change_type] || 4) - (changeTypeOrder[b.change_type] || 4);
      })
    : [];

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
      // Parse and sort the document incorporation log chronologically
      const timelineItems = mergeResult.document_incorporation_log.map((doc, index) => {
        // Parse the document incorporation log entry
        // Format: "filename (role, date)"
        const match = doc.match(/^(.+?)\s*\((.+?),\s*(.+?)\)$/);
        if (match) {
          const [, filename, role, dateStr] = match;
          const cleanDateStr = dateStr.trim();
          
          // Try to parse the date
          let parsedDate = new Date(cleanDateStr);
          
          // If the date is invalid, try different formats
          if (!isValid(parsedDate)) {
            // Try parsing as YYYY-MM-DD
            const isoMatch = cleanDateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (isoMatch) {
              parsedDate = new Date(cleanDateStr);
            } else {
              // Fallback to project creation date + index
              parsedDate = new Date(project.uploadDate);
              parsedDate.setDate(parsedDate.getDate() + index);
            }
          }
          
          return {
            id: `doc-${index}`,
            title: filename.trim(),
            date: parsedDate.toISOString(),
            type: role.trim().toLowerCase().includes('base') ? 'base' as const : 'amendment' as const,
            description: `${role.trim()} document processed`,
            sortDate: parsedDate.getTime() // Add sort key for reliable sorting
          };
        }
        
        // Fallback parsing
        const fallbackDate = new Date(project.uploadDate);
        fallbackDate.setDate(fallbackDate.getDate() + index);
        
        return {
          id: `doc-${index}`,
          title: doc,
          date: fallbackDate.toISOString(),
          type: index === 0 ? 'base' as const : 'amendment' as const,
          description: `Document ${index + 1}`,
          sortDate: fallbackDate.getTime()
        };
      });

      // Sort by date chronologically (earliest to latest, left to right)
      const sortedTimeline = timelineItems.sort((a, b) => a.sortDate - b.sortDate);
      
      console.log('📅 Timeline sorted chronologically:', sortedTimeline.map(item => ({
        title: item.title,
        date: item.date,
        type: item.type
      })));
      
      return sortedTimeline;
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

  // Generate documents data from real database documents with proper file size formatting
  const generateDocumentsData = () => {
    return documents.map(doc => ({
      id: doc.document_id,
      name: doc.name,
      uploadDate: doc.creation_date,
      type: doc.mime_type.includes('pdf') ? 'PDF' : 'DOCX',
      size: formatFileSize(doc.file_size), // Use the formatFileSize function
      status: doc.upload_status as 'complete' | 'processing' | 'error'
    }));
  };

  const documentsData = generateDocumentsData();

  // Filter amendment summaries to exclude base documents and sort chronologically
  const getFilteredAndSortedAmendmentSummaries = () => {
    if (!mergeResult?.amendment_summaries || !mergeResult?.document_incorporation_log) return [];
    
    // Only show amendments and ancillary documents, exclude base documents
    const filteredAmendments = mergeResult.amendment_summaries.filter(amendment => 
      amendment.role === 'amendment' || amendment.role === 'ancillary'
    );

    // Create a map of document names to their chronological order
    const documentOrderMap = new Map<string, number>();
    mergeResult.document_incorporation_log.forEach((doc, index) => {
      // Parse the document incorporation log entry
      // Format: "filename (role, date)"
      const match = doc.match(/^(.+?)\s*\((.+?),\s*(.+?)\)$/);
      if (match) {
        const [, filename, role, dateStr] = match;
        const cleanFilename = filename.trim();
        const cleanDateStr = dateStr.trim();
        
        // Try to parse the date for sorting
        let parsedDate = new Date(cleanDateStr);
        
        // If the date is invalid, try different formats
        if (!isValid(parsedDate)) {
          // Try parsing as YYYY-MM-DD
          const isoMatch = cleanDateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
          if (isoMatch) {
            parsedDate = new Date(cleanDateStr);
          } else {
            // Fallback to index-based ordering
            parsedDate = new Date(Date.now() + index * 24 * 60 * 60 * 1000);
          }
        }
        
        documentOrderMap.set(cleanFilename, parsedDate.getTime());
      }
    });

    // Sort the filtered amendments by their chronological order
    const sortedAmendments = filteredAmendments.sort((a, b) => {
      const orderA = documentOrderMap.get(a.document) || 0;
      const orderB = documentOrderMap.get(b.document) || 0;
      return orderA - orderB;
    });

    console.log('📅 Amendment summaries sorted chronologically:', sortedAmendments.map(amendment => ({
      document: amendment.document,
      role: amendment.role,
      order: documentOrderMap.get(amendment.document)
    })));

    return sortedAmendments;
  };

  const filteredAndSortedAmendmentSummaries = getFilteredAndSortedAmendmentSummaries();

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

              {!mergeResult || (!mergeResult.clause_change_log?.length && !filteredAndSortedAmendmentSummaries.length) ? (
                <NoDataMessage
                  title="No Clause Changes Detected"
                  description="Run AI analysis on your uploaded documents to detect and analyze clause-level changes, additions, and deletions."
                  icon={<AlertCircle className="w-8 h-8 text-gray-400" />}
                />
              ) : (
                <div className="space-y-6">

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
                      {/* By Document View - Only show amendments and ancillary documents in chronological order */}
                      <Tab.Panel className="space-y-4">
                        <h3 className="text-base font-semibold text-gray-900">Changes by Document (Chronological Order)</h3>
                        
                        {filteredAndSortedAmendmentSummaries.length > 0 ? (
                          filteredAndSortedAmendmentSummaries.map((amendment, index) => (
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
                            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm">No amendments or ancillary documents found</p>
                            <p className="text-xs text-gray-400 mt-1">Only documents that modify the base contract are shown here</p>
                          </div>
                        )}
                      </Tab.Panel>

                      {/* By Section View */}
                      <Tab.Panel className="space-y-4">
                        <h3 className="text-base font-semibold text-gray-900">Changes by Section</h3>
                        
                        {getNestedGroupedClauseChanges(sortedClauseChangeLog).map((grp, i) => (
                          <div key={i} className="border border-gray-200 rounded-lg mb-4">
                            {/* Major section header */}
                            <button
                              onClick={() => toggleSection(`major-${i}`)}
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                            >
                              <span className="font-medium text-gray-900">{grp.section}</span>
                              {expandedSections.has(`major-${i}`) ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </button>

                            {expandedSections.has(`major-${i}`) && (
                              <div className="px-6 py-3 border-t border-gray-100 space-y-4">
                                {grp.subsections.map((sub, j) => (
                                  <div key={j} className="space-y-2">
                                    {/* Sub-clause header */}
                                    <div className="flex items-center space-x-2">
                                      <ChevronRight className="w-4 h-4 text-gray-400" />
                                      <span className="font-medium text-gray-800">
                                        {sub.section.replace(/\s*[-–—]\s*/, ': ')} ({sub.changes.length})
                                      </span>
                                    </div>
                                    {/* Individual changes */}
                                    <div className="ml-6 space-y-2">
                                      {sub.changes.map((chg, k) => {
                                        const diffKey = `d-${i}-${j}-${k}`;
                                        return (
                                          <div key={k} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                                            {/* Source label if you’ve added it */}
                                            {chg.document && (
                                              <div className="text-xs text-gray-500">
                                                Source: {chg.document}
                                              </div>
                                            )}
                                            {/* Human summary */}
                                            <p className="text-sm text-gray-600">{chg.summary}</p>
                                            {/* Optional diff toggle */}
                                            {(chg.old_text && chg.new_text && chg.old_text !== chg.new_text) && (
                                              <div className="space-y-3">
                                                <button
                                                  onClick={() => toggleDiff(diffKey)}
                                                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                  {expandedDiffs.has(diffKey) ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                  ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                  )}
                                                  <span>View changes</span>
                                                </button>
                                                {expandedDiffs.has(diffKey) && (
                                                  <div className="mt-3">
                                                    {renderGitHubStyleDiff(chg.old_text, chg.new_text)}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
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
                            <div className="flex items-center space-x-3">
                              <button 
                                onClick={() => handleViewDocumentText(doc)}
                                className="text-primary-600 hover:text-primary-700 transition-colors" 
                                title="View extracted text"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setDocumentToDelete(doc.id)}
                                disabled={deletingDocuments.has(doc.id)}
                                className="text-error-600 hover:text-error-700 transition-colors disabled:opacity-50" 
                                title="Delete"
                              >
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
                  {/* Single Download Button with Dropdown Menu */}
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                      <Download className="w-4 h-4" />
                      <span>Download Merged Contract</span>
                      <ChevronDown className="w-4 h-4" />
                    </Menu.Button>
                    
                    <Menu.Items className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => handleDownloadContract('pdf')}
                            className={`w-full flex items-center space-x-3 px-4 py-2 text-left text-sm transition-colors ${
                              active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                            <span>Download as PDF</span>
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => handleDownloadContract('docx')}
                            className={`w-full flex items-center space-x-3 px-4 py-2 text-left text-sm transition-colors ${
                              active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                            <span>Download as DOCX</span>
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => handleDownloadContract('txt')}
                            className={`w-full flex items-center space-x-3 px-4 py-2 text-left text-sm transition-colors ${
                              active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                            <span>Download as TXT</span>
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
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
                  {/* Disclaimer */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-amber-800 text-sm">
                    <p className="font-medium mb-1">AI-Generated Output</p>
                    <p>This document is a product of AI analysis and compilation of source contracts. It serves as a tool for review and understanding, not as an official or executed legal instrument.</p>
                  </div>
                  
                  {/* Always show full contract */}
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                      {finalContract}
                    </pre>
                  </div>

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

      {/* Document Text Viewer Modal */}
      {showDocumentText && selectedDocumentText && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Document Text</h3>
                  <p className="text-sm text-gray-600">{selectedDocumentText.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDocumentText(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden p-6">
              {selectedDocumentText.extractionStatus === 'complete' && selectedDocumentText.text ? (
                <div className="h-full">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Text extraction successful</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedDocumentText.text.length.toLocaleString()} characters
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 h-full overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                      {selectedDocumentText.text}
                    </pre>
                  </div>
                </div>
              ) : selectedDocumentText.extractionStatus === 'failed' ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Text Extraction Failed</h4>
                  <p className="text-gray-600 mb-4">
                    We could not extract text from this document.
                  </p>
                  {selectedDocumentText.extractionError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-md">
                      <p className="text-sm text-red-700">
                        <strong>Error:</strong> {selectedDocumentText.extractionError}
                      </p>
                    </div>
                  )}
                </div>
              ) : selectedDocumentText.extractionStatus === 'pending' || selectedDocumentText.extractionStatus === 'processing' ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Text Extraction In Progress</h4>
                  <p className="text-gray-600">
                    Please wait while we extract text from this document.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText className="w-12 h-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Text Available</h4>
                  <p className="text-gray-600">
                    No extracted text is available for this document.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDocumentText(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
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

      {/* Delete Document Confirmation Modal */}
      {documentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Document</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete this document?
              </p>
              <p className="text-gray-700">
                This will permanently remove:
              </p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li>• The document file from storage</li>
                <li>• All extracted text and analysis data</li>
                <li>• Document classification information</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setDocumentToDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDocument(documentToDelete)}
                disabled={deletingDocuments.has(documentToDelete)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingDocuments.has(documentToDelete) ? 'Deleting...' : 'Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractProjectDetailTabbed;