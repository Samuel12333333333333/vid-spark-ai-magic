
import { VideoGenerator } from "@/components/dashboard/VideoGenerator";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";

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
  const [showDocs, setShowDocs] = useState(false);

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
          } else if (!pexelsResult.data || !Array.isArray(pexelsResult.data.videos)) {
            console.error('Invalid response from Pexels API test:', pexelsResult.data);
            setApiStatus(prev => ({ ...prev, pexels: 'error' }));
          } else {
            console.log('Pexels API key test successful');
            setApiStatus(prev => ({ ...prev, pexels: 'ok' }));
          }
        } catch (pexelsError) {
          console.error('Exception testing Pexels API:', pexelsError);
          setApiStatus(prev => ({ ...prev, pexels: 'error' }));
        }
        
        // Check Gemini API with proper error handling
        try {
          setApiStatus(prev => ({ ...prev, gemini: 'checking' }));
          const geminiResult = await supabase.functions.invoke('generate-scenes', {
            body: { prompt: "Test scene" }
          });
          
          if (geminiResult.error) {
            console.error('Error testing Gemini API key:', geminiResult.error);
            setApiStatus(prev => ({ ...prev, gemini: 'error' }));
          } else if (!geminiResult.data || !geminiResult.data.scenes) {
            console.error('Invalid response from Gemini API test:', geminiResult);
            setApiStatus(prev => ({ ...prev, gemini: 'error' }));
          } else {
            console.log('Gemini API key test successful');
            setApiStatus(prev => ({ ...prev, gemini: 'ok' }));
          }
        } catch (geminiError) {
          console.error('Exception testing Gemini API:', geminiError);
          setApiStatus(prev => ({ ...prev, gemini: 'error' }));
        }
        
        // Check Shotstack API with proper error handling
        try {
          setApiStatus(prev => ({ ...prev, shotstack: 'checking' }));
          const shotstackTestResult = await supabase.functions.invoke('test-shotstack', {
            body: {} 
          });
          
          if (shotstackTestResult.error) {
            console.error('Error testing Shotstack API key:', shotstackTestResult.error);
            setApiStatus(prev => ({ ...prev, shotstack: 'error' }));
          } else if (!shotstackTestResult.data || !shotstackTestResult.data.success) {
            console.error('Invalid response from Shotstack API test:', shotstackTestResult);
            setApiStatus(prev => ({ ...prev, shotstack: 'error' }));
          } else {
            console.log('Shotstack API test successful');
            setApiStatus(prev => ({ ...prev, shotstack: 'ok' }));
          }
        } catch (shotstackError) {
          console.error('Exception testing Shotstack API:', shotstackError);
          setApiStatus(prev => ({ ...prev, shotstack: 'error' }));
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
          } else if (!elevenLabsResult.data) {
            console.error('No data returned from ElevenLabs API test');
            setApiStatus(prev => ({ ...prev, elevenlabs: 'error' }));
          } else if (!elevenLabsResult.data.audioBase64) {
            console.error('ElevenLabs API did not return audio data');
            setApiStatus(prev => ({ ...prev, elevenlabs: 'error' }));
          } else {
            console.log('ElevenLabs API key test successful');
            setApiStatus(prev => ({ ...prev, elevenlabs: 'ok' }));
          }
        } catch (elevenLabsError) {
          console.error('Exception testing ElevenLabs API:', elevenLabsError);
          setApiStatus(prev => ({ ...prev, elevenlabs: 'error' }));
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
      envVar: "PEXELS_API_KEY",
      docsUrl: "/docs/pexels-api.md"
    },
    gemini: {
      name: "Gemini 2.0 Flash",
      description: "Generates scene descriptions and narration",
      envVar: "GEMINI_API_KEY",
      docsUrl: "/docs/gemini-api.md"
    },
    elevenlabs: {
      name: "ElevenLabs API",
      description: "Generates voiceovers from text",
      envVar: "ELEVEN_LABS_API_KEY",
      docsUrl: "/docs/elevenlabs-api.md"
    },
    shotstack: {
      name: "Shotstack API",
      description: "Renders final videos",
      envVar: "SHOTSTACK_API_KEY",
      docsUrl: "/docs/shotstack-api.md"
    }
  };

  return (
    <div>
      <Helmet>
        <title>Create New Video | SmartVid</title>
      </Helmet>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Create Video</h1>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDocs(!showDocs)}
          >
            {showDocs ? "Hide API Docs" : "View API Docs"}
          </Button>
        </div>
        
        {showDocs && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                SmartVid uses multiple APIs to generate professional videos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(apiStatusDetails).map(([key, details]) => (
                  <a 
                    key={key} 
                    href={details.docsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-4 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{details.name}</h3>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">{details.description}</p>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
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
