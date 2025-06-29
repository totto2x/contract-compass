import React from 'react';
import { Brain, FileText, CheckCircle, AlertTriangle, Clock, Calendar, AlertCircle as AlertIcon } from 'lucide-react';
import OpenAIDebugPanel from '../debug/OpenAIDebugPanel';

interface ClassificationResult {
  filename: string;
  role: 'base' | 'amendment' | 'ancillary';
  execution_date: string | null;
  effective_date: string | null;
  amends: string | null;
}

interface DocumentClassificationPanelProps {
  classificationResult: {
    documents: ClassificationResult[];
    chronological_order: string[];
  } | null;
  isClassifying: boolean;
  rawApiResponse?: any; // Add this to show the raw OpenAI response
  classificationError?: string | null;
}

const DocumentClassificationPanel: React.FC<DocumentClassificationPanelProps> = ({
  classificationResult,
  isClassifying,
  rawApiResponse,
  classificationError
}) => {
  if (!classificationResult && !isClassifying && !rawApiResponse) {
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'base': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'amendment': return 'bg-green-100 text-green-800 border-green-200';
      case 'ancillary': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'base': return <FileText className="w-4 h-4" />;
      case 'amendment': return <CheckCircle className="w-4 h-4" />;
      case 'ancillary': return <Clock className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Calculate document counts
  const baseCount = classificationResult?.documents.filter(d => d.role === 'base').length || 0;
  const amendmentCount = classificationResult?.documents.filter(d => d.role === 'amendment').length || 0;
  const ancillaryCount = classificationResult?.documents.filter(d => d.role === 'ancillary').length || 0;

  return (
    <div className="space-y-6">
      {/* HIDDEN MAIN SECTION - Keep functionality but hide from UI */}
      <div style={{ display: 'none' }}>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Document Classification & Text Extraction</h2>
              <p className="text-sm text-gray-600">AI-powered analysis with real PDF/DOCX text extraction</p>
            </div>
          </div>

          {isClassifying ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Processing documents...</p>
                <p className="text-sm text-gray-500 mt-1">Extracting text and classifying document types</p>
              </div>
            </div>
          ) : classificationResult ? (
            <div className="space-y-6">
              {/* Classification Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Classification Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {baseCount}
                    </div>
                    <div className="text-xs text-gray-600">Base Contracts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {amendmentCount}
                    </div>
                    <div className="text-xs text-gray-600">Amendments</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">
                      {ancillaryCount}
                    </div>
                    <div className="text-xs text-gray-600">Ancillary Docs</div>
                  </div>
                </div>
              </div>

              {/* Text Extraction Status */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Text Extraction Status</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-blue-600">
                      {classificationResult.documents.length}
                    </div>
                    <div className="text-xs text-blue-800">Documents Processed</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">
                      {classificationResult.documents.length}
                    </div>
                    <div className="text-xs text-green-800">Successfully Classified</div>
                  </div>
                </div>
              </div>

              {/* Document Details - Hidden but functionality preserved */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Document Analysis</h3>
                {classificationResult.documents.map((doc, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(doc.role)}`}>
                          {getRoleIcon(doc.role)}
                          <span className="ml-1 capitalize">{doc.role}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                          {doc.amends && (
                            <p className="text-xs text-gray-600 mt-1">
                              Amends: {doc.amends}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Execution: {formatDate(doc.execution_date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Effective: {formatDate(doc.effective_date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chronological Order - Hidden but functionality preserved */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Chronological Processing Order</h3>
                <div className="space-y-1">
                  {classificationResult.chronological_order.map((filename, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs text-gray-700">
                      <span className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-medium">
                        {index + 1}
                      </span>
                      <span>{filename}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Processing Notes - Hidden but functionality preserved */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-900 mb-2">Processing Notes</h3>
                <div className="text-xs text-green-800 space-y-1">
                  <p>✓ Real text extraction from PDF and DOCX files</p>
                  <p>✓ AI-powered document classification and relationship analysis</p>
                  <p>✓ Chronological ordering based on execution and effective dates</p>
                  <p>✓ Ready for contract merging and analysis</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* VISIBLE UPLOAD SUMMARY SECTION */}
      {classificationResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Summary</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="font-medium text-gray-700">
                  {baseCount} Base contract{baseCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span className="font-medium text-gray-700">
                  {amendmentCount} Amendment{amendmentCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                <span className="font-medium text-gray-700">
                  {ancillaryCount} Ancillary doc{ancillaryCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OpenAI Debug Panel - HIDDEN but functionality preserved */}
      <div style={{ display: 'none' }}>
        <OpenAIDebugPanel
          title="Document Classification"
          apiResponse={rawApiResponse}
          isLoading={isClassifying}
          error={classificationError}
        />
      </div>
    </div>
  );
};

export default DocumentClassificationPanel;