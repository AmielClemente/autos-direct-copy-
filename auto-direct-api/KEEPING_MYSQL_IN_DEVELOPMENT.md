# Keeping MySQL for Development

## Overview

Your setup is configured to use:
- **MySQL** for development (local machine)
- **Supabase** for production (Vercel deployment)

## How It Works

The system automatically selects the database based on:
1. `NODE_ENV` environment variable
2. Presence of Supabase configuration

### In Development (Local):
- **DON'T** set `NODE_ENV=production`
- **DON'T** set Supabase environment variables
- System will use MySQL

### In Production (Vercel):
- Set `NODE_ENV=production`
- Set Supabase environment variables
- System will use Supabase

## Current Configuration

Looking at `index.js` (lines 39-54):

```javascript
if (process.env.NODE_ENV === 'production' && supabaseConfig && supabaseConfig.url && supabaseConfig.serviceRoleKey) {
  supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
  console.log('Supabase client initialized for production');
} else {
  console.log('Supabase not configured, using MySQL for development');
  // MySQL pool is created here
  pool = mysql.createPool(connectionConfig);
}
```

## To Use MySQL in Development:

1. **Create `.env.local` file** (already created for you)
   - Contains MySQL configuration
   - Does NOT have Supabase variables
   - Does NOT have `NODE_ENV=production`

2. **Run your app** with:
   ```bash
   cd auto-direct-api
   node index.js
   ```

3. **Check the console** - you should see:
   ```
   Supabase not configured, using MySQL for development
   Database connected successfully
   ```

## To Deploy to Production with Supabase:

1. In Vercel, set environment variables:
   - `NODE_ENV=production`
   - `SUPABASE_URL=your_url`
   - `SUPABASE_ANON_KEY=your_key`
   - `SUPABASE_SERVICE_ROLE_KEY=your_key`

2. The app will automatically use Supabase

## Environment Files Structure

- **`.env.local`** - For local development with MySQL (gitignored)
- **Vercel Environment Variables** - For production with Supabase (in Vercel dashboard)

## Testing

Run the health check:
```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "OK",
  "database": "MySQL Connected",
  "environment": "development"
}
```
