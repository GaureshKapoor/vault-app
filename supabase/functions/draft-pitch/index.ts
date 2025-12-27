import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonCompletion, isAIError } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PitchSuggestion {
  pitch: string;
  tone: string;
}

interface DraftPitchResult {
  suggestions: PitchSuggestion[];
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

    const { title, category, description, core_problem, core_value_proposition } = await req.json();

    console.log("Draft pitch request received:", { title, category, description });

    if (!title && !description && !core_problem) {
      return new Response(
        JSON.stringify({ error: "At least one of title, description, or core_problem is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a startup pitch expert. Given context about a project idea, craft 3 compelling 1-liner descriptions (pitch lines).

A great pitch line:
- Is ONE sentence (under 20 words ideally)
- Clearly states what the product does and who it's for
- Is catchy and memorable
- Avoids jargon and buzzwords
- Creates curiosity or shows clear value

Return a JSON object with this exact structure:
{
  "suggestions": [
    { "pitch": "The 1-liner pitch", "tone": "Professional/Casual/Bold" },
    { "pitch": "The 1-liner pitch", "tone": "Professional/Casual/Bold" },
    { "pitch": "The 1-liner pitch", "tone": "Professional/Casual/Bold" }
  ]
}

Only return valid JSON, no markdown or explanation.`;

    const contextParts = [];
    if (title) contextParts.push(`Project Name: ${title}`);
    if (category) contextParts.push(`Category: ${category}`);
    if (description) contextParts.push(`Current Description: ${description}`);
    if (core_problem) contextParts.push(`Problem it solves: ${core_problem}`);
    if (core_value_proposition) contextParts.push(`Value proposition: ${core_value_proposition}`);

    const userPrompt = contextParts.join("\n");

    const result = await jsonCompletion<DraftPitchResult>([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], { temperature: 0.8 });

    console.log("Pitch suggestions complete:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Draft pitch error:", error);

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
