import { useState } from 'react';
import { OpenAIService } from '../lib/openai';
import toast from 'react-hot-toast';

export interface ContractAnalysisResult {
  summary: string;
  sections: Array<{
    id: string;
    title: string;
    changeType: 'added' | 'modified' | 'deleted';
    description: string;
    details: Array<{
      type: 'added' | 'deleted' | 'modified';
      text: string;
    }>;
  }>;
}

export const useContractAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ContractAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeContracts = async (
    baseContract: string,
    amendmentContract: string,
    contractType: string = 'general'
  ) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await OpenAIService.analyzeContractChanges(
        baseContract,
        amendmentContract,
        contractType
      );
      
      setAnalysisResult(result);
      toast.success('Contract analysis completed successfully');
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to analyze contracts';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSummary = async (
    contractText: string,
    contractType: string = 'general',
    projectName: string = 'Contract Project'
  ) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const summary = await OpenAIService.generateContractSummary(
        contractText,
        contractType,
        projectName
      );
      
      toast.success('Contract summary generated successfully');
      return summary;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate contract summary';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractMetadata = async (contractText: string) => {
    try {
      return await OpenAIService.extractContractMetadata(contractText);
    } catch (err: any) {
      console.error('Metadata extraction failed:', err);
      return {
        parties: ['Unknown Party 1', 'Unknown Party 2'],
        contractType: 'other' as const,
        keyTerms: []
      };
    }
  };

  const clearResults = () => {
    setAnalysisResult(null);
    setError(null);
  };

  return {
    isAnalyzing,
    analysisResult,
    error,
    analyzeContracts,
    generateSummary,
    extractMetadata,
    clearResults
  };
};