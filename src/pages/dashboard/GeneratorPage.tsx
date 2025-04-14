
import { VideoGenerator } from "@/components/dashboard/VideoGenerator";
import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function GeneratorPage() {
  useEffect(() => {
    // Check if the API keys are set in Supabase environment
    const checkApiKeys = async () => {
      try {
        // Attempt a minimal call to the search-videos function to verify API key setup
        const { data, error } = await supabase.functions.invoke('search-videos', {
          body: { keywords: ["test"] }
        });
        
        if (error) {
          console.error('Error testing Pexels API key:', error);
          toast.error("Pexels API connection issue. Please check your API key in Supabase dashboard.");
        } else {
          console.log('Pexels API key test successful');
          // Only show success toast for development/debugging
          if (import.meta.env.DEV) {
            toast.success("Pexels API connection successful");
          }
        }
      } catch (error) {
        console.error('Error in checkApiKeys:', error);
      }
    };
    
    // This is useful for debugging API key issues
    if (import.meta.env.DEV) {
      checkApiKeys();
    }
  }, []);
  
  return (
    <div>
      <Helmet>
        <title>Create New Video | SmartVid</title>
      </Helmet>
      <VideoGenerator />
    </div>
  );
}
