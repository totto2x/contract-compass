import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Tag, 
  FileText, 
  Download, 
  Share,
  ChevronDown, 
  ChevronRight,
  Plus,
  RefreshCw,
  Eye,
  GitBranch,
  AlertCircle,
  Minus,
  CheckCircle,
  Clock,
  Building2,
  BarChart3,
  Brain,
  Loader2
} from 'lucide-react';
import { Menu } from '@headlessui/react';
import { format, isValid } from 'date-fns';
import { ContractProject } from '../types';
import { useDocumentMerging } from '../hooks/useDocumentMerging';
import { DatabaseService } from '../lib/database';
import { DocumentGenerator } from '../lib/documentGenerator';
import ContractSummaryTab from './summary/ContractSummaryTab';
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

// Helper function to extract contract dates from merge result
const extractContractDates = (mergeResult: any) => {
  if (!mergeResult) {
    return null;
  }

  // Try to extract dates from document incorporation log
  if (mergeResult.document_incorporation_log && mergeResult.document_incorporation_log.length > 0) {
    const dates: string[] = [];
    
    mergeResult.document_incorporation_log.forEach((doc: string) => {
      // Parse dates from format: "filename (role, date)"
      const match = doc.match(/\(.*?,\s*(.+?)\)$/);
      if (match) {
        const dateStr = match[1].trim();
        // Try to parse various date formats
        const parsedDate = new Date(dateStr);
        if (isValid(parsedDate)) {
          dates.push(parsedDate.toISOString());
        }
      }
    });

    if (dates.length > 0) {
      // Sort dates to get earliest and latest
      const sortedDates = dates.sort();
      return {
        effectiveStart: sortedDates[0],
        effectiveEnd: sortedDates[sortedDates.length - 1],
        source: 'openai-analysis'
      };
    }
  }

  // Try to extract from final contract text
  if (mergeResult.final_contract) {
    const contractText = mergeResult.final_contract;
    
    // Look for common contract date patterns
    const datePatterns = [
      /entered into on\s+([^,]+)/i,
      /effective\s+(?:as of\s+)?([^,\n]+)/i,
      /dated\s+([^,\n]+)/i,
      /this\s+agreement.*?(\w+\s+\d{1,2},?\s+\d{4})/i
    ];

    for (const pattern of datePatterns) {
      const match = contractText.match(pattern);
      if (match) {
        const dateStr = match[1].trim();
        const parsedDate = new Date(dateStr);
        if (isValid(parsedDate)) {
          // Use the extracted date as start, and add 1 year as end
          const endDate = new Date(parsedDate);
          endDate.setFullYear(endDate.getFullYear() + 1);
          
          return {
            effectiveStart: parsedDate.toISOString(),
            effectiveEnd: endDate.toISOString(),
            source: 'contract-text-analysis'
          };
        }
      }
    }
  }

  // No valid dates found
  return null;
};

