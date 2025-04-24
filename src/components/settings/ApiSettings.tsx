
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Code, Copy, Key, RefreshCw, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mock API documentation items
const API_ENDPOINTS = [
  {
    method: "GET",
    path: "/api/videos",
    description: "List all videos for the authenticated user",
    responseType: "VideoProject[]",
  },
  {
    method: "GET",
    path: "/api/videos/:id",
    description: "Get details of a specific video",
    responseType: "VideoProject",
  },
  {
    method: "POST",
    path: "/api/videos",
    description: "Generate a new video from a text prompt",
    responseType: "VideoProject",
  },
  {
    method: "DELETE",
    path: "/api/videos/:id",
    description: "Delete a video project",
    responseType: "{ success: boolean }",
  },
  {
    method: "GET",
    path: "/api/templates",
    description: "List all available templates",
    responseType: "Template[]",
  },
];

export function ApiSettings() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  
  const hasPaidPlan = subscription?.plan_name !== 'free';
  
  useEffect(() => {
    // Mock API key for demonstration purposes
    // In a real app, this would be fetched from the backend
    if (hasPaidPlan) {
      setApiKey("sk_test_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    }
  }, [hasPaidPlan]);

  const handleCopyKey = () => {
    if (!apiKey) return;
    
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied to clipboard");
  };
  
  const handleGenerateKey = () => {
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      const newKey = "sk_test_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setApiKey(newKey);
      setIsGenerating(false);
      toast.success("New API key generated");
    }, 1500);
  };

  if (!hasPaidPlan) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldAlert className="h-5 w-5 mr-2 text-muted-foreground" />
              API Access Restricted
            </CardTitle>
            <CardDescription>
              API access is only available on Business plans or higher.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center py-6">
            <div className="flex justify-center">
              <Key className="h-12 w-12 text-muted-foreground opacity-40" />
            </div>
            <p className="text-muted-foreground">
              Upgrade to a Business plan to access the SmartVid API and integrate
              video generation directly into your applications.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="default" className="w-full sm:w-auto">
              Upgrade to Business
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage your API keys for integration with SmartVid
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Key className="h-4 w-4" />
            <AlertTitle>Keep your API keys secure</AlertTitle>
            <AlertDescription>
              Your API keys carry privileges, so be sure to keep them secure. Don't share your secret API keys in publicly accessible areas.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Secret API Key</Label>
              <div className="flex">
                <div className="relative flex-1">
                  <Input 
                    value={showKey ? apiKey || "" : "•••• •••• •••• ••••"}
                    readOnly 
                    className="pr-20 font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? "Hide" : "Show"}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="ml-2"
                  onClick={handleCopyKey}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Created {new Date().toLocaleDateString()}
              </p>
            </div>
            
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              onClick={handleGenerateKey}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate API Key
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            Reference documentation for the SmartVid API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Authentication</h3>
            <p className="text-sm text-muted-foreground">
              All API requests must include your API key in the Authorization header:
            </p>
            <div className="bg-muted rounded-md p-3 text-sm font-mono mt-2">
              Authorization: Bearer YOUR_API_KEY
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Base URL</h3>
            <p className="text-sm text-muted-foreground">
              All API endpoints are relative to:
            </p>
            <div className="bg-muted rounded-md p-3 text-sm font-mono mt-2">
              https://api.smartvid.com/v1
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Endpoints</h3>
            
            {API_ENDPOINTS.map((endpoint, index) => (
              <div key={index} className="border rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={
                    endpoint.method === 'GET' ? 'secondary' :
                    endpoint.method === 'POST' ? 'default' :
                    endpoint.method === 'DELETE' ? 'destructive' : 'outline'
                  }>
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono">{endpoint.path}</code>
                </div>
                <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Code className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Returns: {endpoint.responseType}</span>
                </div>
              </div>
            ))}
            
            <div className="text-center mt-6">
              <Button variant="outline" className="w-full sm:w-auto">
                View Full API Documentation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
