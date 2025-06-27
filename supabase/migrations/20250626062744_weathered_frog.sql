/*
  # Add extracted text storage to documents table

  1. New Column
    - `extracted_text` (text, nullable) - stores the extracted text content from PDF/DOCX files
    - `text_extraction_status` (enum) - tracks the status of text extraction
    - `text_extraction_error` (text, nullable) - stores any extraction error messages

  2. New Types
    - `text_extraction_status` enum for tracking extraction progress

  3. Indexes
    - Add index for text extraction status for efficient querying
*/

-- Create text extraction status enum
CREATE TYPE text_extraction_status AS ENUM ('pending', 'processing', 'complete', 'failed');

-- Add extracted text column to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'extracted_text'
  ) THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
  END IF;
END $$;

-- Add text extraction status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'text_extraction_status'
  ) THEN
    ALTER TABLE documents ADD COLUMN text_extraction_status text_extraction_status DEFAULT 'pending';
  END IF;
END $$;

-- Add text extraction error column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'text_extraction_error'
  ) THEN
    ALTER TABLE documents ADD COLUMN text_extraction_error text;
  END IF;
END $$;

-- Add index for text extraction status
CREATE INDEX IF NOT EXISTS idx_documents_text_extraction_status ON documents(text_extraction_status);

-- Add index for full text search on extracted text (optional, for future search features)
CREATE INDEX IF NOT EXISTS idx_documents_extracted_text_search ON documents USING gin(to_tsvector('english', extracted_text));