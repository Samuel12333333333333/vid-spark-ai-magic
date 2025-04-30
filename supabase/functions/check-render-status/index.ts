
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("Check render status function called");
    
    // Initialize Shotstack client with API key
    const shotstackApiKey = Deno.env.get("SHOTSTACK_API_KEY");
    if (!shotstackApiKey) {
      console.error("SHOTSTACK_API_KEY is not set");
      throw new Error("Shotstack API key is not configured");
    }
    
    // Create Supabase client to update project status
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase environment variables are not set");
      throw new Error("Supabase configuration is missing");
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    let { renderId, projectId } = await req.json();
    
    // Validate required parameters
    if (!renderId) {
      throw new Error("Render ID is required");
    }
    
    console.log(`Checking status for render ${renderId}`);
    
    // Call Shotstack API to check render status
    const response = await fetch(`https://api.shotstack.io/stage/render/${renderId}`, {
      method: "GET",
      headers: {
        "x-api-key": shotstackApiKey,
      },
    });
    
    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shotstack API error (${response.status}): ${errorText}`);
      throw new Error(`Shotstack API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Shotstack status response:", JSON.stringify(data));
    
    // Get status from response
    const status = data.response?.status?.toLowerCase();
    const url = data.response?.url;
    const error = data.response?.error;
    
    // Define return status mapping
    let returnStatus;
    switch (status) {
      case "done":
        returnStatus = "done";
        break;
      case "failed":
        returnStatus = "failed";
        break;
      case "rendering":
      case "queued":
      default:
        returnStatus = "processing";
    }
    
    console.log(`Render status: ${returnStatus}, URL: ${url || 'none yet'}`);
    
    // If done or failed, update the project in the database
    if (projectId && (returnStatus === "done" || returnStatus === "failed")) {
      try {
        const updateData: Record<string, any> = {
          status: returnStatus,
          updated_at: new Date().toISOString()
        };
        
        if (returnStatus === "done" && url) {
          updateData.video_url = url;
          // Generate thumbnail URL (Shotstack provides a thumbnail for completed videos)
          updateData.thumbnail_url = url.replace(/\.mp4$/, "-poster.jpg");
        }
        
        if (returnStatus === "failed" && error) {
          updateData.error_message = error;
        }
        
        const { error: updateError } = await supabaseClient
          .from("video_projects")
          .update(updateData)
          .eq("id", projectId);
          
        if (updateError) {
          console.error("Error updating project:", updateError);
        } else {
          console.log(`Updated project ${projectId} with status ${returnStatus}`);
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
      }
    }
    
    return new Response(
      JSON.stringify({
        status: returnStatus,
        url,
        error
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in check-render-status function:", error);
    return new Response(
      JSON.stringify({
        status: "failed",
        error: error.message || "An error occurred checking render status",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
