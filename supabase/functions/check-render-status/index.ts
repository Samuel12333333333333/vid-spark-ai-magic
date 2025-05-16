
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
    
    // Call Shotstack API to check render status - using correct endpoint for v1
    const response = await fetch(`https://api.shotstack.io/v1/render/${renderId}`, {
      method: "GET",
      headers: {
        "x-api-key": shotstackApiKey,
        "Content-Type": "application/json"
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
        returnStatus = "completed";
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
    
    // Generate thumbnail URL if video URL exists
    let thumbnailUrl = null;
    if (url && url.endsWith('.mp4')) {
      thumbnailUrl = url.replace(/\.mp4$/, "-poster.jpg");
      console.log(`Generated thumbnail URL: ${thumbnailUrl}`);
    }
    
    // If done or failed, update the project in the database
    if (projectId && (returnStatus === "completed" || returnStatus === "failed")) {
      try {
        const updateData: Record<string, any> = {
          status: returnStatus,
          updated_at: new Date().toISOString()
        };
        
        if (returnStatus === "completed" && url) {
          updateData.video_url = url;
          updateData.thumbnail_url = thumbnailUrl;
          
          // Create notification for completed video
          try {
            const { data: projectData } = await supabaseClient
              .from('video_projects')
              .select('user_id, title')
              .eq('id', projectId)
              .single();
              
            if (projectData) {
              await supabaseClient.from('notifications').insert({
                user_id: projectData.user_id,
                type: 'video_completed',
                title: 'Video Ready',
                message: `Your video "${projectData.title.substring(0, 30)}${projectData.title.length > 30 ? '...' : ''}" is ready to view.`,
                is_read: false,
                metadata: { videoId: projectId }
              });
              
              console.log(`Created completion notification for user ${projectData.user_id}`);
            }
          } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
          }
        }
        
        if (returnStatus === "failed" && error) {
          updateData.status = "failed";
          updateData.error_message = error;
          
          // Create notification for failed video
          try {
            const { data: projectData } = await supabaseClient
              .from('video_projects')
              .select('user_id, title')
              .eq('id', projectId)
              .single();
              
            if (projectData) {
              await supabaseClient.from('notifications').insert({
                user_id: projectData.user_id,
                type: 'video_failed',
                title: 'Video Generation Failed',
                message: `We couldn't generate your video "${projectData.title.substring(0, 30)}${projectData.title.length > 30 ? '...' : ''}". Please try again.`,
                is_read: false,
                metadata: { videoId: projectId, error: error }
              });
              
              console.log(`Created failure notification for user ${projectData.user_id}`);
            }
          } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
          }
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
        thumbnail: thumbnailUrl,
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
