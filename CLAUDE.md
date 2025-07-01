# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Run Next.js linter
npm run clean                  # Remove .next, out, and data/app.db
npm run reset                  # Clean and restart development

# Backend (if needed)
cd backend && npm run dev      # Start Express backend server
cd backend && npm run start    # Start backend in production
```

## Environment Setup

The project requires these environment variables in `.env.local`:

```bash
# Database (PostgreSQL primary, SQLite fallback)
DATABASE_URL=postgres://...

# Authentication (required)
JWT_SECRET=reputacion-online-secret-key-2025
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# AI Services (optional but recommended)
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...

# OAuth Providers (optional for social media integration)
FACEBOOK_CLIENT_ID=...
TWITTER_CLIENT_ID=...
GOOGLE_CLIENT_ID=...
LINKEDIN_CLIENT_ID=...
```

## Architecture Overview

### Dual Database System
- **Primary**: PostgreSQL with custom service layer (`/src/lib/database.ts`)
- **Fallback**: SQLite with Prisma ORM (`/src/lib/prisma.ts`)
- **Schema**: Prisma schema supports both databases with unified models

### Authentication Architecture
- **JWT-based**: Custom JWT implementation for API routes
- **NextAuth.js**: OAuth integration for social media platforms
- **Middleware**: Route protection in `/src/middleware.ts`
- **Dual approach**: JWT cookies for internal auth, NextAuth for OAuth

### AI Service Integration
- **Sofia AI**: Custom AI assistant specializing in reputation analysis
- **Service Layer**: `/src/lib/ai-service.ts` with OpenAI primary, DeepSeek fallback
- **Endpoints**: Multiple AI-powered analytics endpoints in `/src/app/api/`

### API Structure
- **App Router**: Next.js 13+ with route handlers in `/src/app/api/`
- **Modular**: Separate route groups for auth, dashboard, admin, social media
- **Real-time**: Live analytics with AI-generated realistic data
- **OAuth Callbacks**: Individual callback handlers for each social platform

### Social Media Integration
- **Multi-platform**: Facebook, X/Twitter, LinkedIn, Instagram, YouTube, Threads, TikTok
- **Token Management**: OAuth tokens stored in database with refresh capabilities
- **Fallback Data**: Realistic simulated data when APIs unavailable
- **Connection States**: Tracks connected/disconnected status per platform

### Frontend Architecture
- **Component Structure**: Feature-based organization in `/src/components/`
- **Context Providers**: User, Credits, and Plan contexts for global state
- **Animations**: GSAP and Framer Motion for AI assistant animations
- **UI Library**: Custom components based on Radix UI with Tailwind CSS

## Key Implementation Details

### Database Services
- Use `userService`, `socialMediaService`, `statsService` from `/src/lib/database.ts`
- PostgreSQL queries use parameterized queries with proper error handling
- Auto-initialization scripts in `/scripts/` directory

### AI Service Usage
- Always check for both OpenAI and DeepSeek API keys
- Sofia AI responses should maintain character consistency (reputation expert)
- Fallback to keyword-based analysis if both AI services fail

### OAuth Implementation
- Each platform has dedicated route handlers in `/src/app/api/auth/[platform]/`
- Tokens automatically stored in `social_media` table via NextAuth callbacks
- Platform-specific scopes defined in `/src/lib/auth.ts`

### Real-time Analytics
- Dashboard endpoints generate realistic data with AI enhancement
- Colombian media sources prioritized in `/src/lib/realNewsAPI.ts`
- Sentiment analysis combines AI and keyword-based approaches

## Security Considerations

- JWT tokens use secure HTTP-only cookies
- Database queries use parameterized statements
- OAuth state parameters prevent CSRF attacks
- Admin routes protected with role-based access control

## Testing Social Media Integration

Most OAuth providers require valid credentials. For development:
1. Use simulated data endpoints when OAuth not configured
2. Check connection status in dashboard to see which platforms are active
3. Social media data automatically falls back to realistic mock data

## Production Deployment

The project includes:
- Docker configuration with standalone Next.js build
- Automatic environment detection in `start.js`
- Database initialization scripts for both PostgreSQL and SQLite
- Health checks and graceful shutdown handling