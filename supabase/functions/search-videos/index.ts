
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
    // Get the API key from environment variables
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

    // Parse the request body
    const requestData = await req.json();
    console.log("Request data received:", requestData);
    
    // Check if keywords property exists and is properly formatted
    if (!requestData.keywords) {
      return new Response(
        JSON.stringify({ 
          error: "Keywords parameter is required",
          details: "The request body must include a 'keywords' property"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    let searchTerms;
    // Handle both array and string formats for keywords
    if (Array.isArray(requestData.keywords)) {
      searchTerms = requestData.keywords.join(" ");
    } else if (typeof requestData.keywords === "string") {
      searchTerms = requestData.keywords;
    } else {
      return new Response(
        JSON.stringify({ 
          error: "Invalid keywords format", 
          details: "Keywords must be a string or an array of strings" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Ensure search terms are not empty
    if (!searchTerms.trim()) {
      return new Response(
        JSON.stringify({ 
          error: "Empty search query", 
          details: "Search terms cannot be empty" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Searching Pexels videos for query:", searchTerms);

    try {
      // Call Pexels API to search for videos with improved error handling
      const response = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(searchTerms)}&per_page=3&orientation=landscape`,
        {
          method: "GET",
          headers: {
            "Authorization": API_KEY
          }
        }
      );

      // Check for response status and handle accordingly
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Pexels API error (${response.status}):`, errorText);
        
        // Handle specific error codes
        if (response.status === 401) {
          return new Response(
            JSON.stringify({ 
              error: "Unauthorized request to Pexels API", 
              details: "Please check your API key validity" 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        } else if (response.status === 429) {
          return new Response(
            JSON.stringify({ 
              error: "Rate limit exceeded with Pexels API", 
              details: "Too many requests, please try again later" 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }
        
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Found ${data.videos?.length || 0} videos for query:`, searchTerms);

      // Check if videos array exists and has content
      if (!data.videos || !Array.isArray(data.videos) || data.videos.length === 0) {
        console.log("No videos found for query:", searchTerms);
        return new Response(
          JSON.stringify({ 
            videos: [],
            message: `No videos found for "${searchTerms}"`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Transform Pexels response to our format with additional error handling
      const videos = data.videos.map(video => {
        try {
          // Find HD quality video file with fallback options
          const videoFile = video.video_files.find(file => 
            file.quality === "hd" && file.width >= 1280
          ) || video.video_files.find(file => 
            file.quality === "sd" && file.width >= 640
          ) || video.video_files[0];

          // Use the first picture as preview with fallback
          const preview = video.video_pictures && video.video_pictures.length > 0 
            ? video.video_pictures[0].picture 
            : video.image;

          // Include attribution information
          return {
            id: video.id.toString(),
            url: videoFile.link,
            image: preview,
            width: videoFile.width,
            height: videoFile.height,
            duration: video.duration,
            user: {
              name: video.user?.name || "Pexels Contributor",
              url: video.user?.url || "https://www.pexels.com"
            }
          };
        } catch (e) {
          console.error("Error processing video from Pexels:", e);
          // Skip invalid videos
          return null;
        }
      }).filter(v => v !== null); // Remove any null entries

      if (videos.length === 0) {
        console.warn("All videos had processing errors, returning empty array");
        return new Response(
          JSON.stringify({ 
            videos: [],
            message: "No valid videos found"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
