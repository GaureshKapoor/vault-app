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

## Feature Scope

### Implemented & Working

#### Authentication
- Email/password signup and login
- Auto-confirm enabled (no email verification required)
- Session persistence via localStorage
- Protected routes redirect to /auth if not logged in
- Three-tier check: authenticated → has subscription → completed onboarding

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

### Stubbed / Not Yet Wired

#### AI Autofill
- **Backend**: Edge function ready at `/autofill-idea`
- **UI**: Button exists, shows "Coming soon" toast
- **Dependency**: Requires Lovable AI Gateway (needs replacement)
- **What it does**: Given title + category, generates structured fields

#### AI Scoring
- **Backend**: Edge function ready at `/score-idea`
- **UI**: Displays ai_score if populated, but no trigger to populate
- **Dependency**: Requires Lovable AI Gateway (needs replacement)
- **What it does**: Returns 0-10 score with reasoning, suggests difficulty/priority

#### Status Validation
- **Backend**: Edge function ready at `/validate-status-change`
- **UI**: Status changes work directly, don't call validation
- **What it does**: Validates transition rules, enforces one-building limit

#### Profile Editing
- Profile page shows placeholder data
- Email fetched from auth, other fields not editable
- Database has fields for: display_name, avatar_url, bio, location, phone

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
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| shadcn/ui | Component library (50+ components) |
| Framer Motion | Animations |
| React Router DOM | Routing |
| TanStack Query | Data fetching (configured, underutilized) |
| React Hook Form + Zod | Form handling & validation |
| Lucide | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| Supabase | Database, Auth, Edge Functions |
| PostgreSQL | Database engine |
| RLS | Row-level security for data isolation |

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

1. **AI functions depend on Lovable AI Gateway** - needs migration to own provider
2. **Inbox is localStorage only** - data lost if browser cleared
3. **No email verification** - auto-confirm is enabled
4. **No password reset flow** - users can't recover accounts
5. **Profile is read-only** - can't update display name, avatar, etc.
6. **Notes are append-only** - can't edit or delete
7. **No mobile app** - responsive web only
8. **Dev reset tool temporary exposure** - reset & restart onboarding button will revert to dev-only before launch
9. **Lint warnings** - ESLint now surfaces unused variables (warnings only) to keep dead code visible
