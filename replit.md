# Estonian Tutor MVP

## Overview

The Estonian Tutor MVP is a comprehensive language learning web application specifically designed for intermediate Honduran Spanish speakers learning Estonian. The application combines modern web technologies with AI-powered tutoring to create an immersive, personalized learning experience. It features speech integration, adaptive CEFR-level assessment, interactive learning tools, and cultural context integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **API Pattern**: REST API with typed interfaces
- **Session Management**: In-memory storage with plans for database persistence

### Key Components

#### Database Schema
The application uses a comprehensive schema designed around language learning:

- **Users Table**: Stores user profiles with CEFR levels, progress metrics (words learned, accuracy, streak, total time)
- **Sessions Table**: Tracks learning sessions with type classification (chat, quiz, pronunciation, dialogue)
- **Messages Table**: Stores conversation history with language detection, corrections, and audio URLs
- **Quizzes Table**: Manages quiz questions, answers, and explanations with CEFR level tagging
- **Vocabulary Table**: Curated vocabulary database with CEFR levels and categories
- **User Progress Table**: Tracks detailed learning analytics and mistake patterns

#### AI Integration Services

**OpenAI Service**: 
- GPT-4 powered conversational tutor with specialized Estonian teaching persona
- Automatic CEFR level assessment based on user performance
- Dynamic quiz and dialogue generation
- Grammar correction and cultural context provision

**Speech Service**:
- Whisper API integration for Spanish speech-to-text transcription
- Azure Speech API for Estonian text-to-speech synthesis
- Real-time audio processing and playback management

#### CEFR Assessment System
- Dynamic difficulty adjustment based on performance metrics
- Comprehensive scoring including speed, accuracy, and complexity
- Automatic level progression recommendations
- Performance tracking with detailed analytics

### Data Flow

1. **User Input**: Speech or text input captured through React components
2. **Processing**: Server-side AI processing through OpenAI and Azure services
3. **Storage**: Session data, messages, and progress stored in PostgreSQL
4. **Response**: AI-generated responses with corrections, explanations, and audio
5. **State Management**: TanStack Query handles caching and synchronization
6. **UI Updates**: Real-time updates through optimistic updates and background refetching

### External Dependencies

#### Core Services
- **OpenAI API**: GPT-4 for tutoring and Whisper for speech recognition
- **Azure Speech Services**: Text-to-speech for Estonian pronunciation
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations

#### Development Tools
- **TypeScript**: End-to-end type safety
- **Vite**: Development server and build tool
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built accessible components

### Deployment Strategy

#### Development Environment
- Vite development server with HMR
- Drizzle development with schema migrations
- Environment variable configuration for API keys
- Replit integration with development banners and runtime error handling

#### Production Build
- Vite builds frontend to `dist/public`
- esbuild bundles backend Node.js application
- Database migrations through Drizzle push commands
- Environment-based configuration management

#### Architecture Decisions

**Monolithic Structure**: Chosen for simplicity in development and deployment, with clear separation between client and server code through folder structure.

**Type-Safe Database**: Drizzle ORM provides compile-time type safety while maintaining SQL flexibility, crucial for the complex learning analytics schema.

**React Query for State**: Eliminates the need for complex state management while providing excellent caching and synchronization for the chat and progress tracking features.

**Component-Based UI**: shadcn/ui provides accessible, customizable components that maintain consistency across the learning interface.

**AI-First Approach**: OpenAI integration is central to the tutoring experience, with fallback handling and cost optimization through caching and session management.

**Mobile-First Design**: Responsive design prioritizes mobile usage patterns common in language learning apps.

The architecture balances development simplicity with the complex requirements of personalized language tutoring, emphasizing type safety, performance, and user experience.