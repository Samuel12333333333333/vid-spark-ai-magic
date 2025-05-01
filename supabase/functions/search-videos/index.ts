
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const { keywords } = await req.json();
    
    // Log the request for debugging
    console.log("Request data received:", { keywords });
    
    // Validate input
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return new Response(
        JSON.stringify({ error: "Keywords array is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Combine keywords for search query
    const query = keywords.join(' ');
    
    console.log(`Searching Pexels videos for query: ${query}`);
    
    const API_KEY = Deno.env.get("PEXELS_API_KEY");
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: "Pexels API key is not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Alternative queries to try if the main one fails
    const queryAlternatives = [
      query,
      keywords[0], // Try just the first keyword
      "business", // Generic fallbacks
      "nature",
      "technology"
    ];
    
    let videos = [];
    let currentQuery = queryAlternatives[0];
    let queryIndex = 0;
    
    while (videos.length === 0 && queryIndex < queryAlternatives.length) {
      currentQuery = queryAlternatives[queryIndex];
      
      const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(currentQuery)}&per_page=10&orientation=landscape`;
      
      const response = await fetch(url, {
        headers: {
          "Authorization": API_KEY
        }
      });
      
      if (!response.ok) {
        console.error(`Pexels API error: ${response.status} ${response.statusText}`);
        queryIndex++;
        continue;
      }
      
      const data = await response.json();
      
      if (data && data.videos && data.videos.length > 0) {
        // Map Pexels response to our internal format
        videos = data.videos.map((video) => {
          const bestVideo = video.video_files.reduce((prev, curr) => {
            // Choose HD or close to it, but not too large
            if (curr.quality === "hd" && curr.width <= 1280) {
              return curr;
            }
            if (!prev || (curr.width > prev.width && curr.width <= 1280)) {
              return curr;
            }
            return prev;
          }, null);
          
          return {
            id: video.id.toString(),
            url: bestVideo ? bestVideo.link : video.video_files[0].link,
            image: video.image,
            width: bestVideo ? bestVideo.width : video.video_files[0].width,
            height: bestVideo ? bestVideo.height : video.video_files[0].height,
            duration: video.duration,
            user: {
              name: video.user.name,
              url: video.user.url
            }
          };
        });
        
        console.log(`Found ${videos.length} videos for query: ${currentQuery}`);
        break;
      } else {
        queryIndex++;
        console.log(`No videos found for "${currentQuery}", trying alternative query`);
      }
    }
    
    if (videos.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No videos found for the given keywords",
          videos: [], 
          query,
          triedQueries: queryAlternatives.slice(0, queryIndex + 1)
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        videos,
        query: currentQuery,
        originalQuery: query
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
