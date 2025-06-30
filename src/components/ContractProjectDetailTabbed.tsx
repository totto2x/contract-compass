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
  AlertCircle,
  Plus,
  RefreshCw,
  Minus,
  ChevronRight,
  ChevronDown,
  Download,
  Eye,
  GitBranch,
  CheckCircle,
  FileIcon
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { Menu } from '@headlessui/react';
import { ContractProject } from '../types';
import { useDocumentMerging } from '../hooks/useDocumentMerging';
import { DatabaseService } from '../lib/database';
import { DocumentGenerator } from '../lib/documentGenerator';
import toast from 'react-hot-toast';
import ContractSummaryTab from './summary/ContractSummaryTab';

interface ContractProjectDetailTabbedProps {
  project: ContractProject;
  onBack: () => void;
  onAddDocument?: () => void;
}

// Define the structure of a clause change log entry
interface ClauseChangeLogEntry {
  section: string;
  change_type: 'modified' | 'added' | 'deleted';
  old_text: string;
  new_text: string;
  summary: string;
}

// Helper function to get change type icon
const getChangeTypeIcon = (changeType: 'added' | 'modified' | 'deleted') => {
  switch (changeType) {
    case 'added': return <Plus className="w-4 h-4" />;
    case 'modified': return <RefreshCw className="w-4 h-4" />;
    case 'deleted': return <Minus className="w-4 h-4" />;
    default: return <RefreshCw className="w-4 h-4" />;
  }
};

