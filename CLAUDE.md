# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Main Development
npm run dev                    # Start Next.js development server
npm run build                  # Build for production (includes post-build script)
npm run start                  # Start production server via start.js
npm run lint                   # Run Next.js linter
npm run clean                  # Remove .next, out, and data/app.db
npm run reset                  # Clean and restart development

# Backend Admin Panel (separate Express server)
cd backend && npm run dev      # Start Express backend with nodemon
cd backend && npm run start    # Start backend in production
cd backend && npm test         # Run Jest tests

# Database
npx prisma db push            # Push schema changes to database
npx prisma studio             # Open Prisma Studio database browser
node prisma/seed.js           # Seed database with initial data
```

## Environment Setup

Critical environment variables in `.env.local`:

```bash
# Database Architecture (dual system)
DATABASE_URL=postgres://...      # PostgreSQL primary (production)
# SQLite fallback automatic if PostgreSQL unavailable

# Authentication (dual approach)
JWT_SECRET=reputacion-online-secret-key-2025
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# AI Services (Sofia AI assistant)
OPENAI_API_KEY=sk-...           # Primary AI service
DEEPSEEK_API_KEY=sk-...         # Fallback AI service

# Social Media OAuth (7 platforms)
FACEBOOK_CLIENT_ID=...
TWITTER_CLIENT_ID=...
GOOGLE_CLIENT_ID=...
LINKEDIN_CLIENT_ID=...
INSTAGRAM_CLIENT_ID=...
YOUTUBE_CLIENT_ID=...
THREADS_CLIENT_ID=...
```

## Architecture Overview

### Dual Database System
The platform uses a sophisticated dual database approach with automatic failover:
- **Primary**: PostgreSQL with custom service layer (`/src/lib/database.ts`)
- **Fallback**: SQLite with Prisma ORM (`/src/lib/prisma.ts`)
- **Service Layer**: Unified interface through `userService`, `socialMediaService`, `statsService`
- **Auto-initialization**: Scripts in `/scripts/` handle both database setups

### Authentication Architecture
Two parallel authentication systems working together:
- **Custom JWT**: HTTP-only cookies, 7-day expiration, route protection via `/src/middleware.ts`
- **NextAuth.js**: OAuth integration for social media platforms with automatic token storage
- **Database Integration**: OAuth tokens stored in `social_media` table with refresh capabilities
- **Role-based Access**: Admin/user permissions with protected routes

### AI Service Integration - "Sofia AI"
Specialized AI assistant for reputation management:
- **Service Layer**: `/src/lib/ai-service.ts` with automatic failover
- **Primary**: OpenAI GPT-3.5-turbo optimized for reputation analysis
- **Fallback**: DeepSeek R1 model with identical interface
- **Capabilities**: Sentiment analysis, person search, political metrics, content generation
- **Character Consistency**: Sofia maintains reputation expert personality across interactions

### Social Media Integration
Multi-platform OAuth system with comprehensive token management:
- **7 Platforms**: Facebook, X/Twitter, LinkedIn, Instagram, YouTube, Threads, TikTok
- **OAuth Manager**: `/src/lib/oauth/manager.ts` handles all platform interactions
- **Token Storage**: Automatic storage and refresh via NextAuth callbacks
- **Fallback Data**: Realistic simulated data when APIs unavailable
- **Connection States**: Real-time tracking of connected/disconnected platforms

### API Architecture (Next.js App Router)
Modular API structure with specialized endpoints:
```
/api/
├── auth/[platform]/          # OAuth handlers for each social platform
├── dashboard-analytics/      # AI-enhanced analytics data
├── social-media/            # Platform connection management
├── sofia/                   # AI assistant endpoint
├── admin/                   # Admin panel operations
└── system/status/           # Health checks and system monitoring
```

### Frontend Architecture
Feature-based component organization with advanced animations:
- **Components**: Organized by feature in `/src/components/`
- **Global State**: User, Credits, Plan contexts with React Context
- **Animations**: GSAP and Framer Motion for Sofia AI interactions
- **UI System**: Custom components based on Radix UI with Tailwind CSS

## Key Implementation Details

### Database Service Usage
Always use the unified service layer for database operations:
```typescript
// Import the service layer
import { userService, socialMediaService, statsService } from '@/lib/database';

