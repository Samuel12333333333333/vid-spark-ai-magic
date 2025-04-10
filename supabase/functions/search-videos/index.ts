
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
        JSON.stringify({ error: "API key is missing. Please check your environment variables." }),
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

    // Join keywords with spaces for the search query
    const searchQuery = keywords.join(' ');
    console.log(`Searching Pexels for: ${searchQuery}`);

    // Search for videos with Pexels API
    const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`, {
      method: "GET",
      headers: {
        "Authorization": API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pexels API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Found ${data.videos?.length || 0} videos`);

    // Transform the Pexels response to our expected format
    const videos = data.videos?.map(video => {
      // Find HD or SD file
      const videoFile = video.video_files.find(file => 
        (file.quality === "hd" || file.quality === "sd") && 
        file.file_type.includes("mp4")
      ) || video.video_files[0];
      
      return {
        id: video.id.toString(),
        url: videoFile.link,
        preview: video.image, // Use the video thumbnail
        duration: video.duration,
        width: videoFile.width,
        height: videoFile.height
      };
    }) || [];

    return new Response(
      JSON.stringify({ videos }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
