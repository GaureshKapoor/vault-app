import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's subscription ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.stripe_subscription_id) {
      // No active subscription - just update to free
      const supabaseService = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await supabaseService
        .from("profiles")
        .update({
          subscription_tier: "free",
          subscription_status: "active",
          stripe_subscription_id: null,
          trial_ends_at: null,
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ success: true, message: "Switched to free plan" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    // Cancel the subscription at period end (or immediately based on preference)
    const { immediate } = await req.json().catch(() => ({ immediate: true }));

    if (immediate) {
      // Cancel immediately
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
      console.log("Subscription cancelled immediately:", profile.stripe_subscription_id);
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      console.log("Subscription set to cancel at period end:", profile.stripe_subscription_id);
    }

    // Update profile to free (webhook will also fire, but we do it here for immediate UI update)
    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabaseService
      .from("profiles")
      .update({
        subscription_tier: "free",
        subscription_status: "active",
        stripe_subscription_id: null,
        trial_ends_at: null,
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({ success: true, message: "Subscription cancelled, switched to free plan" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Cancel subscription error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
