import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const idea: IdeaInput = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response:', content);

    // Parse JSON from response (handle markdown code blocks)
    let jsonString = content;
    if (content.includes('```json')) {
      jsonString = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonString = content.split('```')[1].split('```')[0].trim();
    }

    const result: ScoreResult = JSON.parse(jsonString);

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
    const errorMessage = error instanceof Error ? error.message : 'Failed to score idea';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
