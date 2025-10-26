# ✅ Verify Your Vercel Environment Variables

## Check These Variables in Vercel

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

### Required Variables:

1. **NODE_ENV**
   - Value: `production`
   - Environment: Production ✓

2. **SUPABASE_URL** 
   - Value: `https://etfbnbyuvxzejirgzzrt.supabase.co`

3. **SUPABASE_SERVICE_ROLE_KEY** ⚠️ **MOST IMPORTANT**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZmJuYnl1dnh6ZWppcmd6enJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQzMjk0MiwiZXhwIjoyMDc3MDA4OTQyfQ.hqA-uUtSflmO5qtgZIgbKU8xI67P9mIcUdUY6Rc78ss`

4. **JWT_SECRET**
   - Value: (use your existing one)

## Quick Test

After verifying/updating variables, **Redeploy**:

1. Go to Deployments
2. Click **⋯** on latest
3. Click **Redeploy**
4. Wait 1-2 minutes

Then test: `https://your-app.vercel.app/health`

## FRONTEND_URL is Not Needed

The FRONTEND_URL variable is optional and won't cause your issue. The real problem was the "permission denied" error, which should be fixed once you have the correct service_role key in Vercel.

## What to Check in Logs

After redeploying, check Vercel Function Logs. You should see:

```
Environment check: NODE_ENV=production, SUPABASE_URL=SET, SUPABASE_SERVICE_ROLE_KEY=SET
Creating Supabase client with: url=https://etfbnbyuvxzejirgzzrt.supabase.co..., hasKey=true
Supabase client initialized for production
```

If you see this, Supabase is connected properly!

