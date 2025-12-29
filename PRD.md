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
| Web (Desktop/Mobile) | React + Vite | Full landing page | Active |
| iOS (Capacitor shell) | React + Vite packaged via Capacitor | Hero-only in-app start | Live |
| iOS (Expo native) | Expo + React Native + shared hooks | Minimal hero (inside app) | Beta |

### Future Considerations
- **Android App**: Port the Capacitor shell once iOS App Store flow is stable
- **Expo Rollout**: Graduate the Expo build to production after telemetry + user feedback

---

## Payment Strategy

| Platform | Provider | Status |
|----------|----------|--------|
| Web (browser) | Stripe Checkout via `create-checkout-session` | Live (7-day trial fallback if price ID missing) |
| iOS App | Apple IAP | Future - after App Store approval |

Current behavior: Pricing lets users choose Free (updates `profiles` directly) or Pro (Stripe checkout handled via edge function success/cancel URLs). If `STRIPE_PRICE_ID` isn’t configured we auto-create a trial subscription. Billing enforcement remains manual until Stripe webhooks + Apple IAP ship.

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
- **AI Name Suggestion**: Suggests 3 project names with reasoning (wand icon next to title)
- **AI Pitch Drafting**: Generates 3 compelling 1-liner descriptions with different tones
- **AI Idea Generator**: Generates complete ideas from a gist/description or random with category/difficulty filters
- **AI Provider**: OpenRouter (model-agnostic, currently using LLaMA 3.3 70B, configurable via env)

**Authentication Pattern**: Edge Functions use manual JWT validation (not `verify_jwt = true` in config which has middleware issues). Each function validates the `Authorization` header by calling `supabase.auth.getUser()`. If users get 401 errors, they should sign out and back in to refresh their JWT token.

#### Idea Management
- **Create**: Title, category, description, core fields (problem, value prop, loop, MVP, target user)
- **Read**: List view on Home, detail view on /idea/:id
- **Update**: All fields editable in detail view
- **Archive**: Soft delete (status = "archived"), can be restored
- **Templates**: New users get three `is_template` ideas pinned to the top of Home until they edit/save them

#### Idea Lifecycle
Six states with controlled transitions (can be archived anytime):
```
idea → shortlisted → building → shipped
         ↓              ↓
       paused        paused
         ↓              ↓
       archived      archived
```

**Constraint**: Only ONE idea can be "building" at a time per user (enforced at database level and UI with clear error messaging)

#### Idea Evaluation
- Difficulty (1-5 scale)
- Priority (1-5 scale)
- Sprint Fit (1-5 scale)
- Readiness checks: Clear problem, Simple loop, Deployable MVP
- Share/export controls: Idea Detail downloads TXT summaries, Home exports CSV/share sheet snapshots

#### Idea Notes
- Append-only notes per idea
- Displayed in reverse chronological order
- No edit/delete functionality

#### Profile Management
- Avatar picker with 20 emoji options
- Editable fields: display name, phone, location, bio
- Email display (read-only, from auth)
- User preferences from onboarding
- Delete account CTA calls the `delete-user` function (removes data + auth + clears caches)
- Privacy/Terms/Guide links accessible inside Profile

#### Inbox (Raw Thoughts)
- Quick capture of unstructured thoughts
- Stored in localStorage only (not synced to database)
- Convert to full idea when ready

#### Theme
- Dark/light mode toggle
- Respects system preference by default
- Persists choice in localStorage
- Light theme: minimal, clean aesthetic inspired by Notion/Linear
- Vibrant purple primary color (clean but punchy)
- No gradients on buttons/icons (solid colors only)

#### Onboarding Flow
- 7-step setup after first login
- Captures: user type, experience, goals, time commitment, preferences
- Creates first idea during onboarding
- Expo app ships a lightweight version that updates the same profile fields and can seed the first idea

#### Progress Dashboard
- Focus slot tile enforces the one-building rule and links into /build for ritual planning
- Pipeline donut + bar charts (Recharts) summarize counts per status
- Momentum ring + stuck list highlight ideas untouched for 7+ days with shortcuts to AI coaching
- Timeline shows last 5 lifecycle events with inline status dropdown

#### AI Idea Generator
- Mode toggle on /ai switches between Chat and Generate views
- Quick filters (category/difficulty) plus gist prompt
- Generated cards persist locally (`vault_generated_ideas`) until saved or cleared
- Actions: Autofill, Quick Save (creates idea + background scoring), Edit & Save dialog, remove/expand toggles

### Stubbed / Not Yet Implemented

#### Status Validation
- **Backend**: Edge function ready at `/validate-status-change`
- **UI**: Status changes work directly, don't call validation
- **What it does**: Validates transition rules, enforces one-building limit

#### Feed / Community
- Route exists at /feed
- Shows empty state "Coming soon"
- No backend implementation

#### Build Plugins / Start Building
- /build route teases Lovable, Replit, Cursor, Vercel plugins
- UI only — no integrations yet

#### Inbox Sync & Reminders
- Web inbox stays localStorage-only until `inbox_thoughts` lands
- Expo inbox surfaces sync actions but the backend table is still pending
- `useReminderPrompt` placeholder alerts instead of scheduling push notifications

#### Payments Automation
- Stripe checkout works but no webhooks yet to flip `subscription_status`
- Apple IAP + StoreKit integration blocked until App Store submission

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
| Recharts | 2.15 | Pipeline donut + bar charts |
| Sonner / Radix Toast | - | Notifications + toasts |

### Backend
| Technology | Purpose |
|------------|---------|
| Supabase | Database, Auth, Edge Functions |
| PostgreSQL | Database engine |
| RLS | Row-level security for data isolation |
| OpenRouter | AI provider (model-agnostic LLM access) |
| Stripe | Checkout + subscription trial management |

### Mobile (Expo)
| Technology | Purpose |
|------------|---------|
| Expo SDK 54 / React Native 0.81 | Native client |
| React Navigation | Tab + stack routing mirroring web |
| AsyncStorage | Local persistence for AI chat + inbox |
| `shared/` hooks | Reuse Supabase + AI logic across platforms |

### Edge Functions (9 deployed + shared client)
| Function | Purpose |
|----------|---------|
| `autofill-idea` | AI generates idea fields from title/category |
| `score-idea` | AI scores idea 0-10 with reasoning |
| `ai-chat` | Conversational AI assistant with idea context |
| `suggest-name` | AI suggests project names |
| `draft-pitch` | AI drafts 1-liner descriptions |
| `generate-idea` | AI generates complete ideas from gist/filters |
| `create-checkout-session` | Kicks off Stripe Checkout session + redirects |
| `delete-user` | Complete account deletion + cascade cleanup |
| `validate-status-change` | Lifecycle transition validation (service-role) |
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
├── is_template, sort_order (seed templates pinned until renamed)
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
- Persist inbox thoughts to database (web + Expo)
- Wire UI into `/validate-status-change` to show server messages
- Add Stripe webhooks to auto-manage subscription tiers
- Flesh out Start Building plugins with at least one integration

### Medium-term Goals
- Export ideas to various formats (Notion, PDF, etc.)
- Integrations with other tools (Lovable, Replit, Cursor, Vercel)
- Collaboration / sharing features
- Expo parity + Android release

### Long-term Vision
- Community feed for public ideas
- Templates marketplace
- Build plugins/automations
- Team workspaces

---

## Current Limitations

1. **Web inbox is localStorage only** – browser resets wipe thoughts until Supabase table ships
2. **Expo inbox sync blocked** – UI expects an `inbox_thoughts` table that isn’t provisioned yet
3. **Notes are append-only** – no edit/delete UX yet
4. **Payments lack automation** – Stripe checkout exists but no webhook enforcement; Apple IAP pending
5. **Status validation not wired** – UI enforces one-building locally and never calls `/validate-status-change`
6. **Start Building + Feed are placeholders** – UI teases integrations/community with no backend
7. **Push notifications/IAPs missing** – reminder hook + Apple billing are stubs, so mobile relies on manual rituals

### Resolved (previously limitations)
- ~~AI functions depend on Lovable AI Gateway~~ → Now using OpenRouter
- ~~No password reset flow~~ → Password reset working
- ~~Profile is read-only~~ → Profile editing with avatar picker working
- ~~No mobile app~~ → iOS app via Capacitor in development
- ~~AI autofill not wired~~ → AI autofill, scoring, chat, name suggestion, pitch drafting, idea generation all working
- ~~One-building rule fails silently~~ → Clear error toast explaining which idea is currently being built
