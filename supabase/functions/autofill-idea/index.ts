import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsonCompletion, isAIError } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutofillResult {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, category, main_idea } = await req.json();

    console.log("Autofill request received:", { title, category, main_idea });

    if (!title && !main_idea) {
      return new Response(
        JSON.stringify({ error: "At least title or main_idea is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a startup idea analyst. Given a project name, category, and main idea sentence, generate detailed fields for the idea. Be concise but insightful.

Return a JSON object with these exact fields:
- description: A 1-2 sentence expanded description of the idea
- core_problem: The specific problem this solves (1-2 sentences)
- core_value_proposition: The unique value this provides to users (1-2 sentences)
- core_loop: The main user action loop (e.g., "User does X → Gets Y → Returns for Z")
- mvp_shape: What the minimum viable product looks like (1-2 sentences)
- target_user: Who the ideal user is (1 sentence)
- difficulty: 1-5 scale (1=very easy, 5=very hard to build)
- priority: 1-5 scale (1=low, 5=high priority)
- sprint_fit: 1-5 scale (how well it fits a sprint - 1=doesn't fit, 5=perfect fit)

Only return valid JSON, no markdown or explanation.`;

    const userPrompt = `Project: ${title || "Untitled"}
Category: ${category || "General"}
Main Idea: ${main_idea || "No description provided"}`;

    const result = await jsonCompletion<AutofillResult>([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], { temperature: 0.7 });

    // Validate and clamp numeric values
    result.difficulty = Math.min(5, Math.max(1, Math.round(result.difficulty)));
    result.priority = Math.min(5, Math.max(1, Math.round(result.priority)));
    result.sprint_fit = Math.min(5, Math.max(1, Math.round(result.sprint_fit)));

    console.log("Autofill complete:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Autofill error:", error);

    if (isAIError(error)) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
