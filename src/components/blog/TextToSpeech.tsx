
import { useState } from "react";
import { Volume, Pause, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TextToSpeechProps {
  text: string;
  title: string;
}

export function TextToSpeech({ text, title }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const cleanText = (content: string) => {
    // Remove HTML tags
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const generateAndPlayAudio = async () => {
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (audio) {
      audio.play();
      setIsPlaying(true);
      return;
    }

    // Validate we have text to synthesize
    const cleanedText = cleanText(text);
    if (!cleanedText || cleanedText.trim().length === 0) {
      toast.error("No text content to convert to speech");
      return;
    }

    // Limit text to first 3000 characters to avoid API limits
    const trimmedText = cleanedText.substring(0, 3000);
    const shortTitle = title?.substring(0, 100) || "Untitled";

    setIsLoading(true);
    try {
      console.log("Generating audio for text:", trimmedText.substring(0, 100) + "...");
      
      const { data, error } = await supabase.functions.invoke("generate-audio", {
        body: {
          text: trimmedText,
          title: shortTitle,
          voice: "alloy", // Default voice
        },
      });

      if (error) {
        console.error("Error invoking generate-audio:", error);
        throw error;
      }

      if (!data?.audioContent) {
        console.error("No audio content returned:", data);
        throw new Error("No audio content returned");
      }
      
      // Convert base64 to blob URL
      const blob = base64ToBlob(data.audioContent, "audio/mp3");
      const url = URL.createObjectURL(blob);
      
      const newAudio = new Audio(url);
      newAudio.addEventListener("ended", () => {
        setIsPlaying(false);
      });
      
      setAudio(newAudio);
      newAudio.play();
      setIsPlaying(true);
      
      toast.success("Audio generated successfully");
    } catch (error) {
      console.error("Error generating audio:", error);
      toast.error("Failed to generate audio. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to convert base64 to blob
  const base64ToBlob = (base64: string, mimeType: string) => {
    try {
      const byteCharacters = atob(base64);
      const byteArrays = [];
      
      for (let i = 0; i < byteCharacters.length; i += 512) {
        const slice = byteCharacters.slice(i, i + 512);
        
        const byteNumbers = new Array(slice.length);
        for (let j = 0; j < slice.length; j++) {
          byteNumbers[j] = slice.charCodeAt(j);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      return new Blob(byteArrays, { type: mimeType });
    } catch (error) {
      console.error("Error converting base64 to blob:", error);
      throw new Error("Failed to process audio data");
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={generateAndPlayAudio}
            disabled={isLoading}
            aria-label={isPlaying ? "Pause audio" : "Listen to article"}
            className="relative"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Volume className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isPlaying ? "Pause narration" : "Listen to this article"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
