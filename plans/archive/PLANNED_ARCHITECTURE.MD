# Planned Architecture

> Status: OLD — archived reference for the completed workspace migration.

> Goal: consolidate Vault into a mono-repo style layout that cleanly separates platform-specific apps (web + iOS), shared logic, and configuration, while keeping Supabase assets and planning docs centralized.

## Target Directory Layout
```
vault/
├── apps/
│   ├── web/                # Vite + React (current apps/web)
│   └── ios/
│       ├── expo/           # Expo + React Native app
│       └── capacitor/      # Legacy Capacitor project (archived)
├── shared/
│   ├── lib/                # Shared hooks, Supabase client, types
│   └── ui/                 # Future shared design system components
├── config/
│   ├── web/                # eslint, tsconfig, vite/tailwind overrides
│   └── ios/                # Expo/Capacitor configs, ESLint
├── supabase/
│   ├── migrations/
│   └── functions/
├── plans/
│   ├── WEB-VS-IOS_PLAN.md
│   ├── IOS_PROGRESS.md
│   └── PLANNED_ARCHITECTURE.MD (this file)
└── package.json (workspace root, scripts)
```

## Migration Plan

### 1. Apps
- **Web**
  - Move current `src/`, `public/`, `index.html`, `vite.config.ts`, `tailwind.config.ts`, `eslint.config.js`, `postcss.config.js`, `tsconfig.*`, `vercel.json` into `apps/web/`.
  - Update root `package.json` to reference `apps/web` scripts via workspace (`npm run web:dev`, etc.).
  - Keep Capacitor-specific files (`ios/`, `capacitor.config.ts`) archived or sunset once Expo build is primary.

- **iOS (Expo)**
  - Lives in `apps/ios/expo`. Continue building there; ensure `.gitignore` covers `apps/ios/expo/node_modules` + `.expo`.
  - Document Node ≥ 20 requirement (nvm usage) in `apps/ios/expo/README.md`.

### 2. Shared Modules
- Create `shared/lib/` for hooks used by both apps: `useAIOperations`, `useAIChat`, `useSupabaseSession`, `useAuthGuard`, categories, constants, etc. (currently in `apps/shared`).
- Create `shared/ui/` (placeholder) for future design tokens / cross-platform components.
- Expose a single entry point (`shared/index.ts`) so both apps import from `@/shared` via path aliases.

### 3. Config
- Move platform-specific configs under `config/`:
  - `config/web/` – ESLint, Tailwind, Vite, tsconfig references.
  - `config/ios/` – Expo `app.config.js`, ESLint, Metro configs.
- Root `package.json` becomes workspace manager that runs `npm run web:dev` and `npm run ios:start` by shelling into respective folders.

### 4. Supabase
- Leave `supabase/` where it is (already structured), but update docs to reflect new app paths.
- Keep CLI commands documented (e.g., `supabase functions deploy`).

### 5. Plans & Docs
- Continue storing planning docs under `plans/` with descriptive filenames (`WEB-VS-IOS_PLAN.md`, `IOS_PROGRESS.md`, `PLANNED_ARCHITECTURE.MD`, etc.).
- Update README to point to these docs.

### 6. Git Hygiene
- Root `.gitignore` should cover `apps/*/node_modules`, `apps/*/.expo`, `.env*` per app.
- Ensure `apps/web/.env` and `apps/ios/expo/.env` are separate; do not commit secrets.

## Step-by-step Execution
1. **Workspace Init**: Convert root `package.json` to use npm workspaces (or pnpm), referencing `apps/web` and `apps/ios/expo`.
2. **Move Web App**: Physically move `src/`, `public/`, config files into `apps/web`. Update import paths if needed.
3. **Adjust Scripts**: Update root scripts (`web:dev`, `web:build`, `ios:start`) to run inside each app directory.
4. **Update Path Aliases**: Configure Vite + Expo to resolve `@/shared` pointing to `shared/`.
5. **Shared Modules**: Move duplicated hooks (`apps/shared` today) into `shared/lib`, update both apps to import from there.
6. **Docs**: Update README and `plans/` docs with new paths and developer onboarding steps.
7. **CI/CD**: Adjust any deployment scripts (Vercel, Expo EAS) to work with subdirectories.

