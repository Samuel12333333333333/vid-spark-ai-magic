import { VideoGenerator } from "@/components/dashboard/VideoGenerator";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ExternalLink, AlertTriangle, InfoIcon, TerminalIcon, FileCode } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { showErrorToast } from "@/lib/error-handler";
import apiKeyValidator, { ApiKeyStatus } from "@/services/apiKeyValidator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { videoService } from "@/services/videoService";
import { TemplateList } from "@/components/templates/TemplateList";
import { templateService } from "@/services/templateService";
import { Template } from "@/types/template";
import { useNavigate } from "react-router-dom";

export default function GeneratorPage() {
  const [apiStatus, setApiStatus] = useState<Record<string, ApiKeyStatus>>({});
  const [isCheckingApis, setIsCheckingApis] = useState<boolean>(true);
  const [showDocs, setShowDocs] = useState<boolean>(false);
  const [lastRenderError, setLastRenderError] = useState<any>(null);
  const [isLoadingError, setIsLoadingError] = useState(false);
  const [showTemplateInput, setShowTemplateInput] = useState<boolean>(false);
  const [templateJson, setTemplateJson] = useState<string>("");
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState<boolean>(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState("wizard");
  const navigate = useNavigate();
  const isBusiness = true; // Example variable for business plan check
  const hasActiveSubscription = true; // Example variable for subscription check

  useEffect(() => {
    // Check API keys on component mount
    checkApiKeys();
    checkLastError();
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const data = await templateService.getTemplates();
      setTemplates(data.slice(0, 6)); // Show top 6 templates
    } catch (error) {
      console.error("Error loading templates:", error);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const checkLastError = async () => {
    try {
      setIsLoadingError(true);
      // Get the most recent failed video project to display diagnostics
      const { data, error } = await supabase
        .from("video_projects")
        .select("id, error_message, updated_at, status, render_id")
        .eq("status", "failed")
        .order("updated_at", { ascending: false })
        .limit(1);
      
      if (error) {
        console.error("Error fetching last render error:", error);
      } else if (data?.length > 0) {
        setLastRenderError(data[0]);
      }
    } catch (err) {
      console.error("Error checking last render error:", err);
    } finally {
      setIsLoadingError(false);
    }
  };

  const checkApiKeys = async () => {
    try {
      setIsCheckingApis(true);
      
      // Validate all API keys
      const results = await apiKeyValidator.validateAllApiKeys();
      setApiStatus(results);
      
      // Show a warning if any key is invalid
      const invalidKeys = Object.values(results).filter(key => !key.isValid);
      if (invalidKeys.length > 0) {
        toast.warning("API Connection Issues Detected", {
          description: "Some API services are not responding correctly. This may affect video generation."
        });
      } else {
        toast.success("API Connections Verified", {
          description: "All API keys are valid and connections are working properly."
        });
      }
    } catch (error) {
      console.error('Error checking API keys:', error);
      showErrorToast(error);
    } finally {
      setIsCheckingApis(false);
    }
  };

  const generateFromTemplate = async () => {
    try {
      if (!templateJson.trim()) {
        toast.error("Template is empty", {
          description: "Please provide a valid JSON template"
        });
        return;
      }
      
      setIsGeneratingTemplate(true);
      
      let template;
      try {
        template = JSON.parse(templateJson);
      } catch (parseError) {
        toast.error("Invalid JSON template", {
          description: "Please check your template format"
        });
        console.error("Template parsing error:", parseError);
        return;
      }
      
      // Check minimal required fields
      if (!template.timeline || !template.output) {
        toast.error("Invalid template structure", {
          description: "Template must include timeline and output properties"
        });
        return;
      }
      
      // Create basic project details
      const title = template.merge?.find(m => m.find === "HEADLINE")?.replace || "Template Video";
      const prompt = "Generated from custom template";
      
      // Create a new video project
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        toast.error("Authentication error", {
          description: "Please sign in to generate videos"
        });
        return;
      }
      
      const project = await videoService.createProject({
        title,
        prompt,
        user_id: user.id,
        status: "pending",
        style: "custom-template"
      });
      
      if (!project?.id) {
        toast.error("Failed to create project", {
          description: "Could not initialize video generation"
        });
        return;
      }
      
      // Now render using the template
      const { success, renderId, error } = await videoService.startRender(
        project.id,
        prompt,
        "custom-template",
        [], // No scenes needed with template
        false, // Audio is handled in template
        false, // Captions are handled in template
        undefined, 
        undefined,
        template // Pass the template directly
      );
      
      if (success && renderId) {
        toast.success("Template video generation started", {
          description: "We'll notify you when your video is ready"
        });
        
        // Navigate to video page
        navigate(`/dashboard/videos/${project.id}`);
      } else {
        toast.error("Template video generation failed", {
          description: error || "Unknown error occurred"
        });
      }
    } catch (error) {
      console.error("Error generating from template:", error);
      toast.error("Template generation failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  const handleSelectTemplate = (id: string) => {
    // Before navigating to the template, check if the user can access it
    try {
      const template = templates.find(t => t.id === id);
      
      if (!template) {
        toast.error("Template not found");
        return;
      }
      
      // Check subscription requirements
      if (template.is_business_only && !isBusiness) {
        toast.error("Business plan required", {
          description: "This template requires a Business subscription"
        });
        return;
      }
      
      if ((template.is_premium || template.is_pro_only) && !hasActiveSubscription) {
        toast.error("Subscription required", {
          description: "Please upgrade to access premium templates"
        });
        return;
      }
      
      // If all checks pass, navigate to the template
      navigate(`/dashboard/templates/${id}`);
    } catch (error) {
      console.error("Error checking template access:", error);
      // Allow navigation even if check fails
      navigate(`/dashboard/templates/${id}`);
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateInput(!showTemplateInput)}
            >
              <FileCode className="h-4 w-4 mr-2" />
              {showTemplateInput ? "Hide Template Mode" : "Use Template JSON"}
            </Button>
            {lastRenderError && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => checkLastError()}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Check Last Error
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDocs(!showDocs)}
            >
              {showDocs ? "Hide API Docs" : "View API Docs"}
            </Button>
          </div>
        </div>
        
        {showTemplateInput && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Template Mode</CardTitle>
              <CardDescription>
                Paste a Shotstack-compatible template JSON to generate video directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={templateJson}
                onChange={(e) => setTemplateJson(e.target.value)}
                placeholder='{"timeline": {...}, "output": {...}, "merge": [...]}'
                className="font-mono h-64 mb-4"
              />
              <Button 
                onClick={generateFromTemplate}
                disabled={isGeneratingTemplate}
                className="w-full"
              >
                {isGeneratingTemplate ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Generating...
                  </>
                ) : (
                  "Generate from Template"
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Template must be compatible with Shotstack API format including timeline, output, and optional merge fields.
              </p>
            </CardContent>
          </Card>
        )}
        
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
      
      {/* Render Error Diagnostics (if a recent error exists) */}
      {lastRenderError && (
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Video Generation Diagnostics
            </CardTitle>
            <CardDescription>
              Help with diagnosing recent video rendering errors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="error">
              <TabsList className="mb-4">
                <TabsTrigger value="error">Error Details</TabsTrigger>
                <TabsTrigger value="troubleshoot">Troubleshooting</TabsTrigger>
                <TabsTrigger value="help">Get Help</TabsTrigger>
              </TabsList>
              
              <TabsContent value="error">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-900 text-gray-200 rounded-md font-mono text-sm overflow-auto">
                    <div className="flex items-center mb-2">
                      <TerminalIcon className="h-4 w-4 mr-2" />
                      <span className="font-bold">Last Error</span>
                    </div>
                    <p className="whitespace-pre-wrap mb-2">
                      {lastRenderError.error_message || "Unknown error"}
                    </p>
                    <div className="text-gray-400 text-xs">
                      <span>Project ID: {lastRenderError.id}</span>
                      <br />
                      <span>Render ID: {lastRenderError.render_id || "N/A"}</span>
                      <br />
                      <span>Timestamp: {new Date(lastRenderError.updated_at).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => checkLastError()}
                    disabled={isLoadingError}
                  >
                    {isLoadingError ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                        Loading...
                      </>
                    ) : (
                      "Refresh Error Data"
                    )}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="troubleshoot">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="api-keys">
                    <AccordionTrigger>Check API Keys & Credits</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-4">Verify that all required API keys are valid and have sufficient credits:</p>
                      <Button 
                        onClick={() => checkApiKeys()}
                        size="sm" 
                        className="mb-2"
                      >
                        Check API Keys Now
                      </Button>
                      <ul className="list-disc pl-4 mt-2 space-y-1">
                        <li>Shotstack requires credits for rendering</li>
                        <li>Pexels has API rate limits for video searches</li>
                        <li>All API keys must be correctly configured</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="scene-data">
                    <AccordionTrigger>Scene Data Issues</AccordionTrigger>
                    <AccordionContent>
                      <p>Common scene data issues:</p>
                      <ul className="list-disc pl-4 mt-2">
                        <li>Missing video URLs in scenes</li>
                        <li>Malformed JSON in scene descriptions</li>
                        <li>Empty keywords for scene searches</li>
                        <li>Invalid media URLs provided</li>
                      </ul>
                      <p className="mt-4 mb-2">Tips:</p>
                      <ul className="list-disc pl-4">
                        <li>Ensure each scene has descriptive keywords</li>
                        <li>Check for broken URLs in your media sources</li>
                        <li>Keep scene descriptions concise but descriptive</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="template">
                    <AccordionTrigger>Using Direct Templates</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">If scenes aren't working well, try using a direct template:</p>
                      <ol className="list-decimal pl-4 space-y-2">
                        <li>Click "Use Template JSON" at the top of this page</li>
                        <li>Paste a complete Shotstack-compatible template</li>
                        <li>Template must include timeline, output, and merge sections</li>
                        <li>Generate directly without scene processing</li>
                      </ol>
                      <Button
                        onClick={() => setShowTemplateInput(true)}
                        size="sm"
                        className="mt-4"
                      >
                        <FileCode className="h-4 w-4 mr-2" />
                        Show Template Input
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="network">
                    <AccordionTrigger>Network & Timeout Issues</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">Video generation involves multiple API calls which can sometimes fail due to:</p>
                      <ul className="list-disc pl-4">
                        <li>Network connectivity issues</li>
                        <li>API rate limiting or timeouts</li>
                        <li>Long processing times for complex videos</li>
                      </ul>
                      <p className="mt-4">Try generating a shorter video with fewer scenes as a test.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
              
              <TabsContent value="help">
                <div className="space-y-4">
                  <p>If you're still experiencing issues after trying the troubleshooting steps, consider the following:</p>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center">
                      <InfoIcon className="h-4 w-4 mr-2" />
                      How to Get Help
                    </h3>
                    <ol className="list-decimal pl-4 space-y-2">
                      <li>Check the <a href="/docs/shotstack-api.md" className="text-blue-600 hover:underline">Shotstack API documentation</a> for specific error codes and solutions.</li>
                      <li>Try the direct template method using "Use Template JSON" button.</li>
                      <li>Ensure your media URLs are publicly accessible and don't require authentication.</li>
                      <li>Check your network connection and try again in a few minutes.</li>
                    </ol>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => {
                      toast.info("Support request submitted", { 
                        description: "Our team will respond to your issue shortly" 
                      });
                    }}
                  >
                    Get Support
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
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
      
      {!showTemplateInput && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="wizard">Video Wizard</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="wizard" className="pt-2">
            <ErrorBoundary>
              <VideoGenerator />
            </ErrorBoundary>
          </TabsContent>
          
          <TabsContent value="templates" className="pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Templates</CardTitle>
                <CardDescription>
                  Select a template to quickly create a customized video
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateList 
                  templates={templates} 
                  viewMode="grid"
                  isLoading={isLoadingTemplates}
                  onSelectTemplate={handleSelectTemplate}
                />
                {templates.length > 0 && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4" 
                    onClick={() => navigate('/dashboard/templates')}
                  >
                    View All Templates
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
