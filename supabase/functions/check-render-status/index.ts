
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
    const { renderId, projectId } = await req.json();
    
    if (!renderId) {
      throw new Error("Missing render ID");
    }
    
    console.log(`Checking status for render ${renderId}, project ${projectId || 'unknown'}`);
    
    // Get API key from environment
    const shotstackApiKey = Deno.env.get("SHOTSTACK_API_KEY");
    if (!shotstackApiKey) {
      console.error("SHOTSTACK_API_KEY not found in environment variables");
      throw new Error("Shotstack API key is not configured");
    }
    
    // Check render status with Shotstack
    const response = await fetch(`https://api.shotstack.io/v1/render/${renderId}`, {
      method: "GET",
      headers: {
        "x-api-key": shotstackApiKey,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shotstack API error: ${response.status}`, errorText);
      throw new Error(`Shotstack API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    const status = data.response?.status;
    const url = data.response?.url;
    const poster = data.response?.poster || data.response?.thumbnail;
    const error = data.response?.error;
    
    console.log(`Render status: ${status}, url: ${url || 'none'}, error: ${error || 'none'}`);
    
    // If complete, update the project in Supabase
    if (projectId && (status === "done" || status === "failed")) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          if (status === "done" && url) {
            console.log(`Updating project ${projectId} with video URL: ${url}`);
            
            // If render is complete, update project with URL
            await supabase
              .from("video_projects")
              .update({
                status: "completed",
                video_url: url,
                thumbnail_url: poster || null,
                updated_at: new Date().toISOString()
              })
              .eq("id", projectId);
          } else if (status === "failed") {
            console.log(`Updating project ${projectId} as failed`);
            
            // If render failed, update project status
            await supabase
              .from("video_projects")
              .update({
                status: "failed",
                error_message: error || "Rendering failed with Shotstack",
                updated_at: new Date().toISOString()
              })
              .eq("id", projectId);
          }
        }
      } catch (dbError) {
        console.error("Error updating project:", dbError);
      }
    }
    
    // Map status and return response
    let mappedStatus = status;
    if (status === "queued" || status === "fetching" || status === "rendering" || status === "saving") {
      mappedStatus = "processing";
    } else if (status === "done") {
      mappedStatus = "completed";
    }
    
    return new Response(
      JSON.stringify({
        status: mappedStatus,
        url,
        thumbnail: poster,
        projectId,
        renderId,
        errorDetails: error || null
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error checking render status:", error);
    
    return new Response(
      JSON.stringify({
        status: "failed",
        error: error.message || "Failed to check render status",
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
