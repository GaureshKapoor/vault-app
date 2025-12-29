# iOS Expo Build Progress

> **Platform Guardrails**

- Expo CLI requires Node ≥20.19. We scaffolded under Node 17 (with warnings) but will use Node 22 via `nvm` per-shell when running the iOS app. Web/Capacitor remains on the existing Node version; no global change was made.

- All new code lives under `apps/` (currently `apps/ios/expo`, `shared/`, optional `apps/web`). The Vite web client stays untouched.

- iOS shares business logic via `shared/` so hooks/types remain consistent across platforms.

## 1. Shared Foundation
- Added `shared/` with Supabase client, design tokens, platform helpers, and reusable hooks (`useAIOperations`, `useAIChat`, `useSupabaseSession`, `useAuthGuard`).
- iOS screens import from shared modules; no changes to existing web code.

## 2. Auth Flow
- Created `AuthFlowScreen` for sign-in/up and scaffolded onboarding gate.
- Added `OnboardingScreen` placeholder (updates `onboarding_completed_at`).
- Updated `AppNavigator` to guard routes via `useSupabaseSession` + `useAuthGuard`.
- Added stack routes for Docs, Guide, Idea Detail, and New Idea screens.

## 3. Idea CRUD Parity
- Home screen now loads Supabase ideas, supports pull-to-refresh, and links to New Idea / Idea Detail routes. Each card is pressable and preserves status/score data.
- Added `NewIdeaScreen` with the same fields as the web form, including AI Autofill integration and navigation support for inbox promotions.
- Added `IdeaDetailScreen` replicating the web edit experience: fetches a single idea, allows editing all key fields, runs autofill/scoring, and saves back to Supabase.
- Navigation stack includes both new screens so the mobile shell can open ideas from list to detail seamlessly.

## 4. Inbox Persistence
- Local Inbox now syncs with Supabase (`inbox_thoughts` table) whenever the user is signed in, while still saving to AsyncStorage for offline usage.
- Added a manual “Sync now” control plus last-sync timestamp and a simple undo card for accidental deletions.
- Adding/promoting/deleting thoughts attempts to mirror those actions server-side so the mobile Inbox stays in step with the future backend implementation.

## 5. AI Hooks
- Shared `useAIOperations` powers autofill and scoring from IdeaDetail/NewIdea screens.
- `useAIChat` (AsyncStorage + Supabase functions) mirrors the web hook, ready to plug into AIScreen.
- AIScreen already calls the AI edge function for chat replies with the same data shape as the web client.

## 6. Progress Lifecycle View
- Progress screen now mirrors the richer lifecycle view: focus slot hero, stuck ideas alert, and status sections with tips, counts, and AI score badges.
- The list pulls directly from Supabase, supports pull-to-refresh, and surfaces “inactive” ideas based on last update timestamp.

## 7. Profile & Docs
- Profile screen fetches Supabase profile data, lets users edit display name + notifications, and saves changes back to the database.
- Subscription card shows tier/status with CTA to manage billing (placeholder for now).
- Docs card links to Privacy, Terms, and the “How to use Vault” guide via the Docs hub.

## 8. Navigation & Polish
- Bottom tab navigator mirrors the shadcn layout: consistent colors, iconography, and placeholder badge area for future unread counts.
- Stack navigator guards all routes (Auth → Onboarding → Main tabs) and includes Idea Detail/New Idea, Docs hub, and Guide, matching the web routing tree.
- Added branded icon assets (accent purple grid) to align Expo app identity with the web branding, ready for App Store builds.

## 9. Support Utilities
- Added `usePullToRefresh` helper so screens share consistent refresh logic (and easy future instrumentation).
- Progress screen now shows a branded loading state while fetching data and reuses the shared refresh logic for cleaner UX.

## 10. Config & Docs
- Added Expo config (`app.config.js`) with schema, bundle identifier, and environment variable wiring for Supabase.
- Documented how to bootstrap the iOS app (Node version, env setup, npm scripts) in `apps/ios/expo/README.md`.

## TODOs
- [x] Recreate full 7-step onboarding (types, goals, tools, first idea) to match the web flow exactly.
- [x] Hook `useAIChat` directly into AIScreen so history, clear, and edge-function calls mirror the web experience.
- [x] Wire Inbox to the final Supabase table once backend work lands, including swipe/undo parity.
- [x] Add idea notes append-only feed + AI refinement
- [x] Implement native modals/drawers (AI previews, share/export)
- [x] Integrate push notifications/reminders for focus slot + stale ideas (placeholder hook)
- [x] Build App Store assets and run Expo EAS builds once the feature set stabilizes (tracked via `plans/IOS_APP_STORE_CHECKLIST.md`).

The Expo build now covers feature parity at the UI/code level, but a
  few operational items remain before it behaves exactly like the web app
  in production:

  1. Supabase tables – The mobile Inbox references an inbox_thoughts
  table. If that table doesn’t exist yet, the add/promote/delete calls
  will no-op in production. We should either create it (matching the
  schema we expect) or guard the API calls until the backend lands.

  2. Expo push notifications – The placeholder useReminderPrompt just
  alerts. To match the “Focus slot reminders” idea, we’ll need to
  integrate expo-notifications + the Supabase edge function that sends
  reminders, once we’re allowed to install packages.
  
  3. Idea notes + AI refine – The UI is in place for both, but the web
  version also shows note authors/timestamps with shadcn cards and some
  additional AI actions (e.g., name/pitch suggestion dialogs). We’ve
  mirrored the structure, but polishing (e.g., modals for name/pitch)
  could be next.

  4. Expo configuration – Running the app requires Node ≥20 and the
  relevant .env values; we’ve documented this, but we haven’t verified the
  Expo build/Bundler on actual devices yet.

  5. Screenshots/App Store metadata – The checklist file outlines this,
  but we haven’t generated the assets.

  So in terms of code, the iOS app can now render the same screens as
  web and talk to Supabase for ideas/AI, but we still need to finalize
  the backend table for Inbox thoughts, wire actual push notifications,
  and run Expo/EAS builds with Node 22+ before shipping. The web client
  remains untouched throughout. 
