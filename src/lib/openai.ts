interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenAIService {
  private static apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  private static baseURL = 'https://api.openai.com/v1';

  private static validateApiKey() {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
    }
    
    if (this.apiKey.includes('your_openai_api_key')) {
      throw new Error('OpenAI API key contains placeholder value. Please update your .env file with a real API key.');
    }
  }

  private static async makeRequest(messages: OpenAIMessage[], model: string = 'gpt-4'): Promise<string> {
    this.validateApiKey();

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 16384,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data: OpenAIResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API request failed:', error);
      throw error;
    }
  }

  /**
   * Analyze contract changes between documents
   */
  static async analyzeContractChanges(
    baseContract: string,
    amendmentContract: string,
    contractType: string = 'general'
  ): Promise<{
    summary: string;
    sections: Array<{
      id: string;
      title: string;
      changeType: 'added' | 'modified' | 'deleted';
      confidence: number;
      description: string;
      details: Array<{
        type: 'added' | 'deleted' | 'modified';
        text: string;
      }>;
    }>;
  }> {
    const systemPrompt = `You are a legal contract analysis expert. Your task is to analyze changes between a base contract and an amendment, identifying specific modifications, additions, and deletions.

Please provide your analysis in the following JSON format:
{
  "summary": "A comprehensive plain-English summary of all changes made to the contract",
  "sections": [
    {
      "id": "section-identifier",
      "title": "Section Name",
      "changeType": "added|modified|deleted",
      "confidence": 95,
      "description": "Brief description of what changed in this section",
      "details": [
        {
          "type": "added|deleted|modified",
          "text": "Specific text that was changed"
        }
      ]
    }
  ]
}

Focus on:
- Payment terms and schedules
- Service level agreements
- Termination clauses
- Scope of work changes
- Timeline modifications
- Legal obligations and responsibilities

Provide confidence scores (0-100) based on how certain you are about each change.`;

    const userPrompt = `Please analyze the changes between these two contract documents:

BASE CONTRACT:
${baseContract}

AMENDMENT/UPDATED CONTRACT:
${amendmentContract}

Contract Type: ${contractType}

Please identify all changes, modifications, additions, and deletions between these documents.`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.makeRequest(messages);
      
      // Try to parse JSON response
      try {
        return JSON.parse(response);
      } catch (parseError) {
        // If JSON parsing fails, create a fallback response
        return {
          summary: response,
          sections: []
        };
      }
    } catch (error) {
      console.error('Contract analysis failed:', error);
      throw new Error('Failed to analyze contract changes. Please try again.');
    }
  }

  /**
   * Generate a contract summary
   */
  static async generateContractSummary(
    contractText: string,
    contractType: string = 'general',
    projectName: string = 'Contract Project'
  ): Promise<string> {
    const systemPrompt = `You are a legal contract summarization expert. Create clear, comprehensive summaries of contracts that are easy to understand for business stakeholders.

Your summary should include:
- Key parties involved
- Main purpose and scope of the agreement
- Important terms and conditions
- Payment arrangements
- Timeline and duration
- Key obligations for each party
- Termination conditions
- Any notable clauses or restrictions

Write in clear, professional language that non-legal professionals can understand.`;

    const userPrompt = `Please create a comprehensive summary of this contract:

PROJECT: ${projectName}
CONTRACT TYPE: ${contractType}

CONTRACT TEXT:
${contractText}

Please provide a detailed but accessible summary that captures all the essential elements of this agreement.`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      return await this.makeRequest(messages);
    } catch (error) {
      console.error('Contract summary generation failed:', error);
      throw new Error('Failed to generate contract summary. Please try again.');
    }
  }

  /**
   * Extract key contract metadata
   */
  static async extractContractMetadata(
    contractText: string
  ): Promise<{
    parties: string[];
    effectiveDate?: string;
    expirationDate?: string;
    contractType: string;
    keyTerms: string[];
  }> {
    const systemPrompt = `You are a contract metadata extraction expert. Extract key information from contracts and return it in JSON format.

Return the data in this exact format:
{
  "parties": ["Party 1 Name", "Party 2 Name"],
  "effectiveDate": "YYYY-MM-DD or null",
  "expirationDate": "YYYY-MM-DD or null", 
  "contractType": "license|consulting|sla|maintenance|support|other",
  "keyTerms": ["term1", "term2", "term3"]
}

Focus on extracting:
- All parties to the agreement
- Start and end dates
- Contract classification
- 3-5 most important terms or clauses`;

    const userPrompt = `Extract metadata from this contract:

${contractText}`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.makeRequest(messages);
      return JSON.parse(response);
    } catch (error) {
      console.error('Metadata extraction failed:', error);
      // Return default metadata if extraction fails
      return {
        parties: ['Unknown Party 1', 'Unknown Party 2'],
        contractType: 'other',
        keyTerms: []
      };
    }
  }
}