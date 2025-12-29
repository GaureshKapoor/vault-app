# Vault iOS (Expo)

## Running Locally
```bash
cd apps/ios/expo
nvm use 22 # or Node >= 20.19
cp .env.example .env # fill EXPO_PUBLIC_SUPABASE_URL & EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run ios # or android/web
```

## Structure
- `src/navigation` – Tab + stack navigators
- `src/screens` – Inbox, Home, AI, Progress, Profile, Docs, Guide, Auth, Onboarding, New Idea, Idea Detail
- `src/hooks` – utility hooks (pull-to-refresh)
- `assets` – icons/splash
- Shared logic lives in `shared/`
- Expo config + Metro bundler config live in `config/ios/expo`

## Todos
- Finish onboarding flow parity
- Hook shared AI chat hook into AIScreen
- Add Supabase inbox table once backend ready
