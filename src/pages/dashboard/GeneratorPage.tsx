
import { VideoGenerator } from "@/components/dashboard/VideoGenerator";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function GeneratorPage() {
  const [apiStatus, setApiStatus] = useState<{
    pexels: 'checking' | 'ok' | 'error';
    gemini: 'checking' | 'ok' | 'error';
    shotstack: 'checking' | 'ok' | 'error';
    elevenlabs: 'checking' | 'ok' | 'error';
  }>({
    pexels: 'checking',
    gemini: 'checking',
    shotstack: 'checking',
    elevenlabs: 'checking'
  });
  
  const [isCheckingApis, setIsCheckingApis] = useState(true);

  useEffect(() => {
    // Check if the API keys are set in Supabase environment
    const checkApiKeys = async () => {
      try {
        setIsCheckingApis(true);
        
        // Check Pexels API with proper error handling
        try {
          setApiStatus(prev => ({ ...prev, pexels: 'checking' }));
          const pexelsResult = await supabase.functions.invoke('search-videos', {
            body: { keywords: ["test"] }
          });
          
          if (pexelsResult.error) {
            console.error('Error testing Pexels API key:', pexelsResult.error);
            setApiStatus(prev => ({ ...prev, pexels: 'error' }));
            toast.error("Pexels API connection issue. Please check your API key.");
          } else if (!pexelsResult.data || !Array.isArray(pexelsResult.data.videos)) {
            console.error('Invalid response from Pexels API test:', pexelsResult.data);
            setApiStatus(prev => ({ ...prev, pexels: 'error' }));
            toast.error("Pexels API returned invalid data");
          } else {
            console.log('Pexels API key test successful');
            setApiStatus(prev => ({ ...prev, pexels: 'ok' }));
          }
        } catch (pexelsError) {
          console.error('Exception testing Pexels API:', pexelsError);
          setApiStatus(prev => ({ ...prev, pexels: 'error' }));
          toast.error("Pexels API connection failed");
        }
        
        // Check Gemini API with proper error handling
        try {
          setApiStatus(prev => ({ ...prev, gemini: 'checking' }));
          const geminiResult = await supabase.functions.invoke('generate-scenes', {
            body: { prompt: "Test scene", type: "scene" }
          });
          
          if (geminiResult.error) {
            console.error('Error testing Gemini API key:', geminiResult.error);
            setApiStatus(prev => ({ ...prev, gemini: 'error' }));
            toast.error("Gemini API connection issue. Please check your API key.");
          } else if (!geminiResult.data) {
            console.error('Invalid response from Gemini API test:', geminiResult);
            setApiStatus(prev => ({ ...prev, gemini: 'error' }));
            toast.error("Gemini API returned invalid data");
          } else {
            console.log('Gemini API key test successful');
            setApiStatus(prev => ({ ...prev, gemini: 'ok' }));
          }
        } catch (geminiError) {
          console.error('Exception testing Gemini API:', geminiError);
          setApiStatus(prev => ({ ...prev, gemini: 'error' }));
          toast.error("Gemini API connection failed");
        }
        
        // Check Shotstack API with proper error handling
        try {
          setApiStatus(prev => ({ ...prev, shotstack: 'checking' }));
          
          // Test Shotstack API with a minimal request that won't trigger a full render
          const shotstackTestResult = await supabase.functions.invoke('render-video', {
            body: { 
              scenes: [{
                id: "test-scene",
                scene: "Test Scene",
                description: "A test scene for API validation",
                keywords: ["test"],
                duration: 2,
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              }],
              userId: "test-user",
              projectId: "test-project-" + Date.now(),
              includeCaptions: true
            }
          });
          
          if (shotstackTestResult.error) {
            console.error('Error testing Shotstack API key:', shotstackTestResult.error);
            setApiStatus(prev => ({ ...prev, shotstack: 'error' }));
            toast.error("Shotstack API connection issue. Please check your API key.");
          } else if (!shotstackTestResult.data || !shotstackTestResult.data.renderId) {
            console.error('Invalid response from Shotstack API test:', shotstackTestResult);
            setApiStatus(prev => ({ ...prev, shotstack: 'error' }));
            toast.error("Shotstack API returned invalid data");
          } else {
            console.log('Shotstack API test successful');
            setApiStatus(prev => ({ ...prev, shotstack: 'ok' }));
          }
        } catch (shotstackError) {
          console.error('Exception testing Shotstack API:', shotstackError);
          setApiStatus(prev => ({ ...prev, shotstack: 'error' }));
          toast.error("Shotstack API connection failed");
        }
        
        // Check ElevenLabs API with proper error handling
        try {
          setApiStatus(prev => ({ ...prev, elevenlabs: 'checking' }));
          
          // Use a very short test script to minimize the chance of errors
          const elevenLabsResult = await supabase.functions.invoke('generate-audio', {
            body: { 
              script: "Hello, this is a test.", 
              voiceId: "21m00Tcm4TlvDq8ikWAM",
              userId: "test", 
              projectId: "test" 
            }
          });
          
          // Properly validate ElevenLabs API response
          if (elevenLabsResult.error) {
            console.error('Error testing ElevenLabs API key:', elevenLabsResult.error);
            setApiStatus(prev => ({ ...prev, elevenlabs: 'error' }));
            toast.error("ElevenLabs API connection issue. Please check your API key.");
          } else if (!elevenLabsResult.data) {
            console.error('No data returned from ElevenLabs API test');
            setApiStatus(prev => ({ ...prev, elevenlabs: 'error' }));
            toast.error("ElevenLabs API returned invalid data");
          } else if (!elevenLabsResult.data.audioBase64) {
            console.error('ElevenLabs API did not return audio data');
            setApiStatus(prev => ({ ...prev, elevenlabs: 'error' }));
            toast.error("ElevenLabs API did not generate audio");
          } else {
            console.log('ElevenLabs API key test successful');
            setApiStatus(prev => ({ ...prev, elevenlabs: 'ok' }));
          }
        } catch (elevenLabsError) {
          console.error('Exception testing ElevenLabs API:', elevenLabsError);
          setApiStatus(prev => ({ ...prev, elevenlabs: 'error' }));
          toast.error("ElevenLabs API connection failed");
        }
      } catch (error) {
        console.error('Error in checkApiKeys:', error);
        toast.error("Error checking API connections. See console for details.");
      } finally {
        setIsCheckingApis(false);
      }
    };
    
    // This is useful for debugging API key issues
    checkApiKeys();
  }, []);

  const apiStatusDetails = {
    pexels: {
      name: "Pexels API",
      description: "Provides stock video clips",
      envVar: "PEXELS_API_KEY"
    },
    gemini: {
      name: "Gemini API",
      description: "Generates scene descriptions and narration",
      envVar: "GEMINI_API_KEY"
    },
    elevenlabs: {
      name: "ElevenLabs API",
      description: "Generates voiceovers from text",
      envVar: "ELEVEN_LABS_API_KEY"
    },
    shotstack: {
      name: "Shotstack API",
      description: "Renders final videos",
      envVar: "SHOTSTACK_API_KEY"
    }
  };

  return (
    <div>
      <Helmet>
        <title>Create New Video | SmartVid</title>
      </Helmet>
      
      {Object.values(apiStatus).some(status => status === 'error') && (
        <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              API Connection Issues Detected
            </CardTitle>
            <CardDescription>
              Some API services are not responding correctly. This may affect video generation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {Object.entries(apiStatus).map(([key, status]) => 
                status === 'error' && (
                  <li key={key} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{apiStatusDetails[key as keyof typeof apiStatus].name}</p>
                      <p className="text-sm text-muted-foreground">
                        Check if <code className="bg-muted px-1 py-0.5 rounded text-xs">{apiStatusDetails[key as keyof typeof apiStatus].envVar}</code> is correctly set in your Supabase project
                      </p>
                    </div>
                  </li>
                )
              )}
            </ul>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry Connection Check
            </Button>
          </CardContent>
        </Card>
      )}
      
      {Object.values(apiStatus).every(status => status === 'ok') && (
        <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              All Systems Operational
            </CardTitle>
            <CardDescription>
              All API services are connected and working properly.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      
      {isCheckingApis && (
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              Checking API Connections
            </CardTitle>
            <CardDescription>
              Verifying connection to all required API services...
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      
      <VideoGenerator />
    </div>
  );
}
