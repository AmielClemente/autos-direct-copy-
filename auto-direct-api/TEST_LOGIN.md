# Testing Login After Fix

## What I Fixed

The Supabase adapter was not properly handling WHERE clauses like `WHERE (users.emailAddress = ?)`. 

### Changes:
- Now handles `table.column` syntax
- Properly removes parentheses
- Correctly matches parameter values

## Wait for Deployment

Vercel should be auto-deploying now. Wait 1-2 minutes, then test.

## Test Login

After deployment completes:

1. **Check health** (should show Supabase connected):
   ```bash
   curl https://your-app.vercel.app/health
   ```

2. **Try to login** with an email from your Supabase users table

3. **Check Vercel logs** if login fails:
   - Go to Vercel Dashboard
   - Your project → Function Logs
   - Look for errors

## Common Issues

### "No user by this email"
**Check:**
- Does the email exist in your Supabase `users` table?
- Is the email spelled correctly?
- Go to Supabase Dashboard → Table Editor → users → verify email exists

### Password Issues
**Check:**
- What password hash format did you use in Supabase?
- Should be bcrypt hash
- If using sample data, password might be "password123" but you need the hash

### Still Not Working?

Check Vercel logs for:
```
Supabase adapter error: ...
query error: ...
```

Share the exact error message with me!

## Verify Data in Supabase

In Supabase Dashboard → SQL Editor, run:

```sql
-- Check users
SELECT userID, firstName, lastName, emailAddress, user_status 
FROM users 
WHERE user_status = 'Active'
LIMIT 5;

-- Check vehicles  
SELECT vehicleID, modelName, approvalStatus, deletedStatus 
FROM vehicles 
WHERE approvalStatus = 'Approved' AND deletedStatus != 'Deleted'
LIMIT 5;
```

If these return empty, your Supabase doesn't have the data yet!

