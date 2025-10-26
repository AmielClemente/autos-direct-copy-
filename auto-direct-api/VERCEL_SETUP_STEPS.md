# 🚀 Final Setup Steps for Vercel

## Step 1: Add Environment Variables to Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Add these variables (one by one):

### Variable 1:
- **Name**: `NODE_ENV`
- **Value**: `production`
- **Environment**: Production ✓
- Click **Save**

### Variable 2:
- **Name**: `SUPABASE_URL`
- **Value**: `https://etfbnbyuvxzejirgzzrt.supabase.co`
- **Environment**: Production ✓
- Click **Save**

### Variable 3:
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZmJuYnl1dnh6ZWppcmd6enJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQzMjk0MiwiZXhwIjoyMDc3MDA4OTQyfQ.hqA-uUtSflmO5qtgZIgbKU8xI67P9mIcUdUY6Rc78ss`
- **Environment**: Production ✓
- Click **Save**

### Variable 4:
- **Name**: `JWT_SECRET`
- **Value**: `1eb7749d60f260c775cd45591b055d3886e829ee3b90a230c472a672f097c63a06bb2df1228f294fe5e6c574acac920c878e48f6c6388f7a79444e8772b7792e40fdca343db62d9060874db7133b3fdcb3eaa85cac7f3f5f12eb216240a7ccc7f8900fec55996673d6619108942f4ff673ad6262aeb2a5815d6b5a30241463acd9d4cda8a9274d35b1a9385827988791d8b93bafd87ee900247c51584e7e0ef404782c93f6216ee189ee24c9b3ddfac32c59cf65f2482e0499bdf6ccfad44799dbb8fc93f13a8287b2a14f47b04d6d4dce2eb73dce005a287d9d56eeb600a1f0c762464dda00257575ad0ad2edd9b376d8263eb6fabc2483c9fbe47707019339`
- **Environment**: Production ✓
- Click **Save**

## Step 2: Redeploy

After adding all environment variables:

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or just wait - Vercel will auto-redeploy

## Step 3: Wait for Deployment

Wait 1-2 minutes for deployment to complete.

## Step 4: Test Your App

### 1. Health Check
Visit: `https://your-app.vercel.app/health`

Should return:
```json
{
  "status": "OK",
  "database": "Supabase Connected",
  "environment": "production"
}
```

### 2. Try to Login
Try logging in with an email from your Supabase users table.

### 3. Check for Vehicles
Visit: `https://your-app.vercel.app/vehicle/browse-vehicles`

Should return vehicles from your database.

## Step 5: Check Logs (if issues)

If something doesn't work:

1. Go to Vercel Dashboard
2. Your Project → Function Logs
3. Look for errors or the `[Supabase Adapter]` logs I added
4. Share the logs with me

## What Should Work Now

✅ Login should work
✅ Vehicle browsing should work  
✅ No more "permission denied" errors
✅ Database queries should work

## If Still Not Working

Check:
1. Are the environment variables saved? (refresh Vercel settings)
2. Did you select "Production" for each variable?
3. Is the deployment complete? (check deployment status)
4. Are there any errors in Vercel logs?

Share what you see!

