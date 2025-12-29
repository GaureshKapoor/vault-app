import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Helper to ensure we have a valid session before making AI calls
async function ensureValidSession(): Promise<boolean> {
  // Use getUser() which actually validates the token with the server
  // Unlike getSession() which just returns cached data from localStorage
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    // Invalid session - clear it and return false
    console.warn('Invalid session detected:', error?.message);
    await supabase.auth.signOut();
    return false;
  }

  return true;
}

export interface AutofillResult {
  description: string;
  core_problem: string;
  core_value_proposition: string;
  core_loop: string;
  mvp_shape: string;
  target_user: string;
  difficulty: number;
  priority: number;
  sprint_fit: number;
}

export interface NameSuggestion {
  name: string;
  reason: string;
}

export interface PitchSuggestion {
  pitch: string;
  tone: string;
}

export interface ScoreResult {
  ai_score: number;
  ai_reasoning: string;
  suggested_difficulty: number;
  suggested_priority: number;
  suggested_sprint_fit: number;
  check_clear_problem: boolean;
  check_simple_loop: boolean;
  check_deployable_mvp: boolean;
}

interface AutofillInput {
  title: string;
  category?: string;
  main_idea?: string;
}

interface SuggestNameInput {
  main_idea?: string;
  description?: string;
  category?: string;
  core_problem?: string;
}

interface DraftPitchInput {
  title?: string;
  category?: string;
  description?: string;
  core_problem?: string;
  core_value_proposition?: string;
}

interface ScoreInput {
  title: string;
  description: string;
  category: string;
  core_problem: string;
  core_value_proposition: string;
  core_loop?: string;
  mvp_shape?: string;
  target_user?: string;
}

export function useAIOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestingName, setIsSuggestingName] = useState(false);
  const [isDraftingPitch, setIsDraftingPitch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const autofillIdea = async (input: AutofillInput): Promise<AutofillResult | null> => {
    if (!input.title && !input.main_idea) {
      toast({
        variant: "destructive",
        title: "Need input",
        description: "Add a title or main idea before using AI autofill.",
      });
      return null;
    }

    // Ensure we have a valid session before making AI calls
    const hasValidSession = await ensureValidSession();
    if (!hasValidSession) {
      toast({
        variant: "destructive",
        title: "Session expired",
        description: "Please sign in again to use AI features.",
      });
      window.location.href = '/auth';
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("autofill-idea", {
        body: {
          title: input.title,
          category: input.category,
          main_idea: input.main_idea,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data as AutofillResult;
    } catch (err) {
      let message = err instanceof Error ? err.message : "Failed to autofill idea";

      // Handle common error cases with friendlier messages
      if (message.includes("non-2xx") || message.includes("FunctionsHttpError")) {
        message = "AI service temporarily unavailable. Please try again in a moment.";
      }

      setError(message);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: message,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const scoreIdea = async (input: ScoreInput): Promise<ScoreResult | null> => {
    const missingFields: string[] = [];
    if (!input.title) missingFields.push("title");
    if (!input.category) missingFields.push("category");
    if (!input.description) missingFields.push("1-line description");
    if (!input.core_problem) missingFields.push("core problem");
    if (!input.core_value_proposition) missingFields.push("value proposition");

    if (missingFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: `Required for scoring: ${missingFields.join(", ")}.`,
      });
      return null;
    }

    // Ensure we have a valid session before making AI calls
    const hasValidSession = await ensureValidSession();
    if (!hasValidSession) {
      toast({
        variant: "destructive",
        title: "Session expired",
        description: "Please sign in again to use AI features.",
      });
      window.location.href = '/auth';
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("score-idea", {
        body: input,
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data as ScoreResult;
    } catch (err) {
      let message = err instanceof Error ? err.message : "Failed to score idea";

      // Handle common error cases with friendlier messages
      if (message.includes("non-2xx") || message.includes("FunctionsHttpError")) {
        message = "AI service temporarily unavailable. Please try again in a moment.";
      }

      setError(message);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: message,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const suggestName = async (input: SuggestNameInput): Promise<NameSuggestion[] | null> => {
    if (!input.main_idea && !input.description && !input.core_problem) {
      toast({
        variant: "destructive",
        title: "Need context",
        description: "Add a description or main idea before suggesting names.",
      });
      return null;
    }

    // Ensure we have a valid session before making AI calls
    const hasValidSession = await ensureValidSession();
    if (!hasValidSession) {
      toast({
        variant: "destructive",
        title: "Session expired",
        description: "Please sign in again to use AI features.",
      });
      window.location.href = '/auth';
      return null;
    }

    setIsSuggestingName(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("suggest-name", {
        body: {
          main_idea: input.main_idea,
          description: input.description,
          category: input.category,
          core_problem: input.core_problem,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data.suggestions as NameSuggestion[];
    } catch (err) {
      let message = err instanceof Error ? err.message : "Failed to suggest names";

      // Handle common error cases with friendlier messages
      if (message.includes("non-2xx") || message.includes("FunctionsHttpError")) {
        message = "AI service temporarily unavailable. Please try again in a moment.";
      }

      setError(message);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: message,
      });
      return null;
    } finally {
      setIsSuggestingName(false);
    }
  };

  const draftPitch = async (input: DraftPitchInput): Promise<PitchSuggestion[] | null> => {
    if (!input.title && !input.description && !input.core_problem) {
      toast({
        variant: "destructive",
        title: "Need context",
        description: "Add a title, description, or core problem before drafting pitch.",
      });
      return null;
    }

    // Ensure we have a valid session before making AI calls
    const hasValidSession = await ensureValidSession();
    if (!hasValidSession) {
      toast({
        variant: "destructive",
        title: "Session expired",
        description: "Please sign in again to use AI features.",
      });
      window.location.href = '/auth';
      return null;
    }

    setIsDraftingPitch(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("draft-pitch", {
        body: {
          title: input.title,
          category: input.category,
          description: input.description,
          core_problem: input.core_problem,
          core_value_proposition: input.core_value_proposition,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data.suggestions as PitchSuggestion[];
    } catch (err) {
      let message = err instanceof Error ? err.message : "Failed to draft pitch";

      // Handle common error cases with friendlier messages
      if (message.includes("non-2xx") || message.includes("FunctionsHttpError")) {
        message = "AI service temporarily unavailable. Please try again in a moment.";
      }

      setError(message);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: message,
      });
      return null;
    } finally {
      setIsDraftingPitch(false);
    }
  };

  return {
    autofillIdea,
    scoreIdea,
    suggestName,
    draftPitch,
    isLoading,
    isSuggestingName,
    isDraftingPitch,
    error,
  };
}
