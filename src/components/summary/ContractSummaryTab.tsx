import React from 'react';
import { 
  Calendar, 
  User, 
  Tag, 
  FileText, 
  Clock, 
  TrendingUp, 
  BarChart3,
  Building2,
  AlertCircle
} from 'lucide-react';
import { format, isValid } from 'date-fns';

interface ContractSummaryTabProps {
  project: {
    name: string;
    client: string;
    uploadDate: string;
    documentCount: number;
    tags: string[];
    contractEffectiveStart: string;
    contractEffectiveEnd: string;
    lastUpdated: string;
  };
  stats: {
    totalClauses: number;
    amendmentsApplied: number;
    changesDetected: number;
    lastProcessed: string;
  };
  changeSummary: string;
  timeline: Array<{
    id: string;
    title: string;
    date: string;
    type: 'base' | 'amendment';
    description: string;
  }>;
  mergeResult?: any; // Add merge result to extract real contract dates and parties
}

// Helper function to safely format dates
const safeFormatDate = (dateString: string, formatString: string = 'MMMM dd, yyyy'): string => {
  if (!dateString) return 'Not available';
  
  const date = new Date(dateString);
  if (!isValid(date)) return 'Invalid date';
  
  return format(date, formatString);
};

// Helper function to extract contract dates from merge result
const extractContractDates = (mergeResult: any) => {
  if (!mergeResult) {
    return null;
  }

  // Try to extract dates from document incorporation log
  if (mergeResult.document_incorporation_log && mergeResult.document_incorporation_log.length > 0) {
    const dates: string[] = [];
    
    mergeResult.document_incorporation_log.forEach((doc: string) => {
      // Parse dates from format: "filename (role, date)"
      const match = doc.match(/\(.*?,\s*(.+?)\)$/);
      if (match) {
        const dateStr = match[1].trim();
        // Try to parse various date formats
        const parsedDate = new Date(dateStr);
        if (isValid(parsedDate)) {
          dates.push(parsedDate.toISOString());
        }
      }
    });

    if (dates.length > 0) {
      // Sort dates to get earliest and latest
      const sortedDates = dates.sort();
      return {
        effectiveStart: sortedDates[0],
        effectiveEnd: sortedDates[sortedDates.length - 1],
        source: 'openai-analysis'
      };
    }
  }

  // Try to extract from final contract text
  if (mergeResult.final_contract) {
    const contractText = mergeResult.final_contract;
    
    // Look for common contract date patterns
    const datePatterns = [
      /entered into on\s+([^,]+)/i,
      /effective\s+(?:as of\s+)?([^,\n]+)/i,
      /dated\s+([^,\n]+)/i,
      /this\s+agreement.*?(\w+\s+\d{1,2},?\s+\d{4})/i
    ];

    for (const pattern of datePatterns) {
      const match = contractText.match(pattern);
      if (match) {
        const dateStr = match[1].trim();
        const parsedDate = new Date(dateStr);
        if (isValid(parsedDate)) {
          // Use the extracted date as start, and add 1 year as end
          const endDate = new Date(parsedDate);
          endDate.setFullYear(endDate.getFullYear() + 1);
          
          return {
            effectiveStart: parsedDate.toISOString(),
            effectiveEnd: endDate.toISOString(),
            source: 'contract-text-analysis'
          };
        }
      }
    }
  }

  // No valid dates found
  return null;
};

