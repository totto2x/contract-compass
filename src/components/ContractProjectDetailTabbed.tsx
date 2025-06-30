import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Tag, 
  FileText, 
  Download, 
  Plus,
  Clock,
  Building2,
  BarChart3,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Minus,
  GitBranch,
  Eye
} from 'lucide-react';
import { Menu } from '@headlessui/react';
import { format, isValid } from 'date-fns';
import { useDocumentMerging } from '../hooks/useDocumentMerging';
import { DatabaseService } from '../lib/database';
import { DocumentGenerator } from '../lib/documentGenerator';
import toast from 'react-hot-toast';
import ContractSummaryTab from './summary/ContractSummaryTab';

interface ContractProject {
  id: string;
  name: string;
  client: string;
  documentCount: number;
  uploadDate: string;
  lastUpdated: string;
  contractEffectiveStart: string;
  contractEffectiveEnd: string;
  tags: string[];
  baseContract: any;
  amendments: any[];
  totalDocuments: number;
  status: 'processing' | 'complete' | 'error';
}

interface ContractProjectDetailTabbedProps {
  project: ContractProject;
  onBack: () => void;
  onAddDocument?: () => void;
}

// Define the clause change log entry interface
interface ClauseChangeLogEntry {
  section: string;
  change_type: 'modified' | 'added' | 'deleted';
  old_text: string;
  new_text: string;
  summary: string;
}

