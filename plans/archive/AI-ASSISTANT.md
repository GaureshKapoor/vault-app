# Vault AI Assistant - Implementation Plan

> Status: OLD — milestones completed; kept for historical context.

## Overview

Replace mock AI with real AI-powered assistant for idea refinement, scoring, and chat.

**Key Decisions:**
- AI Provider: OpenRouter (easy to swap API keys for OpenAI/Anthropic)
- Chat Storage: localStorage (migrate to DB later if needed)
- Apply UX: Inline "Apply" buttons in chat messages
- Chat Context: Full access to all user ideas

---

## Phase 1: AI Provider Infrastructure (MVP) ✅ COMPLETE

### 1.1 Create Shared AI Client ✅
**New File:** `supabase/functions/_shared/ai-client.ts`

- Abstract OpenRouter API calls
- Use env var `OPENROUTER_API_KEY`
- Support both streaming and JSON responses
- Easy to swap models (configurable via env var)

### 1.2 Update Edge Functions ✅

**Modify:** `supabase/functions/autofill-idea/index.ts`
- Replace Lovable gateway with OpenRouter
- Keep existing prompts (they're solid)

**Modify:** `supabase/functions/score-idea/index.ts`
- Same provider swap
- Keep existing ScoreResult interface

---

## Phase 2: Wire Existing Buttons (MVP) ✅ COMPLETE

### 2.1 Create AI Operations Hook ✅
**New File:** `src/hooks/useAIOperations.ts`

```typescript
export function useAIOperations() {
  const autofillIdea = async (idea) => { /* call edge function */ };
  const scoreIdea = async (idea) => { /* call edge function */ };
  return { autofillIdea, scoreIdea, isLoading, error };
}
```

### 2.2 Wire NewIdea.tsx ✅
**Modify:** `src/pages/NewIdea.tsx`

- Replace "Coming soon" toast with real autofill call
- Show preview dialog with suggested values
- User selects which fields to apply

### 2.3 Wire IdeaDetail.tsx ✅
**Modify:** `src/pages/IdeaDetail.tsx`

- Wire autofill button
- Add "Score with AI" button
- Update idea fields on apply

### 2.4 Create Preview Dialog ✅
**New File:** `src/components/ai/AutofillPreviewDialog.tsx`

- Shows current vs suggested values
- Checkboxes to select fields
- "Apply Selected" button

---

## Phase 3: AI Chat with Context ✅ COMPLETE

### 3.1 Create Chat Edge Function ✅
**New File:** `supabase/functions/ai-chat/index.ts`

- Accept message + conversation history
- Fetch user's ideas for context (up to 20 non-archived)
- Return AI response with full idea context
- Calm, analytical, builder-native tone

### 3.2 Rewrite AI.tsx ✅
**Modify:** `src/pages/AI.tsx`

- Real chat with `useAIChat` hook
- Loading states with "Thinking..." indicator
- Timestamps on messages
- Clear history button
- Auto-scroll to new messages

### 3.3 Create Chat Hook ✅
**New File:** `src/hooks/useAIChat.ts`

- localStorage persistence (max 50 messages)
- Conversation history sent to AI (last 10)
- Error handling with toast notifications
- Clear history function

### 3.4 Optional Components (Deferred to Phase 4)
- `src/components/ai/ActionCard.tsx` - Inline apply button for suggestions
- `src/components/ai/ChatInput.tsx` - Input with quick action buttons

---

## Phase 4: Refine & Suggest Improvements

### 4.1 Add Refine Action
- In IdeaDetail edit mode, add "Refine with AI" per field
- AI suggests improved text with explanation
- User approves or rejects

### 4.2 Quick Actions in Chat
Add shortcut buttons:
- "Score all my ideas"
- "What should I build next?"
- "Find weak assumptions"

---

## File Changes Summary

| File | Action | Phase |
|------|--------|-------|
| `supabase/functions/_shared/ai-client.ts` | CREATE | 1 |
| `supabase/functions/autofill-idea/index.ts` | MODIFY | 1 |
| `supabase/functions/score-idea/index.ts` | MODIFY | 1 |
| `src/hooks/useAIOperations.ts` | CREATE | 2 |
| `src/pages/NewIdea.tsx` | MODIFY | 2 |
| `src/pages/IdeaDetail.tsx` | MODIFY | 2 |
| `src/components/ai/AutofillPreviewDialog.tsx` | CREATE | 2 |
| `supabase/functions/ai-chat/index.ts` | CREATE | 3 |
| `src/pages/AI.tsx` | REWRITE | 3 |
| `src/hooks/useAIChat.ts` | CREATE | 3 |
| `src/components/ai/ActionCard.tsx` | CREATE | 3 |
| `src/components/ai/ChatInput.tsx` | CREATE | 3 |

---

## Environment Setup

```bash
# Add to Supabase secrets
OPENROUTER_API_KEY=your_key_here
AI_MODEL=anthropic/claude-3.5-haiku  # or any OpenRouter-supported model
```

---

## AI Behavior Constraints (Enforced in Prompts)

1. Never write directly to database
2. Always explain reasoning
3. Tone: calm, analytical, builder-native
4. User confirms all changes
5. Suggestions are opt-in, not auto-applied
