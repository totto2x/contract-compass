import React, { useState, useEffect } from 'react';
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
  Upload
} from 'lucide-react';
import { Menu } from '@headlessui/react';
import { format, isValid } from 'date-fns';
import { ContractProject } from '../types';
import ContractSummaryTab from './summary/ContractSummaryTab';
import { useDocumentMerging } from '../hooks/useDocumentMerging';
import { useDocuments } from '../hooks/useDocuments';

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

const ContractProjectDetailTabbed: React.FC<ContractProjectDetailTabbedProps> = ({ 
  project, 
  onBack, 
  onAddDocument 
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'timeline' | 'changes' | 'final'>('summary');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { documents } = useDocuments(project.id);
  const {
    mergeResult,
    isMerging,
    loadMergeResultFromDatabase,
    mergeDocumentsFromProject,
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

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
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
  const changeAnalysis = getRealOrMockChangeAnalysis();
  const finalContract = getRealOrMockFinalContract();

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

  const handleProcessDocuments = async () => {
    try {
      await mergeDocumentsFromProject(project.id);
    } catch (error) {
      console.error('Failed to process documents:', error);
    }
  };

  // Handle download with format selection
  const handleDownloadContract = (format: 'txt' | 'pdf' | 'docx') => {
    downloadFinalContract(`${project.name}-merged`, format);
  };

  const tabs = [
    { id: 'summary', label: 'Contract Summary', icon: FileText },
    { id: 'timeline', label: 'Amendment History', icon: GitBranch },
    { id: 'changes', label: 'Key Clause-Level Changes', icon: AlertCircle },
    { id: 'final', label: 'Final Contract', icon: CheckCircle }
  ];

  // Component for "No Data" state
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        if (!mergeResult) {
          return (
            <NoDataMessage
              title="No AI Analysis Available"
              description="Upload documents and run AI analysis to see a comprehensive contract summary with extracted parties, dates, and key terms."
              icon={<FileText className="w-8 h-8 text-gray-400" />}
            />
          );
        }
        return (
          <ContractSummaryTab
            project={project}
            stats={stats}
            changeSummary={changeSummary}
            timeline={timeline}
            mergeResult={mergeResult}
          />
        );

      case 'timeline':
        if (!mergeResult || timeline.length === 0) {
          return (
            <NoDataMessage
              title="No Document Timeline Available"
              description="Process your uploaded documents with AI to see the chronological timeline of contract amendments and changes."
              icon={<GitBranch className="w-8 h-8 text-gray-400" />}
            />
          );
        }
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-purple-600" />
              <span>Amendment History & Document Timeline</span>
            </h2>
            
            <div className="space-y-6">
              {timeline.map((item, index) => (
                <div key={item.id} className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                      item.type === 'base' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-purple-50 border-purple-200'
                    }`}>
                      <div className={`w-4 h-4 rounded-full ${
                        item.type === 'base' ? 'bg-green-500' : 'bg-purple-500'
                      }`}></div>
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.type === 'base' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{safeFormatDate(item.date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'changes':
        if (!mergeResult || changeAnalysis.sections.length === 0) {
          return (
            <NoDataMessage
              title="No Clause Changes Detected"
              description="Run AI analysis on your uploaded documents to detect and analyze clause-level changes, additions, and deletions."
              icon={<AlertCircle className="w-8 h-8 text-gray-400" />}
            />
          );
        }
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span>Key Clause-Level Changes Analysis</span>
            </h2>
            
            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 leading-relaxed">{changeAnalysis.summary}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Detailed Change Log</h3>
              
              {changeAnalysis.sections.map((section) => (
                <div key={section.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getChangeTypeColor(section.changeType)}`}>
                        {getChangeTypeIcon(section.changeType)}
                        <span className="ml-1 capitalize">{section.changeType}</span>
                      </span>
                      <span className="font-medium text-gray-900">{section.title}</span>
                    </div>
                    {expandedSections.has(section.id) ? 
                      <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    }
                  </button>
                  
                  {expandedSections.has(section.id) && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                      <div className="space-y-2">
                        {section.details.map((detail, index) => (
                          <div key={index} className={`p-3 rounded-lg text-sm ${
                            detail.type === 'added' ? 'bg-green-50 border-l-4 border-green-400' :
                            detail.type === 'deleted' ? 'bg-red-50 border-l-4 border-red-400' :
                            'bg-blue-50 border-l-4 border-blue-400'
                          }`}>
                            <div className="flex items-start space-x-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                detail.type === 'added' ? 'bg-green-100 text-green-800' :
                                detail.type === 'deleted' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {detail.type === 'added' ? '+' : detail.type === 'deleted' ? '-' : '~'}
                              </span>
                              <span className="text-gray-700">{detail.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>Show source document</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'final':
        if (!mergeResult || !finalContract) {
          return (
            <NoDataMessage
              title="No Final Contract Available"
              description="Process your documents with AI to generate a unified final contract that merges all amendments and changes."
              icon={<CheckCircle className="w-8 h-8 text-gray-400" />}
            />
          );
        }
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Final Merged Contract</span>
              </h2>
              
              {/* Download Options Menu */}
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  <Download className="w-4 h-4" />
                  <span>Download Contract</span>
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
            
            {/* Full Contract Display */}
            <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                {finalContract}
              </pre>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
          {onAddDocument && (
            <button 
              onClick={onAddDocument}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add Document</span>
            </button>
          )}
          
          {documents.length > 0 && !mergeResult && (
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
              <span>{isMerging ? 'Processing...' : 'Process Documents'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ContractProjectDetailTabbed;