// Helper function to extract agreement parties from merge result
const extractAgreementParties = (mergeResult: any) => {
  if (!mergeResult) {
    return null;
  }

  // Try to extract from final contract text
  if (mergeResult.final_contract) {
    const contractText = mergeResult.final_contract;
    
    // Look for common party identification patterns
    const partyPatterns = [
      // Pattern: "between [Party1] ("Client") and [Party2] ("Provider")"
      /between\s+([^("]+)\s*\([^)]*(?:client|customer)[^)]*\)\s*and\s+([^("]+)\s*\([^)]*(?:provider|company|contractor)[^)]*\)/i,
      // Pattern: "between [Party1] and [Party2]"
      /between\s+([^,\n]+?)\s*(?:\([^)]*\))?\s*(?:,\s*)?and\s+([^,\n]+?)(?:\s*\([^)]*\))?[,\n]/i,
      // Pattern: "This agreement is entered into by [Party1] and [Party2]"
      /entered into by\s+([^,\n]+?)\s*(?:\([^)]*\))?\s*(?:,\s*)?and\s+([^,\n]+?)(?:\s*\([^)]*\))?[,\n]/i,
      // Pattern: "[Party1] ("Client") agrees with [Party2] ("Provider")"
      /([^("]+)\s*\([^)]*(?:client|customer)[^)]*\)\s*.*?(?:agrees?\s*with|and)\s*([^("]+)\s*\([^)]*(?:provider|company|contractor)[^)]*\)/i
    ];

    for (const pattern of partyPatterns) {
      const match = contractText.match(pattern);
      if (match) {
        let party1 = match[1].trim();
        let party2 = match[2].trim();
        
        // Clean up the extracted names - remove leading articles and clean formatting
        party1 = party1.replace(/^(the\s+)?/i, '').trim();
        party2 = party2.replace(/^(the\s+)?/i, '').trim();
        
        // Remove any trailing commas or periods
        party1 = party1.replace(/[,.]$/, '').trim();
        party2 = party2.replace(/[,.]$/, '').trim();
        
        // Ensure we have meaningful names (not just punctuation or short words)
        if (party1.length > 2 && party2.length > 2) {
          return {
            parties: [party1, party2],
            source: 'contract-text-analysis'
          };
        }
      }
    }
  }

  // Try to extract from base summary
  if (mergeResult.base_summary) {
    const summaryText = mergeResult.base_summary;
    
    // Look for party mentions in the summary
    const summaryPatterns = [
      /between\s+([^,\n]+?)\s*(?:\([^)]*\))?\s*(?:,\s*)?and\s+([^,\n]+?)(?:\s*\([^)]*\))?[,\n]/i,
      /agreement.*?between\s+([^,\n]+?)\s*and\s+([^,\n]+?)[,\n]/i
    ];

    for (const pattern of summaryPatterns) {
      const match = summaryText.match(pattern);
      if (match) {
        let party1 = match[1].trim();
        let party2 = match[2].trim();
        
        // Clean up the extracted names
        party1 = party1.replace(/^(the\s+)?/i, '').trim();
        party2 = party2.replace(/^(the\s+)?/i, '').trim();
        
        // Remove any trailing commas or periods
        party1 = party1.replace(/[,.]$/, '').trim();
        party2 = party2.replace(/[,.]$/, '').trim();
        
        if (party1.length > 2 && party2.length > 2) {
          return {
            parties: [party1, party2],
            source: 'summary-analysis'
          };
        }
      }
    }
  }

  // No valid parties found
  return null;
};

// Helper function to generate comprehensive final contract summary
const generateFinalContractSummary = (mergeResult: any, project: any) => {
  if (!mergeResult) {
    return "No contract analysis available. Please ensure documents have been processed and merged.";
  }

  // Start with base summary
  let summary = mergeResult.base_summary || "Base contract analysis not available.";
  
  // Add amendment information if available
  if (mergeResult.amendment_summaries && mergeResult.amendment_summaries.length > 0) {
    summary += "\n\nKey Changes and Amendments:\n";
    
    mergeResult.amendment_summaries.forEach((amendment: any, index: number) => {
      summary += `\n${index + 1}. ${amendment.document}:\n`;
      if (amendment.changes && amendment.changes.length > 0) {
        amendment.changes.forEach((change: string) => {
          summary += `   • ${change}\n`;
        });
      }
    });
  }
  
  // Add clause change summary if available
  if (mergeResult.clause_change_log && mergeResult.clause_change_log.length > 0) {
    const addedClauses = mergeResult.clause_change_log.filter((c: any) => c.change_type === 'added').length;
    const modifiedClauses = mergeResult.clause_change_log.filter((c: any) => c.change_type === 'modified').length;
    const deletedClauses = mergeResult.clause_change_log.filter((c: any) => c.change_type === 'deleted').length;
    
    summary += `\n\nContract Modifications Summary:\n`;
    if (addedClauses > 0) summary += `• ${addedClauses} new clause${addedClauses > 1 ? 's' : ''} added\n`;
    if (modifiedClauses > 0) summary += `• ${modifiedClauses} clause${modifiedClauses > 1 ? 's' : ''} modified\n`;
    if (deletedClauses > 0) summary += `• ${deletedClauses} clause${deletedClauses > 1 ? 's' : ''} removed\n`;
  }
  
  // Add document incorporation info
  if (mergeResult.document_incorporation_log && mergeResult.document_incorporation_log.length > 0) {
    summary += `\n\nThis final contract incorporates ${mergeResult.document_incorporation_log.length} document${mergeResult.document_incorporation_log.length > 1 ? 's' : ''} processed in chronological order, ensuring all amendments and modifications are properly applied.`;
  }
  
  return summary;
};

