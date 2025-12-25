import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type IdeaStatus = 'idea' | 'shortlisted' | 'building' | 'paused' | 'shipped' | 'archived';

interface ValidationRequest {
  idea_id: string;
  current_status: IdeaStatus;
  new_status: IdeaStatus;
  user_id: string;
}

interface ValidationResult {
  allowed: boolean;
  reason: string;
  warnings?: string[];
}

// Define valid status transitions
const VALID_TRANSITIONS: Record<IdeaStatus, IdeaStatus[]> = {
  'idea': ['shortlisted', 'archived'],
  'shortlisted': ['idea', 'building', 'paused', 'archived'],
  'building': ['paused', 'shipped'], // Cannot go back from building easily
  'paused': ['shortlisted', 'building', 'archived'],
  'shipped': ['archived'], // Shipped is mostly final
  'archived': ['idea'], // Can unarchive back to idea
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea_id, current_status, new_status, user_id }: ValidationRequest = await req.json();

    console.log(`Validating status change: ${current_status} -> ${new_status} for idea ${idea_id}`);

    const result: ValidationResult = {
      allowed: true,
      reason: '',
      warnings: [],
    };

    // Check if transition is valid
    const allowedTransitions = VALID_TRANSITIONS[current_status];
    if (!allowedTransitions.includes(new_status)) {
      result.allowed = false;
      result.reason = `Cannot transition from "${current_status}" to "${new_status}". Valid transitions: ${allowedTransitions.join(', ')}`;
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If transitioning to "building", check if user already has one building
    if (new_status === 'building') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: existingBuilding, error } = await supabase
        .from('ideas')
        .select('id, title')
        .eq('user_id', user_id)
        .eq('status', 'building')
        .neq('id', idea_id)
        .maybeSingle();

      if (error) {
        console.error('Error checking existing building idea:', error);
        throw error;
      }

      if (existingBuilding) {
        result.allowed = false;
        result.reason = `You can only have one idea in "building" status at a time. Currently building: "${existingBuilding.title}"`;
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Add warnings for certain transitions
    if (new_status === 'archived') {
      result.warnings?.push('Archived ideas are hidden from the main view. You can restore them later.');
    }

    if (new_status === 'shipped') {
      result.warnings?.push('Marking as shipped is a milestone! Consider sharing your success.');
    }

    if (current_status === 'building' && new_status === 'paused') {
      result.warnings?.push('Pausing will free up your "building" slot for another idea.');
    }

    result.reason = `Transition from "${current_status}" to "${new_status}" is allowed.`;

    console.log('Validation result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-status-change function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Validation failed';
    return new Response(
      JSON.stringify({ 
        allowed: false, 
        reason: errorMessage,
        error: true 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
