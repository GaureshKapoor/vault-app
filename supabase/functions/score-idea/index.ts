import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonCompletion, isAIError } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IdeaInput {
  title: string;
  description?: string;
  core_problem: string;
  core_value_proposition: string;
  core_loop?: string;
  mvp_shape?: string;
  target_user?: string;
  category?: string;
}

interface ScoreResult {
  ai_score: number;
  ai_reasoning: string;
  suggested_difficulty: number;
  suggested_priority: number;
  suggested_sprint_fit: number;
  check_clear_problem: boolean;
  check_simple_loop: boolean;
  check_deployable_mvp: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const idea: IdeaInput = await req.json();

    console.log('Scoring idea:', idea.title);

    const systemPrompt = `You are an expert startup idea evaluator. Analyze the given idea and provide:
1. An overall score from 0-10 (one decimal place)
2. Brief reasoning for the score (2-3 sentences)
3. Suggested difficulty (1-5, where 1=very easy, 5=very hard)
4. Suggested priority (1-5, where 5=highest priority)
5. Suggested sprint fit (1-5, where 5=fits perfectly in a sprint)
6. Boolean assessments for:
   - check_clear_problem: Is there ONE clear consumer problem?
   - check_simple_loop: Is there ONE simple core loop?
   - check_deployable_mvp: Is there ONE deployable MVP shape?

Consider factors like:
- Market size and timing
- Problem clarity and pain intensity
- Solution uniqueness
- Technical feasibility
- Monetization potential
- Competition landscape

Respond ONLY with valid JSON matching this exact structure:
{
  "ai_score": number,
  "ai_reasoning": "string",
  "suggested_difficulty": number,
  "suggested_priority": number,
  "suggested_sprint_fit": number,
  "check_clear_problem": boolean,
  "check_simple_loop": boolean,
  "check_deployable_mvp": boolean
}`;

    const userPrompt = `Evaluate this startup idea:

Title: ${idea.title}
${idea.description ? `Description: ${idea.description}` : ''}
${idea.category ? `Category: ${idea.category}` : ''}
${idea.target_user ? `Target User: ${idea.target_user}` : ''}

Core Problem: ${idea.core_problem}

Value Proposition: ${idea.core_value_proposition}

${idea.core_loop ? `Core Loop: ${idea.core_loop}` : ''}

${idea.mvp_shape ? `MVP Shape: ${idea.mvp_shape}` : ''}`;

    const result = await jsonCompletion<ScoreResult>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.5 });

    // Validate and clamp values
    result.ai_score = Math.min(10, Math.max(0, Number(result.ai_score.toFixed(1))));
    result.suggested_difficulty = Math.min(5, Math.max(1, Math.round(result.suggested_difficulty)));
    result.suggested_priority = Math.min(5, Math.max(1, Math.round(result.suggested_priority)));
    result.suggested_sprint_fit = Math.min(5, Math.max(1, Math.round(result.suggested_sprint_fit)));

    console.log('Scored idea successfully:', result.ai_score);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in score-idea function:', error);

    if (isAIError(error)) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to score idea';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
