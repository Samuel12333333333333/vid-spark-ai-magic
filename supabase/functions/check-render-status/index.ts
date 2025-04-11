
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const API_KEY = Deno.env.get("SHOTSTACK_API_KEY");
    if (!API_KEY) {
      console.error("SHOTSTACK_API_KEY is not defined");
      return new Response(
        JSON.stringify({ 
          error: "API key is missing. Please check your environment variables.", 
          details: "The SHOTSTACK_API_KEY environment variable is not set."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const { renderId } = await req.json();
    if (!renderId) {
      return new Response(
        JSON.stringify({ error: "Render ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Checking render status for ID:", renderId);

    // Call Shotstack API to check render status
    const response = await fetch(`https://api.shotstack.io/stage/render/${renderId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Shotstack API error response:", errorText);
      throw new Error(`Shotstack API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Render status for ID ${renderId}:`, data.response.status);

    // Return status and URL if available
    const result = {
      status: data.response.status,
      url: data.response.url || null
    };

    // Update the video project in Supabase if render is done
    if (result.status === "done" && result.url) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
        // Import Supabase client
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.7.1");
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        try {
          // Find the project with this render ID
          const { data: projects, error: findError } = await supabase
            .from("video_projects")
            .select("id")
            .eq("render_id", renderId)
            .limit(1);
            
          if (findError) throw findError;
          
          if (projects && projects.length > 0) {
            const projectId = projects[0].id;
            
            // Update the project status and URL
            const { error: updateError } = await supabase
              .from("video_projects")
              .update({
                status: "completed",
                video_url: result.url,
                thumbnail_url: result.url // Could be improved to generate an actual thumbnail
              })
              .eq("id", projectId);
              
            if (updateError) throw updateError;
            
            console.log(`Updated project ${projectId} status to completed`);
          }
        } catch (dbError) {
          console.error("Database update error:", dbError);
          // We still continue to return the render status even if DB update fails
        }
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-render-status function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
