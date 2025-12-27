import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chatCompletion, isAIError } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  conversationHistory: ChatMessage[];
  currentIdeaId?: string;
}

interface IdeaSummary {
  id: string;
  title: string;
  status: string;
  category: string | null;
  ai_score: number | null;
  core_problem: string;
  core_value_proposition: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, conversationHistory, currentIdeaId }: ChatRequest = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Chat request from user:", user.id, "message:", message.substring(0, 50));

    // Fetch user's ideas for context
    const { data: ideas } = await supabase
      .from("ideas")
      .select("id, title, status, category, ai_score, core_problem, core_value_proposition")
      .eq("user_id", user.id)
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(20);

    // Build context about user's ideas
    let ideasContext = "";
    if (ideas && ideas.length > 0) {
      ideasContext = `\n\nUser's Ideas (${ideas.length} total):\n`;
      ideas.forEach((idea: IdeaSummary, i: number) => {
        ideasContext += `${i + 1}. "${idea.title}" [${idea.status}]`;
        if (idea.ai_score) ideasContext += ` - Score: ${idea.ai_score}/10`;
        if (idea.category) ideasContext += ` - ${idea.category}`;
        ideasContext += `\n   Problem: ${idea.core_problem.substring(0, 100)}...\n`;
      });
    }

    // Get current idea details if specified
    let currentIdeaContext = "";
    if (currentIdeaId) {
      const currentIdea = ideas?.find((i: IdeaSummary) => i.id === currentIdeaId);
      if (currentIdea) {
        currentIdeaContext = `\n\nCurrently discussing: "${currentIdea.title}"`;
      }
    }

    const systemPrompt = `You are Vault's AI assistant - a calm, analytical thinking partner for builders and creators.

Your role:
- Help users refine, evaluate, and improve their project/startup ideas
- Provide honest, constructive feedback
- Ask clarifying questions when needed
- Suggest concrete improvements

Your tone:
- Calm and analytical (not hype or overly enthusiastic)
- Builder-native (speak like a fellow developer/founder)
- Direct but supportive
- Focus on clarity and actionability

Important rules:
- Never make changes to the user's data directly
- When suggesting edits, explain your reasoning
- Be concise - users are busy builders
- If you don't know something, say so
- Reference specific ideas by name when relevant
${ideasContext}${currentIdeaContext}

Keep responses concise (2-4 sentences for simple questions, more for complex analysis).`;

    // Build messages array
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const response = await chatCompletion(messages, { temperature: 0.7 });

    console.log("Chat response generated, length:", response.length);

    return new Response(
      JSON.stringify({ message: response }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chat error:", error);

    if (isAIError(error)) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Chat failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
