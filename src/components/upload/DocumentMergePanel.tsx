import React, { useState } from 'react';
import { 
  GitMerge, 
  FileText, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  List
} from 'lucide-react';
import { Menu } from '@headlessui/react';
import OpenAIDebugPanel from '../debug/OpenAIDebugPanel';

interface MergeDocsResult {
  base_summary: string;
  amendment_summaries: Array<{
    document: string;
    role: 'amendment' | 'ancillary';
    changes: string[];
  }>;
  clause_change_log: Array<{
    section: string;
    change_type: 'modified' | 'added' | 'deleted';
    old_text: string;
    new_text: string;
    summary: string;
  }>;
  final_contract: string;
  document_incorporation_log: string[];
}

interface DocumentMergePanelProps {
  mergeResult: MergeDocsResult | null;
  isMerging: boolean;
  onDownloadContract: (format: 'txt' | 'pdf' | 'docx') => void;
  rawApiResponse?: any; // Add this to show the raw OpenAI response
  mergeError?: string | null;
}

const DocumentMergePanel: React.FC<DocumentMergePanelProps> = ({
  mergeResult,
  isMerging,
  onDownloadContract,
  rawApiResponse,
  mergeError
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showFullContract, setShowFullContract] = useState(false);
  const [showClauseChangeLog, setShowClauseChangeLog] = useState(false);

  if (!mergeResult && !isMerging && !rawApiResponse) {
    return null;
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'modified': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'deleted': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'added': return 'bg-green-50 border-green-200 text-green-800';
      case 'modified': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'deleted': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'amendment': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ancillary': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Disclaimer text
  const disclaimerText = "***\n\nAI-Assisted Output: This document is a product of AI analysis and compilation of source contracts. It serves as a tool for review and understanding, not as an official or executed legal instrument.\n\n***";

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <GitMerge className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Contract Analysis & Merge</h2>
            <p className="text-sm text-gray-600">AI-powered contract merging with detailed change analysis</p>
          </div>
        </div>

        {isMerging ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing and merging contracts...</p>
              <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
            </div>
          </div>
        ) : mergeResult ? (
          <div className="space-y-6">
            {/* Base Contract Summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-base font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Base Contract Summary</span>
              </h3>
              <p className="text-sm text-blue-800 leading-relaxed">{mergeResult.base_summary}</p>
            </div>

            {/* Document Incorporation Log */}
            {mergeResult.document_incorporation_log && mergeResult.document_incorporation_log.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <List className="w-5 h-5" />
                  <span>Document Processing Order</span>
                </h3>
                <div className="space-y-2">
                  {mergeResult.document_incorporation_log.map((doc, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amendment Summaries */}
            {mergeResult.amendment_summaries.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Document Analysis</h3>
                {mergeResult.amendment_summaries.map((amendment, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection(`amendment-${index}`)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(amendment.role)}`}>
                          {amendment.role}
                        </span>
                        <span className="font-medium text-gray-900">
                          {amendment.document}
                        </span>
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
                ))}
              </div>
            )}

            {/* Clause Change Log */}
            {mergeResult.clause_change_log && mergeResult.clause_change_log.length > 0 && (
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setShowClauseChangeLog(!showClauseChangeLog)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>Detailed Clause Changes ({mergeResult.clause_change_log.length})</span>
                  </h3>
                  {showClauseChangeLog ? 
                    <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  }
                </button>
                
                {showClauseChangeLog && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="space-y-3 mt-3">
                      {mergeResult.clause_change_log.map((clause, index) => (
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

            {/* Final Merged Contract */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
                  <GitMerge className="w-5 h-5 text-green-600" />
                  <span>Final Merged Contract</span>
                </h3>
                <div className="flex items-center space-x-3">
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
                            onClick={() => onDownloadContract('pdf')}
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
                            onClick={() => onDownloadContract('docx')}
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
                            onClick={() => onDownloadContract('txt')}
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
                    <span>{showFullContract ? 'Collapse' : 'View Full Contract'}</span>
                  </button>
                </div>
              </div>
              
              {showFullContract ? (
                <div className="p-4">
                  {/* Disclaimer */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-amber-800 text-sm">
                    <p className="font-medium mb-1">AI-Assisted Output</p>
                    <p>This document is a product of AI analysis and compilation of source contracts. It serves as a tool for review and understanding, not as an official or executed legal instrument.</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                      {disclaimerText + "\n\n" + mergeResult.final_contract}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  {/* Disclaimer */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-amber-800 text-sm">
                    <p className="font-medium mb-1">AI-Assisted Output</p>
                    <p>This document is a product of AI analysis and compilation of source contracts. It serves as a tool for review and understanding, not as an official or executed legal instrument.</p>
                  </div>
                  
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
                </div>
              )}
            </div>

            {/* Processing Summary */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-2">Processing Complete</h3>
              <div className="text-sm text-green-800 space-y-1">
                <p>✓ Base contract analyzed and summarized</p>
                <p>✓ {mergeResult.amendment_summaries.length} document{mergeResult.amendment_summaries.length !== 1 ? 's' : ''} processed in chronological order</p>
                {mergeResult.clause_change_log && (
                  <p>✓ {mergeResult.clause_change_log.length} clause-level change{mergeResult.clause_change_log.length !== 1 ? 's' : ''} tracked</p>
                )}
                <p>✓ Final unified contract generated with all changes applied</p>
                <p>✓ Ready for download in multiple formats</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* OpenAI Debug Panel */}
      <OpenAIDebugPanel
        title="Contract Merging"
        apiResponse={rawApiResponse}
        isLoading={isMerging}
        error={mergeError}
      />
    </div>
  );
};

export default DocumentMergePanel;