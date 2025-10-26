# 🔑 How to Get Your Supabase Service Role Key

## Step-by-Step Guide

### 1. Go to Supabase Dashboard
Visit: https://supabase.com/dashboard

### 2. Select Your Project
Click on the project you're using

### 3. Go to Settings → API
- On the left sidebar, click **"Settings"**
- Then click **"API"**

### 4. Find the Service Role Key
Scroll down to the **"Project API keys"** section.

You'll see:
- `anon` `public` - This is the PUBLIC key (DON'T use this!)
- `service_role` `secret` - **This is the one you need!**

### 5. Copy the Service Role Key
- Click the **eye icon** 🔒 to reveal the key
- Click **"Copy"** next to the `service_role` key
- The key will look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

## ⚠️ Important Security Notes

- **NEVER share this key publicly**
- **NEVER commit it to GitHub**
- **NEVER use it in frontend code**
- **ONLY use it in your backend** (Vercel environment variables)

## Where to Put It

### In Vercel:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add or edit:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (paste the key you copied)
5. **Important**: Make sure "Production" is selected ✓
6. Click **Save**

## Visual Guide

```
Supabase Dashboard
├── Project: [Your Project Name]
└── Settings
    └── API
        └── Project API keys
            ├── anon public (❌ DON'T USE)
            └── service_role secret (✅ USE THIS!)
```

## Quick Copy Checklist

- [ ] Copied the `service_role` key (NOT anon key)
- [ ] Pasted it into Vercel environment variable: `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Selected "Production" environment
- [ ] Saved the variable
- [ ] Redeployed the application

## After Adding the Key

1. The change will automatically trigger a redeploy
2. OR you can manually redeploy:
   - Go to Deployments
   - Click "⋯" on latest deployment
   - Click "Redeploy"

3. Wait 1-2 minutes
4. Test your app again!

## Still Can't Find It?

If you don't see the API section:
1. Make sure you're logged into the correct account
2. Make sure you've created a Supabase project
3. Make sure you have access to the project

The URL should look like:
`https://supabase.com/dashboard/project/[your-project-id]/settings/api`

