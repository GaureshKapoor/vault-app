# iOS App Store Prep Checklist

> Status: IN USE — keep updating as we prep the first App Store submission.

## Branding
- [ ] Final app icon (1024x1024) and adaptive variants.
- [ ] Launch screens (light/dark) matching web hero.

## Metadata
- [ ] App name & subtitle.
- [ ] Keywords & description.
- [ ] Privacy policy + terms URLs (already live).

## Builds
- [x] Configure bundle identifier (`build.vault.app`) in `app.config.js`.
- [ ] Run `npx expo prebuild --clean --platform ios` and keep the generated `ios/` workspace in sync with source.
- [ ] Install pods (`cd ios && pod install`) after each prebuild.
- [ ] Open `ios/Vault iOS.xcworkspace`, set signing team + provisioning profiles.
- [ ] Build + run in simulator from Xcode (Debug).
- [ ] Archive from Xcode (Release) and validate with Transporter.
- [ ] Set up App Store Connect app record + bundle ID linkage.
- [ ] Decide whether we keep using manual Xcode archives or switch to EAS Build for CI.
- [ ] Generate screenshots (5.5", 6.5", iPhone 6.7" mandatory; iPad optional).

## Services & Capabilities
- [ ] Enable Push Notifications + Background fetch once expo-notifications is wired.
- [ ] Confirm Keychain sharing / associated domains not required for v1.
- [ ] Add Privacy Manifest entries for network usage (Supabase, OpenRouter).

## Features to verify before submission
- Onboarding, Dashboard, AI, Inbox, Progress, Profile, Docs.
- Expo notifications once implemented.
- Supabase auth/session persistence after cold start.
- Offline Inbox drafts + sync flow.
