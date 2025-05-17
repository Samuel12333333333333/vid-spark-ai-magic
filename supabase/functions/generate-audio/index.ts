
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
    
    console.log("Generate audio received request data:", JSON.stringify({
      textLength: requestData?.text?.length || 0,
      title: requestData?.title || "Untitled",
      voice: requestData?.voice || "alloy"
    }, null, 2));
    
    // Extract parameters with fallbacks
    const { text, title = "Untitled", voice = "alloy" } = requestData;
    
    // Validate required parameters - early return if missing text
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.error("Missing or invalid text parameter");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Text is required and must be a non-empty string",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
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
    
    // Try to use selected voice or default to a recommended voice
    let voiceId = "21m00Tcm4TlvDq8ikWAM"; // Default Aria voice
    
    // Map common voice names to IDs
    const voiceMap: {[key: string]: string} = {
      "alloy": "21m00Tcm4TlvDq8ikWAM",  // Default voice
      "aria": "21m00Tcm4TlvDq8ikWAM",
      "roger": "CwhRBWXzGAHq8TQ4Fs17", 
      "sarah": "EXAVITQu4vr4xnSDxMaL",
      "laura": "FGY2WhTYpPnrIDTdsKH5",
      "charlie": "IKne3meq5aSn9XLyUdCD"
    };
    
    // Try to match by name (case insensitive)
    const voiceLower = voice.toLowerCase();
    if (voiceMap[voiceLower]) {
      voiceId = voiceMap[voiceLower];
    }
    
    console.log(`Using voice ID: ${voiceId}`);
    
    // Generate audio using ElevenLabs API
    console.log("Calling ElevenLabs API...");
    
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
        
        // Make sure storage bucket exists
        try {
          // Check if the bucket exists first
          const { data: buckets } = await supabase.storage.listBuckets();
          const bucketExists = buckets?.some(b => b.name === 'video-assets');
          
          if (!bucketExists) {
            // Create the bucket if it doesn't exist
            console.log("Creating video-assets bucket");
            await supabase.storage.createBucket('video-assets', {
              public: true
            });
          }
        } catch (storageError) {
          console.error("Error checking/creating storage bucket:", storageError);
        }
        
        // Store in cache table (assuming a table named 'audio_cache' exists)
        const { error } = await supabase.from('audio_cache').upsert({
          text_hash: hashHex,
          title: title,
          voice: voice,
          audio_content: base64Audio,
          created_at: new Date().toISOString()
        });
        
        if (error) {
          // Don't fail if table doesn't exist yet or other DB error
          console.error("Error saving to audio cache:", error);
        } else {
          console.log("Cached audio for future use");
        }
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
