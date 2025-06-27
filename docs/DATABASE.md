# Database Documentation

This document describes the database schema and setup for the GitHub Contracts application using Supabase.

## Overview

The application uses Supabase as the backend database with PostgreSQL. The schema is designed to support multi-user contract management with proper data isolation and security.

## Database Schema

### Tables

#### users
Extends Supabase's built-in `auth.users` table with additional profile information.

```sql
CREATE TABLE users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Columns:**
- `user_id`: UUID, primary key, references auth.users(id)
- `name`: User's full name
- `email`: User's email address (unique)
- `avatar_url`: Optional profile picture URL
- `created_at`: Account creation timestamp
- `updated_at`: Last profile update timestamp

#### projects
Stores contract projects created by users.

```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_created uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  project_name text NOT NULL,
  counterparty text,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Columns:**
- `id`: UUID, primary key
- `user_id_created`: Foreign key to users table
- `project_name`: Name of the contract project
- `counterparty`: Optional counterparty/client name
- `tags`: Array of tags for categorization
- `status`: Project status (active, archived, deleted)
- `created_at`: Project creation timestamp
- `updated_at`: Last modification timestamp

#### documents
Stores individual contract documents within projects.

```sql
CREATE TABLE documents (
  document_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  type document_type NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  creation_date timestamptz DEFAULT now(),
  upload_status upload_status DEFAULT 'pending',
  processed_at timestamptz,
  metadata jsonb DEFAULT '{}'
);
```

**Columns:**
- `document_id`: UUID, primary key
- `project_id`: Foreign key to projects table
- `name`: Original filename
- `type`: Document type (base, amendment)
- `file_path`: Path to file in storage bucket
- `file_size`: File size in bytes
- `mime_type`: MIME type of the file
- `creation_date`: Document upload timestamp
- `upload_status`: Upload status (pending, uploading, complete, error)
- `processed_at`: Timestamp when processing completed
- `metadata`: Additional metadata as JSON

### Custom Types

```sql
CREATE TYPE document_type AS ENUM ('base', 'amendment');
CREATE TYPE upload_status AS ENUM ('pending', 'uploading', 'complete', 'error');
```

## Row Level Security (RLS)

All tables have RLS enabled to ensure users can only access their own data.

### Users Table Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### Projects Table Policies

```sql
-- Users can view their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT TO authenticated
  USING (auth.uid() = user_id_created);

-- Users can create projects
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id_created);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE TO authenticated
  USING (auth.uid() = user_id_created);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE TO authenticated
  USING (auth.uid() = user_id_created);
```

### Documents Table Policies

```sql
-- Users can view documents from their own projects
CREATE POLICY "Users can view documents from own projects"
  ON documents FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id_created = auth.uid()
    )
  );

-- Similar policies for INSERT, UPDATE, DELETE operations
```

## Storage

### Documents Bucket

Files are stored in a Supabase storage bucket named `documents` with the following structure:

```
documents/
├── {project_id}/
│   ├── {timestamp}-{random}.pdf
│   ├── {timestamp}-{random}.docx
│   └── ...
```

### Storage Policies

```sql
-- Users can upload documents to their own project folders
CREATE POLICY "Users can upload documents to own projects"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id_created = auth.uid()
  )
);
```

## Indexes

Performance indexes are created for common query patterns:

```sql
CREATE INDEX idx_projects_user_id ON projects(user_id_created);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_upload_status ON documents(upload_status);
```

## Triggers

### Auto-update timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Auto-create user profile

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

## Setup Instructions

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Migrations**
   ```bash
   # If using Supabase CLI
   supabase db reset
   
   # Or manually run the SQL files in order:
   # 001_initial_schema.sql
   # 002_storage_setup.sql
   ```

3. **Configure Environment**
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Verify Setup**
   - Check that all tables are created
   - Verify RLS policies are active
   - Test storage bucket access

## Data Migration

If migrating from an existing system:

1. **Export existing data** to CSV/JSON format
2. **Transform data** to match the new schema
3. **Import users** first (respecting auth.users structure)
4. **Import projects** with proper user associations
5. **Import documents** and upload files to storage
6. **Verify data integrity** and relationships

## Backup Strategy

1. **Automatic Backups**: Supabase provides automatic daily backups
2. **Manual Exports**: Regular exports of critical data
3. **Storage Backups**: Separate backup of document files
4. **Testing**: Regular restore testing

## Performance Considerations

1. **Query Optimization**: Use appropriate indexes
2. **Connection Pooling**: Supabase handles this automatically
3. **File Storage**: Use CDN for frequently accessed files
4. **Monitoring**: Track query performance and storage usage

## Security Best Practices

1. **RLS Enforcement**: Never disable RLS on production tables
2. **API Key Management**: Rotate keys regularly
3. **Input Validation**: Validate all user inputs
4. **File Upload Limits**: Enforce size and type restrictions
5. **Audit Logging**: Monitor access patterns

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Check policy conditions and user authentication
2. **Storage Access**: Verify bucket policies and file paths
3. **Migration Failures**: Check for constraint violations
4. **Performance Issues**: Review query plans and indexes

### Debug Queries

```sql
-- Check user projects
SELECT * FROM projects WHERE user_id_created = auth.uid();

-- Check document access
SELECT d.*, p.project_name 
FROM documents d 
JOIN projects p ON d.project_id = p.id 
WHERE p.user_id_created = auth.uid();

-- Storage usage
SELECT bucket_id, COUNT(*), SUM(metadata->>'size')::bigint as total_size
FROM storage.objects 
GROUP BY bucket_id;
```

## API Usage Examples

See the [API Documentation](./API.md) for detailed examples of how to interact with the database through the application's API layer.