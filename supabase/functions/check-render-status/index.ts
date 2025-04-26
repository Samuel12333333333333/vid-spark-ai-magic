
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const { renderId, projectId } = await req.json();
    
    console.log(`Received check-render-status request for renderId: ${renderId}, projectId: ${projectId || 'not provided'}`);
    
    if (!renderId) {
      return new Response(
        JSON.stringify({ error: "Render ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const API_KEY = Deno.env.get("SHOTSTACK_API_KEY");
    if (!API_KEY) {
      console.error("SHOTSTACK_API_KEY is not defined");
      return new Response(
        JSON.stringify({ error: "Shotstack API key is not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`Checking status of render ${renderId} with Shotstack API`);
    
    const response = await fetch(`https://api.shotstack.io/v1/render/${renderId}`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY
      }
    });

    if (!response.ok) {
      console.error(`Shotstack API error: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        // Render ID not found, could be expired or invalid
        return new Response(
          JSON.stringify({ 
            status: "failed", 
            error: "Render ID not found or expired", 
            projectId 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          status: "failed", 
          error: `Shotstack API error: ${response.status}`, 
          projectId 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Shotstack API response:", JSON.stringify(data));
    
    if (!data.success) {
      return new Response(
        JSON.stringify({ 
          status: "failed", 
          error: data.message || "Unknown error", 
          projectId
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If we have a project ID and the render is done, let's make sure we update the project
    if (projectId && data.response.status === "done") {
      // Initialize Supabase client
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        try {
          // Get the project to fetch the user_id (for notifications)
          const { data: projectData } = await supabase
            .from('video_projects')
            .select('user_id, title')
            .eq('id', projectId)
            .single();
          
          if (projectData?.user_id) {
            // Create a notification directly in the database
            const notification = {
              user_id: projectData.user_id,
              title: "Video Rendering Complete",
              message: `Your video "${projectData.title || 'Untitled'}" is ready to view!`,
              type: 'video',
              is_read: false,
              metadata: { 
                projectId, 
                videoUrl: data.response.url,
                thumbnail: data.response.thumbnail
              }
            };
            
            const { error: notificationError } = await supabase
              .from('notifications')
              .insert([notification]);
              
            if (notificationError) {
              console.error("Error creating notification:", notificationError);
            } else {
              console.log("Successfully created notification in database");
            }
          }
        } catch (error) {
          console.error("Error working with Supabase:", error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        status: data.response.status,
        url: data.response.url,
        thumbnail: data.response.thumbnail,
        error: data.response.error,
        projectId
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-render-status function:", error);
    
    return new Response(
      JSON.stringify({ 
        status: "failed", 
        error: error instanceof Error ? error.message : "Unexpected error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
