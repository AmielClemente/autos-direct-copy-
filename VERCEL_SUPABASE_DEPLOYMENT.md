# Vercel + Supabase Deployment Guide

## Overview
This guide will help you deploy your Auto Direct application to Vercel with Supabase as your database provider.

## Prerequisites
- GitHub account
- Vercel account (free tier available)
- Supabase account (free tier available)

## Step 1: Set up Supabase Database

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub
3. Click "New Project"
4. Choose organization and project name
5. Set a strong database password
6. Choose a region close to your users
7. Click "Create new project"

### 1.2 Get Supabase Credentials
1. In your Supabase dashboard, go to Settings > API
2. Copy the following:
   - Project URL
   - Anon public key
   - Service role key (secret)

### 1.3 Set up Database Schema
1. In Supabase dashboard, go to SQL Editor
2. Copy the contents of `auto-direct-api/data/supabase-migration.sql`
3. Paste and run the SQL script
4. This will create all necessary tables

### 1.4 Configure Row Level Security (RLS)
Run this SQL in Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_drive_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_comparisons ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed)
CREATE POLICY "Allow all operations for service role" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON vehicles FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON purchases FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON test_drive_bookings FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON complaints FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON chatbot_inquiries FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON finance_requests FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON vehicle_comparisons FOR ALL USING (true);
```

## Step 2: Set up Vercel

### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Connect your GitHub account

### 2.2 Import Project
1. In Vercel dashboard, click "New Project"
2. Import your GitHub repository
3. Choose the repository: `spr25-groups-auto-direct-group`

### 2.3 Configure Build Settings
Vercel will auto-detect your project structure. Make sure these settings are correct:

**Root Directory:** Leave empty (uses root)
**Framework Preset:** Other
**Build Command:** `cd auto-direct-app && npm run build`
**Output Directory:** `auto-direct-app/dist`
**Install Command:** `npm install`

### 2.4 Set Environment Variables
In Vercel project settings, add these environment variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

## Step 3: Configure API Routes

### 3.1 Create API Directory Structure
Create `api/` directory in your project root:

```
api/
├── auth/
│   ├── login.js
│   └── register.js
├── vehicles/
│   └── browse.js
├── users/
│   └── profile.js
└── chatbot/
    └── message.js
```

### 3.2 Example API Route
Create `api/vehicles/browse.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        makes (
          makeName,
          manufacturers (
            manufacturerName
          )
        )
      `)
      .eq('vehicleStatus', 'Available');

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Step 4: Update Frontend Configuration

### 4.1 Update API Base URL
In `auto-direct-app/src/data/api-calls.js`:

```javascript
const api = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.vercel.app/api' 
  : '/api';

export default api;
```

### 4.2 Update Vite Config
In `auto-direct-app/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
```

## Step 5: Deploy

### 5.1 Push to GitHub
```bash
git add .
git commit -m "Add Vercel + Supabase deployment configuration"
git push origin recap
```

### 5.2 Deploy on Vercel
1. Vercel will automatically deploy when you push to GitHub
2. Go to your Vercel dashboard to monitor the deployment
3. Check the deployment logs for any errors

## Step 6: Configure Custom Domain (Optional)

### 6.1 Add Domain in Vercel
1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 6.2 Update Environment Variables
Update `FRONTEND_URL` to your custom domain.

## Step 7: Testing

### 7.1 Test API Endpoints
```bash
curl https://your-app.vercel.app/api/vehicles/browse
```

### 7.2 Test Frontend
1. Visit your Vercel URL
2. Test user registration/login
3. Test vehicle browsing
4. Test all functionality

## Step 8: Monitoring and Maintenance

### 8.1 Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor performance and errors

### 8.2 Supabase Monitoring
- Check Supabase dashboard for database metrics
- Monitor API usage and limits

### 8.3 Environment Variables
- Keep sensitive keys secure
- Rotate keys regularly
- Use different keys for different environments

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in package.json
   - Verify build commands are correct

2. **Database Connection Issues:**
   - Verify Supabase credentials
   - Check RLS policies
   - Ensure tables exist

3. **CORS Issues:**
   - Update CORS settings in API routes
   - Add Vercel domain to allowed origins

4. **Environment Variables:**
   - Ensure all required variables are set
   - Check variable names match exactly

### Debug Steps:
1. Check Vercel function logs
2. Test API endpoints directly
3. Verify Supabase connection
4. Check browser console for errors
5. Test with different browsers

## Cost Considerations

### Vercel (Free Tier):
- 100GB bandwidth/month
- 100 serverless function executions/day
- Unlimited static deployments

### Supabase (Free Tier):
- 500MB database storage
- 2GB bandwidth/month
- 50,000 monthly active users

For production use, consider upgrading to paid tiers as needed.

## Security Best Practices

1. **Environment Variables:**
   - Never commit secrets to Git
   - Use Vercel's environment variable system
   - Rotate keys regularly

2. **Database Security:**
   - Enable RLS policies
   - Use service role key only in server-side code
   - Regular security audits

3. **API Security:**
   - Implement rate limiting
   - Validate all inputs
   - Use HTTPS everywhere

This setup provides a modern, scalable, and cost-effective deployment solution for your Auto Direct application.

