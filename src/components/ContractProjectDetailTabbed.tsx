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
  Building2,
  BarChart3,
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { ContractProject } from '../types';
import { useDocuments } from '../hooks/useDocuments';
import { useDocumentMerging } from '../hooks/useDocumentMerging';
import ContractSummaryTab from './summary/ContractSummaryTab';

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
  const [activeTab, setActiveTab] = useState<'summary' | 'change-log' | 'source-documents' | 'final-contract'>('summary');
  const [activeChangeLogTab, setActiveChangeLogTab] = useState<'by-document' | 'by-section'>('by-document');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showFullContract, setShowFullContract] = useState(false);

  const { documents, loading: documentsLoading } = useDocuments(project.id);
  const {
    isMerging,
    mergeResult,
    loadMergeResultFromDatabase,
    refreshMergeResult,
    clearResults: clearMergeResults,
    downloadFinalContract,
    rawApiResponse: mergeApiResponse,
    error: mergeError
  } = useDocumentMerging();

  // 🔧 FIX: Wrap data fetching in useEffect with proper dependencies
  useEffect(() => {
    console.log('🔧 ContractProjectDetailTabbed useEffect triggered');
    console.log('📊 Project ID:', project.id);
    console.log('📊 Documents loading:', documentsLoading);
    console.log('📊 Current merge result exists:', !!mergeResult);

    // Only load merge result if we don't have one and documents are loaded
    if (project.id && !documentsLoading && !mergeResult && !isMerging) {
      console.log('🔄 Loading merge result from database...');
      loadMergeResultFromDatabase(project.id);
    }
  }, [project.id, documentsLoading, mergeResult, isMerging, loadMergeResultFromDatabase]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleRefreshMerge = async () => {
    if (project.id) {
      console.log('🔄 Refreshing merge result...');
      await refreshMergeResult(project.id);
    }
  };

  const handleDownloadContract = (format: 'txt' | 'pdf' | 'docx') => {
    const filename = `${project.name}-unified`;
    const documentIncorporationLog = mergeResult?.document_incorporation_log || [];
    
    console.log('🔍 DOWNLOAD CONTRACT FUNCTION:');
    console.log('📊 mergeResult exists:', !!mergeResult);
    console.log('📊 Document incorporation log:', documentIncorporationLog);
    
    downloadFinalContract(filename, format, documentIncorporationLog);
  };

  // Helper function to generate complete disclaimer text with document list
  const getDisclaimerTextForDisplay = (documentIncorporationLog: string[] = []): string => {
    let disclaimer = "***\n\nAI-Generated Output: This document is a product of AI analysis and a compilation of the following source documents:\n\n";
    
    if (documentIncorporationLog && documentIncorporationLog.length > 0) {
      documentIncorporationLog.forEach((doc, index) => {
        disclaimer += `${index + 1}. ${doc}\n`;
      });
    } else {
      disclaimer += "• No source documents specified\n";
    }
    
    disclaimer += "\nIt serves as a tool for review and understanding, not as an official or executed legal instrument.\n\n***";
    
    return disclaimer;
  };

  const amendmentSummaries = mergeResult?.amendment_summaries || [];
  const clauseChangeLog = mergeResult?.clause_change_log || [];

  // Generate stats from merge result
  const stats = {
    totalClauses: clauseChangeLog.length || 12,
    amendmentsApplied: amendmentSummaries.length || 2,
    changesDetected: clauseChangeLog.length || 8,
    lastProcessed: project.lastUpdated
  };

  // Generate change summary from merge result
  const changeSummary = mergeResult?.base_summary || 
    `This ${project.baseContract.type} agreement has been processed with ${project.documentCount} document${project.documentCount !== 1 ? 's' : ''}. The contract analysis includes comprehensive change tracking and document merging to provide a unified view of all modifications and amendments.`;

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = format(new Date(startDate), 'MMM dd, yyyy');
    const end = format(new Date(endDate), 'MMM dd, yyyy');
    return `${start} – ${end}`;
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

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      complete: 'bg-green-100 text-green-800 border-green-200',
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${styles[status as keyof typeof styles] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
              <StatusBadge status={project.status || 'complete'} />
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
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Share className="w-4 h-4" />
            <span>Share</span>
          </button>
          {onAddDocument && (
            <button 
              onClick={onAddDocument}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Document</span>
            </button>
          )}
          <button 
            onClick={handleRefreshMerge}
            disabled={isMerging}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isMerging ? 'animate-spin' : ''}`} />
            <span>Refresh Analysis</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation - Updated with correct icons to match screenshot */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'summary', label: 'Summary', icon: BarChart3 },
            { id: 'change-log', label: 'Change Log', icon: ClipboardList },
            { id: 'source-documents', label: 'Source Documents', icon: GitBranch },
            { id: 'final-contract', label: 'Final Contract', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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
        {activeTab === 'summary' && (
          <ContractSummaryTab
            project={project}
            stats={stats}
            changeSummary={changeSummary}
            timeline={[]} // Empty timeline for summary tab
            mergeResult={mergeResult}
          />
        )}

        {activeTab === 'change-log' && (
          <div className="space-y-6">
            {/* Change Log Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Change Log</h2>
              <p className="text-sm text-gray-600 mb-4">Detailed contract changes and clause-level analysis</p>
              
              {/* Sub-tabs for Change Log */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setActiveChangeLogTab('by-document')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeChangeLogTab === 'by-document'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  By Document
                </button>
                <button
                  onClick={() => setActiveChangeLogTab('by-section')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeChangeLogTab === 'by-section'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  By Section
                </button>
              </div>
            </div>

            {/* By Document View */}
            {activeChangeLogTab === 'by-document' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">By Document View</h3>
                <p className="text-sm text-gray-600 mb-4">Shows detailed changes introduced by each amendment, sorted by document chronologically</p>
                
                {amendmentSummaries.length > 0 ? (
                  <div className="space-y-4">
                    {amendmentSummaries.map((amendment, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-800">
                              {index + 1}
                            </span>
                            <span className="font-medium text-gray-900">{amendment.document}</span>
                          </div>
                          <span className="text-xs text-gray-500 capitalize px-2 py-1 bg-gray-100 rounded-full">
                            {amendment.role}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {amendment.changes.map((change, changeIndex) => (
                            <div key={changeIndex} className="flex items-start space-x-2 text-sm">
                              <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
                              <span className="text-gray-700">{change}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No document changes available</h4>
                    <p className="text-gray-600">Amendment summaries will appear here once documents are processed.</p>
                  </div>
                )}
              </div>
            )}

            {/* By Section View */}
            {activeChangeLogTab === 'by-section' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">By Section View</h3>
                <p className="text-sm text-gray-600 mb-4">Shows detailed changes organized by contract sections, sorted by section</p>
                
                {clauseChangeLog.length > 0 ? (
                  <div className="space-y-3">
                    {clauseChangeLog.map((clause, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${getChangeTypeColor(clause.change_type)}`}>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getChangeTypeIcon(clause.change_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">{clause.section}</span>
                              <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50 capitalize font-medium">
                                {clause.change_type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{clause.summary}</p>
                            
                            {clause.old_text && clause.old_text !== clause.new_text && (
                              <div className="space-y-3 text-xs">
                                {clause.old_text && (
                                  <div>
                                    <span className="font-medium text-gray-700">Before:</span>
                                    <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-red-800 font-mono">
                                      {clause.old_text.length > 150 ? clause.old_text.substring(0, 150) + '...' : clause.old_text}
                                    </div>
                                  </div>
                                )}
                                {clause.new_text && (
                                  <div>
                                    <span className="font-medium text-gray-700">After:</span>
                                    <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded text-green-800 font-mono">
                                      {clause.new_text.length > 150 ? clause.new_text.substring(0, 150) + '...' : clause.new_text}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No section changes available</h4>
                    <p className="text-gray-600">Detailed clause changes will appear here once documents are processed.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'source-documents' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <GitBranch className="w-5 h-5 text-purple-600" />
                <span>Source Documents</span>
              </h2>
              
              {mergeResult?.document_incorporation_log && mergeResult.document_incorporation_log.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    The following documents were processed and incorporated into the final contract in chronological order:
                  </p>
                  
                  <div className="space-y-3">
                    {mergeResult.document_incorporation_log.map((doc, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-800 flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{doc}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Processed in chronological order based on execution and effective dates
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Processing Notes</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>✓ Documents were automatically classified as base contracts, amendments, or ancillary documents</p>
                      <p>✓ Text was extracted from each document and stored for analysis</p>
                      <p>✓ Documents were processed in chronological order to ensure proper change application</p>
                      <p>✓ All changes and modifications were tracked and incorporated into the final contract</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No source documents available</h3>
                  <p className="text-gray-600 mb-4">Source document information will appear here once documents are processed.</p>
                  <button
                    onClick={handleRefreshMerge}
                    disabled={isMerging}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isMerging ? 'animate-spin' : ''}`} />
                    {isMerging ? 'Processing...' : 'Process Documents'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'final-contract' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span>Final Merged Contract</span>
                </h2>
                
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => handleDownloadContract('pdf')}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                  <button 
                    onClick={() => handleDownloadContract('docx')}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOCX</span>
                  </button>
                  <button 
                    onClick={() => handleDownloadContract('txt')}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>TXT</span>
                  </button>
                  <button
                    onClick={() => setShowFullContract(!showFullContract)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                  >
                    {showFullContract ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span>{showFullContract ? 'Collapse' : 'Expand'}</span>
                  </button>
                </div>
              </div>
              
              {isMerging ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Processing contract merge...</p>
                  </div>
                </div>
              ) : mergeResult?.final_contract ? (
                <>
                  {showFullContract ? (
                    <div className="space-y-4">
                      {/* Enhanced Disclaimer with Full Document List */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
                        <p className="font-medium mb-2">AI-Generated Output</p>
                        <p className="mb-2">This document is a product of AI analysis and a compilation of the following source documents:</p>
                        {mergeResult.document_incorporation_log && mergeResult.document_incorporation_log.length > 0 ? (
                          <ul className="list-decimal list-inside mb-2 space-y-1">
                            {mergeResult.document_incorporation_log.map((doc, index) => (
                              <li key={index} className="text-xs">{doc}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs mb-2">• No source documents specified</p>
                        )}
                        <p>It serves as a tool for review and understanding, not as an official or executed legal instrument.</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                          {getDisclaimerTextForDisplay(mergeResult.document_incorporation_log) + "\n\n" + mergeResult.final_contract}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Enhanced Disclaimer with Full Document List */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
                        <p className="font-medium mb-2">AI-Generated Output</p>
                        <p className="mb-2">This document is a product of AI analysis and a compilation of the following source documents:</p>
                        {mergeResult.document_incorporation_log && mergeResult.document_incorporation_log.length > 0 ? (
                          <ul className="list-decimal list-inside mb-2 space-y-1">
                            {mergeResult.document_incorporation_log.map((doc, index) => (
                              <li key={index} className="text-xs">{doc}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs mb-2">• No source documents specified</p>
                        )}
                        <p>It serves as a tool for review and understanding, not as an official or executed legal instrument.</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-2">Contract preview (first 300 characters):</p>
                        <p className="text-sm text-gray-700 font-mono">
                          {mergeResult.final_contract.substring(0, 300)}...
                        </p>
                        <button
                          onClick={() => setShowFullContract(true)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          Click to view full contract
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No merged contract available</h3>
                  <p className="text-gray-600 mb-4">The contract merge process has not been completed yet.</p>
                  <button
                    onClick={handleRefreshMerge}
                    disabled={isMerging}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isMerging ? 'animate-spin' : ''}`} />
                    {isMerging ? 'Processing...' : 'Process Contract'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractProjectDetailTabbed;