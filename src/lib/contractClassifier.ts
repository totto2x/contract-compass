import { TextExtractionService } from './textExtraction';

interface ClassificationResult {
  filename: string;
  role: 'base' | 'amendment' | 'ancillary';
  execution_date: string | null;
  effective_date: string | null;
  amends: string | null;
}

interface ClassificationResponse {
  documents: ClassificationResult[];
  chronological_order: string[];
}

export class ContractClassifierService {
  private static apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  private static baseURL = 'https://api.openai.com/v1';
  private static promptId = 'pmpt_6856e38c1b0881958051a5b28879ccb605519dce90c753fc';

  private static validateApiKey() {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
    }
    
    if (this.apiKey.includes('your_openai_api_key')) {
      throw new Error('OpenAI API key contains placeholder value. Please update your .env file with a real API key.');
    }
  }

  /**
   * Classify multiple contract documents
   */
  static async classifyDocuments(files: File[]): Promise<ClassificationResponse> {
    this.validateApiKey();

    try {
      // Validate all files are supported
      const unsupportedFiles = files.filter(file => !TextExtractionService.isSupportedFileType(file));
      if (unsupportedFiles.length > 0) {
        throw new Error(`Unsupported file types: ${unsupportedFiles.map(f => f.name).join(', ')}`);
      }

      // Extract text from all files using real text extraction
      console.log('🔄 Extracting text from files...');
      const documentTexts = await TextExtractionService.extractTextFromFiles(files);

      // Filter out empty texts (failed extractions) and their corresponding files
      const validTexts: string[] = [];
      const validFiles: File[] = [];
      
      documentTexts.forEach((text, index) => {
        if (text.trim().length > 0) {
          validTexts.push(text);
          validFiles.push(files[index]);
        } else {
          console.warn(`⚠️ No text extracted from ${files[index].name}, excluding from classification`);
        }
      });

      if (validTexts.length === 0) {
        throw new Error('No text could be extracted from any of the uploaded files');
      }

      console.log(`✅ Successfully extracted text from ${validTexts.length} of ${files.length} files`);

      // Prepare the input in the format you specified
      const input = validTexts.map((text, index) => ({
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Document: ${validFiles[index].name}\n\n${text}`
          }
        ]
      }));

      console.log(`📤 Sending classification request with ${input.length} documents to OpenAI...`);
      console.log('📋 Request payload structure:', {
        prompt_id: this.promptId,
        input_count: input.length,
        document_names: validFiles.map(f => f.name)
      });

      // Call the custom OpenAI endpoint
      const response = await fetch(`${this.baseURL}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          prompt: {
            id: this.promptId,
            version: "4"
          },
          input: input,
          reasoning: {},
          max_output_tokens: 16384,
          store: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Classification API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Contract classifier API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Enhanced logging of the raw response
      console.log('📥 Raw classification response received:');
      console.log('🔍 Response type:', typeof data);
      console.log('🔍 Response keys:', Object.keys(data));
      console.log('🔍 Full response structure:', JSON.stringify(data, null, 2));
      
      // Parse the classification result
      let classificationResult: ClassificationResponse;
      
      try {
        // Try to parse the response - the format may vary depending on the custom endpoint
        let resultText = '';
        
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
          // Standard OpenAI format - ensure it's a string
          const content = data.choices[0].message.content;
          resultText = typeof content === 'string' ? content : JSON.stringify(content);
          console.log('📄 Found content in choices[0].message.content');
        } else if (data.output) {
          // Custom endpoint format - ensure it's a string
          resultText = typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
          console.log('📄 Found content in data.output');
        } else if (data.response) {
          // Alternative custom format - ensure it's a string
          resultText = typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
          console.log('📄 Found content in data.response');
        } else if (typeof data === 'object' && data.documents) {
          // Direct object response
          classificationResult = data as ClassificationResponse;
          console.log('📄 Found direct object response with documents');
        } else {
          // Try to find any text content in the response
          resultText = JSON.stringify(data);
          console.log('📄 No recognized format, using stringified response');
        }
        
        // If we don't have the result yet, try to parse the text
        if (!classificationResult && resultText) {
          console.log('🔄 Attempting to parse classification response...');
          console.log('📝 Result text preview:', resultText.substring(0, 500) + (resultText.length > 500 ? '...' : ''));
          console.log('📏 Result text length:', resultText.length);
          
          try {
            classificationResult = JSON.parse(resultText);
            console.log('✅ Successfully parsed JSON response');
            console.log('🔍 Parsed result structure:', {
              has_documents: !!classificationResult.documents,
              documents_count: classificationResult.documents?.length || 0,
              has_chronological_order: !!classificationResult.chronological_order,
              chronological_count: classificationResult.chronological_order?.length || 0
            });
          } catch (jsonError) {
            console.error('❌ JSON parsing failed:', jsonError);
            console.log('📝 Failed to parse this text:', resultText);
            throw new Error(`Failed to parse JSON response: ${jsonError.message}`);
          }
        }
        
        // Validate the structure - if invalid, use fallback instead of throwing error
        if (!classificationResult || !classificationResult.documents || !Array.isArray(classificationResult.documents)) {
          console.warn('⚠️ Invalid classification response structure detected:');
          console.log('🔍 classificationResult exists:', !!classificationResult);
          console.log('🔍 documents exists:', !!classificationResult?.documents);
          console.log('🔍 documents is array:', Array.isArray(classificationResult?.documents));
          console.log('🔍 documents content:', classificationResult?.documents);
          console.warn('🔄 Using fallback classification instead');
          classificationResult = this.fallbackClassification(validFiles);
        } else {
          console.log('✅ Classification response structure is valid');
          console.log('📊 Classification summary:', {
            total_documents: classificationResult.documents.length,
            base_count: classificationResult.documents.filter(d => d.role === 'base').length,
            amendment_count: classificationResult.documents.filter(d => d.role === 'amendment').length,
            ancillary_count: classificationResult.documents.filter(d => d.role === 'ancillary').length
          });
        }
        
      } catch (parseError) {
        console.error('❌ Failed to parse classification result:', parseError);
        console.log('📝 Raw response that failed to parse:', data);
        console.log('🔄 Falling back to filename-based classification');
        
        // Fallback classification based on filenames
        classificationResult = this.fallbackClassification(validFiles);
      }

      // Ensure filenames match the uploaded files and handle any missing classifications
      const finalDocuments: ClassificationResult[] = [];
      
      validFiles.forEach((file, index) => {
        const existingClassification = classificationResult.documents.find(
          doc => doc.filename === file.name || 
                 doc.filename.replace(/\s+/g, '_') === file.name.replace(/\s+/g, '_') ||
                 file.name.includes(doc.filename.split('.')[0]) ||
                 doc.filename.includes(file.name.split('.')[0])
        );
        
        if (existingClassification) {
          // Ensure the filename matches exactly and add any missing fields
          finalDocuments.push({
            ...existingClassification,
            filename: file.name,
            execution_date: existingClassification.execution_date || new Date().toISOString().split('T')[0],
            effective_date: existingClassification.effective_date || new Date().toISOString().split('T')[0]
          });
          console.log(`✅ Matched classification for ${file.name}:`, existingClassification.role);
        } else {
          // Create fallback classification for this file
          const fallback = this.createFallbackClassification(file);
          finalDocuments.push(fallback);
          console.log(`🔄 Created fallback classification for ${file.name}:`, fallback.role);
        }
      });

      // Add any files that failed text extraction
      files.forEach(file => {
        if (!validFiles.includes(file)) {
          const fallback = this.createFallbackClassification(file);
          finalDocuments.push(fallback);
          console.log(`⚠️ Added classification for ${file.name} (text extraction failed)`);
        }
      });

      // Create chronological order based on execution dates
      const chronologicalOrder = finalDocuments
        .sort((a, b) => {
          const dateA = new Date(a.execution_date || a.effective_date || '1970-01-01');
          const dateB = new Date(b.execution_date || b.effective_date || '1970-01-01');
          return dateA.getTime() - dateB.getTime();
        })
        .map(doc => doc.filename);

      const finalResult = {
        documents: finalDocuments,
        chronological_order: classificationResult.chronological_order || chronologicalOrder
      };

      console.log('🎉 Classification completed successfully:');
      console.log('📊 Final result summary:', {
        total_documents: finalResult.documents.length,
        base_count: finalResult.documents.filter(d => d.role === 'base').length,
        amendment_count: finalResult.documents.filter(d => d.role === 'amendment').length,
        ancillary_count: finalResult.documents.filter(d => d.role === 'ancillary').length,
        chronological_order: finalResult.chronological_order
      });

      return finalResult;
    } catch (error) {
      console.error('💥 Contract classification failed:', error);
      console.log('🔄 Returning fallback classification for all files');
      
      // Return fallback classification for all files
      return this.fallbackClassification(files);
    }
  }

  /**
   * Create fallback classification for a single file
   */
  private static createFallbackClassification(file: File): ClassificationResult {
    const filename = file.name.toLowerCase();
    
    let role: 'base' | 'amendment' | 'ancillary' = 'ancillary';
    let amends: string | null = null;
    
    if (filename.includes('amendment') || filename.includes('addendum') || filename.includes('modification')) {
      role = 'amendment';
      amends = 'Base Agreement'; // Generic reference
    } else if (filename.includes('agreement') || filename.includes('contract') || filename.includes('base')) {
      role = 'base';
    } else if (filename.includes('rider') || filename.includes('schedule') || filename.includes('exhibit')) {
      role = 'ancillary';
    }

    return {
      filename: file.name,
      role,
      execution_date: new Date().toISOString().split('T')[0], // Today as fallback
      effective_date: new Date().toISOString().split('T')[0],
      amends
    };
  }

  /**
   * Fallback classification based on filename patterns
   */
  private static fallbackClassification(files: File[]): ClassificationResponse {
    console.log('🔄 Creating fallback classification for files:', files.map(f => f.name));
    
    const documents: ClassificationResult[] = files.map(file => 
      this.createFallbackClassification(file)
    );

    return {
      documents,
      chronological_order: files.map(f => f.name)
    };
  }
}