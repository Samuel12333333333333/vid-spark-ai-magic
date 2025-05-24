
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

serve(async (req) => {
  try {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };

    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { operation, data } = await req.json();

    switch (operation) {
      case "create_render_log":
        return await createRenderLog(supabaseAdmin, data, corsHeaders);
      
      case "update_user_activity":
        return await updateUserActivity(supabaseAdmin, data, corsHeaders);
      
      case "bulk_user_operations":
        return await bulkUserOperations(supabaseAdmin, data, corsHeaders);
      
      default:
        return new Response(
          JSON.stringify({ error: "Unknown operation" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Admin operations error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        } 
      }
    );
  }
});

async function createRenderLog(supabaseAdmin: any, data: any, corsHeaders: any) {
  const { error } = await supabaseAdmin
    .from("render_logs")
    .insert({
      user_id: data.user_id,
      video_project_id: data.video_project_id,
      render_id: data.render_id,
      status: data.status,
      template_name: data.template_name,
      duration: data.duration,
      error_message: data.error_message,
      error_code: data.error_code,
      metadata: data.metadata,
    });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function updateUserActivity(supabaseAdmin: any, data: any, corsHeaders: any) {
  const { error } = await supabaseAdmin
    .from("user_activity")
    .insert({
      user_id: data.user_id,
      activity_type: data.activity_type,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      metadata: data.metadata,
    });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function bulkUserOperations(supabaseAdmin: any, data: any, corsHeaders: any) {
  const { operation_type, user_ids, params } = data;

  switch (operation_type) {
    case "suspend_users":
      const { error: suspendError } = await supabaseAdmin
        .from("user_quotas")
        .update({ monthly_limit: 0 })
        .in("user_id", user_ids);

      if (suspendError) {
        return new Response(
          JSON.stringify({ error: suspendError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      break;

    case "reset_quotas":
      const { error: resetError } = await supabaseAdmin
        .from("user_quotas")
        .update({ 
          current_usage: 0,
          reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .in("user_id", user_ids);

      if (resetError) {
        return new Response(
          JSON.stringify({ error: resetError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      break;

    case "update_plans":
      const { error: planError } = await supabaseAdmin
        .from("user_quotas")
        .update({ 
          plan_type: params.new_plan,
          monthly_limit: params.new_limit
        })
        .in("user_id", user_ids);

      if (planError) {
        return new Response(
          JSON.stringify({ error: planError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      break;

    default:
      return new Response(
        JSON.stringify({ error: "Unknown bulk operation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
  }

  return new Response(
    JSON.stringify({ success: true, affected_users: user_ids.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
