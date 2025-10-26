# 🔍 Debugging: Environment Variable Set But Nothing Showing

## Step 1: Check Vercel Logs

Go to Vercel Dashboard → Your Project → Function Logs

Look for these entries when you try to access the app:

### Good Signs ✅
```
Environment check: SUPABASE_SERVICE_ROLE_KEY=SET
Creating Supabase client with: hasKey=true
Supabase client initialized for production
```

### Bad Signs ❌
```
SUPABASE_SERVICE_ROLE_KEY=NOT SET
Running without Supabase, using MySQL for development
```

## Step 2: Verify Data in Supabase

The issue might be that your Supabase database is **empty**!

### Check Users Table
1. Go to https://supabase.com/dashboard
2. Your project → **Table Editor**
3. Open `users` table
4. **Do you see any rows?**
   - If empty: No users = can't login
   - If has rows: Continue

### Check Vehicles Table
1. Same place → open `vehicles` table  
2. **Do you see any rows?**
   - If empty: No vehicles = can't browse
   - If has rows: Continue

## Step 3: If Supabase is Empty - Add Data

You need to run the migration SQL files!

### Option A: Run SQL Files
1. Supabase Dashboard → **SQL Editor**
2. Run `supabase-migration-corrected.sql` (creates tables)
3. Run `supabase-sample-data-actual-users.sql` (adds data)

### Option B: Manual Check

Run this in Supabase SQL Editor:
```sql
-- Check what's in your database
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_vehicles FROM vehicles;
SELECT COUNT(*) as total_makes FROM makes;

-- Show sample data
SELECT * FROM users LIMIT 5;
SELECT * FROM vehicles LIMIT 5;
```

## Step 4: Force Redeploy

Sometimes environment variables need a force redeploy:

1. Vercel Dashboard
2. Go to **Deployments**
3. Click **⋯** on latest deployment
4. Click **Redeploy** (not "Redeploy with same build")
5. Wait 2-3 minutes

## Step 5: Test Again

After redeploy, test:
- `/health` endpoint
- Try to login
- Browse vehicles

## Common Issues

### Issue 1: Variable Not Picked Up
**Solution**: Force redeploy or update any file and push

### Issue 2: Database Empty
**Solution**: Run the SQL migration files in Supabase

### Issue 3: Wrong Variable Name
**Solution**: Make sure it's `SUPABASE_SERVICE_ROLE_KEY` not `SUPABASE_SERVICE_ROLE`

### Issue 4: Environment Not Selected
**Solution**: Check "Production" checkbox when saving variable

## What to Share

Please share:
1. Screenshot of Vercel environment variables (hide the key values)
2. Screenshot of Supabase `users` table (showing if it's empty or has data)
3. Screenshot of Vercel Function Logs when you hit `/health`

