# Vault - Product Requirements Document

## Product Vision

Vault is a structured idea bank and execution tool for builders, founders, and creators who want to transform scattered thoughts into shipped products.

### Core Loop
```
Raw Ideas → Structured Fields → Evaluation → Ranking → Lifecycle → Shipped
```

### Target Users
- Indie hackers with too many ideas
- Founders validating concepts
- Developers with side project backlogs
- Creators who capture ideas everywhere but build nothing

### Value Proposition
- **Capture**: Jot down raw ideas without friction
- **Structure**: AI helps fill in the blanks (problem, solution, MVP shape)
- **Evaluate**: Score ideas on difficulty, priority, and sprint fit
- **Focus**: One "building" slot forces commitment
- **Ship**: Track progress through lifecycle stages

---

## Platform Strategy

### Current Platforms
| Platform | Technology | Landing Page | Status |
|----------|------------|--------------|--------|
| Web (Desktop/Tablet) | React + Vite | Full landing page | Active |
| Web (Mobile browser) | React + Vite | Full landing page | Active |
| iOS App | Capacitor (WebView) | Minimal hero only | In Development |

### Future Considerations
- **Android App**: Can be added via Capacitor when needed
- **Expo Migration**: If native performance becomes critical, evaluate after 3 months of user feedback

---

## Payment Strategy

| Platform | Provider | Status |
|----------|----------|--------|
| Web (browser) | Stripe | Stubbed - all users get free tier |
| iOS App | Apple IAP | Future - after App Store approval |

Current behavior: Pricing page exists, Stripe checkout stubbed. All users receive free tier with active subscription status.

---

## Feature Scope

### Implemented & Working

#### Authentication
- Email/password signup and login
- Google OAuth integration
- Password reset via email
- Auto-confirm enabled (no email verification required)
- Session persistence via localStorage
- Protected routes redirect to /auth if not logged in
- Three-tier check: authenticated → has subscription → completed onboarding

#### AI Features (via OpenRouter)
- **AI Autofill**: Generates problem, value prop, loop, MVP, target user from title + category
- **AI Scoring**: Returns 0-10 score with reasoning, suggests difficulty/priority/sprint fit
- **AI Chat Assistant**: Conversational AI with context from user's ideas (top 20 non-archived)
- **AI Provider**: OpenRouter (model-agnostic, currently using LLaMA 3.2, configurable via env)

#### Idea Management
- **Create**: Title, category, description, core fields (problem, value prop, loop, MVP, target user)
- **Read**: List view on Home, detail view on /idea/:id
- **Update**: All fields editable in detail view
- **Archive**: Soft delete (status = "archived"), can be restored

#### Idea Lifecycle
Six states with controlled transitions (can be archived anytime):
```
idea → shortlisted → building → shipped
         ↓              ↓
       paused        paused
         ↓              ↓
       archived      archived
```

**Constraint**: Only ONE idea can be "building" at a time per user (enforced at database level)

#### Idea Evaluation
- Difficulty (1-5 scale)
- Priority (1-5 scale)
- Sprint Fit (1-5 scale)
- Readiness checks: Clear problem, Simple loop, Deployable MVP

#### Idea Notes
- Append-only notes per idea
- Displayed in reverse chronological order
- No edit/delete functionality

#### Profile Management
- Avatar picker with 20 emoji options
- Editable fields: display name, phone, location, bio
- Email display (read-only, from auth)
- User preferences from onboarding

#### Inbox (Raw Thoughts)
- Quick capture of unstructured thoughts
- Stored in localStorage only (not synced to database)
- Convert to full idea when ready

#### Theme
- Dark/light mode toggle
- Respects system preference by default
- Persists choice in localStorage

#### Onboarding Flow
- 7-step setup after first login
- Captures: user type, experience, goals, time commitment, preferences
- Creates first idea during onboarding

### Stubbed / Not Yet Implemented

#### Status Validation
- **Backend**: Edge function ready at `/validate-status-change`
- **UI**: Status changes work directly, don't call validation
- **What it does**: Validates transition rules, enforces one-building limit

#### Feed / Community
- Route exists at /feed
- Shows empty state "Coming soon"
- No backend implementation

#### Integrations & Export
- Mentioned in landing page pricing
- No implementation exists

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| Vite | 5.4.19 | Build tool (SWC) |
| TypeScript | 5.8 | Type safety |
| Tailwind CSS | 3.4 | Styling |
| shadcn/ui | - | Component library (50+ components) |
| Framer Motion | 12.23 | Animations |
| React Router DOM | 6.30 | Routing |
| TanStack Query | 5.83 | Data fetching & caching |
| React Hook Form + Zod | 7.61 | Form handling & validation |
| Lucide React | 0.462 | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| Supabase | Database, Auth, Edge Functions |
| PostgreSQL | Database engine |
| RLS | Row-level security for data isolation |
| OpenRouter | AI provider (model-agnostic LLM access) |

### Edge Functions (7 deployed)
| Function | Purpose |
|----------|---------|
| `autofill-idea` | AI generates idea fields from title/category |
| `score-idea` | AI scores idea 0-10 with reasoning |
| `ai-chat` | Conversational AI assistant |
| `create-checkout-session` | Stripe checkout (stubbed) |
| `delete-user` | Complete account deletion |
| `validate-status-change` | Lifecycle transition validation |
| `_shared/ai-client` | Reusable OpenRouter client |

### Database Schema
```
profiles
├── id (UUID, PK)
├── user_id (FK → auth.users)
├── display_name, email, phone, location, bio, avatar_url
├── subscription_tier (free/pro)
├── subscription_status (none/trial/active/cancelled)
├── onboarding_completed_at
├── user_type, building_experience, goals[], tools_used[]
└── weekly_hours, notifications_enabled

ideas
├── id (UUID, PK)
├── user_id (FK → auth.users)
├── title, description, category
├── core_problem, core_value_proposition, core_loop
├── mvp_shape, target_user, main_idea
├── status (idea/shortlisted/building/paused/shipped/archived)
├── difficulty, priority, sprint_fit (1-5)
├── ai_score (0-10), ai_reasoning
├── check_clear_problem, check_simple_loop, check_deployable_mvp
├── is_template, sort_order
└── created_at, updated_at

idea_notes
├── id (UUID, PK)
├── idea_id (FK → ideas)
├── user_id (FK → auth.users)
├── content
└── created_at, updated_at
```

---

## Architectural Principles

1. **User Isolation**: RLS ensures users only see their own data
2. **Single Building Focus**: Database constraint prevents multiple "building" ideas
3. **Append-Only Notes**: Notes cannot be edited or deleted (simplicity)
4. **Offline Capture**: Inbox uses localStorage for frictionless capture
5. **Progressive Enhancement**: AI features enhance but don't block core workflow

---

## Future Vision (No Timelines)

### Near-term Goals
- Wire AI autofill to own AI provider
- Wire AI scoring to trigger on idea creation/update
- Enable profile editing
- Persist inbox thoughts to database

### Medium-term Goals
- Export ideas to various formats
- Integrations with other tools
- Collaboration / sharing features
- Mobile app (iOS via React Native/Expo)

### Long-term Vision
- Community feed for public ideas
- Templates marketplace
- Build plugins/automations
- Team workspaces

---

## Current Limitations

1. **Inbox is localStorage only** - data lost if browser cleared
2. **No email verification** - auto-confirm is enabled
3. **Notes are append-only** - can't edit or delete
4. **Payments stubbed** - Stripe integration exists but checkout skipped; all users get free tier
5. **iOS app in development** - Capacitor wrapper being implemented
6. **Dev reset tool exposed** - reset & restart onboarding button will revert to dev-only before launch

### Resolved (previously limitations)
- ~~AI functions depend on Lovable AI Gateway~~ → Now using OpenRouter
- ~~No password reset flow~~ → Password reset working
- ~~Profile is read-only~~ → Profile editing with avatar picker working
- ~~No mobile app~~ → iOS app via Capacitor in development
