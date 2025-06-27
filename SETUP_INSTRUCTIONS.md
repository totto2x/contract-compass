# Supabase Setup Instructions

## ⚠️ IMPORTANT: Complete Supabase Setup Required

The application is currently configured with placeholder values and needs proper Supabase setup to function correctly.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: GitHub Contracts (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
6. Click "Create new project"
7. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

## Step 3: Update Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values:

```env
# Replace with your actual Supabase project URL
VITE_SUPABASE_URL=https://your-actual-project-ref.supabase.co

# Replace with your actual Supabase anon key
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Run Database Migrations

**CRITICAL**: You must run ALL migration files in chronological order. In your Supabase dashboard, go to **SQL Editor** and run these migrations in the exact order listed:

1. **First run**: `supabase/migrations/20250615004528_wandering_wind.sql`
2. **Then run**: `supabase/migrations/20250615004548_red_wind.sql`
3. **Then run**: `supabase/migrations/20250615054608_turquoise_lab.sql`
4. **Then run**: `supabase/migrations/001_fix_auth_trigger.sql` (if it exists)
5. **Finally run**: `supabase/migrations/20250626062744_weathered_frog.sql` ⚠️ **REQUIRED FOR TEXT EXTRACTION**

**Important Notes:**
- Copy and paste the SQL content from each file into the SQL Editor and execute them one by one
- Do not skip any migrations - they must all be applied in order
- The `20250626062744_weathered_frog.sql` migration is critical as it adds the `extracted_text` and `text_extraction_status` columns required for document processing

## Step 5: Verify Setup

1. Restart your development server: `npm run dev`
2. Try creating a new account
3. Try uploading a document to verify text extraction works
4. Check the browser console for any remaining errors

## Troubleshooting

### "Could not find the 'extracted_text' column" Error
- **This means the `20250626062744_weathered_frog.sql` migration was not applied**
- Go to Supabase SQL Editor and run this migration immediately
- Restart your development server after applying the migration

### "column documents.text_extraction_status does not exist" Error
- **This also means the `20250626062744_weathered_frog.sql` migration was not applied**
- Apply the migration as described above

### "Invalid login credentials" Error
- Verify your Supabase URL and anon key are correct
- Make sure you're not using placeholder values
- Check that your Supabase project is active

### "Database error saving new user" Error
- Ensure all database migrations have been run in order
- Check that RLS policies are properly configured
- Verify the `handle_new_user` trigger is working

### Still Having Issues?
1. Check the browser console for detailed error messages
2. Verify your Supabase project is active and not paused
3. Ensure ALL database migrations completed successfully (check each one in SQL Editor)
4. Check the Supabase dashboard logs for any errors
5. Verify the `documents` table has the `extracted_text` and `text_extraction_status` columns

## Security Notes

- Never commit your actual `.env` file to version control
- The anon key is safe to use in frontend applications
- Keep your service role key (if you get one) secret and server-side only

## Database Schema Verification

After running all migrations, your `documents` table should have these columns:
- `document_id` (uuid)
- `project_id` (uuid)
- `name` (text)
- `type` (text)
- `file_path` (text)
- `file_size` (bigint)
- `mime_type` (text)
- `creation_date` (timestamptz)
- `upload_status` (text)
- `processed_at` (timestamptz)
- `metadata` (jsonb)
- `extracted_text` (text) ⚠️ **Required**
- `text_extraction_status` (text_extraction_status enum) ⚠️ **Required**
- `text_extraction_error` (text)

If any of these columns are missing, re-run the corresponding migration files.