const ContractSummaryTab: React.FC<ContractSummaryTabProps> = ({ 
  project, 
  stats, 
  changeSummary, 
  timeline,
  mergeResult 
}) => {
  // Extract real contract dates from OpenAI analysis
  const contractDates = extractContractDates(mergeResult);

  // Extract real agreement parties from OpenAI analysis
  const agreementParties = extractAgreementParties(mergeResult);
  // Prefer the v8 `parties` array if it exists, otherwise fall back
  const displayedParties: string[] | null =
    mergeResult?.parties && Array.isArray(mergeResult.parties) && mergeResult.parties.length > 0
      ? mergeResult.parties
      : agreementParties?.parties ?? null;

  // And track where they came from for the little ✓ badge
  const partiesSource: 'v8-parties' | 'contract-text-analysis' | 'summary-analysis' | null =
    mergeResult?.parties && Array.isArray(mergeResult.parties) && mergeResult.parties.length > 0
      ? 'v8-parties'
      : agreementParties?.source ?? null;

  // Generate comprehensive final contract summary
  const finalContractSummary = generateFinalContractSummary(mergeResult, project);
  // Prefer the v8 `final_summary` if present; otherwise fall back
  const displayedSummary = mergeResult?.final_summary?.trim()
    ? mergeResult.final_summary
    : finalContractSummary;

  // Component for "No Data" message
  const NoDataMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center py-8 text-gray-500">
      <div className="text-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* 1. Essentials Overview - 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agreement Parties */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Building2 className="w-5 h-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Agreement Parties</h3>
          </div>
          {agreementParties ? (
            <div className="space-y-3">
            {displayedParties && displayedParties.length > 0 ? (
              <div className="space-y-3">
                {displayedParties.map((party, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{party}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {partiesSource === 'v8-parties' && (
                    <p className="text-xs text-indigo-600">✓ Taken from v8 `parties`</p>
                  )}
                  {partiesSource === 'contract-text-analysis' && (
                    <p className="text-xs text-green-600">✓ Extracted from contract text</p>
                  )}
                  {partiesSource === 'summary-analysis' && (
                    <p className="text-xs text-blue-600">✓ Extracted from contract summary</p>
                  )}
                </div>
              </div>
            ) : (
              <NoDataMessage message="No agreement parties data available from contract analysis" />
            )}
            </div>
          ) : (
            <NoDataMessage message="No agreement parties data available from contract analysis" />
          )}
        </div>

        {/* Agreement Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Agreement Details</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Contract Type:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            {contractDates ? (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-700">Effective Start Date:</p>
                  <p className="text-gray-900">{safeFormatDate(contractDates.effectiveStart)}</p>
                  {contractDates.source === 'openai-analysis' && (
                    <p className="text-xs text-green-600 mt-1">✓ Extracted from contract analysis</p>
                  )}
                  {contractDates.source === 'contract-text-analysis' && (
                    <p className="text-xs text-blue-600 mt-1">✓ Extracted from contract text</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Effective End Date:</p>
                  <p className="text-gray-900">{safeFormatDate(contractDates.effectiveEnd)}</p>
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-700">Contract Dates:</p>
                <NoDataMessage message="No contract dates available from analysis" />
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Last Updated: {safeFormatDate(stats.lastProcessed, 'MMM dd, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Contract Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Contract Stats</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Clauses</span>
              <span className="text-lg font-bold text-gray-900">{stats.totalClauses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Changes Detected</span>
              <span className="text-lg font-bold text-gray-900">{stats.changesDetected}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Documents Uploaded</span>
              <span className="text-lg font-bold text-gray-900">{project.documentCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Final Contract Summary - Updated to show merged contract summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Final Contract Summary</h2>
        {displayedSummary ? (
          <div className="prose max-w-none">
            <div className="text-gray-700 leading-relaxed text-base whitespace-pre-line">
              {displayedSummary}
            </div>
          </div>
        ) : (
          <NoDataMessage message="No contract summary available from AI analysis" />
        )}
      </div>
    </div>
  );
};

export default ContractSummaryTab;