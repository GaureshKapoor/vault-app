# AI Idea Generation Feature - Implementation Plan

> Status: OLD — archived reference for the deprecated web-only generator.

## Overview
Add an AI-powered idea generation mode to the existing AI page. Users can generate startup/project ideas via quick generation or interactive dialogue, generate multiple ideas per session, and save with either Quick Save or Edit & Save.

---

## Files to Modify/Create

### New Files
| File | Purpose |
|------|---------|
| `supabase/functions/generate-idea/index.ts` | Edge function for idea generation |
| `src/hooks/useIdeaGeneration.ts` | State management for idea generation |
| `src/components/ai/GeneratedIdeaCard.tsx` | Card component for displaying generated ideas |
| `src/components/ai/IdeaEditDialog.tsx` | Edit dialog for "Edit & Save" flow |
| `src/components/ai/ModeToggle.tsx` | Toggle between Chat and Generate modes |

### Modified Files
| File | Changes |
|------|---------|
| `src/pages/AI.tsx` | Add mode toggle, conditionally render chat vs generate UI |
| `supabase/config.toml` | Add `[functions.generate-idea]` with `verify_jwt = false` |

---

## Phase 1: Backend - Edge Function

### Create `supabase/functions/generate-idea/index.ts`

**Request interface:**
```typescript
interface GenerateIdeaRequest {
  mode: "quick" | "guided";
  category?: string;      // Optional constraint
  difficulty?: number;    // Optional 1-5 constraint
  gist?: string;          // User's idea description (for guided mode)
  count?: number;         // 1-3, defaults to 1
}
```

**Response interface:**
```typescript
interface GeneratedIdea {
  title: string;
  category: string;
  description: string;    // 1-2 sentence pitch
  difficulty: number;     // 1-5
}
```

**System prompt:**
- Generate creative, buildable startup ideas
- Return JSON array of 1-3 ideas
- Apply category/difficulty constraints if provided
- For guided mode, build on the user's gist

**Follow autofill-idea pattern:**
- Manual JWT validation
- Use `jsonCompletion<T>()` from ai-client.ts
- CORS headers, error handling

---

## Phase 2: Frontend Hook

### Create `src/hooks/useIdeaGeneration.ts`

**State:**
```typescript
interface GeneratedIdea {
  id: string;              // Client UUID
  title: string;
  category: string;
  description: string;
  difficulty: number;
  savedId?: string;        // Set after saving
  isExpanded: boolean;
  fullDetails?: AutofillResult;  // After autofill
}

interface UseIdeaGenerationReturn {
  ideas: GeneratedIdea[];
  isGenerating: boolean;

  generateIdeas: (options?: { category?: string; difficulty?: number; gist?: string }) => Promise<void>;
  autofillIdea: (ideaId: string) => Promise<void>;
  quickSave: (idea: GeneratedIdea) => Promise<string | null>;
  removeIdea: (ideaId: string) => void;
  clearAllIdeas: () => void;
  toggleExpand: (ideaId: string) => void;
}
```

**Features:**
- Call `generate-idea` edge function
- Use existing `autofill-idea` for full details
- Insert into `ideas` table for quick save
- localStorage persistence: `vault_generated_ideas`

---

## Phase 3: UI Components

### 3.1 `ModeToggle.tsx`
- Segmented control: "Chat" | "Generate"
- Persist selection in localStorage: `vault_ai_mode`
- Smooth transition animation

### 3.2 `GeneratedIdeaCard.tsx`
Compact card showing:
- Title, category badge, difficulty (1-5 dots)
- Description (truncated)
- Action buttons:
  - **Quick Save** - Immediate save with toast "Idea saved! [View]"
  - **Edit & Save** - Opens IdeaEditDialog
  - **Autofill** - Fetches full details, shows loading state
  - **Remove** - Delete from list

**States:**
- Default: Show summary
- Expanded: Show full details (if autofilled)
- Saved: Checkmark badge, disabled save buttons

### 3.3 `IdeaEditDialog.tsx`
Full edit dialog based on AutofillPreviewDialog pattern:
- Title, Category dropdown, Main Idea textarea
- Core Problem, Value Proposition (required for save)
- Core Loop, MVP Shape, Target User (optional)
- "Autofill Missing" button if partial data
- Cancel / Save buttons

---

## Phase 4: AI Page Integration

### Modify `src/pages/AI.tsx`

**Structure:**
```tsx
function AI() {
  const [mode, setMode] = useState<"chat" | "generate">("chat");

  return (
    <div>
      <Header>
        <ModeToggle mode={mode} onChange={setMode} />
        {/* Clear button */}
      </Header>

      {mode === "chat" ? (
        <ChatView />  // Current implementation
      ) : (
        <GenerateView />  // New generation UI
      )}
    </div>
  );
}
```

**GenerateView layout:**
```
+------------------------------------------+
| Generation Controls                       |
| [Category ▼] [Difficulty ▼] [Generate]   |
| --- or ---                                |
| [Describe your idea...]    [Generate]    |
+------------------------------------------+
| Generated Ideas (n)          [Clear All] |
| [IdeaCard]                               |
| [IdeaCard]                               |
| [IdeaCard]                               |
+------------------------------------------+
| [Refine: "Make it simpler..."]   [Send]  |
+------------------------------------------+
```

---

## Phase 5: Interactive Dialogue (Enhancement)

After basic generation works, add refinement chat:
- Bottom input: "Refine your ideas..."
- Send refinement request with current ideas as context
- AI returns modified ideas or commentary
- Update existing cards or add new ones

---

## Implementation Order

1. **Edge Function** - `generate-idea/index.ts` + config.toml
2. **Hook** - `useIdeaGeneration.ts` with generate + quickSave
3. **IdeaCard** - `GeneratedIdeaCard.tsx` component
4. **AI Page** - Mode toggle + basic generate view
5. **Edit Dialog** - `IdeaEditDialog.tsx` for Edit & Save
6. **Autofill Integration** - Wire up autofill button
7. **Refinement Chat** - Interactive dialogue mode
8. **Polish** - Animations, empty states, mobile

---

## Quick Save vs Edit & Save

### Quick Save
- Saves immediately with: title, category, description, difficulty, status="idea"
- Uses description as both `description` and `core_problem` (placeholder)
- `core_value_proposition` set to description
- Toast: "Idea saved!" with "View" action linking to `/idea/{id}`

### Edit & Save
- Opens dialog with all fields
- User can modify before saving
- Required: title, core_problem, core_value_proposition
- Validates before insert
- After save: close dialog, mark card as saved

---

## Edge Cases

- **Empty generation**: Show friendly message "No ideas generated, try again"
- **Session expiry**: Redirect to /auth (existing pattern)
- **Duplicate saves**: Disable save buttons after first save
- **Page navigation with unsaved ideas**: Ideas persist in localStorage
- **Rate limits**: Loading state prevents spam, toast on error
