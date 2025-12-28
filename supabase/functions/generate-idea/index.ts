import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonCompletion, isAIError } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateIdeaRequest {
  mode: "quick" | "guided";
  category?: string;
  difficulty?: number;
  gist?: string;
  count?: number;
}

interface GeneratedIdea {
  title: string;
  category: string;
  description: string;
  difficulty: number;
}

interface GenerateIdeaResponse {
  ideas: GeneratedIdea[];
}

const VALID_CATEGORIES = [
  "SaaS", "AI", "Health", "FinTech", "EdTech",
  "Climate", "Social", "Productivity", "HR Tech", "Web3", "Other"
];

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

    const { mode, category, difficulty, gist, count = 1 }: GenerateIdeaRequest = await req.json();

    console.log("Generate idea request:", { mode, category, difficulty, gist, count });

    // Validate count
    const ideaCount = Math.min(3, Math.max(1, count));

    // Build constraints description
    const constraints: string[] = [];
    if (category && VALID_CATEGORIES.includes(category)) {
      constraints.push(`Focus on the ${category} space.`);
    }
    if (difficulty && difficulty >= 1 && difficulty <= 5) {
      const difficultyLabels = ["very easy (weekend project)", "easy", "moderate", "challenging", "very complex (multi-month build)"];
      constraints.push(`Target difficulty level ${difficulty}/5 (${difficultyLabels[difficulty - 1]}).`);
    }

    // Build the user prompt based on mode
    let userPrompt = "";
    if (mode === "guided" && gist) {
      userPrompt = `Generate ${ideaCount} startup/project idea${ideaCount > 1 ? 's' : ''} based on this concept:\n\n"${gist}"\n\n${constraints.join(' ')}`;
    } else {
      userPrompt = `Generate ${ideaCount} creative, unique startup/project idea${ideaCount > 1 ? 's' : ''}.\n\n${constraints.join(' ') || 'No specific constraints - surprise me with diverse ideas across different categories.'}`;
    }

    const systemPrompt = `You are a startup idea generator for solo developers and small teams.

Generate creative, buildable startup/project ideas. Each idea should be:
- Practical and achievable for a solo developer or small team
- Have a clear problem-solution fit
- Be specific enough to start building immediately
- Have a catchy, memorable name

For each idea, provide:
- title: A catchy, memorable project name (2-4 words, avoid generic names)
- category: One of [SaaS, AI, Health, FinTech, EdTech, Climate, Social, Productivity, HR Tech, Web3, Other]
- description: A compelling 1-2 sentence pitch that explains what it does and who it's for
- difficulty: 1-5 scale (1=weekend project, 2=1-2 weeks, 3=1 month, 4=2-3 months, 5=complex multi-month build)

Return a JSON object with an "ideas" array containing ${ideaCount} idea${ideaCount > 1 ? 's' : ''}.
Only return valid JSON, no markdown or explanation.`;

    const result = await jsonCompletion<GenerateIdeaResponse>([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], { temperature: 0.9 }); // Higher temperature for creativity

    // Validate and normalize the response
    const validatedIdeas = result.ideas.map((idea: GeneratedIdea) => ({
      title: idea.title || "Untitled Idea",
      category: VALID_CATEGORIES.includes(idea.category) ? idea.category : "Other",
      description: idea.description || "No description provided",
      difficulty: Math.min(5, Math.max(1, Math.round(idea.difficulty || 3))),
    }));

    console.log("Generated ideas:", validatedIdeas);

    return new Response(
      JSON.stringify({ ideas: validatedIdeas }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Generate idea error:", error);

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
