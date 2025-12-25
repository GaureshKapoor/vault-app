import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("=== delete-user function called ===");
  console.log("Method:", req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("SUPABASE_URL exists:", !!SUPABASE_URL);
    console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!SUPABASE_SERVICE_ROLE_KEY);

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the user's JWT from the Authorization header
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header exists:", !!authHeader);
    console.log("Auth header preview:", authHeader ? authHeader.substring(0, 30) + "..." : "null");

    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key - it can verify the JWT too
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Extract JWT token and get user from it
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      console.error("Failed to get user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Deleting user:", user.id);

    // Delete user data first (cascade should handle this, but being explicit)
    // Note: These may fail if tables don't have data, but that's okay
    const { error: notesError } = await supabaseAdmin.from("idea_notes").delete().eq("user_id", user.id);
    if (notesError) console.log("Note: idea_notes delete:", notesError.message);

    const { error: ideasError } = await supabaseAdmin.from("ideas").delete().eq("user_id", user.id);
    if (ideasError) console.log("Note: ideas delete:", ideasError.message);

    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("user_id", user.id);
    if (profileError) console.log("Note: profiles delete:", profileError.message);

    // Delete the auth user using admin API
    console.log("About to delete auth user with admin API...");
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError.message, deleteError);
      return new Response(
        JSON.stringify({ error: `Failed to delete account: ${deleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User deleted successfully:", user.id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Delete user error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