// Helper function to extract agreement parties from merge result
const extractAgreementParties = (mergeResult: any) => {
  if (!mergeResult) {
    return null;
  }

  // Try to extract from final contract text
  if (mergeResult.final_contract) {
    const contractText = mergeResult.final_contract;
    
    // Look for common party identification patterns
    const partyPatterns = [
      // Pattern: "between [Party1] ("Client") and [Party2] ("Provider")"
      /between\s+([^("]+)\s*\([^)]*(?:client|customer)[^)]*\)\s*and\s+([^("]+)\s*\([^)]*(?:provider|company|contractor)[^)]*\)/i,
      // Pattern: "between [Party1] and [Party2]"
      /between\s+([^,\n]+?)\s*(?:\([^)]*\))?\s*(?:,\s*)?and\s+([^,\n]+?)(?:\s*\([^)]*\))?[,\n]/i,
      // Pattern: "This agreement is entered into by [Party1] and [Party2]"
      /entered into by\s+([^,\n]+?)\s*(?:\([^)]*\))?\s*(?:,\s*)?and\s+([^,\n]+?)(?:\s*\([^)]*\))?[,\n]/i,
      // Pattern: "[Party1] ("Client") agrees with [Party2] ("Provider")"
      /([^("]+)\s*\([^)]*(?:client|customer)[^)]*\)\s*.*?(?:agrees?\s*with|and)\s*([^("]+)\s*\([^)]*(?:provider|company|contractor)[^)]*\)/i
    ];

    for (const pattern of partyPatterns) {
      const match = contractText.match(pattern);
      if (match) {
        let party1 = match[1].trim();
        let party2 = match[2].trim();
        
        // Clean up the extracted names - remove leading articles and clean formatting
        party1 = party1.replace(/^(the\s+)?/i, '').trim();
        party2 = party2.replace(/^(the\s+)?/i, '').trim();
        
        // Remove any trailing commas or periods
        party1 = party1.replace(/[,.]$/, '').trim();
        party2 = party2.replace(/[,.]$/, '').trim();
        
        // Ensure we have meaningful names (not just punctuation or short words)
        if (party1.length > 2 && party2.length > 2) {
          return {
            parties: [party1, party2],
            source: 'contract-text-analysis'
          };
        }
      }
    }
  }

  // Try to extract from base summary
  if (mergeResult.base_summary) {
    const summaryText = mergeResult.base_summary;
    
    // Look for party mentions in the summary
    const summaryPatterns = [
      /between\s+([^,\n]+?)\s*(?:\([^)]*\))?\s*(?:,\s*)?and\s+([^,\n]+?)(?:\s*\([^)]*\))?[,\n]/i,
      /agreement.*?between\s+([^,\n]+?)\s*and\s+([^,\n]+?)[,\n]/i
    ];

    for (const pattern of summaryPatterns) {
      const match = summaryText.match(pattern);
      if (match) {
        let party1 = match[1].trim();
        let party2 = match[2].trim();
        
        // Clean up the extracted names
        party1 = party1.replace(/^(the\s+)?/i, '').trim();
        party2 = party2.replace(/^(the\s+)?/i, '').trim();
        
        // Remove any trailing commas or periods
        party1 = party1.replace(/[,.]$/, '').trim();
        party2 = party2.replace(/[,.]$/, '').trim();
        
        if (party1.length > 2 && party2.length > 2) {
          return {
            parties: [party1, party2],
            source: 'summary-analysis'
          };
        }
      }
    }
  }

  // No valid parties found
  return null;
};