## Notes
- Until the move is complete, keep working copies in sync: avoid editing both old and new locations simultaneously.
- Capacitor `ios/` folder can remain temporarily but mark as deprecated in docs.

## File-by-file mapping (Current → Planned)

### Root Files
| Current Path | Planned Location | Notes |
|--------------|------------------|-------|
| `package.json` | root (workspace manager) | convert to workspace, move web-specific scripts into `apps/web/package.json` |
| `package-lock.json` | root (workspace) | may be replaced by root lockfile referencing workspaces |
| `vite.config.ts` | `apps/web/vite.config.ts` | adjust paths/imports |
| `tailwind.config.ts` | `apps/web/tailwind.config.ts` | same content |
| `postcss.config.js` | `apps/web/postcss.config.js` | |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | move into `config/web/` or `apps/web/` depending on usage |
| `.gitignore` | root | expand entries for `apps/*` |
| `README.md` | root | update with workspace instructions |
| `vercel.json` | `apps/web/vercel.json` | if Vercel deploy uses project dir |

### Web App
| Current Path | Planned Location |
|--------------|------------------|
| `src/` | `apps/web/src/` |
| `public/` | `apps/web/public/` |
| `index.html` | `apps/web/index.html` |
| `components.json` | `apps/web/components.json` |

### Capacitor / Legacy iOS
| Current Path | Plan |
|--------------|------|
| `apps/ios/capacitor/` | Archived legacy Capacitor app |
| `config/capacitor.config.ts` | Lives under config for reference |

### Expo iOS App
| Current Path | Planned Location |
|--------------|------------------|
| `apps/ios/expo/` | stays as-is (Expo project) |
| `shared/` | contains cross-platform logic (migrated from `apps/shared/`) |
| `apps/ios/expo/README.md` | keep inside ios app |

### Shared Hooks/Constants
| Current Path | Planned Location |
|--------------|------------------|
| `apps/shared/supabase.js` | `shared/lib/supabase.ts` |
| `apps/shared/hooks/useAIOperations.js` | `shared/lib/hooks/useAIOperations.ts` |
| `apps/shared/hooks/useAIChat.js` | `shared/lib/hooks/useAIChat.ts` |
| `apps/shared/hooks/useSupabaseSession.js` | `shared/lib/hooks/useSupabaseSession.ts` |
| `apps/shared/hooks/useAuthGuard.js` | `shared/lib/hooks/useAuthGuard.ts` |
| `apps/shared/constants/designTokens.js` | `shared/lib/constants/designTokens.ts` |
| etc. |

### Supabase
- Already centralized: keep `supabase/` at root. Update docs to reference both apps using same backend.

### Plans & Docs
| Current Path | Planned Location |
|--------------|------------------|
| `plans/AI-IDEA-GENERATION.md`, `plans/IOS_PROGRESS.md`, `plans/PLANNED_ARCHITECTURE.MD`, etc. | stay in `plans/` |
| `plans/web-vs-ios.md` (or renamed) | align naming (e.g., `plans/WEB-VS-IOS_PLAN.md`) |

### Config Directory
| Contents |
|----------|
| `config/web/eslint.config.mjs` (copy current) |
| `config/web/tsconfig.json` |
| `config/web/vite.env.d.ts` |
| `config/ios/.eslintrc.js` (if needed) |
| `config/ios/expo.config.js` (or reference) |


## Progress Tracker
- [x] Step 1: Use a dedicated branch for restructuring (created/handled outside this repo).
- [x] Step 2: Added npm workspaces (`apps/web`, `apps/ios/expo`) to root package.json while leaving existing web app untouched.
- [ ] Step 3+: Pending per migration plan.
