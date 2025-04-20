import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Loader2, Video, Sparkles, Download, Share2, AlertTriangle, Volume2, FileAudio, Subtitles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { aiService, SceneBreakdown } from "@/services/aiService";
import { mediaService, VideoClip, VoiceOption } from "@/services/mediaService";
import { videoService, VideoProject } from "@/services/videoService";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useVideoLimits } from "@/hooks/useVideoLimits";

type GenerationStep = "script" | "style" | "media" | "branding" | "voiceover" | "generate" | "preview";

export function VideoGenerator() {
  const [currentStep, setCurrentStep] = useState<GenerationStep>("script");
  const [textPrompt, setTextPrompt] = useState("");
  const [videoStyle, setVideoStyle] = useState("ad");
  const [mediaSource, setMediaSource] = useState("stock");
  const [brandColors, setBrandColors] = useState("#0ea5e9");
  const [voiceType, setVoiceType] = useState("none");
  const [enableCaptions, setEnableCaptions] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [scenes, setScenes] = useState<SceneBreakdown[]>([]);
  const [sceneVideos, setSceneVideos] = useState<Map<string, VideoClip>>(new Map());
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [renderId, setRenderId] = useState<string | null>(null);
  const [renderCheckInterval, setRenderCheckInterval] = useState<number | null>(null);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [apiErrors, setApiErrors] = useState<{
    gemini: boolean;
    pexels: boolean;
    shotstack: boolean;
    elevenlabs: boolean;
  }>({
    gemini: false,
    pexels: false,
    shotstack: false,
    elevenlabs: false
  });

  const [narrationScript, setNarrationScript] = useState<string>("");
  const [customNarration, setCustomNarration] = useState<boolean>(false);
  const [generatedNarration, setGeneratedNarration] = useState<string>("");

  const navigate = useNavigate();
  const { user } = useAuth();
  const { canGenerateVideo, remainingVideos, incrementUsage } = useVideoLimits();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to generate videos");
        navigate("/login");
      }
    };
    
    checkAuth();
    
    setVoices(mediaService.getAvailableVoices());
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (renderCheckInterval) {
        clearInterval(renderCheckInterval);
      }
    };
  }, [renderCheckInterval]);

  const videoStyles = [
    { value: "ad", label: "Advertisement" },
    { value: "reel", label: "Social Media Reel" },
    { value: "explainer", label: "Explainer Video" },
    { value: "vlog", label: "Vlog Style" },
    { value: "quote", label: "Quote/Motivation" },
  ];

  const mediaSources = [
    { value: "stock", label: "Use Stock Videos" },
    { value: "upload", label: "Upload My Own" },
    { value: "mixed", label: "Mixed Sources" },
  ];

  const handleNextStep = () => {
    const steps: GenerationStep[] = ["script", "style", "media", "branding", "voiceover", "generate", "preview"];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePreviousStep = () => {
    const steps: GenerationStep[] = ["script", "style", "media", "branding", "voiceover", "generate", "preview"];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const generateScenes = async () => {
    try {
      setGenerationProgress(10);
      setApiErrors({
        gemini: false,
        pexels: false,
        shotstack: false,
        elevenlabs: false
      });
      
      let generatedScenes: SceneBreakdown[];
      try {
        generatedScenes = await aiService.generateScenes(textPrompt);
        
        if (!generatedScenes || generatedScenes.length === 0) {
          throw new Error("No scenes were generated. Please try a different prompt.");
        }
      } catch (error) {
        console.error("Error generating scenes:", error);
        setApiErrors(prev => ({ ...prev, gemini: true }));
        throw new Error("Failed to generate scenes. Please check if the Gemini API Key is set correctly.");
      }
      
      setScenes(generatedScenes);
      setGenerationProgress(25);
      
      const updatedScenes = [...generatedScenes];
      const newSceneVideos = new Map<string, VideoClip>();
      
      try {
        for (const scene of updatedScenes) {
          try {
            if (!scene.keywords || scene.keywords.length === 0) {
              console.warn(`Scene ${scene.id} has no keywords, using scene title instead`);
              scene.keywords = [scene.scene];
            }
            
            const videos = await mediaService.searchVideos(scene.keywords);
            if (videos && videos.length > 0) {
              newSceneVideos.set(scene.id, videos[0]);
            } else {
              console.warn(`No videos found for scene: ${scene.id}`);
            }
          } catch (error) {
            console.error(`Error finding videos for scene: ${scene.id}`, error);
          }
        }
        
        if (newSceneVideos.size === 0) {
          setApiErrors(prev => ({ ...prev, pexels: true }));
          throw new Error("Couldn't find any suitable videos for your scenes. Please check if the Pexels API Key is set correctly.");
        }
      } catch (error) {
        console.error("Error searching for videos:", error);
        if (!apiErrors.pexels) {
          setApiErrors(prev => ({ ...prev, pexels: true }));
        }
        throw error;
      }
      
      setSceneVideos(newSceneVideos);
      setGenerationProgress(45);
      
      let audioContent: string | null = null;
      let scriptContent: string | null = null;
      
      if (voiceType !== "none") {
        try {
          const scenesForNarration = updatedScenes.map(scene => ({
            id: scene.id,
            scene: scene.scene,
            description: scene.description
          }));
          
          const { audioBase64: generatedAudio, narrationScript: generatedScript } = await mediaService.generateAudio(
            "", // Empty script to trigger auto-generation
            voiceType,
            user?.id || "",
            projectId || "temp-project-id",
            scenesForNarration
          );
          
          audioContent = generatedAudio;
          scriptContent = generatedScript;
          setGeneratedNarration(generatedScript);
          setAudioBase64(audioContent);
          setGenerationProgress(60);
        } catch (error) {
          console.error("Error generating audio:", error);
          setApiErrors(prev => ({ ...prev, elevenlabs: true }));
          toast.error("Failed to generate voiceover. Video will be created without narration.");
        }
      } else {
        setGenerationProgress(60);
      }
      
      const scenesForRendering = updatedScenes.map(scene => ({
        ...scene,
        videoUrl: newSceneVideos.get(scene.id)?.url || ""
      })).filter(scene => scene.videoUrl);
      
      if (scenesForRendering.length === 0) {
        throw new Error("No videos found for any scenes. Please try again with a different prompt.");
      }
      
      const projectData = {
        title: textPrompt.slice(0, 50) + (textPrompt.length > 50 ? '...' : ''),
        prompt: textPrompt,
        style: videoStyle,
        media_source: mediaSource,
        brand_colors: brandColors,
        voice_type: voiceType,
        has_audio: voiceType !== "none",
        has_captions: enableCaptions,
        narration_script: scriptContent || narrationScript || "",
        user_id: user?.id || "",
        status: 'processing' as 'pending' | 'processing' | 'completed' | 'failed'
      };
      
      let newProject: VideoProject | null;
      try {
        newProject = await videoService.createProject(projectData);
        if (!newProject) {
          throw new Error("Failed to create video project.");
        }
      } catch (error) {
        console.error("Error creating project:", error);
        throw new Error("Failed to create video project. Please try again later.");
      }
      
      setProjectId(newProject.id);
      
      let renderIdResponse: string;
      try {
        renderIdResponse = await mediaService.renderVideo(
          scenesForRendering, 
          user?.id || "", 
          newProject.id,
          audioContent || undefined,
          enableCaptions,
          scriptContent || narrationScript || undefined
        );
        
        if (!renderIdResponse) {
          setApiErrors(prev => ({ ...prev, shotstack: true }));
          throw new Error("Failed to start video rendering. Please check if the Shotstack API Key is set correctly.");
        }
      } catch (error) {
        console.error("Error rendering video:", error);
        if (!apiErrors.shotstack) {
          setApiErrors(prev => ({ ...prev, shotstack: true }));
        }
        
        if (newProject) {
          await videoService.updateProject(newProject.id, {
            status: "failed" as "pending" | "processing" | "completed" | "failed"
          });
        }
        
        throw error;
      }
      
      setRenderId(renderIdResponse);
      setGenerationProgress(80);
      
      const intervalId = window.setInterval(async () => {
        try {
          if (!renderIdResponse) {
            console.error("No render ID to check status for");
            return;
          }
          
          const { status, url } = await mediaService.checkRenderStatus(renderIdResponse);
          console.log(`Checking render status: ${status}, URL: ${url || 'not ready'}`);
          
          if (status === "done" && url) {
            clearInterval(intervalId);
            setRenderCheckInterval(null);
            setGenerationProgress(100);
            setGeneratedVideoUrl(url);
            setIsGenerating(false);
            setCurrentStep("preview");
            
            await videoService.updateProject(newProject.id, {
              status: "completed" as "pending" | "processing" | "completed" | "failed",
              video_url: url,
              thumbnail_url: url,
              duration: scenesForRendering.reduce((acc, scene) => acc + scene.duration, 0)
            });
            
            toast.success("Your video has been generated successfully!");
          } else if (status === "failed") {
            clearInterval(intervalId);
            setRenderCheckInterval(null);
            setIsGenerating(false);
            setGenerationProgress(0);
            setApiErrors(prev => ({ ...prev, shotstack: true }));
            
            await videoService.updateProject(newProject.id, {
              status: "failed" as "pending" | "processing" | "completed" | "failed"
            });
            
            toast.error("Video generation failed. Please try again.");
          } else {
            if (status === "queued") setGenerationProgress(80);
            if (status === "fetching") setGenerationProgress(85);
            if (status === "rendering") setGenerationProgress(90);
            if (status === "saving") setGenerationProgress(95);
          }
        } catch (error) {
          console.error("Error checking render status:", error);
        }
      }, 5000);
      
      setRenderCheckInterval(intervalId);
    } catch (error) {
      console.error("Error generating video:", error);
      setIsGenerating(false);
      setGenerationProgress(0);
      toast.error(error instanceof Error ? error.message : "Error generating video. Please try again.");
    }
  };

  const handleVideoGenerate = async () => {
    if (!textPrompt) {
      toast.error("Please enter a text prompt for your video");
      return;
    }

    const canProceed = await incrementUsage();
    if (!canProceed) {
      return;
    }
    
    setIsGenerating(true);
    generateScenes();
  };

  const handleDownload = () => {
    if (generatedVideoUrl) {
      const a = document.createElement('a');
      a.href = generatedVideoUrl;
      a.download = `smartvid-${projectId || Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Your video is being downloaded");
    } else {
      toast.error("No video available to download");
    }
  };

  const handleShare = () => {
    if (projectId) {
      const shareUrl = `${window.location.origin}/video/${projectId}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Video link copied to clipboard");
    } else {
      toast.error("Cannot share video: Project ID is missing");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Video</h1>
        <p className="text-muted-foreground">Follow the steps below to generate your video</p>
      </div>

      <Alert className="mb-6" variant={apiErrors.gemini || apiErrors.pexels || apiErrors.shotstack || apiErrors.elevenlabs ? "destructive" : "default"}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>API Keys Required</AlertTitle>
        <AlertDescription>
          Make sure the required API keys are set in your Supabase project:
          <ul className="list-disc ml-6 mt-2">
            <li className={apiErrors.gemini ? "text-destructive font-semibold" : ""}>
              GEMINI_API_KEY - For scene generation {apiErrors.gemini && "(Error detected)"}
            </li>
            <li className={apiErrors.pexels ? "text-destructive font-semibold" : ""}>
              PEXELS_API_KEY - For stock video clips {apiErrors.pexels && "(Error detected)"}
            </li>
            <li className={apiErrors.shotstack ? "text-destructive font-semibold" : ""}>
              SHOTSTACK_API_KEY - For video rendering {apiErrors.shotstack && "(Error detected)"}
            </li>
            <li className={apiErrors.elevenlabs ? "text-destructive font-semibold" : ""}>
              ELEVEN_LABS_API_KEY - For voiceover generation {apiErrors.elevenlabs && "(Error detected)"}
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      <Alert className="mb-6">
        <AlertTitle>Video Generation Limit</AlertTitle>
        <AlertDescription>
          You have {remainingVideos} video {remainingVideos === 1 ? 'generation' : 'generations'} remaining this month.
        </AlertDescription>
      </Alert>

      <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as GenerationStep)}>
        <TabsList className="grid grid-cols-7 mb-8">
          <TabsTrigger value="script" disabled={isGenerating}>Script</TabsTrigger>
          <TabsTrigger value="style" disabled={!textPrompt || isGenerating}>Style</TabsTrigger>
          <TabsTrigger value="media" disabled={!textPrompt || isGenerating}>Media</TabsTrigger>
          <TabsTrigger value="branding" disabled={!textPrompt || isGenerating}>Branding</TabsTrigger>
          <TabsTrigger value="voiceover" disabled={!textPrompt || isGenerating}>Voice & Captions</TabsTrigger>
          <TabsTrigger value="generate" disabled={!textPrompt || isGenerating}>Generate</TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedVideoUrl}>Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="script">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Add Your Script or Idea</CardTitle>
              <CardDescription>
                Describe what you want in your video. Be as detailed as possible for better results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g., Create a video explaining how artificial intelligence is changing the way we work. Include scenes of people using technology in offices, AI visualizations, and end with future predictions."
                className="min-h-32"
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
              />
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  <Sparkles className="inline-block w-4 h-4 mr-1" />
                  For best results, include details about scenes, visuals, and message.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" disabled>
                Back
              </Button>
              <Button onClick={handleNextStep} disabled={!textPrompt.trim()}>
                Next Step
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="style">
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Choose Video Style</CardTitle>
              <CardDescription>
                Select the style that best matches your video needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={videoStyle} 
                onValueChange={setVideoStyle}
                className="grid grid-cols-2 gap-4"
              >
                {videoStyles.map((style) => (
                  <div key={style.value} className="flex items-start space-x-2">
                    <RadioGroupItem value={style.value} id={style.value} className="mt-1" />
                    <div className="grid gap-1.5">
                      <Label htmlFor={style.value}>{style.label}</Label>
                      <p className="text-sm text-muted-foreground">
                        Optimized for {style.label.toLowerCase()} content
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousStep}>
                Back
              </Button>
              <Button onClick={handleNextStep}>
                Next Step
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Media Selection</CardTitle>
              <CardDescription>
                Choose where to source the video clips from
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={mediaSource} 
                onValueChange={setMediaSource}
                className="grid gap-4"
              >
                {mediaSources.map((source) => (
                  <div key={source.value} className="flex items-start space-x-2">
                    <RadioGroupItem value={source.value} id={source.value} className="mt-1" />
                    <div className="grid gap-1.5">
                      <Label htmlFor={source.value}>{source.label}</Label>
                      <p className="text-sm text-muted-foreground">
                        {source.value === "stock" 
                          ? "We'll select high-quality stock videos that match your script" 
                          : source.value === "upload" 
                          ? "Upload your own video clips and images"
                          : "Combine your uploads with our stock library"}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              {mediaSource === "upload" && (
                <div className="mt-4">
                  <Label htmlFor="media-upload">Upload media files</Label>
                  <Input id="media-upload" type="file" multiple className="mt-2" />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousStep}>
                Back
              </Button>
              <Button onClick={handleNextStep}>
                Next Step
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Brand Customization</CardTitle>
              <CardDescription>
                Add your brand elements to make the video yours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="brand-color">Brand Color</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input 
                    type="color" 
                    id="brand-color" 
                    value={brandColors}
                    onChange={(e) => setBrandColors(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input 
                    type="text" 
                    value={brandColors}
                    onChange={(e) => setBrandColors(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="logo-upload">Logo (Optional)</Label>
                <Input id="logo-upload" type="file" className="mt-1.5" />
              </div>
              
              <div>
                <Label htmlFor="font-style">Font Style</Label>
                <select 
                  id="font-style" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                  <option value="playful">Playful</option>
                  <option value="bold">Bold</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousStep}>
                Back
              </Button>
              <Button onClick={handleNextStep}>
                Next Step
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="voiceover">
          <Card>
            <CardHeader>
              <CardTitle>Step 5: Voiceover & Captions</CardTitle>
              <CardDescription>
                Add a professional voiceover and captions to your video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="voice-select" className="text-base font-medium">AI Voiceover</Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="enable-voice" className="text-sm">Enable</Label>
                    <Switch 
                      id="enable-voice" 
                      checked={voiceType !== "none"}
                      onCheckedChange={(checked) => setVoiceType(checked ? "21m00Tcm4TlvDq8ikWAM" : "none")}
                    />
                  </div>
                </div>

                {voiceType !== "none" && (
                  <div className="space-y-4">
                    <Select value={voiceType} onValueChange={setVoiceType}>
                      <SelectTrigger id="voice-select" className="w-full">
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="px-4 py-3 bg-muted/50 rounded-lg flex items-center gap-3">
                      <FileAudio className="h-5 w-5 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="font-medium">ElevenLabs AI voices</p>
                        <p className="text-muted-foreground">High-quality, lifelike AI narration for your video</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="custom-narration" className="text-sm">Use custom narration script</Label>
                        <Switch
                          id="custom-narration"
                          checked={customNarration}
                          onCheckedChange={setCustomNarration}
                        />
                      </div>
                      
                      {customNarration && (
                        <div className="space-y-2">
                          <Label htmlFor="narration-script">Narration Script (15-40 words recommended)</Label>
                          <Textarea
                            id="narration-script"
                            placeholder="Enter a natural, emotional narration script that enhances the mood of your video..."
                            value={narrationScript}
                            onChange={(e) => setNarrationScript(e.target.value)}
                            className="min-h-24"
                          />
                          <p className="text-xs text-muted-foreground">
                            For best results, write in a warm, natural tone that complements the visual story.
                          </p>
                        </div>
                      )}
                      
                      {!customNarration && (
                        <div className="px-4 py-3 bg-muted/50 rounded-lg">
                          <p className="text-sm">
                            AI will automatically generate an emotionally resonant narration script based on your video content.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="enable-captions" className="text-base font-medium">Captions</Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="enable-captions" className="text-sm">Enable</Label>
                    <Switch 
                      id="enable-captions" 
                      checked={enableCaptions}
                      onCheckedChange={setEnableCaptions}
                    />
                  </div>
                </div>

                {enableCaptions && (
                  <div className="px-4 py-3 bg-muted/50 rounded-lg flex items-center gap-3">
                    <Subtitles className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="font-medium">Automatic captions</p>
                      <p className="text-muted-foreground">
                        {voiceType !== "none" 
                          ? "Voiceover narration will be displayed as captions in your video" 
                          : "Scene titles will be displayed as captions in your video"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousStep}>
                Back
              </Button>
              <Button onClick={handleNextStep}>
                Next Step
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Step 6: Generate Your Video</CardTitle>
              <CardDescription>
                Review your choices and generate your video
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Script/Prompt:</span>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep("script")}>
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{textPrompt}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Video Style:</span>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentStep("style")}>
                        Edit
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {videoStyles.find(s => s.value === videoStyle)?.label}
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Media Source:</span>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentStep("media")}>
                        Edit
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {mediaSources.find(s => s.value === mediaSource)?.label}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Voiceover:</span>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentStep("voiceover")}>
                        Edit
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {voiceType !== "none" ? (
                        <>
                          <Volume2 className="h-4 w-4" />
                          <span>{voices.find(v => v.id === voiceType)?.name || "Unknown Voice"}</span>
                        </>
                      ) : (
                        "No voiceover"
                      )}
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Captions:</span>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentStep("voiceover")}>
                        Edit
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {enableCaptions ? (
                        <>
                          <Subtitles className="h-4 w-4" />
                          <span>Enabled</span>
                        </>
                      ) : (
                        "Disabled"
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Estimated Time:</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    1-2 minutes (depending on video length and complexity)
                  </p>
                </div>
                
                {isGenerating && (
                  <div className="space-y-2 py-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Generation Progress</span>
                      <span className="text-sm">{generationProgress}%</span>
                    </div>
                    <Progress value={generationProgress} />
                    <div className="flex items-center justify-center py-4 space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin text-smartvid-600" />
                      <span className="text-sm">
                        {generationProgress < 25
                          ? "Analyzing your prompt..."
                          : generationProgress < 45
                          ? "Finding the perfect clips..."
                          : generationProgress < 60
                          ? "Generating voiceover..."
                          : generationProgress < 80
                          ? "Creating final video..."
                          : "Finalizing your video..."}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousStep} disabled={isGenerating}>
                Back
              </Button>
              <Button 
                onClick={handleVideoGenerate} 
                disabled={isGenerating || !canGenerateVideo} 
                className="bg-smartvid-600 hover:bg-smartvid-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : !canGenerateVideo ? (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Monthly Limit Reached
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Generate Video
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Your Video is Ready!</CardTitle>
              <CardDescription>
                Preview your video and download or share it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
                  {generatedVideoUrl ? (
                    <video 
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      muted
                    >
                      <source src={generatedVideoUrl} type="video/mp4" />
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <p className="text-muted-foreground">Video not available</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button onClick={handleDownload} className="bg-smartvid-600 hover:bg-smartvid-700">
                    <Download className="mr-2 h-4 w-4" />
                    Download MP4
                  </Button>
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Video
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Video Information</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Resolution:</span>
                    <span>1080p HD</span>
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{Math.round(scenes.reduce((acc, scene) => acc + scene.duration, 0))} seconds</span>
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("generate")}>
                Back
              </Button>
              <Button 
                onClick={() => {
                  setTextPrompt("");
                  setCurrentStep("script");
                  setGeneratedVideoUrl("");
                }}
              >
                Create New Video
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
