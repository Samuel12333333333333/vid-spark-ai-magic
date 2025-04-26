
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
          const { data: projectData, error: projectError } = await supabase
            .from('video_projects')
            .select('user_id, title')
            .eq('id', projectId)
            .single();
          
          if (projectError) {
            console.error("Error fetching project data:", projectError);
            throw projectError;
          }
          
          if (projectData?.user_id) {
            console.log(`Creating notification for user ${projectData.user_id} about completed video "${projectData.title || 'Untitled'}"`);
            
            // Create a notification directly in the database
            const notification = {
              user_id: projectData.user_id,
              title: "Video Rendering Complete",
              message: `Your video "${projectData.title || 'Untitled'}" is ready to view!`,
              type: 'video', // CRITICAL FIX: Use 'video' instead of 'video_completed' to match the constraint
              is_read: false,
              metadata: { 
                projectId, 
                videoUrl: data.response.url,
                thumbnail: data.response.thumbnail
              }
            };
            
            console.log("Attempting to create notification with payload:", JSON.stringify(notification));
            
            // First attempt: Direct database insertion
            const { error: insertError } = await supabase
              .from('notifications')
              .insert([notification]);
              
            if (insertError) {
              console.error("Error creating notification:", insertError);
              console.error("Error details:", JSON.stringify(insertError));
              
              // Second attempt: Try again without metadata which might be causing issues
              const simplifiedNotification = {
                user_id: projectData.user_id,
                title: "Video Rendering Complete",
                message: `Your video "${projectData.title || 'Untitled'}" is ready to view!`,
                type: 'video',
                is_read: false
              };
              
              console.log("Trying simplified notification insert:", JSON.stringify(simplifiedNotification));
              
              const { error: fallbackError } = await supabase
                .from('notifications')
                .insert([simplifiedNotification]);
                
              if (fallbackError) {
                console.error("Fallback insert also failed:", fallbackError);
                console.error("Fallback error details:", JSON.stringify(fallbackError));
              } else {
                console.log("✅ Simplified notification created successfully");
              }
            } else {
              console.log("✅ Notification created successfully");
            }
            
            // Update project status and URLs
            const { error: updateError } = await supabase
              .from('video_projects')
              .update({
                status: 'completed',
                video_url: data.response.url,
                thumbnail_url: data.response.thumbnail || null
              })
              .eq('id', projectId);
              
            if (updateError) {
              console.error("Error updating project:", updateError);
              throw updateError;
            }
            
            console.log(`Project ${projectId} updated successfully with video URL and status`);
          } else {
            console.error("Cannot create notification: user_id not found in project data");
          }
        } catch (supabaseError) {
          console.error("Error working with Supabase:", supabaseError);
        }
      } else {
        console.error("Missing Supabase credentials, cannot create notification");
      }
    } else if (projectId && data.response.status === "failed") {
      // Handle failed render status
      // Initialize Supabase client
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        try {
          // Update project status
          await supabase
            .from('video_projects')
            .update({ 
              status: 'failed',
              error_message: data.response.error || "Unknown error" 
            })
            .eq('id', projectId);
            
          // Get the project to fetch the user_id
          const { data: projectData } = await supabase
            .from('video_projects')
            .select('user_id, title')
            .eq('id', projectId)
            .single();
            
          if (projectData?.user_id) {
            // Create a notification for failed rendering
            const notification = {
              user_id: projectData.user_id,
              title: "Video Rendering Failed",
              message: `Your video "${projectData.title || 'Untitled'}" could not be rendered. Please try again.`,
              type: 'video', // CRITICAL FIX: Use 'video' instead of 'video_failed'
              is_read: false,
              metadata: { projectId, error: data.response.error || "Unknown error" }
            };
            
            console.log("Attempting to create failure notification:", JSON.stringify(notification));
            
            // Try to create notification
            const { error: notificationError } = await supabase
              .from('notifications')
              .insert([notification]);
              
            if (notificationError) {
              console.error("Error creating failure notification:", notificationError);
              console.error("Error details:", JSON.stringify(notificationError));
              
              // Try simplified version without metadata
              const simplifiedNotification = {
                user_id: projectData.user_id,
                title: "Video Rendering Failed",
                message: `Your video "${projectData.title || 'Untitled'}" could not be rendered. Please try again.`,
                type: 'video',
                is_read: false
              };
              
              const { error: fallbackError } = await supabase
                .from('notifications')
                .insert([simplifiedNotification]);
              
              if (fallbackError) {
                console.error("Simplified failure notification also failed:", fallbackError);
              } else {
                console.log("✅ Simplified failure notification created successfully");
              }
            } else {
              console.log(`✅ Failure notification created for project ${projectId}`);
            }
          }
        } catch (supabaseError) {
          console.error("Error working with Supabase for failed render:", supabaseError);
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
