
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
    const API_KEY = Deno.env.get("PEXELS_API_KEY");
    if (!API_KEY) {
      console.error("PEXELS_API_KEY is not defined");
      return new Response(
        JSON.stringify({ 
          error: "API key is missing. Please check your environment variables.",
          details: "The PEXELS_API_KEY environment variable is not set."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const { keywords } = await req.json();
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return new Response(
        JSON.stringify({ error: "Keywords array is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Join keywords with a space for the search query
    const searchQuery = keywords.join(" ");
    console.log("Searching videos for query:", searchQuery);

    try {
      // Call Pexels API to search for videos
      const response = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(searchQuery)}&per_page=3&orientation=landscape`,
        {
          method: "GET",
          headers: {
            "Authorization": API_KEY
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Pexels API error response:", errorText);
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Found ${data.videos?.length || 0} videos for query: ${searchQuery}`);

      // Check if videos array exists
      if (!data.videos || !Array.isArray(data.videos)) {
        console.error("Unexpected Pexels API response structure:", data);
        return new Response(
          JSON.stringify({ 
            error: "Invalid response from Pexels API", 
            videos: [] 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Transform Pexels response to our format
      const videos = data.videos.map(video => {
        // Find HD quality video file
        const videoFile = video.video_files.find(file => 
          file.quality === "hd" && file.width >= 1280
        ) || video.video_files[0];

        // Use the first picture as preview
        const preview = video.video_pictures.length > 0 
          ? video.video_pictures[0].picture 
          : video.image;

        return {
          id: video.id.toString(),
          url: videoFile.link,
          preview: preview,
          duration: video.duration,
          width: videoFile.width,
          height: videoFile.height
        };
      });

      return new Response(
        JSON.stringify({ videos }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (apiError) {
      console.error("Error calling Pexels API:", apiError);
      return new Response(
        JSON.stringify({ 
          error: "Error fetching videos from Pexels", 
          details: apiError.message,
          videos: [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in search-videos function:", error);
    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred", 
        details: error.message,
        videos: [] 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
