
import { VideoGenerator } from "@/components/dashboard/VideoGenerator";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ExternalLink, AlertTriangle } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { showErrorToast } from "@/lib/error-handler";
import apiKeyValidator, { ApiKeyStatus } from "@/services/apiKeyValidator";

export default function GeneratorPage() {
  const [apiStatus, setApiStatus] = useState<Record<string, ApiKeyStatus>>({});
  const [isCheckingApis, setIsCheckingApis] = useState<boolean>(true);
  const [showDocs, setShowDocs] = useState<boolean>(false);

  useEffect(() => {
    // Check API keys on component mount
    checkApiKeys();
  }, []);

  const checkApiKeys = async () => {
    try {
      setIsCheckingApis(true);
      
      // Validate all API keys
      const results = await apiKeyValidator.validateAllApiKeys();
      setApiStatus(results);
      
      // Show a warning if any key is invalid
      const invalidKeys = Object.values(results).filter(key => !key.isValid);
      if (invalidKeys.length > 0) {
        toast.warning(
          "API Connection Issues Detected", 
          "Some API services are not responding correctly. This may affect video generation."
        );
      } else {
        toast.success(
          "API Connections Verified", 
          "All API keys are valid and connections are working properly."
        );
      }
    } catch (error) {
      console.error('Error checking API keys:', error);
      showErrorToast(error);
    } finally {
      setIsCheckingApis(false);
    }
  };

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
      
      {Object.values(apiStatus).some(status => status.isValid === false) && (
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
                !status.isValid && (
                  <li key={key} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{apiStatusDetails[key]?.name || key}</p>
                      <p className="text-sm text-muted-foreground">
                        Check if <code className="bg-muted px-1 py-0.5 rounded text-xs">{status.key}</code> is correctly set in your Supabase project
                      </p>
                      {status.errorMessage && (
                        <p className="text-xs text-red-500 mt-1">{status.errorMessage}</p>
                      )}
                    </div>
                  </li>
                )
              )}
            </ul>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => checkApiKeys()}
              disabled={isCheckingApis}
            >
              {isCheckingApis ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Checking APIs...
                </>
              ) : (
                "Retry Connection Check"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {Object.values(apiStatus).length > 0 && Object.values(apiStatus).every(status => status.isValid === true) && (
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
      
      {!isCheckingApis && Object.values(apiStatus).length === 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              API Status Check Failed
            </CardTitle>
            <CardDescription>
              Unable to verify API connections. Please check your network connection and try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => checkApiKeys()}
            >
              Retry Connection Check
            </Button>
          </CardContent>
        </Card>
      )}
      
      <ErrorBoundary>
        <VideoGenerator />
      </ErrorBoundary>
    </div>
  );
}
