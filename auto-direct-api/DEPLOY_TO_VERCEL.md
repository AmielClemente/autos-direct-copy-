# How to Deploy to Vercel with Supabase

## Problem You're Facing

After deploying to Vercel, you can't see cars and can't login. This is because the code was returning empty arrays instead of querying Supabase properly.

## I've Fixed The Code

I updated `index.js` to use the SupabaseAdapter instead of returning empty arrays. Now you need to populate your Supabase database.

## Steps to Fix

### Step 1: Run Migration in Supabase

Go to your Supabase dashboard → SQL Editor and run these in order:

1. First, run `supabase-migration-corrected.sql` to create the tables
2. Then, run `supabase-sample-data-actual-users.sql` to populate with your real data

### Step 2: Verify Data is in Supabase

In Supabase dashboard, check:
- `users` table has data
- `vehicles` table has data with `approvalStatus = 'Approved'`
- `makes` and `manufacturers` tables have data

### Step 3: Redeploy to Vercel

Push your changes to GitHub, and Vercel will auto-deploy. The code now uses the SupabaseAdapter which should work for basic queries.

### Step 4: Test Your Deployment

1. Go to your Vercel deployment URL
2. Try to login with one of these test users:
   - Email: `22070210@student.westernsydney.edu.au`
   - Email: `admin@autosdirect.com.au`
   - Password for all: `password123` (unless you changed it)

3. Check if cars are showing in the browse page

## Important Notes

### Limitations

The SupabaseAdapter I implemented is VERY BASIC and only handles simple SELECT queries. It won't work for:

- Complex JOIN queries (like vehicle listing with makes/manufacturers)
- WHERE clauses with parameters
- INSERT/UPDATE/DELETE operations
- Subqueries

### What Works Now

- Basic SELECT * FROM table queries
- Simple filtering

### What Doesn't Work Yet

- Vehicle browsing (needs JOINs)
- User login (needs WHERE clauses with parameters)
- Any complex queries

## Recommendation

For now, the best approach is to:

### Option A: Use MySQL in Vercel (Easiest)

1. DON'T set NODE_ENV=production in Vercel
2. Set up a managed MySQL database (like PlanetScale or Railway)
3. Configure connection in Vercel environment variables
4. Deploy

### Option B: Complete Supabase Migration (More Work)

1. Rewrite all services to use Supabase client instead of SQL queries
2. This is substantial refactoring work
3. Would need to update:
   - vehicle-routes.js
   - user-routes.js  
   - All service files
   - authentication/authorization middleware

### Option C: Hybrid Approach

- Use MySQL for complex queries (vehicles, browsing)
- Use Supabase for auth only
- Gradually migrate components

## Testing Checklist

After deploying, test:

- [ ] `/health` endpoint - should show "Supabase Connected"
- [ ] Can see vehicles in browse page
- [ ] Can login with test user
- [ ] Can view individual vehicle details
- [ ] Admin panel loads
- [ ] User registration works

## If Still Not Working

1. Check Vercel logs for errors
2. Check Supabase logs for query errors
3. Verify all environment variables are set in Vercel
4. Make sure data was actually inserted into Supabase tables

## Next Steps

If the basic adapter doesn't work, you'll need to either:

1. Rewrite services to use Supabase client directly
2. Keep using MySQL for now
3. Build a more sophisticated SQL-to-Supabase query parser

Let me know which approach you'd like to take!

