
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body - expect either text or stringified JSON
    let requestData;
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      requestData = await req.json();
    } else {
      const text = await req.text();
      try {
        requestData = JSON.parse(text);
      } catch (e) {
        requestData = { text: text };
      }
    }
    
    // Extract parameters with fallbacks
    const { text, title = "Untitled", voice = "alloy" } = requestData;
    
    if (!text) {
      throw new Error("Text is required");
    }
    
    console.log(`Generating audio for text length: ${text.length}, title: ${title}, voice: ${voice}`);
    
    // Validate request
    if (text.length > 4000) {
      throw new Error("Text is too long (max 4000 characters)");
    }

    // Get API key from environment
    const apiKey = Deno.env.get("ELEVEN_LABS_API_KEY");
    if (!apiKey) {
      console.error("ELEVEN_LABS_API_KEY not found in environment variables");
      return new Response(
        JSON.stringify({
          success: false,
          error: "ElevenLabs API key is not configured",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    // Generate audio using ElevenLabs API
    console.log("Calling ElevenLabs API...");
    const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Default voice ID if not provided
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("ElevenLabs API error:", errorData);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorData}`);
    }
    
    console.log("Successfully generated audio from ElevenLabs");
    
    // Convert audio to base64
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    
    // Add this audio to cache using Supabase for future requests
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Create a hash of the text to use as a cache key
        const textHash = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(text)
        );
        const hashArray = Array.from(new Uint8Array(textHash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        // Store in cache table (assuming a table named 'audio_cache' exists)
        await supabase.from('audio_cache').upsert({
          text_hash: hashHex,
          title: title,
          voice: voice,
          audio_content: base64Audio,
          created_at: new Date().toISOString()
        }).catch(err => {
          // Don't fail if table doesn't exist yet or other DB error
          console.error("Error saving to audio cache:", err);
        });
        
        console.log("Cached audio for future use");
      }
    } catch (cacheError) {
      // Don't fail the request if caching fails
      console.error("Error caching audio:", cacheError);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        audioContent: base64Audio,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error generating audio:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to generate audio",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
