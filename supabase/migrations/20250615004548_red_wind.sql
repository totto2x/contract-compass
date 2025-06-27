/*
  # Storage Setup for Document Files

  1. Storage Bucket
    - Create 'documents' bucket for file storage
    - Enable RLS on storage bucket
    - Set up policies for file access

  2. Storage Policies
    - Users can upload files to their own project folders
    - Users can download files from their own projects
    - Users can delete files from their own projects
*/

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage
UPDATE storage.buckets 
SET public = false 
WHERE id = 'documents';

-- Storage policies for documents bucket
CREATE POLICY "Users can upload documents to own projects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id_created = auth.uid()
  )
);

CREATE POLICY "Users can view documents from own projects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id_created = auth.uid()
  )
);

CREATE POLICY "Users can update documents in own projects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id_created = auth.uid()
  )
);

CREATE POLICY "Users can delete documents from own projects"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id_created = auth.uid()
  )
);