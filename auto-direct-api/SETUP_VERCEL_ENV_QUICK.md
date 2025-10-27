# 🚀 Quick Vercel Environment Setup

## Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Click on your project: `autos-direct-copy-`
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)

## Step 2: Add These 4 Variables

Add each one separately by clicking **"Add New"**:

### Variable 1: NODE_ENV
```
Name: NODE_ENV
Value: production
Environments: ☑ Production
Click "Save"
```

### Variable 2: SUPABASE_URL
```
Name: SUPABASE_URL
Value: https://etfbnbyuvxzejirgzzrt.supabase.co
Environments: ☑ Production
Click "Save"
```

### Variable 3: SUPABASE_SERVICE_ROLE_KEY
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZmJuYnl1dnh6ZWppcmd6enJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQzMjk0MiwiZXhwIjoyMDc3MDA4OTQyfQ.hqA-uUtSflmO5qtgZIgbKU8xI67P9mIcUdUY6Rc78ss
Environments: ☑ Production
Click "Save"
```

### Variable 4: JWT_SECRET
```
Name: JWT_SECRET
Value: 1eb7749d60f260c775cd45591b055d3886e829ee3b90a230c472a672f097c63a06bb2df1228f294fe5e6c574acac920c878e48f6c6388f7a79444e8772b7792e40fdca343db62d9060874db7133b3fdcb3eaa85cac7f3f5f12eb216240a7ccc7f8900fec55996673d6619108942f4ff673ad6262aeb2a5815d6b5a30241463acd9d4cda8a9274d35b1a9385827988791d8b93bafd87ee900247c51584e7e0ef404782c93f6216ee189ee24c9b3ddfac32c59cf65f2482e0499bdf6ccfad44799dbb8fc93f13a8287b2a14f47b04d6d4dce2eb73dce005a287d9d56eeb600a1f0c762464dda00257575ad0ad2edd9b376d8263eb6fabc2483c9fbe47707019339
Environments: ☑ Production
Click "Save"
```

## Step 3: Redeploy

After adding all 4 variables:

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Wait 1-2 minutes

## Step 4: Test

Visit these URLs to test:

1. `https://autos-direct-copy.vercel.app/health`
   - Should return: `{"status":"OK",...}`

2. `https://autos-direct-copy.vercel.app/vehicle/makes`
   - Should return JSON with makes data

## ❌ Do NOT Add These

You don't need:
- `POSTGRES_*` variables (we use Supabase JS, not raw PostgreSQL)
- `SUPABASE_ANON_KEY` (that's for frontend)
- `NEXT_PUBLIC_*` variables (those are for Next.js frontend)
- `DB_*` variables (those are for local MySQL development)

## Still Not Working?

Check the Vercel Function Logs:

1. Go to **Deployments** tab
2. Click on latest deployment
3. Click **"Function Logs"**
4. Look for logs starting with `[INIT]`
5. Share what you see!
