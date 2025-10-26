# Vercel Deployment Fix - Can't See Cars/Can't Login

## Problem

Your Vercel deployment is showing the Supabase database is connected but:
- No cars are showing
- Login is not working

## Root Cause

Looking at `index.js` lines 106-119, when NODE_ENV=production and Supabase is configured, it creates a MOCK adapter that returns empty arrays:

```javascript
req.pool = {
  query: (sql, params, callback) => {
    console.log('Supabase query adapter:', sql.substring(0, 100));
    // For now, return empty results  <--- THIS IS THE PROBLEM
    if (callback) {
      callback(null, []);
    }
    return Promise.resolve([]);
  }
};
```

## Solutions

You have 3 options:

### Option 1: Use MySQL in Vercel (Quick Fix)

This is the EASIEST fix for now:

1. In Vercel, DON'T set `NODE_ENV=production`
2. Set your MySQL environment variables instead
3. Or use a MySQL service like PlanetScale

### Option 2: Fix Supabase Integration (Recommended Long-term)

1. Create a proper Supabase query adapter
2. OR rewrite services to use Supabase client directly
3. This requires substantial code changes

### Option 3: Hybrid Approach (Best for Now)

Keep MySQL in production too, but use Supabase for auth only.

## Quick Fix Instructions

### Step 1: Check Your Supabase Data

Go to your Supabase dashboard and run the SQL to populate data:

1. Run `supabase-migration-corrected.sql` to create tables
2. Run `supabase-sample-data-actual-users.sql` to populate data

### Step 2: Temporarily Disable Supabase

In Vercel environment variables, REMOVE or comment out:
- NODE_ENV=production (or set it to development)
- SUPABASE_URL
- SUPABASE_ANON_KEY  
- SUPABASE_SERVICE_ROLE_KEY

### Step 3: Deploy

This will make the app use MySQL even in Vercel (if you configure it), or the mock will at least be explicit.

### Step 4: Proper Fix - Implement Supabase Queries

You need to rewrite vehicle queries to use Supabase client:

```javascript
// Instead of: req.pool.query(sql, params, callback)
// Use: req.supabase.from('vehicles').select('*').eq('approvalStatus', 'Approved')
```

## Testing

After any change, check:
1. `/health` endpoint - should show which database is connected
2. `/api/test` endpoint - basic connectivity test

