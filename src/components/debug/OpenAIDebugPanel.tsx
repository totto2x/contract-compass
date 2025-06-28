import React, { useState } from 'react';
import { Eye, EyeOff, Code, Copy, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface OpenAIDebugPanelProps {
  title: string;
  apiResponse?: any;
  isLoading?: boolean;
  error?: string | null;
}

const OpenAIDebugPanel: React.FC<OpenAIDebugPanelProps> = ({
  title,
  apiResponse,
  isLoading = false,
  error = null
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('JSON downloaded!');
  };

  if (!apiResponse && !isLoading && !error) {
    return null;
  }

  return (
    <div className="bg-gray-900 text-gray-100 rounded-xl border border-gray-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Code className="w-5 h-5 text-green-400" />
          <span className="font-medium">{title} - OpenAI API Response</span>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-700">
          {/* Status Bar */}
          <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center space-x-4 text-sm">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                error ? 'bg-red-900 text-red-200' :
                isLoading ? 'bg-yellow-900 text-yellow-200' :
                apiResponse ? 'bg-green-900 text-green-200' :
                'bg-gray-700 text-gray-300'
              }`}>
                {error ? 'Error' : isLoading ? 'Loading...' : apiResponse ? 'Success' : 'No Data'}
              </span>
              {apiResponse && (
                <span className="text-gray-400">
                  Response size: {JSON.stringify(apiResponse).length} characters
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                {showRawJson ? 'Formatted' : 'Raw JSON'}
              </button>
              {apiResponse && (
                <>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(apiResponse, null, 2))}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => downloadJson(apiResponse, `${title.toLowerCase().replace(/\s+/g, '-')}-response.json`)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                    title="Download JSON"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-4">
                <h4 className="text-red-400 font-medium mb-2">Error Details:</h4>
                <pre className="text-red-300 text-sm whitespace-pre-wrap">{error}</pre>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-300">Waiting for OpenAI response...</span>
                </div>
              </div>
            )}

            {apiResponse && (
              <div className="space-y-4">
                {showRawJson ? (
                  <div className="bg-black rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                      {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Formatted display based on response type */}
                    {apiResponse.documents && (
                      <div>
                        <h4 className="text-green-400 font-medium mb-2">Document Classification Results:</h4>
                        <div className="space-y-2">
                          {apiResponse.documents.map((doc: any, index: number) => (
                            <div key={index} className="bg-gray-800 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium">{doc.filename}</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  doc.role === 'base' ? 'bg-blue-900 text-blue-200' :
                                  doc.role === 'amendment' ? 'bg-green-900 text-green-200' :
                                  'bg-gray-700 text-gray-300'
                                }`}>
                                  {doc.role}
                                </span>
                              </div>
                              <div className="text-sm text-gray-300 space-y-1">
                                <p>Confidence: {doc.confidence}%</p>
                                {doc.execution_date && <p>Execution Date: {doc.execution_date}</p>}
                                {doc.effective_date && <p>Effective Date: {doc.effective_date}</p>}
                                {doc.amends && <p>Amends: {doc.amends}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {apiResponse.base_summary && (
                      <div>
                        <h4 className="text-green-400 font-medium mb-2">Base Contract Summary:</h4>
                        <div className="bg-gray-800 rounded-lg p-3">
                          <p className="text-gray-300 text-sm leading-relaxed">{apiResponse.base_summary}</p>
                        </div>
                      </div>
                    )}

                    {apiResponse.amendment_summaries && apiResponse.amendment_summaries.length > 0 && (
                      <div>
                        <h4 className="text-green-400 font-medium mb-2">Amendment Summaries:</h4>
                        <div className="space-y-2">
                          {apiResponse.amendment_summaries.map((amendment: any, index: number) => (
                            <div key={index} className="bg-gray-800 rounded-lg p-3">
                              <h5 className="text-white font-medium mb-2">{amendment.document}</h5>
                              <p className="text-purple-300 text-xs mb-2">Role: {amendment.role}</p>
                              <ul className="text-gray-300 text-sm space-y-1">
                                {amendment.changes.map((change: string, changeIndex: number) => (
                                  <li key={changeIndex} className="flex items-start space-x-2">
                                    <span className="text-green-400 mt-1">•</span>
                                    <span>{change}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {apiResponse.clause_change_log && apiResponse.clause_change_log.length > 0 && (
                      <div>
                        <h4 className="text-green-400 font-medium mb-2">Clause Change Log:</h4>
                        <div className="space-y-2">
                          {apiResponse.clause_change_log.map((change: any, index: number) => (
                            <div key={index} className="bg-gray-800 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium">{change.section}</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  change.change_type === 'added' ? 'bg-green-900 text-green-200' :
                                  change.change_type === 'modified' ? 'bg-blue-900 text-blue-200' :
                                  'bg-red-900 text-red-200'
                                }`}>
                                  {change.change_type}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm mb-2">{change.summary}</p>
                              {change.old_text && (
                                <div className="text-xs">
                                  <p className="text-red-400 mb-1">Old: {change.old_text.substring(0, 100)}...</p>
                                  <p className="text-green-400">New: {change.new_text.substring(0, 100)}...</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {apiResponse.final_contract && (
                      <div>
                        <h4 className="text-green-400 font-medium mb-2">Final Contract Preview:</h4>
                        <div className="bg-gray-800 rounded-lg p-3">
                          <p className="text-gray-300 text-sm font-mono leading-relaxed">
                            {apiResponse.final_contract.substring(0, 500)}...
                          </p>
                          <p className="text-gray-500 text-xs mt-2">
                            Total length: {apiResponse.final_contract.length} characters
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Raw JSON toggle */}
                    <div className="pt-4 border-t border-gray-700">
                      <button
                        onClick={() => setShowRawJson(true)}
                        className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        View raw JSON response →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenAIDebugPanel;