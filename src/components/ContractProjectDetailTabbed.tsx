import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
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
  Tag,
  Clock,
  BarChart3
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { ContractProject } from '../types';
import { useDocumentMerging } from '../hooks/useDocumentMerging';
import { useDocuments } from '../hooks/useDocuments';
import ContractSummaryTab from './summary/ContractSummaryTab';
import { Menu } from '@headlessui/react';

interface ContractProjectDetailTabbedProps {
  project: ContractProject;
  onBack: () => void;
  onAddDocument?: () => void;
}

const ContractProjectDetailTabbed: React.FC<ContractProjectDetailTabbedProps> = ({ 
  project, 
  onBack, 
  onAddDocument 
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'changelog' | 'source-docs' | 'final-contract'>('summary');
  const [changelogView, setChangelogView] = useState<'by-section' | 'by-document'>('by-section');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showFullContract, setShowFullContract] = useState(false);

  const { 
    mergeResult, 
    loadMergeResultFromDatabase, 
    refreshMergeResult,
    downloadFinalContract,
    isMerging 
  } = useDocumentMerging();

  const { documents } = useDocuments(project.id);

  // Load merge result when component mounts
  useEffect(() => {
    loadMergeResultFromDatabase(project.id);
  }, [project.id]);

  // Helper function to format section titles consistently
  const formatSectionTitle = (sectionTitle: string): string => {
    // Handle different section title formats
    if (!sectionTitle) return sectionTitle;
    
    // If it already starts with "Section" or "Article", return as-is
    if (/^(Section|Article)\s+\d+/i.test(sectionTitle)) {
      return sectionTitle;
    }
    
    // Extract section number and name
    const match = sectionTitle.match(/^(\d+(?:\.\d+)*)[:\s]*(.*)$/);
    if (match) {
      const [, number, name] = match;
      // For main sections (single number), use "Section"
      if (!number.includes('.')) {
        return `Section ${number}: ${name.trim()}`;
      }
      // For subsections (with dots), use "Subsection"
      return `Subsection ${number}: ${name.trim()}`;
    }
    
    // If no number found, return original
    return sectionTitle;
  };

  // Helper function to format subsection titles consistently
  const formatSubsectionTitle = (sectionTitle: string): string => {
    // Handle different subsection title formats
    if (!sectionTitle) return sectionTitle;
    
    // If it already starts with "Section", "Subsection", or "Article", return as-is
    if (/^(Section|Subsection|Article)\s+\d+/i.test(sectionTitle)) {
      return sectionTitle;
    }
    
    // Extract section number and name
    const match = sectionTitle.match(/^(\d+(?:\.\d+)*)[:\s]*(.*)$/);
    if (match) {
      const [, number, name] = match;
      // For subsections (with dots), use "Subsection"
      if (number.includes('.')) {
        return `Subsection ${number}: ${name.trim()}`;
      }
      // For main sections (single number), use "Section"
      return `Section ${number}: ${name.trim()}`;
    }
    
    // Handle special cases like "Article 7: Mobile Development"
    const articleMatch = sectionTitle.match(/^(Article\s+\d+)[:\s]*(.*)$/i);
    if (articleMatch) {
      const [, articleNum, name] = articleMatch;
      return `${articleNum}: ${name.trim()}`;
    }
    
    // If no number found, return original
    return sectionTitle;
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleRefreshAnalysis = async () => {
    try {
      await refreshMergeResult(project.id);
    } catch (error) {
      console.error('Failed to refresh analysis:', error);
    }
  };

  const handleDownloadContract = (format: 'txt' | 'pdf' | 'docx') => {
    const documentIncorporationLog = mergeResult?.document_incorporation_log || [];
    downloadFinalContract(`${project.name}-unified`, format, documentIncorporationLog);
  };

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

  // Group changes by section for the "By Section" view
  const groupChangesBySection = () => {
    if (!mergeResult?.clause_change_log) return {};
    
    const grouped: Record<string, any[]> = {};
    
    mergeResult.clause_change_log.forEach((change) => {
      const formattedSection = formatSectionTitle(change.section);
      if (!grouped[formattedSection]) {
        grouped[formattedSection] = [];
      }
      grouped[formattedSection].push(change);
    });
    
    return grouped;
  };

  // Mock data for demonstration
  const mockStats = {
    totalClauses: mergeResult?.clause_change_log?.length || 0,
    amendmentsApplied: mergeResult?.amendment_summaries?.length || 0,
    changesDetected: mergeResult?.clause_change_log?.length || 0,
    lastProcessed: project.lastUpdated
  };

  const mockTimeline = [
    {
      id: 'base',
      title: 'Base Contract',
      date: project.uploadDate,
      type: 'base' as const,
      description: `Initial ${project.baseContract.type} agreement`
    },
    {
      id: 'amend-1',
      title: 'Amendment 1',
      date: '2024-03-01',
      type: 'amendment' as const,
      description: 'Payment terms modification'
    },
    {
      id: 'amend-2',
      title: 'Amendment 2',
      date: '2024-05-15',
      type: 'amendment' as const,
      description: 'SLA updates and termination changes'
    }
  ];

  const tabs = [
    { id: 'summary', label: 'Summary', icon: BarChart3 },
    { id: 'changelog', label: 'Change Log', icon: GitBranch },
    { id: 'source-docs', label: 'Source Documents', icon: FileText },
    { id: 'final-contract', label: 'Final Contract', icon: CheckCircle }
  ];

  const renderSummaryTab = () => (
    <ContractSummaryTab
      project={project}
      stats={mockStats}
      changeSummary={mergeResult?.base_summary || ''}
      timeline={mockTimeline}
      mergeResult={mergeResult}
    />
  );

  const renderChangelogTab = () => (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Change Log</h3>
          <p className="text-sm text-gray-600">Detailed contract changes and clause-level analysis</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setChangelogView('by-document')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              changelogView === 'by-document'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Document
          </button>
          <button
            onClick={() => setChangelogView('by-section')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              changelogView === 'by-section'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Section
          </button>
        </div>
      </div>

      {changelogView === 'by-section' ? (
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-gray-900">Changes by Section</h4>
          
          {Object.entries(groupChangesBySection()).map(([section, changes]) => (
            <div key={section} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection(section)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-900">{section}</span>
                  <span className="text-sm text-gray-500">
                    ({changes.length} change{changes.length !== 1 ? 's' : ''})
                  </span>
                </div>
                {expandedSections.has(section) ? 
                  <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                }
              </button>
              
              {expandedSections.has(section) && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="space-y-3 mt-3">
                    {changes.map((change, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${getChangeTypeColor(change.change_type)}`}>
                        <div className="flex items-start space-x-2 mb-2">
                          {getChangeTypeIcon(change.change_type)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium">{formatSubsectionTitle(change.section)}</span>
                              <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50 capitalize">
                                {change.change_type}
                              </span>
                            </div>
                            <p className="text-sm mb-2">{change.summary}</p>
                            {change.old_text && change.old_text !== change.new_text && (
                              <div className="space-y-2 text-xs">
                                {change.old_text && (
                                  <div>
                                    <span className="font-medium">Before:</span>
                                    <p className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                                      {change.old_text.length > 100 ? change.old_text.substring(0, 100) + '...' : change.old_text}
                                    </p>
                                  </div>
                                )}
                                {change.new_text && (
                                  <div>
                                    <span className="font-medium">After:</span>
                                    <p className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-green-800">
                                      {change.new_text.length > 100 ? change.new_text.substring(0, 100) + '...' : change.new_text}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-gray-900">Changes by Document</h4>
          
          {mergeResult?.amendment_summaries?.map((amendment, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  {amendment.role}
                </span>
                <span className="font-medium text-gray-900">{amendment.document}</span>
              </div>
              
              <div className="space-y-2">
                {amendment.changes.map((change, changeIndex) => (
                  <div key={changeIndex} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-sm text-gray-700">{change}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSourceDocsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Source Documents</h3>
          <p className="text-sm text-gray-600">All documents used in this contract analysis</p>
        </div>
        
        {onAddDocument && (
          <button
            onClick={onAddDocument}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Document</span>
          </button>
        )}
      </div>

      {/* Document Incorporation Log */}
      {mergeResult?.document_incorporation_log && mergeResult.document_incorporation_log.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Processing Order</h4>
          <div className="space-y-2">
            {mergeResult.document_incorporation_log.map((doc, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium text-blue-800">
                  {index + 1}
                </span>
                <span className="text-blue-800">{doc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.document_id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <FileText className="w-5 h-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span>Type: {doc.type}</span>
                    <span>Size: {(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>Uploaded: {format(new Date(doc.creation_date), 'MMM dd, yyyy')}</span>
                  </div>
                  {doc.text_extraction_status === 'complete' && doc.extracted_text && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Text extracted ({doc.extracted_text.length} characters)
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  doc.upload_status === 'complete' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {doc.upload_status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFinalContractTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Final Contract</h3>
          <p className="text-sm text-gray-600">Merged contract with all amendments applied</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Download</span>
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
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showFullContract ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>{showFullContract ? 'Collapse' : 'View Full Contract'}</span>
          </button>
        </div>
      </div>

      {mergeResult?.final_contract ? (
        showFullContract ? (
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
              {mergeResult.final_contract}
            </pre>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Contract preview (first 300 characters):</p>
            <p className="text-sm text-gray-700 font-mono">
              {mergeResult.final_contract.substring(0, 300)}...
            </p>
            <button
              onClick={() => setShowFullContract(true)}
              className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Click to view full contract
            </button>
          </div>
        )
      ) : (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No final contract available</h3>
          <p className="text-gray-600">The contract merge process has not been completed yet.</p>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return renderSummaryTab();
      case 'changelog':
        return renderChangelogTab();
      case 'source-docs':
        return renderSourceDocsTab();
      case 'final-contract':
        return renderFinalContractTab();
      default:
        return renderSummaryTab();
    }
  };

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
                <FileText className="w-4 h-4" />
                <span>{project.documentCount} Documents</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Created {format(new Date(project.uploadDate), 'MMM dd, yyyy')}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {project.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
            className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isMerging ? 'animate-spin' : ''}`} />
            <span>Refresh Analysis</span>
          </button>
          {onAddDocument && (
            <button
              onClick={onAddDocument}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
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
      <div className="min-h-96">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ContractProjectDetailTabbed;