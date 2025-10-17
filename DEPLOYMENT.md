# Deployment Guide - Render.com

This guide explains how to deploy Rugby Score Hub to Render.com.

## Prerequisites

1. A GitHub account with this repository pushed
2. A Render.com account (free tier available)
3. A Supabase project with the database migrations applied

## Step-by-Step Deployment

### 1. Push Your Code to GitHub

Make sure all your latest changes are committed and pushed:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Create a New Static Site on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository
4. Select the `rugby-score-hub` repository

### 3. Configure Build Settings

Render should auto-detect the `render.yaml` configuration, but verify these settings:

- **Name:** `rugby-score-hub` (or your preferred name)
- **Branch:** `main`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`

### 4. Add Environment Variables

In the Render dashboard for your static site, go to **Environment** and add:

```
VITE_SUPABASE_PROJECT_ID = your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY = your-anon-key
VITE_SUPABASE_URL = https://your-project-id.supabase.co
```

**Where to find these values:**
- Go to your Supabase project dashboard
- Navigate to **Settings** → **API**
- Copy the **Project URL** (for `VITE_SUPABASE_URL`)
- Copy the **anon public** key (for `VITE_SUPABASE_PUBLISHABLE_KEY`)
- The project ID is in the URL (e.g., `iugtpegzbzfthgyfiqlq.supabase.co`)

### 5. Deploy

1. Click **"Create Static Site"**
2. Render will automatically build and deploy your site
3. Wait for the build to complete (usually 2-5 minutes)
4. Your site will be live at `https://your-site-name.onrender.com`

### 6. Configure Custom Domain (Optional)

1. In your Render dashboard, go to **Settings** → **Custom Domain**
2. Add your domain name
3. Update your DNS settings as instructed by Render

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase project ID | `iugtpegzbzfthgyfiqlq` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | `eyJhbGci...` |
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |

## Automatic Deployments

Once set up, Render will automatically deploy when you push to the `main` branch on GitHub.

To disable auto-deploy:
1. Go to **Settings** → **Build & Deploy**
2. Toggle off **Auto-Deploy**

## Troubleshooting

### Build Fails

- Check the build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### App Loads But Features Don't Work

- Check browser console for errors
- Verify Supabase environment variables are correct
- Ensure Supabase database migrations have been applied
- Check that Supabase RLS policies allow public access

### 404 Errors on Page Refresh

- Verify the `render.yaml` has the correct routes configuration
- The rewrite rule should redirect all routes to `/index.html` for client-side routing

## Performance Tips

1. **Enable Brotli Compression** - Render automatically compresses static assets
2. **Use CDN** - Render serves static sites via CDN by default
3. **Monitor Performance** - Use Render's metrics to track load times

## Support

- Render Docs: https://render.com/docs/static-sites
- Render Community: https://community.render.com/
- Supabase Docs: https://supabase.com/docs
