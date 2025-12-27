import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonCompletion, isAIError } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NameSuggestion {
  name: string;
  reason: string;
}

interface SuggestNameResult {
  suggestions: NameSuggestion[];
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

    const { main_idea, description, category, core_problem } = await req.json();

    console.log("Suggest name request received:", { main_idea, description, category, core_problem });

    if (!main_idea && !description && !core_problem) {
      return new Response(
        JSON.stringify({ error: "At least one of main_idea, description, or core_problem is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a creative startup naming expert. Given context about a project idea, suggest 3 catchy, memorable project names.

Good project names are:
- Short (1-2 words, max 3)
- Easy to spell and pronounce
- Memorable and unique
- Evocative of the product's purpose or feeling
- Modern and professional

Return a JSON object with this exact structure:
{
  "suggestions": [
    { "name": "Name1", "reason": "Brief reason why this name works (1 sentence)" },
    { "name": "Name2", "reason": "Brief reason why this name works (1 sentence)" },
    { "name": "Name3", "reason": "Brief reason why this name works (1 sentence)" }
  ]
}

Only return valid JSON, no markdown or explanation.`;

    const contextParts = [];
    if (main_idea) contextParts.push(`Main Idea: ${main_idea}`);
    if (description) contextParts.push(`Description: ${description}`);
    if (category) contextParts.push(`Category: ${category}`);
    if (core_problem) contextParts.push(`Problem it solves: ${core_problem}`);

    const userPrompt = contextParts.join("\n");

    const result = await jsonCompletion<SuggestNameResult>([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], { temperature: 0.9 });

    console.log("Name suggestions complete:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Suggest name error:", error);

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
