# Step-by-Step Guide: Deploy Debate Master to Vercel

This guide will walk you through deploying the **app-subscription** branch of Debate Master to Vercel.

## Prerequisites

Before you begin, ensure you have:

- ✅ A GitHub account
- ✅ A Vercel account (sign up at [vercel.com](https://vercel.com) if needed)
- ✅ Your Supabase project set up and running
- ✅ Your Google Gemini API key
- ✅ (Optional) OpenAI and Anthropic API keys if you want to enable Pro tier features

---

## Step 1: Prepare Your Repository

### 1.1 Ensure Your Code is Committed

Make sure all your changes are committed to the `app-subscription` branch:

```bash
git checkout app-subscription
git status
git add .
git commit -m "Prepare for deployment"
```

### 1.2 Push to GitHub

If you haven't already, push your branch to GitHub:

```bash
git push origin app-subscription
```

---

## Step 2: Set Up Vercel Account

### 2.1 Sign Up / Log In to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"** to connect your GitHub account
4. Authorize Vercel to access your repositories

---

## Step 3: Create a New Vercel Project

### 3.1 Import Your Repository

1. In the Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find and select your **Debate-Master** repository
3. Click **"Import"**

### 3.2 Configure Project Settings

1. **Framework Preset**: Vercel should auto-detect **Next.js** (if not, select it)
2. **Root Directory**: Leave as `.` (root)
3. **Build Command**: Leave as default (`npm run build` or `next build`)
4. **Output Directory**: Leave as default (`.next`)
5. **Install Command**: Leave as default (`npm install`)

### 3.3 Select Branch

1. Under **"Production Branch"**, select **`app-subscription`**
2. (Optional) You can also set up preview deployments for other branches

---

## Step 4: Configure Environment Variables

This is a critical step! You need to add all required environment variables in Vercel.

### 4.1 Open Environment Variables Section

In the project configuration page, scroll down to **"Environment Variables"** section.

### 4.2 Add Required Variables

Click **"Add"** for each of the following environment variables:

#### Required Variables:

1. **`NEXT_PUBLIC_SUPABASE_URL`**
   - **Value**: Your Supabase project URL
   - **Where to find**: Supabase Dashboard → Settings → API → Project URL
   - **Example**: `https://xxxxxxxxxxxxx.supabase.co`
   - **Environment**: Select all (Production, Preview, Development)

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - **Value**: Your Supabase anonymous/public key
   - **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
   - **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Environment**: Select all (Production, Preview, Development)

3. **`GEMINI_API_KEY`**
   - **Value**: Your Google Gemini API key
   - **Where to find**: [Google AI Studio](https://makersuite.google.com/app/apikey) or [Google Cloud Console](https://console.cloud.google.com/)
   - **Example**: `AIzaSy...`
   - **Environment**: Select all (Production, Preview, Development)

#### Optional Variables (for Pro tier features):

4. **`OPENAI_API_KEY`** (Optional)
   - **Value**: Your OpenAI API key (if you want GPT-4o support)
   - **Where to find**: [OpenAI Platform](https://platform.openai.com/api-keys)
   - **Environment**: Select all

5. **`ANTHROPIC_API_KEY`** (Optional)
   - **Value**: Your Anthropic API key (if you want Claude support)
   - **Where to find**: [Anthropic Console](https://console.anthropic.com/)
   - **Environment**: Select all

6. **`PAYMENT_PROVIDER_MODE`** (Optional)
   - **Value**: `mock` or `real`
   - **Default**: `mock` (for testing)
   - **Note**: Set to `real` only if you have payment provider integration set up
   - **Environment**: Select all

### 4.3 Save Environment Variables

After adding all variables, click **"Save"** or **"Deploy"** to proceed.

---

## Step 5: Deploy Your Application

### 5.1 Start Deployment

1. Review all your settings
2. Click **"Deploy"** button at the bottom of the page
3. Vercel will start building your application

### 5.2 Monitor Build Process

You'll see a build log showing:
- Installing dependencies
- Running build command
- Creating optimized production build
- Deploying to Vercel's edge network

**Build time**: Typically 2-5 minutes

### 5.3 Wait for Deployment to Complete

Once the build completes successfully, you'll see:
- ✅ **"Ready"** status
- Your deployment URL (e.g., `https://debate-master-xyz.vercel.app`)

---

## Step 6: Verify Deployment

### 6.1 Test Your Application

1. Click on the deployment URL to open your app
2. Test key functionality:
   - ✅ User registration/login
   - ✅ Creating a debate
   - ✅ AI debate functionality
   - ✅ Navigation between pages

### 6.2 Check for Errors

- Open browser console (F12) to check for client-side errors
- Check Vercel logs if something doesn't work:
  - Go to **"Deployments"** tab
  - Click on your deployment
  - Check **"Functions"** and **"Logs"** tabs

---

## Step 7: Configure Custom Domain (Optional)

### 7.1 Add Custom Domain

1. Go to your project settings
2. Navigate to **"Domains"** section
3. Enter your domain name (e.g., `debate-master.com`)
4. Follow Vercel's instructions to configure DNS records

### 7.2 SSL Certificate

Vercel automatically provisions SSL certificates for your domains (HTTPS).

---

## Step 8: Set Up Database (If Not Already Done)

### 8.1 Run Supabase Migrations

If you haven't already, you need to run the database migrations:

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Run the SQL from `supabase_migration.sql`:
   - This creates subscription fields and usage tracking tables
4. (Optional) Run `payment_migration.sql` if you're using payment features

### 8.2 Verify Database Setup

Check that your Supabase database has:
- ✅ `profiles` table with subscription fields
- ✅ `subscription_usage` table (if using subscription tracking)
- ✅ Proper Row Level Security (RLS) policies

---

## Step 9: Configure Supabase for Production

### 9.1 Update Supabase Redirect URLs

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add your Vercel deployment URL to **"Redirect URLs"**:
   - `https://your-app.vercel.app/**`
   - `https://your-custom-domain.com/**` (if using custom domain)
3. Add to **"Site URL"**: `https://your-app.vercel.app`

### 9.2 Update CORS Settings (if needed)

If you encounter CORS issues:
1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Add your Vercel domain to allowed origins

---

## Step 10: Enable Automatic Deployments

### 10.1 Automatic Deployments

Vercel automatically deploys when you push to your branch:
- **Production**: Deploys from `app-subscription` branch (or your configured production branch)
- **Preview**: Deploys from other branches and pull requests

### 10.2 Configure Branch Protection (Recommended)

1. Go to your project settings
2. Navigate to **"Git"** section
3. Configure which branches trigger deployments
4. Set up branch protection rules if needed

---

## Troubleshooting Common Issues

### Issue: Build Fails

**Possible causes:**
- Missing environment variables
- TypeScript errors
- Build command issues

**Solution:**
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Test build locally: `npm run build`

### Issue: "Module not found" Errors

**Solution:**
1. Ensure `package.json` has all dependencies
2. Check that `node_modules` is in `.gitignore` (it should be)
3. Vercel will run `npm install` automatically

### Issue: Environment Variables Not Working

**Solution:**
1. Verify variables are set for the correct environment (Production/Preview/Development)
2. Restart deployment after adding new variables
3. Remember: `NEXT_PUBLIC_*` variables are exposed to the browser

### Issue: Supabase Connection Errors

**Solution:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
2. Check Supabase project is active and not paused
3. Verify redirect URLs are configured in Supabase

### Issue: API Key Errors (Gemini/OpenAI/Anthropic)

**Solution:**
1. Verify API keys are valid and have credits/quota
2. Check API key permissions
3. For Gemini: Ensure API is enabled in Google Cloud Console

---

## Post-Deployment Checklist

- [ ] Application loads successfully
- [ ] User authentication works (sign up/login)
- [ ] Database connections work
- [ ] AI debate functionality works
- [ ] All pages are accessible
- [ ] Environment variables are set correctly
- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active (automatic with Vercel)
- [ ] Supabase redirect URLs are updated
- [ ] Database migrations are run
- [ ] Error monitoring is set up (optional: Vercel Analytics)

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Quick Reference: Environment Variables Summary

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSy...

# Optional (for Pro tier)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional (payment)
PAYMENT_PROVIDER_MODE=mock
```

---

## Need Help?

If you encounter issues:
1. Check Vercel build logs
2. Review browser console for client-side errors
3. Verify all environment variables are set
4. Check Supabase dashboard for database issues
5. Review the troubleshooting section above

---

**Congratulations!** 🎉 Your Debate Master app should now be live on Vercel!
