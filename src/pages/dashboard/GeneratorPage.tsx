
import { VideoGenerator } from "@/components/dashboard/VideoGenerator";
import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function GeneratorPage() {
  useEffect(() => {
    // Set the ElevenLabs API key in Supabase environment
    const setElevenLabsApiKey = async () => {
      try {
        // This is just for demo purposes - in a real app, we'd have a proper admin setting for this
        // The ElevenLabs API key would be set through the Supabase dashboard
        const { data, error } = await supabase.functions.invoke('set-api-key', {
          body: { 
            key: 'ELEVEN_LABS_API_KEY',
            value: 'sk_d4b72330b4e5bbb7ccf3d63848a3625a9147543bc94a42d5'
          }
        });
        
        if (error) {
          console.error('Error setting ElevenLabs API key:', error);
        } else {
          console.log('ElevenLabs API key set successfully');
        }
      } catch (error) {
        console.error('Error in setElevenLabsApiKey:', error);
      }
    };
    
    // This is commented out because we don't have a set-api-key function
    // In a real app, we'd have a proper admin interface for setting API keys
    // setElevenLabsApiKey();
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
