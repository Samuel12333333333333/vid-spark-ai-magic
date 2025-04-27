
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
    if (projectId) {
      // Initialize Supabase client
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error("Missing Supabase credentials, cannot update project");
        return new Response(
          JSON.stringify({ 
            status: data.response.status,
            url: data.response.url,
            thumbnail: data.response.thumbnail,
            error: "Missing Supabase credentials",
            projectId
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
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
        
        if (!projectData?.user_id) {
          console.error("Cannot update status: user_id not found in project data");
          return new Response(
            JSON.stringify({ 
              status: data.response.status,
              url: data.response.url,
              thumbnail: data.response.thumbnail,
              error: "User ID not found in project data",
              projectId
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Handle completed render
        if (data.response.status === "done") {
          console.log(`Creating notification for user ${projectData.user_id} about completed video "${projectData.title || 'Untitled'}"`);
          
          // First update the project
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
          
          console.log("Project updated successfully with completed status and video URL");
          
          // Try multiple approaches to create notification - guaranteed delivery
          let notificationCreated = false;
          
          // Approach 1: Direct insert with full notification data
          try {
            console.log("Attempt 1: Creating completion notification with full data");
            
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
            
            const { data: notifData, error: notifError } = await supabase
              .from('notifications')
              .insert([notification])
              .select();
              
            if (notifError) {
              console.error("Attempt 1 failed:", notifError);
              throw notifError;
            } else {
              console.log("✅ Notification created successfully:", notifData);
              notificationCreated = true;
            }
          } catch (error1) {
            console.error("Error in notification creation attempt 1:", error1);
            
            // Approach 2: Simplified notification without metadata
            if (!notificationCreated) {
              try {
                console.log("Attempt 2: Creating notification without metadata");
                
                const simpleNotification = {
                  user_id: projectData.user_id,
                  title: "Video Rendering Complete",
                  message: `Your video "${projectData.title || 'Untitled'}" is ready to view!`,
                  type: 'video',
                  is_read: false
                };
                
                const { data: simpleData, error: simpleError } = await supabase
                  .from('notifications')
                  .insert([simpleNotification])
                  .select();
                  
                if (simpleError) {
                  console.error("Attempt 2 failed:", simpleError);
                  throw simpleError;
                } else {
                  console.log("✅ Simple notification created successfully:", simpleData);
                  notificationCreated = true;
                }
              } catch (error2) {
                console.error("Error in notification creation attempt 2:", error2);
                
                // Approach 3: Ultra-minimal notification
                if (!notificationCreated) {
                  try {
                    console.log("Attempt 3: Creating minimal notification");
                    
                    const minimalNotification = {
                      user_id: projectData.user_id,
                      title: "Video Complete",
                      message: "Your video is ready to view.",
                      type: 'video',
                      is_read: false
                    };
                    
                    const { error: minimalError } = await supabase
                      .from('notifications')
                      .insert([minimalNotification]);
                      
                    if (minimalError) {
                      console.error("Attempt 3 failed:", minimalError);
                    } else {
                      console.log("✅ Minimal notification created successfully");
                      notificationCreated = true;
                    }
                  } catch (error3) {
                    console.error("All notification creation attempts failed:", error3);
                  }
                }
              }
            }
          }
          
          if (!notificationCreated) {
            console.error("❌ Failed to create notification after all attempts");
          }
        } 
        // Handle failed render
        else if (data.response.status === "failed") {
          // Update project status
          await supabase
            .from('video_projects')
            .update({ 
              status: 'failed',
              error_message: data.response.error || "Unknown error" 
            })
            .eq('id', projectId);
            
          // Create a notification for failed rendering
          try {
            const failNotification = {
              user_id: projectData.user_id,
              title: "Video Rendering Failed",
              message: `Your video "${projectData.title || 'Untitled'}" could not be rendered. Please try again.`,
              type: 'video',
              is_read: false
            };
            
            const { error: failNotifError } = await supabase
              .from('notifications')
              .insert([failNotification]);
              
            if (failNotifError) {
              console.error("Failed to create failure notification:", failNotifError);
            } else {
              console.log("✅ Failure notification created successfully");
            }
          } catch (failError) {
            console.error("Error creating failure notification:", failError);
          }
        }
      } catch (supabaseError) {
        console.error("Error working with Supabase:", supabaseError);
        return new Response(
          JSON.stringify({ 
            status: data.response.status,
            url: data.response.url,
            thumbnail: data.response.thumbnail,
            error: "Database error: " + (supabaseError instanceof Error ? supabaseError.message : "Unknown error"),
            projectId
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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
