# Vault

A structured idea bank and execution tool for builders who want to ship more.

## What is Vault?

Vault helps you transform scattered ideas into shipped products through a structured workflow:

1. **Capture** - Jot down raw ideas in the Inbox
2. **Structure** - Use AI to fill in problem, solution, and MVP details
3. **Evaluate** - Score ideas on difficulty, priority, and sprint fit
4. **Focus** - Commit to ONE idea at a time (building slot)
5. **Ship** - Track progress through lifecycle stages

## Quick Start

### Prerequisites
- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm or bun

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

### Edge Functions
Located in `supabase/functions/`:
- `autofill-idea` - AI-powered field generation (needs AI provider)
- `score-idea` - AI-powered idea evaluation (needs AI provider)
- `validate-status-change` - Lifecycle transition rules

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

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **State**: TanStack Query, React Router DOM
- **Animations**: Framer Motion

## Current Limitations

- **AI features are stubbed** - Autofill and scoring show "Coming soon"
- **Inbox is local-only** - Thoughts stored in localStorage
- **Profile is read-only** - Can't update display name or avatar
- **No password reset** - Account recovery not implemented
- **Web only** - No native mobile app yet

## Project Structure

```
src/
├── pages/           # Route components
├── components/      # Reusable UI
│   ├── layout/      # App shell, navigation
│   └── ui/          # shadcn/ui primitives
├── hooks/           # Custom React hooks
├── integrations/    # Supabase client
└── lib/             # Utilities

supabase/
├── migrations/      # Database schema
└── functions/       # Edge functions
```

## Documentation

- [PRD.md](PRD.md) - Product requirements and feature scope
- [claude.md](claude.md) - Claude Code working instructions

## Contributing

This project uses feature-by-feature development. See [claude.md](claude.md) for workflow guidelines.
