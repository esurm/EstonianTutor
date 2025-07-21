# Railway Deployment Guide

## Issues Fixed

### 1. Session Storage Issue
- **Problem**: Using MemoryStore in production (not scalable, causes memory leaks)
- **Solution**: Configured `connect-pg-simple` to use PostgreSQL for session storage in production

### 2. Port Configuration Issue  
- **Problem**: App defaulting to port 5000, Railway expects dynamic PORT environment variable
- **Solution**: Changed default port to 8080 and simplified server.listen() call

## Required Environment Variables

Set these in your Railway project dashboard:

```bash
# Database (Railway PostgreSQL plugin will provide this automatically)
DATABASE_URL=postgresql://user:password@host:port/database

# Session Security (generate a random 32+ character string)
SESSION_SECRET=your-random-session-secret-at-least-32-characters-long

# Production environment
NODE_ENV=production

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional: OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key
```

## Deployment Steps

1. **Push your code** to GitHub/GitLab repository

2. **Create Railway project**:
   - Connect your repository to Railway
   - Railway will automatically detect Node.js and use the build/start commands from package.json

3. **Add PostgreSQL database**:
   - In Railway dashboard, click "Add Plugin" → "PostgreSQL"
   - This automatically provides the DATABASE_URL environment variable

4. **Set environment variables**:
   - Go to your app's Variables tab in Railway
   - Add all required environment variables listed above

5. **Deploy**:
   - Railway will automatically build and deploy
   - Build command: `npm run build` (builds Vite frontend + bundles server)
   - Start command: `npm start` (runs the production server)

## Health Check

The app now includes a health check endpoint at `/health` that Railway can use to verify the app is running.

## Session Management

- **Development**: Uses in-memory session store (MemoryStore)
- **Production**: Uses PostgreSQL session store (scales properly, persistent across restarts)

## Troubleshooting

### App fails to start
- Check that DATABASE_URL is properly set
- Ensure SESSION_SECRET is at least 32 characters
- Check Railway logs for specific error messages

### "Application failed to respond" 
- Verify the app is binding to `0.0.0.0:$PORT` (fixed in server/index.ts)
- Check that Railway assigned the correct PORT environment variable
- Test the health check endpoint: `https://your-app.railway.app/health`

### Session issues
- Verify DATABASE_URL is accessible
- Check that the session table was created automatically
- Ensure SESSION_SECRET is consistent across deployments