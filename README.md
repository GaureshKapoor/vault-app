# Vault

A structured idea bank and execution tool for builders who want to ship more.

## What is Vault?

Vault helps you transform scattered ideas into shipped products through a structured workflow:

1. **Capture** - Jot down raw ideas in the Inbox
2. **Structure** - Use AI to fill in problem, solution, and MVP details
3. **Evaluate** - Score ideas on difficulty, priority, and sprint fit
4. **Focus** - Commit to ONE idea at a time (building slot)
5. **Ship** - Track progress through lifecycle stages

## Project Structure

```
vault-app/
├── apps/
│   ├── web/                 # Vite + React web app
│   │   ├── src/
│   │   ├── public/
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   ├── ios-expo/            # Expo + React Native
│   │   ├── src/screens/
│   │   ├── assets/
│   │   ├── app.config.js
│   │   ├── metro.config.js
│   │   └── package.json
│   │
│   └── ios-capacitor/       # Capacitor (web wrapped in native shell)
│       ├── ios/             # Xcode project
│       └── capacitor.config.ts
│
├── shared/                  # Shared code
│   ├── hooks/
│   ├── lib/
│   └── constants/
│
├── supabase/                # Backend
│   ├── functions/           # Edge functions
│   └── migrations/          # Database schema
│
├── plans/                   # Feature plans
├── .env                     # Environment variables
├── package.json             # Workspace root
└── vercel.json              # Deployment root

```

## Platforms

| Platform | Tech | Status |
|----------|------|--------|
| Web | Vite + React | Active |
| iOS (Expo) | Expo + React Native | In Development |
| iOS (Capacitor) | Web wrapped in native shell | Available |

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- Xcode (for iOS development)

### Installation

```bash
# Clone and install
git clone <your-repo-url>
cd vault-app
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start web development
npm run web:dev
```

Web app available at `http://localhost:8080`

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run web:dev` | Start web dev server |
| `npm run web:build` | Build web for production |
| `npm run web:preview` | Preview production build |
| `npm run web:lint` | Lint web code |
| `npm run expo:start` | Start Expo dev server |
| `npm run expo:ios` | Run Expo on iOS simulator |
| `npm run capacitor:sync` | Sync web build to Capacitor |
| `npm run capacitor:open` | Open Xcode project |

### iOS Development

**Expo (React Native):**
```bash
npm run expo:start
# Scan QR code with Expo Go app, or press 'i' for simulator
```

**Capacitor (Web wrapper):**
```bash
npm run web:build
npm run capacitor:sync
npm run capacitor:open
# Build and run from Xcode
```

### Environment Variables

```env
# Web (Vite)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

# iOS (Expo)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Features (Edge Functions)
OPENROUTER_API_KEY=your-openrouter-key
```

## Tech Stack

### Frontend (Web)
- React 18, Vite 5, TypeScript 5
- Tailwind CSS, shadcn/ui
- Framer Motion, TanStack Query
- React Router DOM

### Frontend (iOS - Expo)
- Expo SDK 54, React Native 0.81
- React Navigation
- Lucide React Native icons

### Frontend (iOS - Capacitor)
- Same as web, wrapped in native shell
- Capacitor 8 for native APIs

### Backend
- Supabase (PostgreSQL, Auth, Edge Functions)
- OpenRouter (AI provider)

## Features

### Working
- Email/password + Google OAuth authentication
- Password reset via email
- AI Autofill, Scoring, Chat, Idea Generator, Name Suggestion, Pitch Drafting
- Profile editing with avatar picker
- Idea CRUD with 6-state lifecycle
- One-building-at-a-time enforcement
- Dark/light theme
- Responsive mobile layout

### Stubbed
- Payments (Stripe exists, checkout skipped)
- Feed/community features

## Supabase Setup

### Edge Functions (10 deployed)
Located in `supabase/functions/`:
- `autofill-idea` - AI generates idea fields
- `score-idea` - AI scores idea 0-10
- `ai-chat` - Conversational AI assistant
- `suggest-name` - AI suggests project names
- `draft-pitch` - AI drafts descriptions
- `generate-idea` - AI generates complete ideas
- `create-checkout-session` - Stripe checkout (stubbed)
- `delete-user` - Account deletion
- `validate-status-change` - Lifecycle rules
- `_shared/ai-client` - Reusable OpenRouter client

### Edge Function Authentication
All Edge Functions use manual JWT validation. If AI features return 401 errors, sign out and sign back in to get a fresh token.

## Idea Lifecycle

```
idea → shortlisted → building → shipped
         ↓              ↓
       paused        paused
         ↓              ↓
       archived      archived
```

**Key constraint**: Only ONE idea can be "building" at a time.

## Documentation

- [PRD.md](PRD.md) - Product requirements
- [.claude/CLAUDE.md](.claude/CLAUDE.md) - Development workflow