const ContractProjectDetailTabbed: React.FC<ContractProjectDetailTabbedProps> = ({
  project,
  onBack,
  onAddDocument
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedDiffs, setExpandedDiffs] = useState<Set<string>>(new Set());
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const {
    mergeResult,
    loadMergeResultFromDatabase,
    refreshMergeResult,
    downloadFinalContract,
    isMerging
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

  // Helper function to get change type icon
  const getChangeTypeIcon = (changeType: 'modified' | 'added' | 'deleted') => {
    switch (changeType) {
      case 'added':
        return <Plus className="w-4 h-4" />;
      case 'modified':
        return <RefreshCw className="w-4 h-4" />;
      case 'deleted':
        return <Minus className="w-4 h-4" />;
      default:
        return <RefreshCw className="w-4 h-4" />;
    }
  };

  // Helper function to get change type colors
  const getChangeTypeColor = (changeType: 'modified' | 'added' | 'deleted') => {
    switch (changeType) {
      case 'added':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'modified':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'deleted':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Helper function to determine overall change type for a group of changes
  const getOverallChangeType = (changes: ClauseChangeLogEntry[]): 'modified' | 'added' | 'deleted' => {
    // Priority: deleted > added > modified
    if (changes.some(c => c.change_type === 'deleted')) return 'deleted';
    if (changes.some(c => c.change_type === 'added')) return 'added';
    return 'modified';
  };

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
    if (!mergeResult) {
      toast.error('No merged contract available for download');
      return;
    }

    try {
      setDownloadingFormat(format);
      await downloadFinalContract(project.name, format);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(`Failed to download ${format.toUpperCase()} contract`);
    } finally {
      setDownloadingFormat(null);
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
        <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
          {oldText && (
            <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
              <div className="flex items-start space-x-2">
                <span className="text-red-600 font-mono text-xs">-</span>
                <div className="text-sm text-red-800 font-mono leading-relaxed">
                  {oldText}
                </div>
              </div>
            </div>
          )}
          {newText && (
            <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
              <div className="flex items-start space-x-2">
                <span className="text-green-600 font-mono text-xs">+</span>
                <div className="text-sm text-green-800 font-mono leading-relaxed">
                  {newText}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const safeFormatDate = (dateString: string, formatString: string = 'MMMM dd, yyyy'): string => {
    if (!dateString) return 'Not available';
    
    const date = new Date(dateString);
    if (!isValid(date)) return 'Invalid date';
    
    return format(date, formatString);
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = safeFormatDate(startDate, 'MMM dd, yyyy');
    const end = safeFormatDate(endDate, 'MMM dd, yyyy');
    return `${start} – ${end}`;
  };

  // Group clause changes by section
  const changesBySection = mergeResult?.clause_change_log?.reduce(
    (acc, change) => {
      const sec = change.section;
      if (!acc[sec]) acc[sec] = [];
      acc[sec].push(change);
      return acc;
    },
    {} as Record<string, ClauseChangeLogEntry[]>
  ) || {};

  // Convert to an array so we can .map(), preserving insertion order
  const groupedSectionSummaries = Object.entries(changesBySection).map(
    ([section, changes]) => ({ section, changes })
  );

  // Mock stats for the summary tab
  const stats = {
    totalClauses: mergeResult?.clause_change_log?.length || 0,
    amendmentsApplied: mergeResult?.amendment_summaries?.length || 0,
    changesDetected: mergeResult?.clause_change_log?.length || 0,
    lastProcessed: project.lastUpdated
  };

  const changeSummary = mergeResult?.base_summary || 'No contract analysis available';

  // Mock timeline data
  const timeline = [
    {
      id: 'base',
      title: 'Base Contract',
      date: project.uploadDate,
      type: 'base' as const,
      description: 'Initial contract uploaded'
    },
    ...(mergeResult?.amendment_summaries?.map((amendment, index) => ({
      id: `amendment-${index}`,
      title: `Amendment ${index + 1}`,
      date: project.lastUpdated,
      type: 'amendment' as const,
      description: amendment.document
    })) || [])
  ];

  const tabs = [
    { name: 'Summary', icon: FileText },
    { name: 'Change Log', icon: GitBranch },
    { name: 'Source Documents', icon: Eye },
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
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                <CheckCircle className="w-4 h-4 mr-1" />
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
                <span>{project.documentCount} documents</span>
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
            <Menu.Button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Download Contract</span>
            </Menu.Button>
            
            <Menu.Items className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handleDownloadFinal('pdf')}
                    disabled={downloadingFormat === 'pdf'}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-left text-sm transition-colors ${
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>{downloadingFormat === 'pdf' ? 'Downloading...' : 'Download as PDF'}</span>
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handleDownloadFinal('docx')}
                    disabled={downloadingFormat === 'docx'}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-left text-sm transition-colors ${
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>{downloadingFormat === 'docx' ? 'Downloading...' : 'Download as DOCX'}</span>
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handleDownloadFinal('txt')}
                    disabled={downloadingFormat === 'txt'}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-left text-sm transition-colors ${
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>{downloadingFormat === 'txt' ? 'Downloading...' : 'Download as TXT'}</span>
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 p-1 bg-gray-100 rounded-t-xl">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    `flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selected
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
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
                  <p className="text-gray-600">Detailed contract changes and clause-level analysis</p>
                </div>

                {mergeResult?.clause_change_log && mergeResult.clause_change_log.length > 0 ? (
                  <div className="space-y-6">
                    {/* View Toggle */}
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">View by:</span>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded">
                          By Document
                        </button>
                        <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
                          By Section
                        </button>
                      </div>
                    </div>

                    {/* Changes by Section */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-4">Changes by Section</h3>
                      <div className="space-y-4">
                        {groupedSectionSummaries.map(({ section, changes }, secIdx) => {
                          const groupKey = `section-${secIdx}`;
                          const overallChangeType = getOverallChangeType(changes);
                          
                          return (
                            <div key={groupKey} className="border border-gray-200 rounded-lg">
                              {/* Section Header */}
                              <div className="p-4 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center space-x-3">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getChangeTypeColor(overallChangeType)}`}>
                                    {getChangeTypeIcon(overallChangeType)}
                                    <span className="ml-1 capitalize">{overallChangeType}</span>
                                  </span>
                                  <span className="font-medium text-gray-900">{section}</span>
                                  <span className="text-sm text-gray-500">
                                    ({changes.length} change{changes.length !== 1 ? 's' : ''})
                                  </span>
                                </div>
                              </div>

                              {/* Individual Changes */}
                              <div className="p-4 space-y-3">
                                {changes.map((change, idx) => {
                                  const changeKey = `${groupKey}-${idx}`;
                                  const isExpanded = expandedDiffs.has(changeKey);
                                  
                                  return (
                                    <div key={changeKey} className="space-y-2">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getChangeTypeColor(change.change_type)}`}>
                                              {getChangeTypeIcon(change.change_type)}
                                              <span className="ml-1 capitalize">{change.change_type}</span>
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-700">{change.summary}</p>
                                        </div>
                                        
                                        <button
                                          onClick={() => toggleDiff(changeKey)}
                                          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors ml-4"
                                        >
                                          {isExpanded ? (
                                            <ChevronDown className="w-4 h-4" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4" />
                                          )}
                                          <span>View changes</span>
                                        </button>
                                      </div>
                                      
                                      {isExpanded && renderGitHubStyleDiff(change.old_text, change.new_text)}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No change log available</h3>
                    <p className="text-gray-600">Contract analysis has not been completed yet.</p>
                  </div>
                )}
              </div>
            </Tab.Panel>

            {/* Source Documents Tab */}
            <Tab.Panel>
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Source Documents</h2>
                  <p className="text-gray-600">Documents used in the contract analysis and merging process</p>
                </div>

                {mergeResult?.document_incorporation_log && mergeResult.document_incorporation_log.length > 0 ? (
                  <div className="space-y-4">
                    {mergeResult.document_incorporation_log.map((doc, index) => (
                      <div key={index} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{doc}</p>
                          <p className="text-sm text-gray-500">Document {index + 1} of {mergeResult.document_incorporation_log.length}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No source documents</h3>
                    <p className="text-gray-600">Document information is not available.</p>
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
                    <p className="text-gray-600">Complete merged contract with all amendments applied</p>
                  </div>
                  
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </Menu.Button>
                    
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
                  </Menu>
                </div>

                {mergeResult?.final_contract ? (
                  <div className="space-y-4">
                    {/* Disclaimer */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
                      <p className="font-medium mb-1">AI-Generated Output</p>
                      <p>
                        This document is a product of AI analysis and compilation of source contracts
                        {mergeResult.document_incorporation_log && mergeResult.document_incorporation_log.length > 0 && (
                          <>
                            {' '}from the following documents: {mergeResult.document_incorporation_log.join(', ')}
                          </>
                        )}
                        . It serves as a tool for review and understanding, not as an official or executed legal instrument.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                        {mergeResult.final_contract}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No final contract available</h3>
                    <p className="text-gray-600">Contract merging has not been completed yet.</p>
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