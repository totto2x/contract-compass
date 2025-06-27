/*
  # Add merged contract results storage

  1. New Table
    - `merged_contract_results`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `base_summary` (text)
      - `amendment_summaries` (jsonb)
      - `clause_change_log` (jsonb)
      - `final_contract` (text)
      - `document_incorporation_log` (jsonb)
      - `merge_status` (enum: 'processing', 'complete', 'error')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on merged_contract_results table
    - Add policies for user data access

  3. Indexes
    - Add index for project_id for efficient querying
    - Add index for merge_status
*/

-- Create merge status enum
CREATE TYPE merge_status AS ENUM ('processing', 'complete', 'error');

-- Create merged contract results table
CREATE TABLE IF NOT EXISTS merged_contract_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  base_summary text NOT NULL,
  amendment_summaries jsonb DEFAULT '[]',
  clause_change_log jsonb DEFAULT '[]',
  final_contract text NOT NULL,
  document_incorporation_log jsonb DEFAULT '[]',
  merge_status merge_status DEFAULT 'processing',
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE merged_contract_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for merged_contract_results table
CREATE POLICY "Users can view merge results from own projects"
  ON merged_contract_results
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id_created = auth.uid()
    )
  );

CREATE POLICY "Users can create merge results in own projects"
  ON merged_contract_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id_created = auth.uid()
    )
  );

CREATE POLICY "Users can update merge results in own projects"
  ON merged_contract_results
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id_created = auth.uid()
    )
  );

CREATE POLICY "Users can delete merge results from own projects"
  ON merged_contract_results
  FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id_created = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_merged_contract_results_project_id ON merged_contract_results(project_id);
CREATE INDEX IF NOT EXISTS idx_merged_contract_results_status ON merged_contract_results(merge_status);
CREATE INDEX IF NOT EXISTS idx_merged_contract_results_created_at ON merged_contract_results(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_merged_contract_results_updated_at
  BEFORE UPDATE ON merged_contract_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();