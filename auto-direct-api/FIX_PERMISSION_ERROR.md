# 🔧 Fix Permission Error

## Error You're Seeing
```
permission denied for schema public
```

## The Problem

Your Vercel environment variables are using the **Supabase Anon Key** instead of the **Service Role Key**. The anon key has restricted permissions!

## The Fix

### Step 1: Get Your Service Role Key

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Find **"service_role"** key
5. Copy the full key (starts with `eyJhbGc...`)

### Step 2: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `SUPABASE_SERVICE_ROLE_KEY`
5. Make sure it's using the **SERVICE_ROLE** key, NOT the anon key
6. Also check these variables exist:
   - `NODE_ENV=production` ✅
   - `SUPABASE_URL=` (your supabase URL)
   - `SUPABASE_SERVICE_ROLE_KEY=` (service role key, NOT anon key)
   - `JWT_SECRET=` (your JWT secret)

### Step 3: Redeploy

After updating the environment variable:
1. Go to **Deployments**
2. Click the **⋯** menu on latest deployment
3. Click **Redeploy**

Or just push a small change to trigger auto-deploy.

### Step 4: Verify

After redeploy, check `/health` endpoint again. Should show "Supabase Connected" without errors.

## Key Differences

| Key Type | Scope | Use Case |
|---------|-------|----------|
| `anon` key | Public schema only | Frontend client |
| `service_role` key | **Full database access** | Backend server |

**You MUST use `service_role` key in your backend!**

## If Still Not Working

Check Vercel logs again after redeploy. You should see:
- No more "permission denied" errors
- Successful queries
- Data being returned

Share the new logs if issues persist!

