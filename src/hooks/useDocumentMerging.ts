import { useState } from 'react';
import { ContractMergerService } from '../lib/contractMerger';
import { DatabaseService } from '../lib/database';
import toast from 'react-hot-toast';

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

export const useDocumentMerging = () => {
  const [isMerging, setIsMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<MergeDocsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null); // Store raw OpenAI response

  const mergeDocumentsFromProject = async (projectId: string) => {
    setIsMerging(true);
    setError(null);
    setRawApiResponse(null); // Clear previous response

    try {
      // First check if we have a cached result in the database
      console.log('🔍 Checking for existing merge result in database...');
      const existingResult = await DatabaseService.getMergedContractResult(projectId);
      
      if (existingResult) {
        console.log('✅ Found existing merge result in database, using cached version');
        const result = {
          base_summary: existingResult.base_summary,
          amendment_summaries: existingResult.amendment_summaries,
          clause_change_log: existingResult.clause_change_log,
          final_contract: existingResult.final_contract,
          document_incorporation_log: existingResult.document_incorporation_log
        };
        
        setMergeResult(result);
        setRawApiResponse(existingResult); // Store the database result as "API response"
        
        toast.success('Contract merge result loaded from database');
        return result;
      }

      // If no cached result, perform the merge
      console.log('🔄 No cached result found, performing new merge...');
      const result = await ContractMergerService.mergeDocumentsFromProject(projectId);
      
      // Note: We would need to modify ContractMergerService to return the raw API response
      // For now, we'll store the processed result
      setRawApiResponse(result);
      setMergeResult(result);
      
      // Save the result to the database
      try {
        console.log('💾 Saving merge result to database...');
        await DatabaseService.saveMergedContractResult(projectId, result);
        console.log('✅ Merge result saved to database successfully');
        
        toast.success('Contract merged successfully and saved to database');
      } catch (saveError) {
        console.error('⚠️ Failed to save merge result to database:', saveError);
        // Don't throw error here - the merge was successful, just saving failed
        toast.success('Contract merged successfully (database save failed)');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to merge documents';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsMerging(false);
    }
  };

  const loadMergeResultFromDatabase = async (projectId: string) => {
    try {
      console.log('🔍 Loading merge result from database...');
      const result = await DatabaseService.getMergedContractResult(projectId);
      
      if (result) {
        console.log('✅ Loaded merge result from database');
        const mergeData = {
          base_summary: result.base_summary,
          amendment_summaries: result.amendment_summaries,
          clause_change_log: result.clause_change_log,
          final_contract: result.final_contract,
          document_incorporation_log: result.document_incorporation_log
        };
        
        setMergeResult(mergeData);
        setRawApiResponse(result); // Store the database result as "API response"
        return mergeData;
      } else {
        console.log('ℹ️ No merge result found in database for this project');
        return null;
      }
    } catch (err: any) {
      console.error('Failed to load merge result from database:', err);
      // Don't set error state for loading failures
      return null;
    }
  };

  const clearResults = () => {
    setMergeResult(null);
    setError(null);
    setRawApiResponse(null);
  };

  const downloadFinalContract = (filename: string = 'merged-contract.txt') => {
    if (!mergeResult) {
      toast.error('No merged contract available for download');
      return;
    }

    const blob = new Blob([mergeResult.final_contract], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Contract downloaded successfully');
  };

  return {
    isMerging,
    mergeResult,
    error,
    rawApiResponse, // Expose raw API response
    mergeDocumentsFromProject,
    loadMergeResultFromDatabase,
    clearResults,
    downloadFinalContract
  };
};