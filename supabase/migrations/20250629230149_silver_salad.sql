/*
  # Add execution_date and effective_date to documents table

  1. New Columns
    - `execution_date` (timestamptz, nullable) - stores the date the contract was executed
    - `effective_date` (timestamptz, nullable) - stores the date the contract became effective

  2. Indexes
    - Add indexes for better query performance on dates

  3. Data Migration
    - Migrate existing data from metadata to new columns
    - Clean up metadata after migration
*/

-- Add execution_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'execution_date'
  ) THEN
    ALTER TABLE documents ADD COLUMN execution_date timestamptz;
  END IF;
END $$;

-- Add effective_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'effective_date'
  ) THEN
    ALTER TABLE documents ADD COLUMN effective_date timestamptz;
  END IF;
END $$;

-- Create indexes for better query performance on dates
CREATE INDEX IF NOT EXISTS idx_documents_execution_date ON documents(execution_date);
CREATE INDEX IF NOT EXISTS idx_documents_effective_date ON documents(effective_date);

-- Migrate existing data from metadata to new columns
-- This assumes your existing metadata has 'execution_date' and 'effective_date' as strings
UPDATE documents
SET
  execution_date = CASE 
    WHEN metadata->>'execution_date' IS NOT NULL AND metadata->>'execution_date' != '' 
    THEN (metadata->>'execution_date')::timestamptz 
    ELSE NULL 
  END,
  effective_date = CASE 
    WHEN metadata->>'effective_date' IS NOT NULL AND metadata->>'effective_date' != '' 
    THEN (metadata->>'effective_date')::timestamptz 
    ELSE NULL 
  END
WHERE
  metadata ? 'execution_date' OR metadata ? 'effective_date';

-- Remove these fields from metadata after migration
UPDATE documents
SET
  metadata = metadata - 'execution_date' - 'effective_date'
WHERE
  metadata ? 'execution_date' OR metadata ? 'effective_date';