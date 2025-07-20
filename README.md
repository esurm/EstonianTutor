# Estonian Tutor MVP

An adaptive Estonian language learning platform designed specifically for Honduran Spanish speakers, featuring AI-powered tutoring and real-time progress tracking.

## Features

- **AI-Powered Tutoring**: GPT-4 conversations in Estonian with corrections and explanations
- **Speech Integration**: Azure TTS for Estonian pronunciation and Whisper for Spanish speech recognition
- **CEFR Level Assessment**: Automatic difficulty adjustment based on performance
- **Interactive Learning Tools**: Quizzes, dialogues, and pronunciation practice
- **Real-time Progress Tracking**: Persistent user progress with Supabase database
- **Google Authentication**: Secure login and progress saving

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Passport.js + Google OAuth
- **AI Services**: OpenAI GPT-4 + Whisper + Azure Speech

## Environment Variables

Create a `.env` file with:

```
DATABASE_URL=your_supabase_connection_string
OPENAI_API_KEY=your_openai_api_key
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_azure_region
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
```

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Push database schema: `npm run db:push`
5. Start development server: `npm run dev`

## Deployment

This app can be deployed to:
- **Vercel** (recommended for frontend + serverless backend)
- **Railway** (full-stack deployment)
- **Render** (free tier available)
- **Heroku** (with add-ons)

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your connection string from Project Settings → Database
3. Run `npm run db:push` to create tables

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project and enable Google+ API
3. Create OAuth 2.0 credentials
4. Set authorized redirect URI: `https://yourdomain.com/auth/google/callback`

## License

MIT