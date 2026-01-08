# Web vs iOS Platform Strategy

> Status: OLD — superseded by the Expo-first architecture plan.

## Overview

Vault is deployed across multiple platforms with shared codebase where possible.

| Platform | Technology | Landing Page | App Experience |
|----------|------------|--------------|----------------|
| Web (Desktop/Tablet) | React + Vite | Full landing | Full app |
| Web (Mobile browser) | React + Vite | Full landing | Full app |
| iOS App | Capacitor | Hero only | Full app |

---

## Phase 1: Capacitor iOS App (Current)

### Architecture
```
vault-app/
├── src/
│   ├── pages/
│   │   ├── WebLanding.tsx      # Full landing (web browser)
│   │   ├── IOSLanding.tsx      # Hero-only (iOS app)
│   │   └── ...                 # All other pages SHARED
│   ├── lib/
│   │   └── platform.ts         # Platform detection
│   └── App.tsx                 # Conditional routing
├── ios/                        # Capacitor iOS project
└── capacitor.config.ts
```

### Platform Detection
```typescript
// src/lib/platform.ts
import { Capacitor } from '@capacitor/core';

export const isIOSApp = () => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
};

export const isWebBrowser = () => {
  return !Capacitor.isNativePlatform();
};
```

### Landing Page Differences

| Element | Web | iOS App |
|---------|-----|---------|
| Header nav | Yes (4 links) | No |
| Hero section | Animated tagline, carousel | Static, single card |
| Stats section | Yes | No |
| Features section | Yes | No |
| How it works | Yes | No |
| Video section | Yes | No |
| Testimonials | Yes | No |
| Pricing | Yes | No |
| FAQ | Yes | No |
| Footer | Yes | No |
| Get Started button | Yes | Yes |

### What's Shared
- All pages except landing (`Home`, `Auth`, `Pricing`, `Inbox`, `AI`, `Profile`, etc.)
- All components
- All hooks and utilities
- Supabase integration
- Theme system (dark/light)
- Bottom navigation

---

## Payment Strategy

| Platform | Provider | Status |
|----------|----------|--------|
| Web | Stripe | Stubbed (future) |
| iOS | Apple IAP (StoreKit) | Future |

Current: All users receive free tier. Payment integration planned post-MVP.

---

## Phase 2: Future Expo Migration (If Needed)

If native performance becomes critical (evaluate after 3 months):

### Monorepo Structure
```
vault/
├── apps/
│   ├── web/        # Current React app
│   └── mobile/     # Expo React Native app
├── packages/
│   ├── shared/     # Business logic, types, API hooks
│   └── ui/         # Shared design tokens
└── supabase/
    ├── migrations/
    └── functions/
```

### What Would Be Shared
- Supabase hooks and API calls
- Types and interfaces
- Business logic
- Design tokens (colors, spacing)

### What Would Be Rewritten
- UI components (React → React Native)
- Styling (CSS → StyleSheet)
- Navigation (React Router → React Navigation)

### Decision Criteria
Migrate to Expo if:
- Users report laggy scrolling or animations
- Need complex native features (AR, advanced camera, etc.)
- App Store reviews cite performance issues

---

## Build Commands

```bash
# Web development
npm run dev

# Web production build
npm run build

# iOS development
npm run build && npx cap sync ios && npx cap open ios

# iOS production build
npm run build && npx cap sync ios
# Then build in Xcode for App Store
```

---

## iOS App Store Checklist

- [ ] Apple Developer Account ($99/year)
- [ ] App icons (1024x1024 + all required sizes)
- [ ] Screenshots for all device sizes
- [ ] App description
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] App Review Information

---

## Status

- [x] Web (Desktop/Tablet) - Active
- [x] Web (Mobile browser) - Active
- [ ] iOS App - In Development
- [ ] Android App - Future (via Capacitor)
- [ ] Expo Migration - Evaluate post-launch
