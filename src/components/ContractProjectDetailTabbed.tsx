import React, { useState, useEffect } from 'react';
import { ContractProject } from '../types';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  FileText, 
  Download, 
  Plus,
  Clock,
  Tag,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { useDocuments } from '../hooks/useDocuments';
import { useDocumentMerging } from '../hooks/useDocumentMerging';
import { DocumentGenerator } from '../lib/documentGenerator';
import { DatabaseService } from '../lib/database';
import ContractSummaryTab from './summary/ContractSummaryTab';
import toast from 'react-hot-toast';

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
  const [activeTab, setActiveTab] = useState<'summary' | 'change-log' | 'source-docs' | 'final-contract'>('summary');
  const [downloadingFormats, setDownloadingFormats] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deletingDocuments, setDeletingDocuments] = useState<Set<string>>(new Set());

  const { documents, loading: documentsLoading, deleteDocument } = useDocuments(project.id);
  const { 
    mergeResult, 
    loadMergeResultFromDatabase, 
    downloadFinalContract 
  } = useDocumentMerging();

  // Load merge result when component mounts
  useEffect(() => {
    loadMergeResultFromDatabase(project.id);
  }, [project.id]);

  // Helper function to safely format dates
  const safeFormatDate = (dateString: string | null | undefined, formatString: string = 'MMM dd, yyyy'): string => {
    if (!dateString) return 'Not available';
    
    const date = new Date(dateString);
    if (!isValid(date)) return 'Invalid date';
    
    return format(date, formatString);
  };

  const handleDownloadFinal = async (format: 'txt' | 'pdf' | 'docx') => {
    if (!mergeResult) {
      toast.error('No merged contract available for download');
      return;
    }

    try {
      setDownloadingFormats(prev => new Set(prev).add(format));
      
      const filename = `${project.name}-unified`;
      const documentIncorporationLog = mergeResult.document_incorporation_log || [];
      
      switch (format) {
        case 'txt':
          DocumentGenerator.generateTXT(mergeResult.final_contract, filename, documentIncorporationLog);
          toast.success('Contract downloaded as TXT file');
          break;

        case 'pdf':
          toast('Generating PDF document...');
          await DocumentGenerator.generatePDF(mergeResult.final_contract, filename, documentIncorporationLog);
          toast.success('Contract downloaded as PDF file');
          break;

        case 'docx':
          toast('Generating DOCX document...');
          await DocumentGenerator.generateDOCX(mergeResult.final_contract, filename, documentIncorporationLog);
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
      setDownloadingFormats(prev => {
        const newSet = new Set(prev);
        newSet.delete(format);
        return newSet;
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      setDeletingDocuments(prev => new Set(prev).add(documentId));
      await deleteDocument(documentId);
      setShowDeleteConfirm(null);
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error('Failed to delete document');
    } finally {
      setDeletingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = format(new Date(startDate), 'MMM dd, yyyy');
    const end = format(new Date(endDate), 'MMM dd, yyyy');
    return `${start} – ${end}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'base': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'amendment': return 'bg-green-100 text-green-800 border-green-200';
      case 'ancillary': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Generate mock stats for the summary tab
  const stats = {
    totalClauses: mergeResult?.clause_change_log?.length || 0,
    amendmentsDetected: mergeResult?.amendment_summaries?.length || 0,
    changesDetected: mergeResult?.clause_change_log?.length || 0,
    lastProcessed: project.lastUpdated
  };

  const changeSummary = mergeResult?.base_summary || 'No contract analysis available yet.';

  // Generate timeline from documents
  const timeline = documents.map((doc, index) => ({
    id: doc.document_id,
    title: doc.name,
    date: doc.effective_date || doc.creation_date,
    type: doc.classification_role === 'base' ? 'base' as const : 'amendment' as const,
    description: `${doc.classification_role || doc.type} document`
  }));

  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'change-log', label: 'Change Log', icon: Clock },
    { id: 'source-docs', label: 'Source Documents', icon: Eye },
    { id: 'final-contract', label: 'Final Contract', icon: Download },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <ContractSummaryTab
            project={project}
            stats={stats}
            changeSummary={changeSummary}
            timeline={timeline}
            mergeResult={mergeResult}
          />
        );

      case 'change-log':
        return (
          <div className="space-y-6">
            {mergeResult?.clause_change_log && mergeResult.clause_change_log.length > 0 ? (
              <div className="space-y-4">
                {mergeResult.clause_change_log.map((change, index) => (
                  <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                          change.change_type === 'added' ? 'bg-green-100 text-green-800 border-green-200' :
                          change.change_type === 'modified' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {change.change_type}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">{change.section}</h3>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">{change.summary}</p>
                    {change.old_text && change.new_text && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Before</h4>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800">{change.old_text}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">After</h4>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-800">{change.new_text}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No change log available</h3>
                <p className="text-gray-600">Process documents to generate a detailed change log.</p>
              </div>
            )}
          </div>
        );

      case 'source-docs':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Source Documents</h3>
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
              </div>

              {documentsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading documents...</p>
                </div>
              ) : documents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Document Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Effective Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Upload Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {documents.map((doc) => {
                        const isDeleting = deletingDocuments.has(doc.document_id);
                        
                        return (
                          <tr key={doc.document_id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(doc.classification_role || doc.type)}`}>
                                {doc.classification_role || doc.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900 font-medium">
                                  {safeFormatDate(doc.effective_date)}
                                </span>
                              </div>
                              {doc.execution_date && doc.execution_date !== doc.effective_date && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Executed: {safeFormatDate(doc.execution_date)}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.upload_status)}`}>
                                {getStatusIcon(doc.upload_status)}
                                <span className="ml-1 capitalize">{doc.upload_status}</span>
                              </span>
                              {doc.text_extraction_status && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Text: {doc.text_extraction_status}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setShowDeleteConfirm(doc.document_id)}
                                disabled={isDeleting}
                                className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors disabled:opacity-50"
                                title="Delete document"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
                  <p className="text-gray-600 mb-4">Upload documents to start contract analysis</p>
                  {onAddDocument && (
                    <button
                      onClick={onAddDocument}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Document
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'final-contract':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Final Merged Contract</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleDownloadFinal('pdf')}
                    disabled={downloadingFormats.has('pdf')}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingFormats.has('pdf') ? 'Generating...' : 'Download PDF'}</span>
                  </button>
                  <button
                    onClick={() => handleDownloadFinal('docx')}
                    disabled={downloadingFormats.has('docx')}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingFormats.has('docx') ? 'Generating...' : 'Download DOCX'}</span>
                  </button>
                  <button
                    onClick={() => handleDownloadFinal('txt')}
                    disabled={downloadingFormats.has('txt')}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingFormats.has('txt') ? 'Generating...' : 'Download TXT'}</span>
                  </button>
                </div>
              </div>

              {mergeResult?.final_contract ? (
                <div className="space-y-4">
                  {/* Document Incorporation Log */}
                  {mergeResult.document_incorporation_log && mergeResult.document_incorporation_log.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-amber-900 mb-2">AI-Generated Output</h4>
                      <p className="text-sm text-amber-800 mb-2">This document is a product of AI analysis and a compilation of the following source documents:</p>
                      <ol className="list-decimal list-inside text-sm text-amber-800 space-y-1">
                        {mergeResult.document_incorporation_log.map((doc, index) => (
                          <li key={index}>{doc}</li>
                        ))}
                      </ol>
                      <p className="text-sm text-amber-800 mt-2">It serves as a tool for review and understanding, not as an official or executed legal instrument.</p>
                    </div>
                  )}

                  {/* Contract Content */}
                  <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                      {mergeResult.final_contract}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No merged contract available</h3>
                  <p className="text-gray-600">Process documents to generate the final merged contract.</p>
                </div>
              )}
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
                <FileText className="w-4 h-4" />
                <span>{project.documentCount} Document{project.documentCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Created {format(new Date(project.uploadDate), 'MMM dd, yyyy')}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
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
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
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

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Document</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete this document? This will permanently remove the file and its analysis data.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDocument(showDeleteConfirm)}
                disabled={deletingDocuments.has(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingDocuments.has(showDeleteConfirm) ? 'Deleting...' : 'Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractProjectDetailTabbed;