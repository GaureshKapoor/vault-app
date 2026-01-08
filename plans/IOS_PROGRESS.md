# iOS Expo Build Progress

> Status: IN USE — source of truth for Expo parity and outstanding polish.

> **Platform Guardrails**

- Expo CLI requires Node ≥20.19. We scaffolded under Node 17 (with warnings) but will use Node 22 via `nvm` per-shell when running the iOS app. Web/Capacitor remains on the existing Node version; no global change was made.

- All new code lives under `apps/` (currently `apps/ios/expo`, `shared/`, optional `apps/web`). The Vite web client stays untouched.

- iOS shares business logic via `shared/` so hooks/types remain consistent across platforms.

## Current Build Workflow (Xcode)
- `cd apps/ios-expo && nvm use 22 && npm install` to pull Expo deps that match SDK 54.
- `npx expo prebuild --clean --platform ios` (or `expo prebuild ios`) generates the `ios/` directory that Xcode consumes. Run this anytime native deps or app.json changes.
- Open `apps/ios-expo/ios/Vault iOS.xcworkspace` in Xcode, fix signing, and build to simulator/device.
- Until we wire push and native modules, keep using the Expo dev client (`npx expo start --ios`) for iteration, then fall back to Xcode once prebuild completes.

## 1. Shared Foundation
- Added `shared/` with Supabase client, design tokens, platform helpers, and reusable hooks (`useAIOperations`, `useAIChat`, `useSupabaseSession`, `useAuthGuard`).
- ACTION: Screens currently import via `../shared`/`../../../shared`, which overshoots the symlink. Fix paths to `../../shared` (from `src/*`) so Metro/Xcode builds can resolve modules. Also update hooks to import `supabase` from `../lib/supabase`.

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
- Missing: `apps/ios-expo/README.md` still references `apps/ios/expo`; update instructions after the shared import fixes ship.

## TODOs
- [ ] Fix all `shared` import paths so Metro/Xcode resolve the shared hooks (currently points to `../shared`/`../supabase`).
- [ ] Verify Supabase hooks after the path fix (the hooks import `supabase` from `../supabase`, which 404s).
- [ ] Run `npx expo prebuild --clean --platform ios` and commit/ignore generated native project as needed for Xcode builds.
- [ ] Configure Xcode signing (bundle id `build.vault.app`) and confirm simulator build succeeds.
- [ ] Ensure `.env` contains `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY` when running via Xcode (Expo prebuild copies them at build time).
- [ ] Create/verify `inbox_thoughts` table or guard calls behind feature flag.
- [ ] Implement expo-notifications + reminder edge function to replace placeholder alerts.
- [ ] Polish AI detail flows (notes authorship, pitch/name dialogs) to match web parity.
- [ ] Capture screenshots + videos once Xcode build is stable (tracked alongside `plans/IOS_APP_STORE_CHECKLIST.md`).