const ContractProjectDetailTabbed: React.FC<ContractProjectDetailTabbedProps> = ({ 
  project, 
  onBack, 
  onAddDocument 
}) => {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedDiffs, setExpandedDiffs] = useState<Set<string>>(new Set());
  const [showFullContract, setShowFullContract] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const {
    isMerging,
    mergeResult,
    loadMergeResultFromDatabase,
    refreshMergeResult,
    downloadFinalContract,
    clearResults
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

  const handleRefreshAnalysis = async () => {
    try {
      await refreshMergeResult(project.id);
      toast.success('Contract analysis refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh analysis:', error);
      toast.error('Failed to refresh analysis');
    }
  };

  const handleDownloadContract = async (format: 'txt' | 'pdf' | 'docx') => {
    if (!mergeResult) {
      toast.error('No merged contract available for download');
      return;
    }

    try {
      setDownloadingFormat(format);
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
      setDownloadingFormat(null);
    }
  };

  const getChangeTypeIcon = (type: 'added' | 'modified' | 'deleted') => {
    switch (type) {
      case 'added': return <Plus className="w-4 h-4 text-green-600" />;
      case 'modified': return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case 'deleted': return <Minus className="w-4 h-4 text-red-600" />;
    }
  };

  const getChangeTypeColor = (type: 'added' | 'modified' | 'deleted') => {
    switch (type) {
      case 'added': return 'text-green-700 bg-green-50 border-green-200';
      case 'modified': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'deleted': return 'text-red-700 bg-red-50 border-red-200';
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

  // Mock analysis data if no merge result
  const analysis = mergeResult || {
    base_summary: "Contract analysis is being processed. Please wait for the analysis to complete or refresh to check for updates.",
    amendment_summaries: [],
    clause_change_log: [],
    final_contract: "Contract content will be available once processing is complete.",
    document_incorporation_log: []
  };

  // Group all clause change entries by their section header
  const changesBySection = analysis.clause_change_log.reduce(
    (acc, change) => {
      const sec = change.section;
      if (!acc[sec]) acc[sec] = [];
      acc[sec].push(change);
      return acc;
    },
    {} as Record<string, typeof analysis.clause_change_log>
  );

  // Convert to an array so we can .map(), preserving insertion order
  const groupedSectionSummaries = Object.entries(changesBySection).map(
    ([section, changes]) => {
      // Determine the overall change type for this section
      // Priority: deleted > added > modified
      let overallChangeType: 'added' | 'modified' | 'deleted' = 'modified';
      
      if (changes.some(change => change.change_type === 'deleted')) {
        overallChangeType = 'deleted';
      } else if (changes.some(change => change.change_type === 'added')) {
        overallChangeType = 'added';
      }
      
      return { section, changes, overallChangeType };
    }
  );

  // Create amendment summaries for "By Document" view
  const amendmentSummaries = analysis.amendment_summaries.map((summary, index) => ({
    id: `amendment-${index}`,
    title: summary.document,
    role: summary.role,
    changes: summary.changes,
    changeType: 'modified' as const,
    description: `Changes from ${summary.document}`,
    oldText: `Previous version before ${summary.document}`,
    newText: summary.changes.join('\n')
  }));

  // Stats for the summary tab
  const stats = {
    totalClauses: analysis.clause_change_log.length,
    amendmentsApplied: analysis.amendment_summaries.length,
    changesDetected: analysis.clause_change_log.length,
    lastProcessed: project.lastUpdated
  };

  // Timeline data
  const timeline = [
    {
      id: 'base',
      title: 'Base Contract',
      date: project.uploadDate,
      type: 'base' as const,
      description: 'Initial contract uploaded'
    },
    ...analysis.amendment_summaries.map((summary, index) => ({
      id: `amendment-${index}`,
      title: summary.document,
      date: project.lastUpdated,
      type: 'amendment' as const,
      description: `Amendment: ${summary.document}`
    }))
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
                <span>Created {safeFormatDate(project.uploadDate, 'MMM dd, yyyy')}</span>
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
          <button
            onClick={handleRefreshAnalysis}
            disabled={isMerging}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isMerging ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Refresh Analysis</span>
          </button>
          
          {onAddDocument && (
            <button
              onClick={onAddDocument}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Documents</span>
            </button>
          )}
          
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Download</span>
              <ChevronDown className="w-4 h-4" />
            </Menu.Button>
            
            <Menu.Items className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handleDownloadContract('pdf')}
                    disabled={downloadingFormat === 'pdf'}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-left text-sm transition-colors disabled:opacity-50 ${
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>{downloadingFormat === 'pdf' ? 'Generating PDF...' : 'Download as PDF'}</span>
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handleDownloadContract('docx')}
                    disabled={downloadingFormat === 'docx'}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-left text-sm transition-colors disabled:opacity-50 ${
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>{downloadingFormat === 'docx' ? 'Generating DOCX...' : 'Download as DOCX'}</span>
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handleDownloadContract('txt')}
                    disabled={downloadingFormat === 'txt'}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-left text-sm transition-colors disabled:opacity-50 ${
                      active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>{downloadingFormat === 'txt' ? 'Generating TXT...' : 'Download as TXT'}</span>
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 m-6 mb-0">
            {tabs.map((tab) => {
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
                changeSummary={analysis.base_summary}
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

                {/* Sub-tabs for By Document vs By Section */}
                <Tab.Group>
                  <Tab.List className="flex space-x-1 rounded-lg bg-gray-100 p-1 w-fit">
                    <Tab
                      className={({ selected }) =>
                        `rounded-md py-2 px-4 text-sm font-medium transition-all duration-200 ${
                          selected
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`
                      }
                    >
                      By Document
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        `rounded-md py-2 px-4 text-sm font-medium transition-all duration-200 ${
                          selected
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`
                      }
                    >
                      By Section
                    </Tab>
                  </Tab.List>

                  <Tab.Panels className="mt-6">
                    {/* By Document Panel */}
                    <Tab.Panel>
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold text-gray-900">Changes by Document</h3>
                        {amendmentSummaries.length > 0 ? (
                          <div className="space-y-4">
                            {amendmentSummaries.map((summary) => {
                              const key = summary.id;
                              return (
                                <div key={key} className="border border-gray-200 rounded-lg">
                                  <button
                                    onClick={() => toggleSection(key)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getChangeTypeColor(summary.changeType)}`}>
                                        {getChangeTypeIcon(summary.changeType)}
                                        <span className="ml-1 capitalize">{summary.changeType}</span>
                                      </span>
                                      <span className="font-medium text-gray-900">{summary.title}</span>
                                      <span className="text-sm text-gray-500">
                                        ({summary.changes.length} change{summary.changes.length !== 1 ? 's' : ''})
                                      </span>
                                    </div>
                                    {expandedSections.has(key) ? 
                                      <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                                      <ChevronRight className="w-4 h-4 text-gray-500" />
                                    }
                                  </button>
                                  
                                  {expandedSections.has(key) && (
                                    <div className="px-4 pb-4 border-t border-gray-100">
                                      <div className="space-y-2 mt-3">
                                        {summary.changes.map((change, changeIndex) => (
                                          <div key={changeIndex} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                            <span className="text-sm text-gray-700">{change}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p>No document changes available</p>
                          </div>
                        )}
                      </div>
                    </Tab.Panel>

                    {/* By Section Panel */}
                    <Tab.Panel>
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold text-gray-900">Changes by Section</h3>
                        {groupedSectionSummaries.length > 0 ? (
                          <div className="space-y-4">
                            {groupedSectionSummaries.map(({ section, changes, overallChangeType }, secIdx) => {
                              const groupKey = `section-${secIdx}`;
                              return (
                                <div key={groupKey} className="border border-gray-200 rounded-lg">
                                  {/* Section header */}
                                  <div className="p-4 border-b border-gray-100">
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

                                  {/* List all the changes under this section */}
                                  <div className="p-4 space-y-3">
                                    {changes.map((change, idx) => {
                                      const changeKey = `${groupKey}-${idx}`;
                                      return (
                                        <div key={changeKey} className="border border-gray-100 rounded-lg p-3">
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                              {getChangeTypeIcon(change.change_type)}
                                              <span className="text-sm font-medium text-gray-900">{change.summary}</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(change.change_type)}`}>
                                              {change.change_type}
                                            </span>
                                          </div>
                                          
                                          <button
                                            onClick={() => toggleDiff(changeKey)}
                                            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                                          >
                                            {!expandedDiffs.has(changeKey) ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            <span>View changes</span>
                                          </button>
                                          
                                          {expandedDiffs.has(changeKey) && (
                                            <div className="mt-3">
                                              {renderGitHubStyleDiff(change.old_text, change.new_text)}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p>No section changes available</p>
                          </div>
                        )}
                      </div>
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </div>
            </Tab.Panel>

            {/* Source Documents Tab */}
            <Tab.Panel>
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Source Documents</h2>
                  <p className="text-gray-600">Documents used in the contract analysis and merging process</p>
                </div>

                {analysis.document_incorporation_log && analysis.document_incorporation_log.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900">Document Processing Order</h3>
                    <div className="space-y-3">
                      {analysis.document_incorporation_log.map((doc, index) => (
                        <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{doc}</p>
                          </div>
                          <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p>No source document information available</p>
                  </div>
                )}
              </div>
            </Tab.Panel>

            {/* Final Contract Tab */}
            <Tab.Panel>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Final Merged Contract</h2>
                    <p className="text-gray-600">Complete contract with all amendments and changes applied</p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
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
                    
                    <button
                      onClick={() => setShowFullContract(!showFullContract)}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      {showFullContract ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span>{showFullContract ? 'Collapse' : 'Expand'}</span>
                    </button>
                  </div>
                </div>
                
                {/* AI-Generated Output Disclaimer */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
                  <p className="font-medium mb-1">AI-Generated Output</p>
                  <p className="mb-2">This document is a product of AI analysis and compilation of source contracts. It serves as a tool for review and understanding, not as an official or executed legal instrument.</p>
                  {analysis.document_incorporation_log && analysis.document_incorporation_log.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium mb-1">Source Documents:</p>
                      <ul className="text-xs space-y-1">
                        {analysis.document_incorporation_log.map((doc, index) => (
                          <li key={index}>• {doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {showFullContract ? (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                      {analysis.final_contract}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Contract preview (first 300 characters):</p>
                    <p className="text-sm text-gray-700 font-mono">
                      {analysis.final_contract.substring(0, 300)}...
                    </p>
                    <button
                      onClick={() => setShowFullContract(true)}
                      className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Click to view full contract
                    </button>
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