// Helper function to get change type colors
const getChangeTypeColor = (changeType: 'added' | 'modified' | 'deleted') => {
  switch (changeType) {
    case 'added': return 'bg-green-50 text-green-700 border-green-200';
    case 'modified': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'deleted': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

// Helper function to determine overall change type for a group of changes
const getOverallChangeType = (changes: ClauseChangeLogEntry[]): 'added' | 'modified' | 'deleted' => {
  // Priority: deleted > added > modified
  if (changes.some(c => c.change_type === 'deleted')) return 'deleted';
  if (changes.some(c => c.change_type === 'added')) return 'added';
  return 'modified';
};

// Helper function to extract document name from change context
const getDocumentSourceForChange = (
  change: ClauseChangeLogEntry, 
  documentIncorporationLog: string[],
  amendmentSummaries: any[]
): string => {
  // Try to find which document made this change by looking at amendment summaries
  // This is a heuristic approach since the clause_change_log doesn't directly reference documents
  
  // First, try to match by looking for similar text in amendment summaries
  for (const amendment of amendmentSummaries) {
    if (amendment.changes && Array.isArray(amendment.changes)) {
      const hasMatchingChange = amendment.changes.some((changeText: string) => 
        changeText.toLowerCase().includes(change.summary.toLowerCase().substring(0, 20)) ||
        change.summary.toLowerCase().includes(changeText.toLowerCase().substring(0, 20))
      );
      
      if (hasMatchingChange) {
        return amendment.document;
      }
    }
  }
  
  // Fallback: try to infer from section and change type patterns
  // This is less reliable but better than no information
  if (change.change_type === 'added') {
    // New additions are likely from the most recent amendment
    const lastAmendment = amendmentSummaries[amendmentSummaries.length - 1];
    if (lastAmendment) return lastAmendment.document;
  }
  
  // Final fallback: return "Unknown Document"
  return 'Unknown Document';
};

const ContractProjectDetailTabbed: React.FC<ContractProjectDetailTabbedProps> = ({
  project,
  onBack,
  onAddDocument
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedDiffs, setExpandedDiffs] = useState<Set<string>>(new Set());
  const [downloadingProjects, setDownloadingProjects] = useState<Set<string>>(new Set());

  const {
    isMerging,
    mergeResult,
    loadMergeResultFromDatabase,
    refreshMergeResult,
    clearResults,
    downloadFinalContract
  } = useDocumentMerging();

  // Load merge result when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadMergeResultFromDatabase(project.id);
      } catch (error) {
        console.error('Failed to load merge result:', error);
      }
    };

    loadData();
  }, [project.id, loadMergeResultFromDatabase]);

  const toggleDiff = (key: string) => {
    const newExpanded = new Set(expandedDiffs);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedDiffs(newExpanded);
  };

  const handleDownloadFinal = async (format: 'txt' | 'pdf' | 'docx') => {
    try {
      if (!mergeResult || !mergeResult.final_contract) {
        toast.error('No merged contract available for download');
        return;
      }

      setDownloadingProjects(prev => new Set(prev).add(project.id));

      const filename = `${project.name}-unified`;
      
      switch (format) {
        case 'txt':
          DocumentGenerator.generateTXT(mergeResult.final_contract, filename);
          toast.success('Contract downloaded as TXT file');
          break;

        case 'pdf':
          toast('Generating PDF document...');
          await DocumentGenerator.generatePDF(mergeResult.final_contract, filename);
          toast.success('Contract downloaded as PDF file');
          break;

        case 'docx':
          toast('Generating DOCX document...');
          await DocumentGenerator.generateDOCX(mergeResult.final_contract, filename);
          toast.success('Contract downloaded as DOCX file');
          break;

        default:
          toast.error('Unsupported download format');
          break;
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(`Failed to download ${format.toUpperCase()} contract`);
    } finally {
      setDownloadingProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(project.id);
        return newSet;
      });
    }
  };

  const handleRefreshAnalysis = async () => {
    try {
      await refreshMergeResult(project.id);
      toast.success('Contract analysis refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh analysis:', error);
      toast.error('Failed to refresh contract analysis');
    }
  };

  const renderGitHubStyleDiff = (oldText: string, newText: string) => {
    if (!oldText && !newText) return null;

    return (
      <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
          <span className="text-xs font-medium text-gray-600">Changes</span>
        </div>
        <div className="divide-y divide-gray-200">
          {oldText && (
            <div className="bg-red-50 px-3 py-2">
              <div className="flex items-start space-x-2">
                <span className="text-red-600 font-mono text-sm">-</span>
                <span className="text-red-800 text-sm">{oldText}</span>
              </div>
            </div>
          )}
          {newText && (
            <div className="bg-green-50 px-3 py-2">
              <div className="flex items-start space-x-2">
                <span className="text-green-600 font-mono text-sm">+</span>
                <span className="text-green-800 text-sm">{newText}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = format(new Date(startDate), 'MMM dd, yyyy');
    const end = format(new Date(endDate), 'MMM dd, yyyy');
    return `${start} – ${end}`;
  };

  const isDownloading = downloadingProjects.has(project.id);

  // Mock stats for now - in a real app, these would come from the merge result
  const stats = {
    totalClauses: mergeResult?.clause_change_log?.length || 0,
    amendmentsApplied: mergeResult?.amendment_summaries?.length || 0,
    changesDetected: mergeResult?.clause_change_log?.length || 0,
    lastProcessed: new Date().toISOString()
  };

  // Get the change summary from merge result
  const changeSummary = mergeResult?.base_summary || 'No contract analysis available. Please ensure documents have been processed.';

  // Create timeline from document incorporation log
  const timeline = mergeResult?.document_incorporation_log?.map((doc, index) => ({
    id: `doc-${index}`,
    title: doc.split('(')[0].trim(),
    date: new Date().toISOString(), // In real app, extract from doc string
    type: index === 0 ? 'base' as const : 'amendment' as const,
    description: doc
  })) || [];

  // Group clause changes by section
  const changesBySection = (mergeResult?.clause_change_log || []).reduce(
    (acc, change) => {
      const sec = change.section;
      if (!acc[sec]) acc[sec] = [];
      acc[sec].push(change);
      return acc;
    },
    {} as Record<string, ClauseChangeLogEntry[]>
  );

  // Convert to an array so we can .map(), preserving insertion order
  const groupedSectionSummaries = Object.entries(changesBySection).map(
    ([section, changes]) => ({ section, changes })
  );

  const tabs = [
    { name: 'Summary', icon: FileText },
    { name: 'Change Log', icon: GitBranch },
    { name: 'Source Documents', icon: FileIcon },
    { name: 'Final Contract', icon: CheckCircle }
  ];

  return (
    <div className="p-8 space-y-8">
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
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Complete
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{project.client}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDateRange(project.contractEffectiveStart, project.contractEffectiveEnd)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>{project.documentCount} document{project.documentCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
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
              className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Documents</span>
            </button>
          )}
          
          <button
            onClick={handleRefreshAnalysis}
            disabled={isMerging}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isMerging ? 'animate-spin' : ''}`} />
            <span>Refresh Analysis</span>
          </button>

          <Menu as="div" className="relative">
            <Menu.Button 
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isDownloading}
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Downloading...' : 'Download Contract'}</span>
              {!isDownloading && <ChevronDown className="w-4 h-4" />}
            </Menu.Button>
            
            {!isDownloading && (
              <Menu.Items className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleDownloadFinal('pdf')}
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
                      onClick={() => handleDownloadFinal('docx')}
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
                      onClick={() => handleDownloadFinal('txt')}
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
            )}
          </Menu>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 m-6 mb-0">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200 ${
                      selected
                        ? 'bg-white text-blue-700 shadow'
                        : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
                    }`
                  }
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </div>
                </Tab>
              );
            })}
          </Tab.List>

          <Tab.Panels className="p-6">
            {/* Summary Tab */}
            <Tab.Panel>
              <ContractSummaryTab
                project={project}
                stats={stats}
                changeSummary={changeSummary}
                timeline={timeline}
                mergeResult={mergeResult}
              />
            </Tab.Panel>

            {/* Change Log Tab */}
            <Tab.Panel>
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Change Log</h2>
                  <p className="text-gray-600 text-sm">Detailed contract changes and clause-level analysis</p>
                </div>

                {/* Sub-tabs for By Document vs By Section */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap text-sm font-medium">
                      By Document
                    </button>
                    <button className="py-2 px-1 border-b-2 border-blue-500 text-blue-600 whitespace-nowrap text-sm font-medium">
                      By Section
                    </button>
                  </nav>
                </div>

                {/* Changes by Section */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-gray-900">Changes by Section</h3>
                  
                  {groupedSectionSummaries.length > 0 ? (
                    <div className="space-y-4">
                      {groupedSectionSummaries.map(({ section, changes }, secIdx) => {
                        const overallChangeType = getOverallChangeType(changes);
                        const groupKey = `section-${secIdx}`;
                        
                        return (
                          <div key={groupKey} className="border border-gray-200 rounded-lg">
                            {/* Section Header */}
                            <div className="p-4 bg-gray-50 border-b border-gray-200">
                              <div className="flex items-center space-x-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getChangeTypeColor(overallChangeType)}`}>
                                  {getChangeTypeIcon(overallChangeType)}
                                  <span className="ml-1 capitalize">{overallChangeType}</span>
                                </span>
                                <span className="font-medium text-gray-900">{section}</span>
                                <span className="text-sm text-gray-500">({changes.length} change{changes.length !== 1 ? 's' : ''})</span>
                              </div>
                            </div>

                            {/* Individual Changes */}
                            <div className="p-4 space-y-3">
                              {changes.map((change, idx) => {
                                const changeKey = `${groupKey}-${idx}`;
                                const documentSource = getDocumentSourceForChange(
                                  change, 
                                  mergeResult?.document_incorporation_log || [],
                                  mergeResult?.amendment_summaries || []
                                );
                                
                                return (
                                  <div key={changeKey} className="border-l-4 border-gray-200 pl-4">
                                    <div className="space-y-2">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <p className="text-sm text-gray-700 leading-relaxed">{change.summary}</p>
                                          <div className="flex items-center space-x-2 mt-1">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getChangeTypeColor(change.change_type)}`}>
                                              {getChangeTypeIcon(change.change_type)}
                                              <span className="ml-1 capitalize">{change.change_type}</span>
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              from <span className="font-medium">{documentSource}</span>
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <button
                                        onClick={() => toggleDiff(changeKey)}
                                        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                                      >
                                        {expandedDiffs.has(changeKey) ? (
                                          <ChevronDown className="w-4 h-4" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4" />
                                        )}
                                        <span>View changes</span>
                                      </button>
                                      
                                      {expandedDiffs.has(changeKey) && renderGitHubStyleDiff(change.old_text, change.new_text)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No changes detected</h3>
                      <p className="text-gray-600">No clause-level changes were found in the contract analysis.</p>
                    </div>
                  )}
                </div>
              </div>
            </Tab.Panel>

            {/* Source Documents Tab */}
            <Tab.Panel>
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Source Documents</h2>
                  <p className="text-gray-600 text-sm">Documents used in the contract analysis and merging process</p>
                </div>

                {mergeResult?.document_incorporation_log && mergeResult.document_incorporation_log.length > 0 ? (
                  <div className="space-y-4">
                    {mergeResult.document_incorporation_log.map((doc, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{doc.split('(')[0].trim()}</p>
                            <p className="text-sm text-gray-600">{doc}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            index === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {index === 0 ? 'Base' : 'Amendment'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No source documents</h3>
                    <p className="text-gray-600">No document information available from the contract analysis.</p>
                  </div>
                )}
              </div>
            </Tab.Panel>

            {/* Final Contract Tab */}
            <Tab.Panel>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Final Contract</h2>
                    <p className="text-gray-600 text-sm">Complete merged contract with all amendments applied</p>
                  </div>
                  
                  <Menu as="div" className="relative">
                    <Menu.Button 
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      disabled={isDownloading}
                    >
                      <Download className="w-4 h-4" />
                      <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
                      {!isDownloading && <ChevronDown className="w-4 h-4" />}
                    </Menu.Button>
                    
                    {!isDownloading && (
                      <Menu.Items className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => handleDownloadFinal('pdf')}
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
                              onClick={() => handleDownloadFinal('docx')}
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
                              onClick={() => handleDownloadFinal('txt')}
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
                    )}
                  </Menu>
                </div>

                {mergeResult?.final_contract ? (
                  <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                      {mergeResult.final_contract}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No final contract</h3>
                    <p className="text-gray-600">The final merged contract is not available. Please refresh the analysis.</p>
                  </div>
                )}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default ContractProjectDetailTabbed;