// These services automatically handle PostgreSQL/SQLite fallback
const user = await userService.findById(userId);
const platforms = await socialMediaService.getConnectedPlatforms(userId);
```

### AI Service Integration
The AI service provides automatic fallback between OpenAI and DeepSeek:
```typescript
// Sofia AI maintains consistent character across interactions
const response = await aiService.generateResponse(prompt, 'sofia');
// Automatically handles API failures and switches providers
```

### OAuth Implementation Pattern
Each social platform follows the same pattern:
1. OAuth initiation: `/api/auth/[platform]/route.ts`
2. Callback handling: `/api/auth/[platform]/callback/route.ts`
3. Token storage: Automatic via NextAuth callbacks
4. Platform integration: `/src/lib/oauth/[platform].ts`

### Real-time Analytics System
Dashboard endpoints generate AI-enhanced realistic data:
- **Colombian Media**: Prioritized sources in `/src/lib/realNewsAPI.ts`
- **Sentiment Analysis**: Combined AI and keyword-based approaches
- **Political Metrics**: Specialized analysis for political figures
- **Live Updates**: Polling-based real-time data updates

## Development Workflow

### Database Development
- Use `npm run dev` to start with auto-initialization
- PostgreSQL primary, SQLite fallback automatic
- Run `/scripts/init-database.js` for fresh setup
- Use Prisma Studio for database inspection

### AI Service Development
- Test with both OpenAI and DeepSeek API keys
- Sofia AI responses should maintain character consistency
- Fallback to keyword-based analysis if both AI services fail

### Social Media Integration Testing
- Most OAuth providers require valid credentials
- Use simulated data endpoints when OAuth not configured
- Check connection status in dashboard for platform availability

### Frontend Development
- Components organized by feature, not by type
- Use existing context providers for global state
- Follow Radix UI + Tailwind CSS patterns
- Test animations with GSAP and Framer Motion

## Production Deployment

Deployment-ready configuration:
- **Docker**: Multi-stage build with standalone Next.js
- **Environment Detection**: Automatic via `start.js`
- **Database Migration**: Auto-initialization for both PostgreSQL and SQLite
- **Health Checks**: System status monitoring via `/api/system/status`
- **Graceful Shutdown**: Proper cleanup of database connections

## Security Implementation

The platform implements multiple security layers:
- **Parameterized Queries**: All database queries use parameterized statements
- **JWT Security**: HTTP-only cookies with secure configuration
- **CSRF Protection**: OAuth state parameters prevent attacks
- **Role-based Access**: Admin routes protected with middleware
- **Token Management**: Automatic refresh and validation for OAuth tokens

## Testing and Quality Assurance

### Main Application Testing
```bash
npm run lint                  # Run Next.js linter for code quality
npm run build                 # Build application (includes type checking)
npm run start                 # Test production build locally
```

### Backend Testing
```bash
cd backend && npm test        # Run Jest test suite for backend
cd backend && npm run dev     # Start backend with auto-reload for testing
```

### Database Testing and Debugging
```bash
npx prisma studio            # Visual database browser for both SQLite and PostgreSQL
node scripts/test-user-service.js        # Test database service layer
node scripts/verify-postgres-connection.js  # Verify PostgreSQL connectivity
```

## Critical Development Patterns

### Environment Variable Handling
The application uses automatic environment detection in `start.js`:
- **Development**: Minimal `.env.local` with `JWT_SECRET` only
- **Production**: Auto-detection of hosting platform (Vercel, Railway, Coolify)
- **Database**: Automatic PostgreSQL primary with SQLite fallback

### Database Connection Pattern
Always use the service layer pattern for database operations:
```typescript
import { userService, socialMediaService, statsService } from '@/lib/database';
// These services handle both PostgreSQL and SQLite automatically
```

### Component Development Guidelines
- Feature-based organization in `/src/components/[feature]/`
- Always use existing UI components from `/src/components/ui/`
- Follow Radix UI patterns for accessibility
- Use Tailwind CSS classes consistently with existing patterns

## Node.js Version Requirements

The project requires Node.js >= 20.0.0 and npm >= 9.0.0 as specified in package.json engines.

## Additional Database Scripts

When working with database issues, these diagnostic scripts are available:
```bash
node scripts/diagnose-postgres.js       # Comprehensive PostgreSQL diagnostics
node scripts/verify-postgres-connection.js  # Test PostgreSQL connectivity
node scripts/test-passwords.js          # Test password extraction and validation
node scripts/migrate-sqlite-to-postgres.js  # Migrate data between databases
```

## Environment Detection and Deployment

The `start.js` script provides automatic environment detection for:
- **Coolify**: Uses COOLIFY_FQDN for NEXTAUTH_URL
- **Vercel**: Uses VERCEL_URL for NEXTAUTH_URL  
- **Railway**: Uses RAILWAY_STATIC_URL for NEXTAUTH_URL
- **Local**: Defaults to http://localhost:3000

## TypeScript Configuration

The project uses TypeScript with strict configuration. Key TypeScript files:
- `next-env.d.ts`: Next.js type definitions
- `src/types/next-auth.d.ts`: NextAuth type extensions
- `tsconfig.json`: TypeScript configuration with strict mode enabled

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.