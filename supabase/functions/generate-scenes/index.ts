
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
    const API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined");
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

    const result = await model.generateContent([
      systemPrompt,
      prompt
    ]);
    
    const response = result.response.text();
    console.log("Gemini response:", response);
    
    // Parse the JSON from the response
    const jsonStartIndex = response.indexOf('[');
    const jsonEndIndex = response.lastIndexOf(']') + 1;
    const jsonStr = response.substring(jsonStartIndex, jsonEndIndex);
    
    let scenes = [];
    try {
      scenes = JSON.parse(jsonStr);
      // Add unique IDs to each scene
      scenes = scenes.map((scene, index) => ({
        id: crypto.randomUUID(),
        ...scene
      }));
      console.log("Parsed scenes:", scenes);
    } catch (e) {
      console.error("Error parsing JSON:", e);
      throw new Error("Failed to parse scene breakdown");
    }

    return new Response(
      JSON.stringify({ scenes }),
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
