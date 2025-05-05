
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
    // Parse request body
    const { text, title, voice = "alloy" } = await req.json();
    
    if (!text) {
      throw new Error("Text is required");
    }
    
    console.log(`Generating audio for text length: ${text.length}, title: ${title}, voice: ${voice}`);
    
    // Validate request
    if (text.length > 4000) {
      throw new Error("Text is too long (max 4000 characters)");
    }

    // Get OpenAI API key from environment
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiApiKey) {
      throw new Error("OpenAI API key is not configured");
    }
    
    // Generate audio from text
    console.log("Calling OpenAI TTS API...");
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: voice,
        response_format: "mp3",
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }
    
    console.log("Successfully generated audio from OpenAI");
    
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
