import { useState } from 'react';
import { ContractClassifierService } from '../lib/contractClassifier';
import toast from 'react-hot-toast';

interface ClassificationResult {
  filename: string;
  role: 'base' | 'amendment' | 'ancillary';
  execution_date: string | null;
  effective_date: string | null;
  amends: string | null;
  confidence: number;
}

interface ClassificationResponse {
  documents: ClassificationResult[];
  chronological_order: string[];
}

export const useDocumentClassification = () => {
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState<ClassificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null); // Store raw OpenAI response

  const classifyDocuments = async (files: File[]) => {
    setIsClassifying(true);
    setError(null);
    setRawApiResponse(null); // Clear previous response

    try {
      // Store the raw API response for debugging
      const result = await ContractClassifierService.classifyDocuments(files);
      
      // Note: We would need to modify ContractClassifierService to return the raw API response
      // For now, we'll store the processed result
      setRawApiResponse(result);
      setClassificationResult(result);
      
      const baseCount = result.documents.filter(d => d.role === 'base').length;
      const amendmentCount = result.documents.filter(d => d.role === 'amendment').length;
      const ancillaryCount = result.documents.filter(d => d.role === 'ancillary').length;
      
      // Show more detailed success message
      const extractedCount = result.documents.filter(d => d.confidence > 50).length;
      const totalCount = result.documents.length;
      
      toast.success(
        `Documents processed: ${baseCount} base, ${amendmentCount} amendments, ${ancillaryCount} ancillary. ` +
        `Text extracted from ${extractedCount}/${totalCount} files.`
      );
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to classify documents';
      setError(errorMessage);
      toast.error(`Classification failed: ${errorMessage}`);
      throw err;
    } finally {
      setIsClassifying(false);
    }
  };

  const clearResults = () => {
    setClassificationResult(null);
    setError(null);
    setRawApiResponse(null);
  };

  return {
    isClassifying,
    classificationResult,
    error,
    rawApiResponse, // Expose raw API response
    classifyDocuments,
    clearResults
  };
};