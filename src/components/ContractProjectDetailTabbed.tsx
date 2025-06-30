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
  BarChart3
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
  const [activeTab, setActiveTab] = useState<'summary' | 'timeline' | 'final-contract'>('summary');
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

  // Mock data for demonstration
  const timeline = [
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'summary', label: 'Contract Summary', icon: BarChart3 },
            { id: 'timeline', label: 'Document Timeline', icon: GitBranch },
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
            timeline={timeline}
            mergeResult={mergeResult}
          />
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <GitBranch className="w-5 h-5 text-purple-600" />
                <span>Document Timeline</span>
              </h2>
              
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 mt-1 transition-colors ${
                      item.type === 'base'
                        ? 'bg-green-500 border-green-500'
                        : 'bg-purple-500 border-purple-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-600">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(item.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amendment Summaries */}
            {amendmentSummaries.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Amendment Analysis</h3>
                <div className="space-y-4">
                  {amendmentSummaries.map((amendment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{amendment.document}</span>
                        <span className="text-xs text-gray-500">{amendment.role}</span>
                      </div>
                      <div className="space-y-1">
                        {amendment.changes.map((change, changeIndex) => (
                          <div key={changeIndex} className="text-sm text-gray-600 flex items-start space-x-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{change}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clause Change Log */}
            {clauseChangeLog.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Clause Changes</h3>
                <div className="space-y-3">
                  {clauseChangeLog.map((clause, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getChangeTypeColor(clause.change_type)}`}>
                      <div className="flex items-start space-x-2 mb-2">
                        {getChangeTypeIcon(clause.change_type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">{clause.section}</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50 capitalize">
                              {clause.change_type}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{clause.summary}</p>
                          {clause.old_text && clause.old_text !== clause.new_text && (
                            <div className="space-y-2 text-xs">
                              {clause.old_text && (
                                <div>
                                  <span className="font-medium">Before:</span>
                                  <p className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                                    {clause.old_text.length > 100 ? clause.old_text.substring(0, 100) + '...' : clause.old_text}
                                  </p>
                                </div>
                              )}
                              {clause.new_text && (
                                <div>
                                  <span className="font-medium">After:</span>
                                  <p className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-green-800">
                                    {clause.new_text.length > 100 ? clause.new_text.substring(0, 100) + '...' : clause.new_text}
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
                  {/* Document Incorporation Log */}
                  {mergeResult.document_incorporation_log && mergeResult.document_incorporation_log.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Source Documents</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        {mergeResult.document_incorporation_log.map((doc, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium text-blue-800">
                              {index + 1}
                            </span>
                            <span>{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {showFullContract ? (
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
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        Click to view full contract
                      </button>
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