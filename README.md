# Vault

A structured idea bank and execution tool for builders who want to ship more.

## What is Vault?

Vault helps you transform scattered ideas into shipped products through a structured workflow:

1. **Capture** - Jot down raw ideas in the Inbox
2. **Structure** - Use AI to fill in problem, solution, and MVP details
3. **Evaluate** - Score ideas on difficulty, priority, and sprint fit
4. **Focus** - Commit to ONE idea at a time (building slot)
5. **Ship** - Track progress through lifecycle stages

## Platforms

| Platform | Status | Landing Page |
|----------|--------|--------------|
| Web (Desktop/Tablet) | Active | Full |
| Web (Mobile browser) | Active | Full |
| iOS App | In Development | Minimal hero |

## Quick Start

### Prerequisites
- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm or bun
- Xcode (for iOS development)
- CocoaPods (for iOS development)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd vault-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### iOS Development

```bash
# Build web assets
npm run build

# Sync to iOS project
npx cap sync ios

# Open in Xcode
npx cap open ios

# Or run in simulator directly
npx cap run ios
```

### Environment Variables

```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_URL=https://your-project.supabase.co
```

## Supabase Setup

Vault uses Supabase for authentication, database, and edge functions.

### Database Tables
- **profiles** - User settings and subscription info
- **ideas** - Core idea data with AI scoring fields
- **idea_notes** - Notes attached to ideas

### Migrations
Apply migrations in order from `supabase/migrations/`:
1. Base schema (tables, RLS, triggers)
2. Subscription fields
3. Template ideas
4. Sort order

### Edge Functions (9 deployed)
Located in `supabase/functions/`:
- `autofill-idea` - AI generates idea fields from title/category
- `score-idea` - AI scores idea 0-10 with reasoning
- `ai-chat` - Conversational AI assistant
- `suggest-name` - AI suggests project names
- `draft-pitch` - AI drafts 1-liner descriptions
- `create-checkout-session` - Stripe checkout (stubbed)
- `delete-user` - Complete account deletion
- `validate-status-change` - Lifecycle transition rules
- `_shared/ai-client` - Reusable OpenRouter client

### Edge Function Authentication
All Edge Functions use manual JWT validation (not `verify_jwt = true` config which has issues). Each function:
1. Checks for `Authorization` header
2. Creates an authenticated Supabase client with that header
3. Calls `supabase.auth.getUser()` to validate the token

If AI features return 401 errors, **sign out and sign back in** to get a fresh JWT token. See [CLAUDE.md](.claude/CLAUDE.md) for the full auth pattern.

## Using Vault

### Core Workflow

1. **Sign up** with email/password
2. **Complete onboarding** (7 steps)
3. **Capture ideas** in the Inbox (quick thoughts)
4. **Create structured ideas** with full details
5. **Evaluate** using difficulty, priority, sprint fit
6. **Move to "building"** when ready to commit
7. **Track progress** through shipped

### Idea Lifecycle

```
idea → shortlisted → building → shipped
         ↓              ↓
       paused        paused
         ↓              ↓
       archived      archived
```

**Key constraint**: Only ONE idea can be "building" at a time.

### Idea Fields
- **Title** - Short name
- **Category** - Type of idea (App, Tool, Service, etc.)
- **Core Problem** - What problem does this solve?
- **Value Proposition** - What's unique about your solution?
- **Core Loop** - What's the main user action?
- **MVP Shape** - What's the minimum to launch?
- **Target User** - Who is this for?

## Tech Stack

### Frontend
- React 18.3, Vite 5.4, TypeScript 5.8
- Tailwind CSS 3.4, shadcn/ui (50+ components)
- Framer Motion 12.23 (animations)
- TanStack Query 5.83 (data fetching)
- React Router DOM 6.30 (routing)

### Backend
- Supabase (PostgreSQL, Auth, Edge Functions)
- OpenRouter (AI provider - model agnostic)

### Mobile
- Capacitor 8.0 (iOS wrapper)

## Features

### Working
- Email/password + Google OAuth authentication
- Password reset via email
- AI Autofill (generates idea fields from title/category)
- AI Scoring (0-10 score with reasoning)
- AI Chat Assistant (context-aware with user's ideas)
- Profile editing with avatar picker
- Idea CRUD with 6-state lifecycle
- Dark/light theme

### Stubbed
- Payments (Stripe exists, checkout skipped - all users free tier)
- Feed/community features
- Export functionality

## Current Limitations

- **Inbox is local-only** - Thoughts stored in localStorage
- **No email verification** - Auto-confirm enabled
- **Notes are append-only** - Can't edit or delete
- **Payments stubbed** - All users get free tier

## Project Structure

```
vault-app/
├── src/
│   ├── pages/           # Route components
│   │   ├── WebLanding.tsx   # Full landing (web)
│   │   ├── IOSLanding.tsx   # Minimal landing (iOS app)
│   │   └── ...
│   ├── components/      # Reusable UI
│   │   ├── layout/      # App shell, navigation
│   │   └── ui/          # shadcn/ui primitives
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # Supabase client
│   └── lib/             # Utilities
│       └── platform.ts  # Platform detection (isIOSApp, isWebBrowser)
├── ios/                 # Capacitor iOS project (Xcode)
├── supabase/
│   ├── migrations/      # Database schema
│   └── functions/       # Edge functions
├── plans/               # Feature implementation plans
└── capacitor.config.ts  # iOS app configuration
```

## Documentation

- [PRD.md](PRD.md) - Product requirements and feature scope
- [plans/web-vs-ios.md](plans/web-vs-ios.md) - Platform strategy
- [.claude/CLAUDE.md](.claude/CLAUDE.md) - Claude Code working instructions

## Contributing

This project uses feature-by-feature development. See [.claude/CLAUDE.md](.claude/CLAUDE.md) for workflow guidelines.
