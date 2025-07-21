# Railway Deployment Checklist

## ✅ Issues Fixed

- [x] **Session Storage**: Replaced MemoryStore with PostgreSQL session store for production
- [x] **Port Configuration**: Fixed app to properly bind to Railway's PORT environment variable  
- [x] **Health Check**: Added `/health` endpoint for Railway monitoring
- [x] **Error Handling**: Added proper validation for required environment variables

## 🚀 Deployment Steps

### 1. Push Code to Repository
```bash
git add .
git commit -m "Fix Railway deployment issues - session storage and port binding"
git push origin main
```

### 2. Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"  
3. Connect your GitHub repository
4. Railway will auto-detect Node.js and start building

### 3. Add PostgreSQL Database
1. In Railway dashboard, click "Add Plugin"
2. Select "PostgreSQL" 
3. This automatically provides the `DATABASE_URL` environment variable

### 4. Set Environment Variables
Go to your app's **Variables** tab and add:

**Required:**
```
NODE_ENV=production
SESSION_SECRET=your-random-32-plus-character-secret
```

**Optional (for full functionality):**
```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=sk-your-openai-api-key
```

### 5. Deploy
Railway will automatically:
- Run `npm run build` (builds frontend + server)
- Run `npm start` (starts production server)
- Assign a public URL

## 🔍 Verification

After deployment, test these endpoints:
- `https://your-app.railway.app/health` - Should return `{"status":"ok"}`
- `https://your-app.railway.app/` - Should serve your frontend
- `https://your-app.railway.app/api/user` - Should return user data (demo user if not authenticated)

## ⚠️ Common Issues

**"Application failed to respond"**
- Check Railway logs for startup errors
- Verify environment variables are set correctly
- Ensure DATABASE_URL is accessible

**Session/Authentication Issues**  
- Verify SESSION_SECRET is set and at least 32 characters
- Check that PostgreSQL plugin is connected
- Review Railway logs for session table creation

**Build Failures**
- Check that all dependencies are in package.json
- Verify Node.js version compatibility
- Review build logs in Railway dashboard

## 📊 Monitoring

- **Health Check**: Railway pings `/health` every few minutes
- **Logs**: Available in Railway dashboard under "Deployments"
- **Metrics**: CPU, memory, and request metrics in Railway dashboard

## 🔄 Updates

For future deployments:
1. Push changes to your repository
2. Railway automatically deploys new commits
3. No need to manually restart or rebuild