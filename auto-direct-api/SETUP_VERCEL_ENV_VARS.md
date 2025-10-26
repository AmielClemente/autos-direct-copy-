# 🔧 Setting Up Vercel Environment Variables

## Your Current Setup

You have a Next.js frontend that uses the **anon** key (which is correct for frontend).

But your **Express backend** needs the **service_role** key to access the database.

## Required Environment Variables

### For Your Backend API (Vercel)

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add these:

```
NODE_ENV=production
SUPABASE_URL=https://etfbnbyuvxzejirgzzrt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<get-this-from-supabase-dashboard>
JWT_SECRET=<your-jwt-secret-here>
```

### Where to Get SUPABASE_SERVICE_ROLE_KEY:

1. Go to: https://supabase.com/dashboard
2. Select project: `etfbnbyuvxzejirgzzrt`
3. Settings → API
4. Under "Project API keys", find **`service_role`** key
5. Click eye icon to reveal it
6. Copy it
7. Paste into Vercel as `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important**: The `service_role` key is DIFFERENT from `NEXT_PUBLIC_SUPABASE_ANON_KEY`!

## Current vs Required

| Current (Frontend) | Required (Backend API) |
|---------------------|------------------------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon key) | `SUPABASE_SERVICE_ROLE_KEY` (service_role key) |
| Used by Next.js frontend ✅ | Used by Express backend ❌ |

## Quick Checklist

- [ ] Go to https://supabase.com/dashboard
- [ ] Project: `etfbnbyuvxzejirgzzrt`
- [ ] Settings → API
- [ ] Find **service_role** key (secret)
- [ ] Copy it
- [ ] Go to Vercel → Your Project → Settings → Environment Variables
- [ ] Add: `SUPABASE_SERVICE_ROLE_KEY` = (paste the service_role key)
- [ ] Make sure "Production" is selected ✓
- [ ] Click Save
- [ ] Redeploy your app

## Visual Guide

```
Supabase Dashboard
└── etfbnbyuvxzejirgzzrt
    └── Settings
        └── API
            └── Project API keys
                ├── anon public (already have this ✅)
                └── service_role secret (need to copy this ✅)
```

## After Adding

Once you add `SUPABASE_SERVICE_ROLE_KEY` to Vercel:

1. Vercel will auto-redeploy
2. Wait 1-2 minutes
3. Test your app
4. The "permission denied" error should be gone!

## Why Two Keys?

- **Anon key** (public): Limited permissions, safe for frontend
- **Service role key** (secret): Full permissions, only for backend

Your backend needs full access to query the database, so it needs the service_role key.

