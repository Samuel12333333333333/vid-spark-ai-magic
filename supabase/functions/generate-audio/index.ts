
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

    const { script, voiceId, userId, projectId } = await req.json();
    
    if (!script || script.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Script is required and cannot be empty" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Default to Rachel if no voice ID is provided
    const selectedVoiceId = voiceId || "21m00Tcm4TlvDq8ikWAM";
    
    console.log(`Generating audio for project ${projectId} with voice ${selectedVoiceId}`);

    const ttsPayload = {
      text: script,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    };

    // Call ElevenLabs API to generate audio
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

    // Option to transcribe with Whisper API could be added here
    // For now, we'll just return the audio

    return new Response(
      JSON.stringify({ 
        audioBase64: base64Audio,
        format: "mp3",
        voiceId: selectedVoiceId,
        voiceName: AVAILABLE_VOICES.find(v => v.id === selectedVoiceId)?.name || "Unknown Voice"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-audio function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
