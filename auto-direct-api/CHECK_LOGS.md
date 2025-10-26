# 🔍 How to Check Vercel Logs

Since you're not seeing errors, I've added detailed logging. Here's how to find them:

## Step 1: Go to Vercel Dashboard

1. Visit https://vercel.com/dashboard
2. Click on your project

## Step 2: Check Function Logs

1. Click on the latest deployment
2. Click **"Function Logs"** or **"Logs"** tab
3. Look for entries starting with `[Supabase Adapter]`

## Step 3: What to Look For

When you try to login, you should see logs like:

```
[Supabase Adapter] SELECT Query: SELECT * FROM users WHERE (users.emailAddress = ?)
[Supabase Adapter] Params: ['your@email.com']
[Supabase Adapter] Table: users
[Supabase Adapter] WHERE clause: (users.emailAddress = ?)
[Supabase Adapter] Parsing WHERE: users.emailAddress = ?
[Supabase Adapter] Results: 0 rows
```

## Common Issues

### Issue 1: No logs at all
**Problem:** Supabase adapter might not be being used
**Solution:** Check if NODE_ENV is set to 'production' in Vercel

### Issue 2: "Results: 0 rows"
**Problem:** No data in Supabase or email doesn't match
**Solution:** Check your Supabase users table

### Issue 3: Error messages
**Problem:** Supabase connection issue or query error
**Solution:** Check the exact error message

### Issue 4: Params show undefined
**Problem:** Parameters not being passed correctly
**Solution:** Issue in the query construction

## Step 4: Share the Logs

Copy and paste the logs here so I can see what's happening!

Also try visiting your Vercel app and check:

1. `/health` endpoint - what does it show?
2. Try to login - what error do you see?
3. Check browser console for any errors

## Alternative: Check Supabase Directly

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Table Editor**
4. Open `users` table
5. Check if you have any rows with:
   - `user_status = 'Active'`
   - A valid email address

## Quick Test Query

In Supabase SQL Editor, run:

```sql
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as active_users FROM users WHERE user_status = 'Active';
SELECT emailAddress, user_status FROM users LIMIT 5;
```

If these return 0, your Supabase database is empty!

