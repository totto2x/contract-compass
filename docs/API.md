# API Documentation

This document describes the API endpoints and data structures used in the GitHub Contracts application.

## Overview

The application uses Supabase as the backend, providing a REST API with real-time subscriptions. All API calls are authenticated using Supabase Auth.

## Authentication

### Login
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### Logout
```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

## Projects API

### Get All Projects
```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .order('created_at', { ascending: false });
```

### Create Project
```typescript
const { data, error } = await supabase
  .from('projects')
  .insert({
    name: 'Project Name',
    client: 'Client Name',
    tags: ['tag1', 'tag2'],
    documents_count: 0,
    status: 'processing'
  });
```

### Update Project
```typescript
const { data, error } = await supabase
  .from('projects')
  .update({
    name: 'Updated Name',
    status: 'complete'
  })
  .eq('id', projectId);
```

### Delete Project
```typescript
const { error } = await supabase
  .from('projects')
  .delete()
  .eq('id', projectId);
```

## Files API

### Get Files for Project
```typescript
const { data, error } = await supabase
  .from('files')
  .select('*')
  .eq('project_id', projectId)
  .order('created_at', { ascending: false });
```

### Upload File
```typescript
// First upload to storage
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('documents')
  .upload(`${projectId}/${fileName}`, file);

// Then create file record
const { data, error } = await supabase
  .from('files')
  .insert({
    project_id: projectId,
    filename: file.name,
    file_type: file.type,
    file_size: file.size,
    file_path: uploadData?.path,
    upload_status: 'complete'
  });
```

### Update File Status
```typescript
const { data, error } = await supabase
  .from('files')
  .update({
    upload_status: 'complete'
  })
  .eq('id', fileId);
```

### Delete File
```typescript
// Delete from storage
const { error: storageError } = await supabase.storage
  .from('documents')
  .remove([filePath]);

// Delete record
const { error } = await supabase
  .from('files')
  .delete()
  .eq('id', fileId);
```

## Data Types

### Project
```typescript
interface Project {
  id: string;
  name: string;
  client: string | null;
  upload_date: string;
  tags: string[];
  documents_count: number;
  status: 'processing' | 'complete' | 'error';
  created_at: string;
  updated_at: string;
}
```

### File
```typescript
interface File {
  id: string;
  project_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  upload_status: 'pending' | 'uploading' | 'complete' | 'error';
  file_path: string | null;
  created_at: string;
  updated_at: string;
}
```

## Real-time Subscriptions

### Subscribe to Project Changes
```typescript
const subscription = supabase
  .channel('projects')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'projects'
  }, (payload) => {
    console.log('Project changed:', payload);
  })
  .subscribe();
```

### Subscribe to File Changes
```typescript
const subscription = supabase
  .channel('files')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'files',
    filter: `project_id=eq.${projectId}`
  }, (payload) => {
    console.log('File changed:', payload);
  })
  .subscribe();
```

## Error Handling

All API calls return an error object if something goes wrong:

```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*');

if (error) {
  console.error('API Error:', error.message);
  // Handle error appropriately
}
```

Common error types:
- `PGRST116`: Row not found
- `23505`: Unique constraint violation
- `42501`: Insufficient privileges

## Rate Limiting

Supabase has built-in rate limiting:
- 100 requests per second per IP
- 1000 requests per minute per authenticated user

## Pagination

For large datasets, use pagination:

```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .range(0, 9) // Get first 10 records
  .order('created_at', { ascending: false });
```

## Filtering

### Basic Filtering
```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('status', 'complete')
  .ilike('name', '%contract%');
```

### Advanced Filtering
```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .or('status.eq.complete,status.eq.processing')
  .gte('created_at', '2024-01-01')
  .contains('tags', ['enterprise']);
```

## File Storage

### Upload File
```typescript
const { data, error } = await supabase.storage
  .from('documents')
  .upload(`${projectId}/${fileName}`, file, {
    cacheControl: '3600',
    upsert: false
  });
```

### Download File
```typescript
const { data, error } = await supabase.storage
  .from('documents')
  .download(filePath);
```

### Get Public URL
```typescript
const { data } = supabase.storage
  .from('documents')
  .getPublicUrl(filePath);
```

## Security

### Row Level Security (RLS)

All tables have RLS enabled. Users can only access their own data:

```sql
-- Projects policy
CREATE POLICY "Users can only see their own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Files policy  
CREATE POLICY "Users can only see files from their projects" ON files
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
```

### API Keys

- Use the anon key for client-side operations
- Never expose the service role key in client code
- Rotate keys regularly

## Best Practices

1. **Always handle errors**: Check the error object on every API call
2. **Use TypeScript**: Leverage type safety with generated types
3. **Implement retry logic**: For transient failures
4. **Cache responses**: Use React Query or similar for caching
5. **Validate inputs**: Always validate user inputs before API calls
6. **Use transactions**: For operations that modify multiple tables
7. **Monitor performance**: Track slow queries and optimize

## Testing

### Unit Tests
```typescript
import { supabase } from '../lib/supabase';

describe('Projects API', () => {
  test('should create project', async () => {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: 'Test Project',
        client: 'Test Client'
      });
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
```

### Integration Tests
Use a test database for integration tests to avoid affecting production data.

## Migration Guide

When updating the API:

1. Create migration files in `/supabase/migrations`
2. Test migrations on staging environment
3. Update TypeScript types
4. Update API documentation
5. Deploy to production

## Support

For API issues:
1. Check Supabase dashboard for errors
2. Review network requests in browser dev tools
3. Check RLS policies
4. Verify authentication status
5. Create an issue with reproduction steps