# Deployment Guide - Estonian Tutor MVP

## 🚀 Free Hosting Options (Recommended for MVP)

### Option 1: Railway (Recommended) 
**Cost**: Free tier with $5/month when you need more resources

**Steps**:
1. Push your code to GitHub (instructions below)
2. Go to [railway.app](https://railway.app)
3. Sign up with GitHub
4. Click "Deploy from GitHub repo"
5. Select your repository
6. Railway will auto-detect Node.js and deploy
7. Add environment variables in Railway dashboard
8. Get your domain: `your-app-name.up.railway.app`

**Why Railway**: Easy deployment, includes PostgreSQL addon, automatic SSL

---

### Option 2: Render 
**Cost**: Free tier (apps sleep after 15 min inactivity)

**Steps**:
1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create "Web Service" from GitHub repo
4. Build command: `npm run build`
5. Start command: `npm start`
6. Add environment variables
7. Get domain: `your-app-name.onrender.com`

---

### Option 3: Vercel + Serverless
**Cost**: Free tier, very generous limits

**Steps**:
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. Follow prompts to deploy
4. Add environment variables in Vercel dashboard
5. Get domain: `your-app-name.vercel.app`

**Note**: Requires converting Express routes to serverless functions

---

## 🗂️ GitHub Setup

1. **Create GitHub Repository**:
   ```bash
   # Go to github.com and create new repository
   # Copy the remote URL, then:
   
   git remote add origin https://github.com/yourusername/estonian-tutor-mvp.git
   git branch -M main
   git push -u origin main
   ```

2. **Update Repository URL**:
   - Edit README.md with your actual GitHub URL
   - Update package.json repository field

---

## 🔧 Environment Variables Setup

Add these to your hosting platform:

```
DATABASE_URL=postgresql://user:pass@host:port/db
OPENAI_API_KEY=sk-...
AZURE_SPEECH_KEY=your_key
AZURE_SPEECH_REGION=eastus
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_random_32char_string
NODE_ENV=production
```

---

## 🗄️ Database Setup (Supabase)

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Go to Settings → Database
   - Copy "Connection string" (URI format)
   - Replace `[YOUR-PASSWORD]` with your database password

2. **Deploy Schema**:
   ```bash
   npm run db:push
   ```

---

## 🔐 Google OAuth Setup

1. **Google Cloud Console**:
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable "Google+ API"

2. **Create OAuth Credentials**:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: `https://yourdomain.com/auth/google/callback`
   - Copy Client ID and Client Secret

3. **Update Redirect URI** after deployment:
   - Replace `yourdomain.com` with your actual deployed domain

---

## 📋 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Hosting platform connected to GitHub
- [ ] Environment variables added
- [ ] Database schema deployed (`npm run db:push`)
- [ ] Google OAuth configured with correct redirect URI
- [ ] App tested on production domain

---

## 🎯 Quick Start (Railway - Easiest)

1. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/yourusername/repo-name.git
   git push -u origin main
   ```

2. **Deploy on Railway**:
   - Visit [railway.app](https://railway.app)
   - "Deploy from GitHub repo"
   - Add environment variables
   - Your app will be live at `*.up.railway.app`

3. **Configure Google OAuth**:
   - Update redirect URI to: `https://your-app.up.railway.app/auth/google/callback`

**Total time**: ~10 minutes
**Monthly cost**: $0 (free tier) or $5 when you outgrow it

---

## 🆘 Troubleshooting

**App won't start**:
- Check environment variables are set correctly
- Verify DATABASE_URL format
- Check build logs in hosting platform

**Google OAuth fails**:
- Verify redirect URI matches exactly
- Check GOOGLE_CLIENT_ID and SECRET are correct
- Ensure Google+ API is enabled

**Database connection fails**:
- Test DATABASE_URL format
- Run `npm run db:push` to ensure schema exists
- Check Supabase project is active