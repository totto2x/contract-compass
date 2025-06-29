# Supabase Setup Instructions

## ⚠️ CRITICAL: Your Supabase Project May Be Paused!

**If you're seeing "Failed to fetch" errors, your Supabase project is likely PAUSED or DELETED.**

### 🚨 IMMEDIATE ACTION REQUIRED:

1. **Go to [supabase.com/dashboard](https://supabase.com/dashboard)**
2. **Check if your project shows as "PAUSED" or is missing**
3. **If paused, click the "Resume" button to reactivate it**
4. **If deleted, you'll need to create a new project and update your .env file**

---

## Step 1: Verify/Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. **Check if your existing project is active:**
   - Look for project: `zwkdhbojvhgfogtdqydr`
   - If it shows "PAUSED", click "Resume"
   - If it's missing, create a new project:
     - Click "New Project"
     - Choose your organization
     - Enter project details:
       - **Name**: GitHub Contracts (or your preferred name)
       - **Database Password**: Choose a strong password
       - **Region**: Select closest to your users
     - Click "Create new project"
     - Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

## Step 3: Update Environment Variables (If Needed)

**Only do this if you created a NEW project or your credentials changed:**

1. Open the `.env` file in your project root
2. Replace with your actual values:

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
4. **Then run**: `supabase/migrations/20250626062744_weathered_frog.sql` ⚠️ **REQUIRED FOR TEXT EXTRACTION**
5. **Finally run**: `supabase/migrations/20250627071415_wild_hat.sql` ⚠️ **REQUIRED FOR MERGE RESULTS**

**Important Notes:**
- Copy and paste the SQL content from each file into the SQL Editor and execute them one by one
- Do not skip any migrations - they must all be applied in order
- The last two migrations are critical for the app to function properly

## Step 5: Verify Setup

1. Restart your development server: `npm run dev`
2. Check the browser console for connection test results
3. Try creating a new account
4. Try uploading a document to verify text extraction works

## Troubleshooting

### "Failed to fetch" Error (Most Common)
- **🚨 Your Supabase project is PAUSED or DELETED**
- **Solution**: Go to [supabase.com/dashboard](https://supabase.com/dashboard) and resume/recreate your project
- Check the browser console for detailed connection test results

### "Could not find the 'merged_contract_results' table" Error
- **This means the `20250627071415_wild_hat.sql` migration was not applied**
- Go to Supabase SQL Editor and run this migration immediately
- Restart your development server after applying the migration

### "Could not find the 'extracted_text' column" Error
- **This means the `20250626062744_weathered_frog.sql` migration was not applied**
- Go to Supabase SQL Editor and run this migration immediately
- Restart your development server after applying the migration

### "Invalid login credentials" Error
- Verify your Supabase URL and anon key are correct
- Make sure you're not using placeholder values
- Check that your Supabase project is active (not paused)

### "Database error saving new user" Error
- Ensure all database migrations have been run in order
- Check that RLS policies are properly configured
- Verify the `handle_new_user` trigger is working

### Still Having Issues?
1. **Check the browser console** - detailed error messages are logged there
2. **Verify your Supabase project is active** and not paused
3. **Ensure ALL database migrations completed successfully** (check each one in SQL Editor)
4. **Check the Supabase dashboard logs** for any errors
5. **Verify all required tables exist** in your database

## Security Notes

- Never commit your actual `.env` file to version control
- The anon key is safe to use in frontend applications
- Keep your service role key (if you get one) secret and server-side only

## Database Schema Verification

After running all migrations, your database should have these tables:
- `users` - User profiles and authentication
- `projects` - Contract projects
- `documents` - Uploaded contract documents with text extraction
- `merged_contract_results` - AI-generated contract merge results

**Critical columns to verify:**
- `documents.extracted_text` (text) ⚠️ **Required**
- `documents.text_extraction_status` (enum) ⚠️ **Required**
- `merged_contract_results` table exists ⚠️ **Required**

If any of these are missing, re-run the corresponding migration files.

## Quick Diagnostic Checklist

✅ **Supabase project is ACTIVE (not paused)**  
✅ **All 5 migration files have been run successfully**  
✅ **Browser console shows "✅ Supabase connection test successful"**  
✅ **Browser console shows "✅ merged_contract_results table exists and is accessible"**  

If any of these show ❌, that's your issue to fix first.