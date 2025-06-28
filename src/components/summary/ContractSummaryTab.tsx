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
        let client = match[1].trim();
        let provider = match[2].trim();
        
        // Clean up the extracted names
        client = client.replace(/^(the\s+)?/i, '').replace(/,?\s*(inc\.?|llc\.?|corp\.?|ltd\.?)$/i, ' $1').trim();
        provider = provider.replace(/^(the\s+)?/i, '').replace(/,?\s*(inc\.?|llc\.?|corp\.?|ltd\.?)$/i, ' $1').trim();
        
        // Ensure we have meaningful names (not just punctuation or short words)
        if (client.length > 2 && provider.length > 2) {
          return {
            client: client,
            provider: provider,
            source: 'contract-text-analysis'
          };
        }
      }
    }

    // Try to find any mention of GitHub as provider
    const githubMatch = contractText.match(/(GitHub[^,\n]*(?:Inc\.?|Corporation)?)/i);
    if (githubMatch) {
      return {
        client: null, // We don't have a reliable client name
        provider: githubMatch[1].trim(),
        source: 'contract-text-partial'
      };
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
        let client = match[1].trim();
        let provider = match[2].trim();
        
        // Clean up the extracted names
        client = client.replace(/^(the\s+)?/i, '').trim();
        provider = provider.replace(/^(the\s+)?/i, '').trim();
        
        if (client.length > 2 && provider.length > 2) {
          return {
            client: client,
            provider: provider,
            source: 'summary-analysis'
          };
        }
      }
    }
  }

  // No valid parties found
  return null;
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
              <div>
                <p className="text-sm font-medium text-gray-700">Client:</p>
                <p className="text-gray-900">{agreementParties.client || 'Not specified'}</p>
                {agreementParties.source === 'contract-text-analysis' && (
                  <p className="text-xs text-green-600 mt-1">✓ Extracted from contract text</p>
                )}
                {agreementParties.source === 'summary-analysis' && (
                  <p className="text-xs text-blue-600 mt-1">✓ Extracted from contract summary</p>
                )}
                {agreementParties.source === 'contract-text-partial' && (
                  <p className="text-xs text-yellow-600 mt-1">⚠️ Partially extracted from contract</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Provider:</p>
                <p className="text-gray-900">{agreementParties.provider}</p>
                {agreementParties.source === 'contract-text-analysis' && (
                  <p className="text-xs text-green-600 mt-1">✓ Extracted from contract text</p>
                )}
                {agreementParties.source === 'summary-analysis' && (
                  <p className="text-xs text-blue-600 mt-1">✓ Extracted from contract summary</p>
                )}
                {agreementParties.source === 'contract-text-partial' && (
                  <p className="text-xs text-yellow-600 mt-1">✓ Extracted from contract text</p>
                )}
              </div>
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

      {/* 2. Final Contract Summary - Plain Text Block */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Final Contract Summary</h2>
        {changeSummary ? (
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed text-base">
              {changeSummary}
            </p>
          </div>
        ) : (
          <NoDataMessage message="No contract summary available from AI analysis" />
        )}
      </div>

      {/* 3. Mini Timeline - Simplified Horizontal */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Contract Timeline</h2>
        
        {timeline.length > 0 ? (
          <>
            {/* Horizontal milestone dots */}
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200"></div>
              
              {/* Timeline items */}
              <div className="flex justify-between items-start relative">
                {timeline.slice(0, 5).map((item, index) => (
                  <div key={item.id} className="flex flex-col items-center group cursor-pointer">
                    {/* Milestone dot */}
                    <div className={`w-8 h-8 rounded-full border-2 bg-white flex items-center justify-center z-10 transition-all duration-200 group-hover:scale-110 ${
                      item.type === 'base' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-400 bg-gray-50'
                    }`}>
                      <div className={`w-3 h-3 rounded-full ${
                        item.type === 'base' ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    
                    {/* Label */}
                    <div className="mt-3 text-center max-w-20">
                      <p className="text-xs font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1 hidden group-hover:block absolute bg-white border border-gray-200 rounded-lg p-2 shadow-lg z-20 -translate-x-1/2 left-1/2 top-12 w-48">
                        {safeFormatDate(item.date, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline footer */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Hover over milestones to see dates • {timeline.length > 5 ? `Showing first 5 of ${timeline.length} documents` : `${timeline.length} document${timeline.length !== 1 ? 's' : ''} total`}
              </p>
              {contractDates && (
                <p className="text-xs text-green-600 text-center mt-1">
                  ✓ Contract dates extracted from OpenAI analysis
                </p>
              )}
            </div>
          </>
        ) : (
          <NoDataMessage message="No document timeline available from contract analysis" />
        )}
      </div>
    </div>
  );
};

export default ContractSummaryTab;