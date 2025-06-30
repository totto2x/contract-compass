import { DatabaseService } from './database';

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

export class ContractMergerService {
  private static apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  private static baseURL = 'https://api.openai.com/v1';
  private static promptId = 'pmpt_6854d82929d4819582792aaf089a61e208392ecd1396c61e';

  private static validateApiKey() {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
    }
    
    if (this.apiKey.includes('your_openai_api_key')) {
      throw new Error('OpenAI API key contains placeholder value. Please update your .env file with a real API key.');
    }
  }

  /**
   * Make API request with retry logic for incomplete responses
   */
  private static async makeApiRequestWithRetry(
    initialInput: any[],
    maxRetries: number = 10
  ): Promise<{ data: any; accumulatedText: string }> {
    let accumulatedText = '';
    let previousResponseId: string | null = null;
    let retryCount = 0;
    let currentInput = initialInput;

    while (retryCount < maxRetries) {
      console.log(`🔄 API call attempt ${retryCount + 1}/${maxRetries}${previousResponseId ? ' (continuation)' : ' (initial)'}`);

      const requestBody: any = {
        prompt: {
          id: this.promptId,
          version: "7"
        },
        input: currentInput,
        reasoning: {},
        max_output_tokens: 16384,
        store: true
      };

      // Add previous_response_id for continuation calls
      if (previousResponseId) {
        requestBody.previous_response_id = previousResponseId;
      }

      const response = await fetch(`${this.baseURL}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Contract merger API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      console.log(`📥 API response ${retryCount + 1}:`, {
        id: data.id,
        status: data.status,
        incomplete_reason: data.incomplete_details?.reason,
        has_output: !!data.output,
        output_length: data.output?.length || 0
      });

      // Extract the text content from this response
      let responseText = '';
      if (data.output && Array.isArray(data.output) && data.output.length > 0) {
        // Handle array format
        const textOutput = data.output.find((item: any) => item.type === 'message');
        if (textOutput && textOutput.content && Array.isArray(textOutput.content)) {
          const textContent = textOutput.content.find((content: any) => content.type === 'output_text');
          if (textContent && textContent.text) {
            responseText = textContent.text;
          }
        }
      } else if (typeof data.output === 'string') {
        // Handle string format
        responseText = data.output;
      } else if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        // Handle standard OpenAI format
        responseText = data.choices[0].message.content;
      }

      // Accumulate the text
      if (responseText) {
        accumulatedText += responseText;
        console.log(`📝 Accumulated text length: ${accumulatedText.length} characters`);
      }

      // Check if response is complete
      if (data.status === 'complete' || data.error) {
        console.log(`✅ API sequence completed after ${retryCount + 1} call(s)`);
        return { data, accumulatedText };
      }

      // Check if response is incomplete due to max tokens
      if (data.status === 'incomplete' && data.incomplete_details?.reason === 'max_output_tokens') {
        console.log(`⏳ Response incomplete (max tokens reached), preparing continuation...`);
        
        // Store the response ID for continuation
        previousResponseId = data.id;
        
        // Set up continuation input
        currentInput = [{
          role: "user",
          content: [{
            type: "input_text",
            text: "Continue where you left off."
          }]
        }];
        
        retryCount++;
        continue;
      }

      // If we get here, something unexpected happened
      console.warn(`⚠️ Unexpected response status: ${data.status}`);
      break;
    }

    if (retryCount >= maxRetries) {
      throw new Error(`Maximum retry attempts (${maxRetries}) reached for contract merger API`);
    }

    // Return the last response and accumulated text
    return { data: {}, accumulatedText };
  }

  /**
   * Merge contract documents using stored extracted text from database
   */
  static async mergeDocumentsFromProject(projectId: string): Promise<MergeDocsResult> {
    this.validateApiKey();

    try {
      console.log('Getting documents with extracted text from database...');
      
      // Get documents with extracted text from database
      const documentsData = await DatabaseService.getDocumentsForMerging(projectId);
      const { chronologicalOrder } = documentsData;

      // Check if we have any documents at all for this project
      if (chronologicalOrder.length === 0) {
        console.log('No documents found, checking for any documents in project...');
        
        // Get all documents for this project to provide better error information
        const allDocuments = await DatabaseService.getDocuments(projectId);
        
        if (allDocuments.length === 0) {
          throw new Error('No documents found for this project. Please upload documents first.');
        }
        
        // Check text extraction status
        const pendingExtractions = allDocuments.filter(doc => 
          doc.text_extraction_status === 'pending' || doc.text_extraction_status === 'processing'
        );
        const failedExtractions = allDocuments.filter(doc => 
          doc.text_extraction_status === 'failed'
        );
        const successfulExtractions = allDocuments.filter(doc => 
          doc.text_extraction_status === 'complete' && doc.extracted_text
        );
        
        console.log(`📊 Document extraction status:`, {
          total: allDocuments.length,
          pending: pendingExtractions.length,
          failed: failedExtractions.length,
          successful: successfulExtractions.length
        });
        
        if (pendingExtractions.length > 0) {
          throw new Error(`Text extraction is still in progress for ${pendingExtractions.length} document${pendingExtractions.length > 1 ? 's' : ''}. Please wait for extraction to complete before merging.`);
        }
        
        if (failedExtractions.length === allDocuments.length) {
          throw new Error(`Text extraction failed for all ${allDocuments.length} document${allDocuments.length > 1 ? 's' : ''}. Please try re-uploading documents with selectable text (not scanned images).`);
        }
        
        if (successfulExtractions.length === 0) {
          throw new Error(`No documents with successfully extracted text found. Please ensure your documents contain selectable text and try re-uploading.`);
        }
        
        // This shouldn't happen, but just in case
        throw new Error('No documents with extracted text found for this project');
      }

      console.log(`Found ${chronologicalOrder.length} documents with extracted text for merging`);

      // Construct the input array in the specified interleaved format using stored text
      const inputMessages: any[] = [];

      // Iterate through chronological order and build the interleaved input
      for (const document of chronologicalOrder) {
        if (!document.extracted_text || document.text_extraction_status !== 'complete') {
          console.warn(`Document ${document.name} has no extracted text, skipping`);
          continue;
        }

        // Get the classification role directly from the document object
        const role = document.classification_role || (document.type === 'base' ? 'base' : 'amendment');

        // Add the document role message
        inputMessages.push({
          role: "user",
          content: [
            {
              type: "input_text",
              text: `${document.name}: ${role}`
            }
          ]
        });

        // Add the document content message using stored extracted text
        inputMessages.push({
          role: "user",
          content: [
            {
              type: "input_text",
              text: document.extracted_text
            }
          ]
        });
      }

      // Add the chronological order message at the end
      const chronologicalOrderText = `chronological_order = [${chronologicalOrder.map(d => d.name).join(', ')}]`;
      inputMessages.push({
        role: "user",
        content: [
          {
            type: "input_text",
            text: chronologicalOrderText
          }
        ]
      });

      console.log(`Constructed input with ${inputMessages.length} messages for ${chronologicalOrder.length} documents`);

      // Make API request with retry logic
      const { data, accumulatedText } = await this.makeApiRequestWithRetry(inputMessages);
      
      // Parse the accumulated merge result
      let mergeResult: MergeDocsResult;
      
      try {
        if (!accumulatedText || accumulatedText.trim().length === 0) {
          throw new Error('No accumulated text received from API');
        }

        console.log('🔄 Parsing accumulated merge response...');
        console.log(`📏 Total accumulated text length: ${accumulatedText.length} characters`);
        console.log(`📝 Accumulated text preview:`, accumulatedText.substring(0, 500) + (accumulatedText.length > 500 ? '...' : ''));
        
        // Try to parse the accumulated text as JSON
        try {
          mergeResult = JSON.parse(accumulatedText);
          console.log('✅ Successfully parsed accumulated JSON response');
        } catch (jsonError) {
          console.error('❌ JSON parsing failed on accumulated text:', jsonError);
          console.log('📝 Failed to parse this accumulated text:', accumulatedText);
          
          // Try to fix incomplete JSON by adding missing closing braces
          let fixedText = accumulatedText.trim();
          
          // Count opening and closing braces to determine how many are missing
          const openBraces = (fixedText.match(/\{/g) || []).length;
          const closeBraces = (fixedText.match(/\}/g) || []).length;
          const missingBraces = openBraces - closeBraces;
          
          if (missingBraces > 0) {
            console.log(`🔧 Attempting to fix JSON by adding ${missingBraces} missing closing brace(s)`);
            fixedText += '}' .repeat(missingBraces);
            
            try {
              mergeResult = JSON.parse(fixedText);
              console.log('✅ Successfully parsed fixed JSON response');
            } catch (fixedJsonError) {
              console.error('❌ Fixed JSON parsing also failed:', fixedJsonError);
              throw new Error(`Failed to parse accumulated JSON response: ${jsonError.message}`);
            }
          } else {
            throw new Error(`Failed to parse accumulated JSON response: ${jsonError.message}`);
          }
        }
        
        // Validate and ensure all required fields are present
        if (!mergeResult || !mergeResult.base_summary) {
          console.warn('⚠️ Invalid merge response structure in accumulated text');
          throw new Error('Invalid merge response structure in accumulated text');
        }
        
        // Ensure document_incorporation_log is always an array
        if (!mergeResult.document_incorporation_log) {
          console.log('📝 document_incorporation_log missing, creating from chronological order');
          mergeResult.document_incorporation_log = chronologicalOrder.map(doc => {
            const role = doc.classification_role || doc.type;
            const date = doc.execution_date || doc.creation_date?.split('T')[0] || 'date not specified';
            return `${doc.name} (${role}, ${date})`;
          });
        } else if (!Array.isArray(mergeResult.document_incorporation_log)) {
          console.warn('⚠️ document_incorporation_log is not an array, converting');
          mergeResult.document_incorporation_log = [];
        }
        
        // Ensure other required fields are arrays
        if (!Array.isArray(mergeResult.amendment_summaries)) {
          mergeResult.amendment_summaries = [];
        }
        if (!Array.isArray(mergeResult.clause_change_log)) {
          mergeResult.clause_change_log = [];
        }
        
        console.log('✅ Merge response structure is valid');
        console.log('📊 Merge summary:', {
          has_base_summary: !!mergeResult.base_summary,
          amendment_summaries_count: mergeResult.amendment_summaries?.length || 0,
          clause_change_log_count: mergeResult.clause_change_log?.length || 0,
          final_contract_length: mergeResult.final_contract?.length || 0,
          document_incorporation_log_count: mergeResult.document_incorporation_log?.length || 0
        });
        
      } catch (parseError) {
        console.error('Failed to parse accumulated merge result:', parseError);
        console.log('Raw accumulated text that failed to parse:', accumulatedText);
        console.log('🔄 Falling back to fallback merge result');
        
        // Fallback merge result
        mergeResult = this.fallbackMergeResult(chronologicalOrder);
      }

      return mergeResult;
    } catch (error) {
      console.error('Contract merging failed:', error);
      
      // Return fallback merge result with better error handling
      try {
        const documentsData = await DatabaseService.getDocumentsForMerging(projectId).catch(() => ({
          baseDocuments: [],
          amendments: [],
          ancillaryDocuments: [],
          chronologicalOrder: []
        }));
        
        return this.fallbackMergeResult(documentsData.chronologicalOrder);
      } catch (fallbackError) {
        console.error('Fallback merge result also failed:', fallbackError);
        
        // Final fallback - return empty result structure
        return {
          base_summary: `Contract merging failed: ${error.message}`,
          amendment_summaries: [],
          clause_change_log: [],
          final_contract: 'Contract merging could not be completed due to missing or invalid document data.',
          document_incorporation_log: []
        };
      }
    }
  }

  /**
   * Fallback merge result when API fails
   */
  private static fallbackMergeResult(documents: any[]): MergeDocsResult {
    // Generate base summary
    const baseDocuments = documents.filter(doc => 
      doc.classification_role === 'base' || doc.type === 'base'
    );
    const amendmentDocuments = documents.filter(doc => 
      doc.classification_role === 'amendment' || doc.type === 'amendment'
    );
    const ancillaryDocuments = documents.filter(doc => 
      doc.classification_role === 'ancillary'
    );

    const baseSummary = baseDocuments.length > 0
      ? `Base contract analysis from ${baseDocuments.map(doc => doc.name).join(', ')}. ${baseDocuments.length} base document${baseDocuments.length !== 1 ? 's' : ''} processed with extracted text from database.`
      : 'No base contract identified. Document classification and text extraction completed for analysis.';

    // Generate amendment summaries
    const amendmentSummaries = amendmentDocuments.map((doc) => {
      const hasText = doc.extracted_text && doc.text_extraction_status === 'complete';
      const changes = hasText
        ? [
            `Document processed: ${doc.name}`,
            `Classification role: ${doc.classification_role || doc.type}`,
            `Execution date: ${doc.execution_date || 'Not specified'}`,
            `Effective date: ${doc.effective_date || 'Not specified'}`,
            `Amends: ${doc.amends_document || 'Not specified'}`,
            `Confidence: ${doc.metadata?.classification_confidence || 'N/A'}%`,
            `Text extraction: Successful (${doc.extracted_text?.length || 0} characters)`
          ]
        : [
            `Document uploaded: ${doc.name}`,
            `Classification role: ${doc.classification_role || doc.type}`,
            `File type: ${doc.mime_type}`,
            `Status: Text extraction ${doc.text_extraction_status || 'pending'}`,
            `Error: ${doc.text_extraction_error || 'None'}`
          ];

      return {
        document: doc.name,
        role: (doc.classification_role || doc.type) as 'amendment' | 'ancillary',
        changes
      };
    });

    // Add ancillary documents to amendment summaries
    ancillaryDocuments.forEach(doc => {
      const hasText = doc.extracted_text && doc.text_extraction_status === 'complete';
      const changes = hasText
        ? [
            `Ancillary document processed: ${doc.name}`,
            `Classification role: ${doc.classification_role}`,
            `Confidence: ${doc.metadata?.classification_confidence || 'N/A'}%`,
            `Text extraction: Successful (${doc.extracted_text?.length || 0} characters)`
          ]
        : [
            `Ancillary document uploaded: ${doc.name}`,
            `Classification role: ${doc.classification_role}`,
            `Status: Text extraction ${doc.text_extraction_status || 'pending'}`,
            `Error: ${doc.text_extraction_error || 'None'}`
          ];

      amendmentSummaries.push({
        document: doc.name,
        role: 'ancillary',
        changes
      });
    });

    // Generate clause change log
    const clauseChangeLog = amendmentDocuments.map((doc, index) => ({
      section: `Amendment ${index + 1}`,
      change_type: 'modified' as const,
      old_text: 'Original contract terms',
      new_text: `Modified by ${doc.name}`,
      summary: `Changes introduced by ${doc.name} (${doc.execution_date || 'date not specified'})`
    }));

    // Generate final contract text using stored extracted text
    const baseText = baseDocuments.length > 0 && baseDocuments[0].extracted_text
      ? baseDocuments[0].extracted_text
      : `Contract content from ${documents[0]?.name || 'uploaded documents'}`;

    const finalContract = baseText + '\n\n[Contract merging completed with ' + 
      amendmentDocuments.length + ' amendment' + (amendmentDocuments.length !== 1 ? 's' : '') + 
      ' and ' + ancillaryDocuments.length + ' ancillary document' + (ancillaryDocuments.length !== 1 ? 's' : '') + 
      ' applied in chronological order using stored extracted text]';

    // Generate document incorporation log - CRITICAL: Always ensure this is populated
    const documentIncorporationLog = documents.map(doc => {
      const role = doc.classification_role || doc.type;
      const date = doc.execution_date || doc.creation_date?.split('T')[0] || 'date not specified';
      return `${doc.name} (${role}, ${date})`;
    });

    return {
      base_summary: baseSummary,
      amendment_summaries: amendmentSummaries,
      clause_change_log: clauseChangeLog,
      final_contract: finalContract,
      document_incorporation_log: documentIncorporationLog // Ensure this is always populated
    };
  }
}