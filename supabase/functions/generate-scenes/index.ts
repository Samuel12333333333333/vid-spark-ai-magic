
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.0";

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
    // Get the API key - note the correct secret name is GEMINI_API_KEY
    const API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!API_KEY) {
      console.error("GEMINI_API_KEY is not defined");
      return new Response(
        JSON.stringify({ 
          error: "API key is missing. Please check your environment variables.",
          details: "The GEMINI_API_KEY environment variable is not set."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Generating scenes for prompt:", prompt);

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = `You are an expert video editor. Break down the following prompt into 3-5 distinct scenes for a short-form video.
      For each scene include:
      1. A clear scene description (setting, action, subject)
      2. 3-5 keywords that would be good for searching stock footage
      3. Suggested duration in seconds (between 3-8 seconds per scene)
      
      Format your response as a JSON array of scene objects with the properties:
      { 
        "scene": "Scene title",
        "description": "Detailed scene description",
        "keywords": ["keyword1", "keyword2", "keyword3"],
        "duration": 5
      }`;

    try {
      console.log("Calling Gemini API...");
      const result = await model.generateContent([
        systemPrompt,
        prompt
      ]);
      
      const response = result.response.text();
      console.log("Gemini response received");
      
      // Parse the JSON from the response
      let jsonStr = "";
      try {
        // Look for JSON array in the response
        const jsonStartIndex = response.indexOf('[');
        const jsonEndIndex = response.lastIndexOf(']') + 1;
        
        if (jsonStartIndex === -1 || jsonEndIndex === -1) {
          // If we can't find array brackets, try to parse the whole thing
          console.log("Couldn't find JSON array markers, trying to parse the entire response");
          jsonStr = response;
        } else {
          jsonStr = response.substring(jsonStartIndex, jsonEndIndex);
        }
        
        console.log("Extracted JSON string:", jsonStr);
      } catch (e) {
        console.error("Error extracting JSON:", e);
        throw new Error("Failed to extract JSON from Gemini response");
      }
      
      let scenes = [];
      try {
        // Handle case where the response might be wrapped in backticks or code block
        jsonStr = jsonStr.replace(/^```json\n|\n```$/g, "");
        jsonStr = jsonStr.replace(/^```\n|\n```$/g, "");
        scenes = JSON.parse(jsonStr);
        
        // Add unique IDs to each scene
        scenes = scenes.map((scene, index) => ({
          id: crypto.randomUUID(),
          ...scene
        }));
        console.log("Successfully parsed scenes:", scenes.length);
      } catch (e) {
        console.error("Error parsing JSON:", e, "Raw JSON string:", jsonStr);
        
        // Fallback to a default response if parsing fails
        scenes = [
          {
            id: crypto.randomUUID(),
            scene: "Introduction",
            description: "Opening scene introducing the main concept",
            keywords: ["introduction", "opening", "concept"],
            duration: 5
          },
          {
            id: crypto.randomUUID(),
            scene: "Main Content",
            description: "Presenting the core information from the prompt",
            keywords: ["information", "content", "presentation"],
            duration: 6
          },
          {
            id: crypto.randomUUID(),
            scene: "Conclusion",
            description: "Final scene summarizing the main points",
            keywords: ["conclusion", "summary", "final"],
            duration: 5
          }
        ];
        console.log("Using fallback scenes due to JSON parsing error");
      }

      return new Response(
        JSON.stringify({ scenes }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (generationError) {
      console.error("Error generating content:", generationError);
      return new Response(
        JSON.stringify({ error: "Failed to generate scenes from Gemini API", details: generationError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in generate-scenes function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
