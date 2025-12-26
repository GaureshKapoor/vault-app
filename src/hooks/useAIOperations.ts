import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface ScoreInput {
  title: string;
  description?: string;
  category?: string;
  core_problem: string;
  core_value_proposition: string;
  core_loop?: string;
  mvp_shape?: string;
  target_user?: string;
}

export function useAIOperations() {
  const [isLoading, setIsLoading] = useState(false);
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
    if (!input.title || !input.core_problem || !input.core_value_proposition) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Title, core problem, and value proposition are required for scoring.",
      });
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

  return {
    autofillIdea,
    scoreIdea,
    isLoading,
    error,
  };
}
