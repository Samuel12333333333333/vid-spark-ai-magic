
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
    const { prompt } = await req.json();
    
    console.log("Generating scenes for prompt:", prompt);
    
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not set in environment");
    }
    
    // Use the correct URL for gemini-2.0-flash model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    console.log("Using Gemini 2.0 Flash model");
    
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
    
    console.log("Calling Gemini 2.0 Flash API...");
    
    // Make the API request with the correct format for gemini-2.0-flash
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 1000,
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", errorData);
      throw new Error(`Gemini API returned ${response.status}: ${errorData}`);
    }
    
    const responseData = await response.json();
    console.log("Received response from Gemini");
    
    // Extract the text from the response
    let textResponse = "";
    if (responseData.candidates && 
        responseData.candidates[0] && 
        responseData.candidates[0].content && 
        responseData.candidates[0].content.parts) {
      
      textResponse = responseData.candidates[0].content.parts
        .map(part => part.text || "")
        .join("");
    }
    
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
      
      // Make another API call to fix the JSON
      const fixResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fixPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000,
          }
        })
      });
      
      if (!fixResponse.ok) {
        throw new Error(`Failed to fix JSON: ${await fixResponse.text()}`);
      }
      
      const fixResponseData = await fixResponse.json();
      let fixedText = "";
      
      if (fixResponseData.candidates && 
          fixResponseData.candidates[0] && 
          fixResponseData.candidates[0].content &&
          fixResponseData.candidates[0].content.parts) {
        fixedText = fixResponseData.candidates[0].content.parts
          .map(part => part.text || "")
          .join("");
      }
      
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
        modelUsed: "gemini-2.0-flash" 
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
