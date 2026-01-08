# Vault iOS (Expo)

## Running Locally
```bash
cd apps/ios-expo
nvm use 20.19.6 # or Node >= 20.19
npm install
npx expo prebuild --platform ios  # generates ios/ folder
npm run ios
```

## Building with Xcode
```bash
open ios/VaultiOS.xcworkspace
# Select your device/simulator, then Cmd+R to build
```

## Structure
- `src/navigation` – Tab + stack navigators
- `src/screens` – Inbox, Home, AI, Progress, Profile, Docs, Guide, AuthFlow, Onboarding, NewIdea, IdeaDetail
- `src/components` – Reusable components (ActionDrawer, NotesSection, etc.)
- `src/hooks` – Utility hooks (pull-to-refresh, reminder prompt)
- `src/data` – Static content (docs, guide sections)
- `assets` – App icons and splash screen
- `shared/` – Symlink to root shared folder (Supabase client, AI hooks)
- `ios/` – Generated Xcode project (don't edit manually)

## Environment
Uses env vars from root `.env` file:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
