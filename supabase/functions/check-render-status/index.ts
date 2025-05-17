
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced error logging function
function logError(title: string, error: any, context: Record<string, any> = {}) {
  console.error(`====== ERROR: ${title} ======`);
  console.error(error?.message || error);
  
  if (Object.keys(context).length > 0) {
    console.error("Context:", JSON.stringify(context, null, 2));
  }
  
  if (error?.stack) {
    console.error("Stack:", error.stack);
  }
  
  console.error("==============================");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const reqBody = await req.json();
    const { renderId, projectId } = reqBody;
    
    if (!renderId) {
      throw new Error("Render ID is required");
    }
    
    if (!projectId) {
      throw new Error("Project ID is required");
    }
    
    console.log(`Checking render status for: ${renderId}, Project: ${projectId}`);
    
    // Get Shotstack API key
    const shotstackApiKey = Deno.env.get("SHOTSTACK_API_KEY");
    if (!shotstackApiKey) {
      throw new Error("Shotstack API key is not configured");
    }
    
    // Check render status in Shotstack API
    const response = await fetch(`https://api.shotstack.io/v1/render/${renderId}`, {
      method: "GET",
      headers: {
        "x-api-key": shotstackApiKey,
        "Content-Type": "application/json",
      },
    });
    
    // Handle non-200 responses
    if (!response.ok) {
      // Get the error text for better diagnostics
      const errorText = await response.text();
      
      // For 404 errors, the render might be deleted or invalid
      if (response.status === 404) {
        // Create Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (!supabaseUrl || !supabaseServiceKey) {
          throw new Error("Supabase environment variables not configured");
        }
        
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        // Update the project with failed status and error message
        try {
          const { error: updateError } = await supabaseAdmin
            .from("video_projects")
            .update({
              status: "failed",
              error_message: `Render not found (404): The render ID ${renderId} doesn't exist or has been deleted`,
              updated_at: new Date().toISOString()
            })
            .eq("id", projectId);
            
          if (updateError) {
            logError("Database Update Error", updateError, { projectId });
          }
        } catch (dbError) {
          logError("Database Error", dbError, { projectId, renderId });
        }
        
        return new Response(
          JSON.stringify({
            status: "failed",
            error: `Render not found (404): The render ID ${renderId} doesn't exist or has been deleted`,
            rawStatus: "not_found"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // For other errors
      logError("Shotstack Status API Error", `${response.status} ${response.statusText}`, {
        renderId,
        projectId,
        errorResponse: errorText
      });
      
      // Create Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        // Update the project with failed status
        try {
          const { error: updateError } = await supabaseAdmin
            .from("video_projects")
            .update({
              status: "failed",
              error_message: `Shotstack API error: ${response.status} ${response.statusText}`,
              updated_at: new Date().toISOString()
            })
            .eq("id", projectId);
            
          if (updateError) {
            logError("Database Update Error", updateError, { projectId });
          }
        } catch (dbError) {
          logError("Database Error", dbError, { projectId, renderId });
        }
      }
      
      return new Response(
        JSON.stringify({
          status: "failed",
          error: `Shotstack API error: ${response.status} ${response.statusText}`,
          rawStatus: "error",
          details: errorText
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Parse the JSON response
    const data = await response.json();
    console.log(`Render status response for ${renderId}:`, JSON.stringify(data));
    
    if (!data.response) {
      throw new Error("Invalid response from Shotstack API");
    }
    
    // Get status from response
    const rawStatus = data.response.status;
    const url = data.response.url;
    const thumbnail = data.response.thumbnail;
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not configured");
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // If the render is done, update the project in the database
    let mappedStatus: string = rawStatus;
    
    // Map Shotstack status to our application status
    switch (rawStatus) {
      case "queued":
      case "fetching":
        mappedStatus = "pending";
        break;
      case "rendering":
      case "saving":
        mappedStatus = "processing";
        break;
      case "done":
        mappedStatus = "completed";
        
        // Update the project with the video URL if complete
        try {
          const { error: updateError } = await supabaseAdmin
            .from("video_projects")
            .update({
              status: "completed",
              video_url: url,
              thumbnail_url: thumbnail || null,
              updated_at: new Date().toISOString()
            })
            .eq("id", projectId);
            
          if (updateError) {
            logError("Database Update Error", updateError, { projectId });
          } else {
            console.log(`Updated project ${projectId} with completed status and URL: ${url}`);
          }
        } catch (dbError) {
          logError("Database Error", dbError, { projectId, renderId });
        }
        break;
      case "failed":
        mappedStatus = "failed";
        
        // Update the project with failed status
        try {
          const errorMessage = data.response.error || "Unknown rendering error";
          const { error: updateError } = await supabaseAdmin
            .from("video_projects")
            .update({
              status: "failed",
              error_message: errorMessage,
              updated_at: new Date().toISOString()
            })
            .eq("id", projectId);
            
          if (updateError) {
            logError("Database Update Error", updateError, { projectId });
          } else {
            console.log(`Updated project ${projectId} with failed status`);
          }
        } catch (dbError) {
          logError("Database Error", dbError, { projectId, renderId });
        }
        break;
      default:
        mappedStatus = rawStatus;
    }
    
    // Create the response object
    const responseObj = {
      status: mappedStatus,
      rawStatus,
      url,
      thumbnail,
      shotstack: data.response
    };
    
    return new Response(
      JSON.stringify(responseObj),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    logError("Check Render Status Error", error, { reqBody: await req.json().catch(() => ({})) });
    
    // Create error response
    return new Response(
      JSON.stringify({
        status: "failed",
        error: error.message || "An error occurred checking render status",
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
