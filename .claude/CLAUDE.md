# Claude Code Instructions for Vault

This file defines how Claude Code should work on this project.

## Session Workflow

Each working session follows this structured approach:

### Starting a Session
1. **User provides a feature brief** - 2-3 paragraphs describing what the feature is, what it should do, and any specific requirements
2. **Claude acknowledges the scope** - Confirms understanding of the feature and its boundaries
3. **File identification** - Identify which files are directly related to this feature
4. **Ask permission for tangential files** - If other files might need changes, ask before exploring them

### During a Session
- Stay focused on the single feature being worked on
- Only explore files directly related to the current task
- If discovering something that seems wrong elsewhere, note it but don't fix it unless asked
- Use back-and-forth prompting to clarify implementation details
- Each implementation step should be small and verifiable

### Ending a Session
- Summarize what was accomplished
- Note any discovered issues that weren't addressed (for future sessions)
- Only commit when explicitly asked
- User explicitly marks the feature as "done" before moving on

### Key Rules
- **One feature per session** - Don't mix features or start new work mid-session
- **Ask before exploring** - If you need to look at files outside the feature scope, ask first
- **User drives scope** - Wait for the user to expand scope, don't assume
- **Explicit handoffs** - When the user says "done" or starts a new session, that's a clean break

---

## Core Principles

### 1. Feature-by-Feature Workflow
- Work on ONE feature at a time
- Complete the current feature before moving to the next
- Each feature should be: discussed → planned → implemented → tested → committed

### 2. No Wandering Edits
- Only modify files directly related to the current task
- Do not "clean up" unrelated code while working on a feature
- Do not refactor files you weren't asked to touch

### 3. No Silent Refactors
- Never refactor code without explicit approval
- If you notice code that could be improved, mention it and wait for confirmation
- Keep changes minimal and focused

### 4. Always Ask Before Expanding Scope
- If a task naturally leads to additional work, stop and ask
- Do not assume the user wants related features implemented
- Present options, don't make decisions unilaterally

## Handling New Feature Requests

When the user requests a new feature:

1. **Understand** - Ask clarifying questions if the request is ambiguous
2. **Plan** - Propose an approach before writing code
3. **Confirm** - Get approval on the plan
4. **Implement** - Make the changes
5. **Verify** - Test that it works
6. **Commit** - Only when explicitly asked

## File Organization Expectations

```
src/
├── pages/           # Route-level components (one per route)
├── components/      # Reusable UI components
│   ├── layout/      # Layout components (AppLayout, BottomNav)
│   ├── ui/          # shadcn/ui primitives
│   ├── icons/       # Custom icon components
│   └── [feature]/   # Feature-specific components
├── hooks/           # Custom React hooks
├── integrations/    # External service integrations (Supabase)
├── lib/             # Utility functions
└── assets/          # Static assets (images, fonts)

supabase/
├── migrations/      # SQL migrations (append-only)
└── functions/       # Edge Functions
```

## What NOT to Do

- Do not create new documentation files beyond README.md, PRD.md, and this file
- Do not add comments to code you didn't change
- Do not add type annotations to existing code unless fixing a bug
- Do not install new dependencies without discussing first
- Do not modify .env files without explicit instruction
- Do not push to git or deploy without being asked

## Current Project State

### Working Features
- User authentication (email/password)
- Idea CRUD (create, read, update, archive)
- Idea lifecycle management (6 states)
- One "building" idea per user constraint
- Idea notes (append-only)
- Theme toggle (dark/light)
- Inbox (localStorage only)

### Stubbed Features (Not Yet Wired)
- AI Autofill (backend ready, UI shows "Coming soon")
- AI Scoring (backend ready, not triggered from UI)
- Status change validation (backend ready, not called)
- Profile editing (placeholder UI)
- Feed/community features

### Known Dependencies
- Supabase (currently using Lovable-provisioned instance)
- AI functions depend on Lovable AI Gateway (will need replacement)

## Communication Style

- Be direct and concise
- State what you're about to do before doing it
- If something fails, explain why and propose alternatives
- Don't apologize excessively - just fix the issue

---

## Feature Plans

Feature implementation plans are stored in `plans/` folder at project root.

### Workflow
1. **Before implementation:** Create or reference the plan file for the feature (e.g., `plans/AI-assistant.md`)
2. **During implementation:** Update the plan file as phases complete - mark steps done, note blockers
3. **After implementation:** Keep the plan as a reference document

### Rules
- One `.md` file per feature
- Always check `plans/` for existing plan before starting work
- Update plan status as you progress through phases
