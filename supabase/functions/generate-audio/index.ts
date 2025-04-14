
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const ELEVEN_LABS_API_KEY = Deno.env.get("ELEVEN_LABS_API_KEY");

const AVAILABLE_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel - Warm and conversational" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi - Strong and confident" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah - Professional and clear" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli - Approachable and friendly" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam - Deep and authoritative" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Josh - Warm and engaging" }
];

// Function to generate narration script
async function generateNarrationScript(scenes) {
  try {
    // Use the GEMINI_API_KEY for generating narration
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not defined");
      throw new Error("Gemini API key is missing");
    }
    
    // Combine all scene descriptions into a single narrative
    let fullDescription = '';
    
    if (Array.isArray(scenes)) {
      scenes.forEach(scene => {
        fullDescription += scene.description + " ";
      });
    } else if (typeof scenes === 'string') {
      // If scenes is just a string description
      fullDescription = scenes;
    } else {
      throw new Error("Invalid scenes format");
    }
    
    // Create prompt for narration generation
    const prompt = `
    Generate a short, emotionally resonant voiceover script for this video scene:
    
    "${fullDescription}"
    
    Requirements:
    1. The narration should match the tone, emotion, and pacing of the visual.
    2. Keep it between 15-40 words — suitable for 5 to 15 seconds of speech.
    3. Use natural, human tone — no robotic phrasing or generic commentary.
    4. Enhance the mood/story rather than describing visuals literally.
    5. Write in a warm, emotional, heartfelt, joyful, or nostalgic tone as appropriate.
    
    Provide ONLY the voiceover script with no extra formatting, labels, or quotes.
    `;
    
    console.log("Generating narration script with prompt:", prompt.substring(0, 100) + "...");
    
    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error from Gemini API:", errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        console.error("Unexpected response format from Gemini API:", JSON.stringify(data).substring(0, 200));
        throw new Error("Invalid response format from Gemini API");
      }
      
      const narration = data.candidates[0].content.parts[0].text.trim();
      
      console.log("Generated narration script:", narration);
      
      return narration;
    } catch (apiError) {
      console.error("API error when generating narration:", apiError);
      throw apiError;
    }
  } catch (error) {
    console.error("Error generating narration script:", error);
    // Return a fallback narration
    return "Journey with us through this moment of beauty and wonder.";
  }
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    if (!ELEVEN_LABS_API_KEY) {
      console.error("ELEVEN_LABS_API_KEY is not defined");
      return new Response(
        JSON.stringify({ 
          error: "API key is missing. Please check your environment variables.",
          details: "The ELEVEN_LABS_API_KEY environment variable is not set."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const requestData = await req.json();
    console.log("Request received:", JSON.stringify({
      scriptLength: requestData.script?.length || 0,
      voiceId: requestData.voiceId,
      userId: requestData.userId,
      projectId: requestData.projectId,
      scenesProvided: !!requestData.scenes
    }));
    
    const { scenes, script, voiceId, userId, projectId } = requestData;
    
    // Generate or use provided script
    let narrationScript;
    if (script && script.trim() !== "") {
      console.log("Using provided script:", script);
      narrationScript = script;
    } else if (scenes) {
      // Generate narration based on scenes
      console.log("Generating narration from scenes");
      narrationScript = await generateNarrationScript(scenes);
    } else {
      return new Response(
        JSON.stringify({ error: "Either script or scenes are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    if (!narrationScript || narrationScript.trim() === "") {
      console.error("Failed to generate narration script");
      return new Response(
        JSON.stringify({ error: "Failed to generate a narration script" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Default to Rachel if no voice ID is provided
    const selectedVoiceId = voiceId || "21m00Tcm4TlvDq8ikWAM";
    
    console.log(`Generating audio for project ${projectId} with voice ${selectedVoiceId}`);
    console.log(`Narration script: "${narrationScript}"`);

    const ttsPayload = {
      text: narrationScript,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    };

    // Call ElevenLabs API to generate audio
    try {
      console.log("Calling ElevenLabs API...");
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVEN_LABS_API_KEY,
          "Accept": "audio/mpeg"
        },
        body: JSON.stringify(ttsPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API error response:", errorText);
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      // Get audio data as ArrayBuffer
      const audioBuffer = await response.arrayBuffer();
      
      // Convert to base64 for storage
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(audioBuffer))
      );
      
      console.log("Audio generation successful, returning data");

      return new Response(
        JSON.stringify({ 
          audioBase64: base64Audio,
          format: "mp3",
          voiceId: selectedVoiceId,
          narrationScript: narrationScript,
          voiceName: AVAILABLE_VOICES.find(v => v.id === selectedVoiceId)?.name || "Unknown Voice"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (audioError) {
      console.error("Error generating audio with ElevenLabs:", audioError);
      throw audioError;
    }
  } catch (error) {
    console.error("Error in generate-audio function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
