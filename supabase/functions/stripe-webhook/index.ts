import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error("Missing Stripe configuration");
    return new Response(
      JSON.stringify({ error: "Stripe not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });

  // Get raw body for signature verification
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing stripe-signature header");
    return new Response(
      JSON.stringify({ error: "Missing signature" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let event: Stripe.Event;

  try {
    // Use async version for Deno runtime
    event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(
      JSON.stringify({ error: "Invalid signature" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log("Received Stripe event:", event.type);

  // Use service role to update profiles
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          console.error("No user_id in session metadata");
          break;
        }

        console.log("Checkout completed for user:", userId);

        // Get subscription details to check trial status
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const isTrialing = subscription.status === "trialing";
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;

        const { error } = await supabase
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_tier: "pro",
            subscription_status: isTrialing ? "trial" : "active",
            trial_ends_at: trialEnd,
          })
          .eq("user_id", userId);

        if (error) {
          console.error("Failed to update profile:", error);
        } else {
          console.log("Profile updated: subscription_status =", isTrialing ? "trial" : "active");
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        // Find user by subscription ID
        const { data: profile, error: findError } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (findError || !profile) {
          // Try finding by customer ID
          const customerId = subscription.customer as string;
          const { data: profileByCustomer } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (!profileByCustomer) {
            console.error("No profile found for subscription:", subscriptionId);
            break;
          }
          profile.user_id = profileByCustomer.user_id;
        }

        console.log("Subscription updated for user:", profile.user_id, "status:", subscription.status);

        // Map Stripe status to our status
        let subscriptionStatus: string;
        switch (subscription.status) {
          case "trialing":
            subscriptionStatus = "trial";
            break;
          case "active":
            subscriptionStatus = "active";
            break;
          case "canceled":
          case "unpaid":
          case "past_due":
            subscriptionStatus = "cancelled";
            break;
          default:
            subscriptionStatus = "none";
        }

        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;

        const { error } = await supabase
          .from("profiles")
          .update({
            stripe_subscription_id: subscriptionId,
            subscription_status: subscriptionStatus,
            trial_ends_at: trialEnd,
          })
          .eq("user_id", profile.user_id);

        if (error) {
          console.error("Failed to update subscription status:", error);
        } else {
          console.log("Updated subscription_status to:", subscriptionStatus);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log("Subscription deleted for customer:", customerId);

        // Downgrade to free tier when subscription is deleted/cancelled
        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_tier: "free",
            subscription_status: "active",
            trial_ends_at: null,
            stripe_subscription_id: null,
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Failed to downgrade to free:", error);
        } else {
          console.log("Downgraded user to free tier");
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        console.log("Payment succeeded for subscription:", subscriptionId);

        // Update to active (in case this is the first payment after trial)
        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          console.error("Failed to update payment success:", error);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;

        console.log("Payment failed for subscription:", subscriptionId);

        // Find profile to potentially notify user
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          // For now just log - could send email notification here
          console.log("Payment failed for user:", profile.user_id);
          // Don't immediately cancel - Stripe will retry
          // After multiple failures, subscription.deleted will fire
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
