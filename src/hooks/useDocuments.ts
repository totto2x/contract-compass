import { useState, useEffect } from 'react';
import { DatabaseService, type DatabaseDocument } from '../lib/database';
import { TextExtractionService } from '../lib/textExtraction';
import toast from 'react-hot-toast';

export const useDocuments = (projectId: string | null) => {
  const [documents, setDocuments] = useState<DatabaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const data = await DatabaseService.getDocuments(projectId);
      setDocuments(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const uploadDocument = async (
    file: File,
    type: 'base' | 'amendment',
    onProgress?: (progress: number) => void,
    classificationData?: {
      classification_role: 'base' | 'amendment' | 'ancillary';
      execution_date?: string | null;
      effective_date?: string | null;
      amends_document?: string | null;
    }
  ) => {
    if (!projectId) throw new Error('No project selected');

    try {
      // Update progress to show file upload starting
      onProgress?.(10);

      // Upload file to storage
      const filePath = await DatabaseService.uploadFile(projectId, file, (uploadProgress) => {
        // File upload takes 10-50% of total progress
        onProgress?.(10 + (uploadProgress * 0.4));
      });

      onProgress?.(50);

      // Extract text from the file
      let extractedText = '';
      let textExtractionStatus: 'complete' | 'failed' = 'complete';
      let textExtractionError: string | undefined;

      try {
        console.log(`Extracting text from ${file.name}...`);
        extractedText = await TextExtractionService.extractText(file);
        console.log(`Text extraction successful: ${extractedText.length} characters extracted`);
        onProgress?.(80);
      } catch (extractionError: any) {
        console.error('Text extraction failed:', extractionError);
        textExtractionStatus = 'failed';
        textExtractionError = extractionError.message;
        onProgress?.(70); // Still progress even if extraction fails
      }

      // Create document record with extracted text and classification data
      const documentData = {
        project_id: projectId,
        name: file.name,
        type,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        extracted_text: extractedText || null,
        text_extraction_status: textExtractionStatus,
        text_extraction_error: textExtractionError,
        ...classificationData
      };

      const newDocument = await DatabaseService.createDocument(documentData);
      setDocuments(prev => [newDocument, ...prev]);
      
      onProgress?.(90);

      // Update status to complete
      await DatabaseService.updateDocumentStatus(newDocument.document_id, 'complete');
      setDocuments(prev => prev.map(d => 
        d.document_id === newDocument.document_id 
          ? { ...d, upload_status: 'complete' }
          : d
      ));

      onProgress?.(100);
      toast.success(`Document uploaded successfully${extractedText ? ' with text extraction' : ' (text extraction failed)'}`);
      return newDocument;
    } catch (err: any) {
      toast.error('Failed to upload document');
      throw err;
    }
  };

  const updateDocumentClassification = async (
    documentId: string,
    classificationData: {
      classification_role: 'base' | 'amendment' | 'ancillary';
      execution_date?: string | null;
      effective_date?: string | null;
      amends_document?: string | null;
    }
  ) => {
    try {
      await DatabaseService.updateDocumentClassification(documentId, classificationData);
      
      // Update local state
      setDocuments(prev => prev.map(d => 
        d.document_id === documentId 
          ? { ...d, ...classificationData }
          : d
      ));

      toast.success('Document classification updated');
    } catch (err: any) {
      toast.error('Failed to update document classification');
      throw err;
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      await DatabaseService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(d => d.document_id !== documentId));
      toast.success('Document deleted successfully');
    } catch (err: any) {
      toast.error('Failed to delete document');
      throw err;
    }
  };

  const downloadDocument = async (document: DatabaseDocument) => {
    try {
      const blob = await DatabaseService.downloadFile(document.file_path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error('Failed to download document');
      throw err;
    }
  };

  const getDocumentsForMerging = async () => {
    if (!projectId) throw new Error('No project selected');
    
    try {
      return await DatabaseService.getDocumentsForMerging(projectId);
    } catch (err: any) {
      toast.error('Failed to get documents for merging');
      throw err;
    }
  };

  return {
    documents,
    loading,
    error,
    uploadDocument,
    updateDocumentClassification,
    deleteDocument,
    downloadDocument,
    getDocumentsForMerging,
    refetch: fetchDocuments
  };
};