import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Enhanced validation for Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!');
  console.error('Please check your .env file and ensure you have:');
  console.error('- VITE_SUPABASE_URL=https://your-project-ref.supabase.co');
  console.error('- VITE_SUPABASE_ANON_KEY=your-anon-key-here');
  console.error('Get these values from: https://supabase.com/dashboard/project/[your-project]/settings/api');
  throw new Error('Supabase configuration is missing. Please check your environment variables.');
}

// Check if using placeholder values
if (supabaseUrl.includes('your-project-ref') || supabaseAnonKey.includes('your-anon-key')) {
  console.error('❌ Supabase configuration contains placeholder values!');
  console.error('Please replace the placeholder values in your .env file with actual Supabase credentials.');
  console.error('Current URL:', supabaseUrl);
  throw new Error('Supabase configuration contains placeholder values. Please update your .env file.');
}

// Validate URL format and clean it
let cleanUrl = supabaseUrl.trim();
try {
  new URL(cleanUrl);
} catch (error) {
  console.error('❌ Invalid Supabase URL format:', cleanUrl);
  throw new Error('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL environment variable.');
}

// Clean the anon key of any potential hidden characters
const cleanAnonKey = supabaseAnonKey.trim();

// Validate anon key format (should be a JWT token starting with 'eyJ')
if (!cleanAnonKey.startsWith('eyJ')) {
  console.error('❌ Invalid Supabase anon key format. Key should start with "eyJ"');
  console.error('Current key starts with:', cleanAnonKey.substring(0, 10) + '...');
  throw new Error('Invalid Supabase anon key format. Please check your VITE_SUPABASE_ANON_KEY environment variable.');
}

// Enhanced connection test with better error reporting
const testConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', cleanUrl);
    console.log('Key prefix:', cleanAnonKey.substring(0, 20) + '...');
    
    // Test the REST API endpoint specifically
    const testUrl = `${cleanUrl}/rest/v1/`;
    const response = await fetch(testUrl, {
      method: 'HEAD',
      headers: {
        'apikey': cleanAnonKey,
        'Authorization': `Bearer ${cleanAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Supabase connection test failed:', response.status, response.statusText);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.status === 404) {
        console.error('🚨 CRITICAL: Your Supabase project appears to be PAUSED or DELETED!');
        console.error('👉 Go to https://supabase.com/dashboard and check if your project is active');
        console.error('👉 If paused, click "Resume" to reactivate your project');
      } else if (response.status === 401 || response.status === 403) {
        console.error('🚨 CRITICAL: Authentication failed - your anon key may be incorrect or expired');
        console.error('👉 Go to https://supabase.com/dashboard/project/[your-project]/settings/api');
        console.error('👉 Copy the "anon public" key and update your .env file');
      } else {
        console.error('🚨 CRITICAL: Unexpected error connecting to Supabase');
        console.error('👉 Check your internet connection');
        console.error('👉 Verify your Supabase project URL is correct');
        console.error('👉 Check Supabase status at https://status.supabase.com/');
      }
    } else {
      console.log('✅ Supabase connection test successful');
      
      // Test if merged_contract_results table exists
      try {
        const tableTestResponse = await fetch(`${cleanUrl}/rest/v1/merged_contract_results?limit=1`, {
          method: 'HEAD',
          headers: {
            'apikey': cleanAnonKey,
            'Authorization': `Bearer ${cleanAnonKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (tableTestResponse.ok) {
          console.log('✅ merged_contract_results table exists and is accessible');
        } else if (tableTestResponse.status === 404) {
          console.error('❌ merged_contract_results table does not exist!');
          console.error('🚨 CRITICAL: You need to run the database migration: 20250627071415_wild_hat.sql');
          console.error('👉 Go to Supabase Dashboard → SQL Editor');
          console.error('👉 Run the migration file to create the merged_contract_results table');
        } else {
          console.warn('⚠️ merged_contract_results table test returned:', tableTestResponse.status);
        }
      } catch (tableError) {
        console.warn('⚠️ Could not test merged_contract_results table:', tableError);
      }
    }
  } catch (error) {
    console.error('❌ Network error connecting to Supabase:', error);
    console.error('🚨 CRITICAL: This usually means:');
    console.error('1. Your internet connection is down');
    console.error('2. Your Supabase project URL is incorrect');
    console.error('3. Your Supabase project is paused or deleted');
    console.error('4. Firewall or network restrictions are blocking the connection');
    console.error('👉 Check: https://supabase.com/dashboard');
    console.error('👉 Verify your project is active and not paused');
  }
};

