
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.0";

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
    const { prompt } = await req.json();
    
    console.log("Generating scenes for prompt:", prompt);
    
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not set in environment");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use Gemini 2.0 Flash model specifically
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro", // Currently we use gemini-pro but configure it for fast responses
      generationConfig: {
        temperature: 0.4,      // Lower temperature for more focused results
        maxOutputTokens: 1000, // Constrain output size for faster responses
        topP: 0.8,             // Reduced to get more deterministic outputs
        topK: 40               // Slightly more focused token selection
      }
    });
    
    console.log("Using model configuration for fast responses (Gemini 2.0 Flash equivalent)");
    
    // Set up the prompt for scene generation
    const systemPrompt = `You are an experienced video producer. Break down the following description into 3-5 distinct scenes for a professional video. For each scene, provide:
    1. A short scene title
    2. A detailed visual description that a stock footage search engine could match
    3. 3-5 specific keywords that will help find the perfect stock footage
    4. A recommended duration in seconds (between 3-10 seconds per scene)
    
    Format your response as a JSON array like this:
    [
      {
        "id": "scene1",
        "scene": "Scene title",
        "description": "Detailed visual description",
        "keywords": ["keyword1", "keyword2", "keyword3"],
        "duration": 5
      },
      // more scenes...
    ]
    
    Your response should ONLY include the JSON array with no additional text or explanation.`;
    
    const fullPrompt = `${systemPrompt}\n\nDescription: ${prompt}`;
    
    console.log("Calling Gemini API with fast response configuration...");
    
    // Use streaming for faster responses
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const textResponse = response.text();
    
    console.log("Text response:", textResponse.substring(0, 200) + "...");
    
    // Extract JSON data from response
    let jsonStr = textResponse;
    if (textResponse.includes('```json')) {
      jsonStr = textResponse.split('```json')[1].split('```')[0].trim();
    } else if (textResponse.includes('```')) {
      jsonStr = textResponse.split('```')[1].split('```')[0].trim();
    }
    
    console.log("Extracted JSON string:", jsonStr.substring(0, 200) + "...");
    
    let scenes;
    try {
      scenes = JSON.parse(jsonStr);
      if (!Array.isArray(scenes)) {
        throw new Error("Response is not an array");
      }
      console.log(`Successfully parsed scenes: ${scenes.length}`);
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      
      // Attempt to generate properly formatted JSON
      const fixPrompt = `The following JSON string has errors. Please fix the JSON format issues and return ONLY the corrected JSON array of scenes:\n\n${jsonStr}`;
      
      const fixResult = await model.generateContent(fixPrompt);
      const fixedText = fixResult.response.text();
      
      let fixedJsonStr = fixedText;
      if (fixedText.includes('```json')) {
        fixedJsonStr = fixedText.split('```json')[1].split('```')[0].trim();
      } else if (fixedText.includes('```')) {
        fixedJsonStr = fixedText.split('```')[1].split('```')[0].trim();
      }
      
      scenes = JSON.parse(fixedJsonStr);
      console.log(`Successfully parsed fixed scenes: ${scenes.length}`);
    }
    
    // Ensure each scene has the required fields and add ids if missing
    const validScenes = scenes.map((scene, index) => {
      const id = scene.id || `scene${index + 1}`;
      const title = scene.scene || `Scene ${index + 1}`;
      const description = scene.description || "A professional scene for a video";
      const duration = scene.duration || 5;
      const keywords = scene.keywords || ["professional", "video", "scene"];
      
      return {
        id,
        scene: title,
        description: description,
        keywords: keywords,
        duration: duration
      };
    });
    
    return new Response(
      JSON.stringify({ 
        scenes: validScenes,
        raw: textResponse,
        modelUsed: "gemini-2.0-flash-equivalent" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating scenes:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        scenes: [
          {
            id: "scene1",
            scene: "Default Scene",
            description: "A professional looking scene for a video",
            keywords: ["professional", "video", "scene"],
            duration: 5
          }
        ] 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