// Run connection test in development
if (import.meta.env.DEV) {
  testConnection();
}

export const supabase = createClient(cleanUrl, cleanAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  },
  // Add retry configuration for better error handling
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Enhanced Database type definition to include merged contract results
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          user_id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          name?: string;
          email?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id_created: string;
          project_name: string;
          counterparty: string | null;
          tags: string[];
          status: 'active' | 'archived' | 'deleted';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id_created: string;
          project_name: string;
          counterparty?: string | null;
          tags?: string[];
          status?: 'active' | 'archived' | 'deleted';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id_created?: string;
          project_name?: string;
          counterparty?: string | null;
          tags?: string[];
          status?: 'active' | 'archived' | 'deleted';
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          document_id: string;
          project_id: string;
          name: string;
          type: 'base' | 'amendment';
          file_path: string;
          file_size: number;
          mime_type: string;
          creation_date: string;
          upload_status: 'pending' | 'uploading' | 'complete' | 'error';
          processed_at: string | null;
          metadata: Record<string, any>;
          extracted_text: string | null;
          text_extraction_status: 'pending' | 'processing' | 'complete' | 'failed';
          text_extraction_error: string | null;
        };
        Insert: {
          document_id?: string;
          project_id: string;
          name: string;
          type: 'base' | 'amendment';
          file_path: string;
          file_size: number;
          mime_type: string;
          creation_date?: string;
          upload_status?: 'pending' | 'uploading' | 'complete' | 'error';
          processed_at?: string | null;
          metadata?: Record<string, any>;
          extracted_text?: string | null;
          text_extraction_status?: 'pending' | 'processing' | 'complete' | 'failed';
          text_extraction_error?: string | null;
        };
        Update: {
          document_id?: string;
          project_id?: string;
          name?: string;
          type?: 'base' | 'amendment';
          file_path?: string;
          file_size?: number;
          mime_type?: string;
          creation_date?: string;
          upload_status?: 'pending' | 'uploading' | 'complete' | 'error';
          processed_at?: string | null;
          metadata?: Record<string, any>;
          extracted_text?: string | null;
          text_extraction_status?: 'pending' | 'processing' | 'complete' | 'failed';
          text_extraction_error?: string | null;
        };
      };
      merged_contract_results: {
        Row: {
          id: string;
          project_id: string;
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
          merge_status: 'processing' | 'complete' | 'error';
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          base_summary: string;
          amendment_summaries?: Array<{
            document: string;
            role: 'amendment' | 'ancillary';
            changes: string[];
          }>;
          clause_change_log?: Array<{
            section: string;
            change_type: 'modified' | 'added' | 'deleted';
            old_text: string;
            new_text: string;
            summary: string;
          }>;
          final_contract: string;
          document_incorporation_log?: string[];
          merge_status?: 'processing' | 'complete' | 'error';
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          base_summary?: string;
          amendment_summaries?: Array<{
            document: string;
            role: 'amendment' | 'ancillary';
            changes: string[];
          }>;
          clause_change_log?: Array<{
            section: string;
            change_type: 'modified' | 'added' | 'deleted';
            old_text: string;
            new_text: string;
            summary: string;
          }>;
          final_contract?: string;
          document_incorporation_log?: string[];
          merge_status?: 'processing' | 'complete' | 'error';
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};