
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Loader2, Video, Sparkles, Download, Share2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type GenerationStep = "script" | "style" | "media" | "branding" | "voiceover" | "generate" | "preview";

export function VideoGenerator() {
  const [currentStep, setCurrentStep] = useState<GenerationStep>("script");
  const [textPrompt, setTextPrompt] = useState("");
  const [videoStyle, setVideoStyle] = useState("ad");
  const [mediaSource, setMediaSource] = useState("stock");
  const [brandColors, setBrandColors] = useState("#0ea5e9");
  const [voiceType, setVoiceType] = useState("male");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");
  const navigate = useNavigate();

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

  const voiceOptions = [
    { value: "male", label: "Male Voice" },
    { value: "female", label: "Female Voice" },
    { value: "neutral", label: "Gender Neutral" },
    { value: "none", label: "No Voiceover" },
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

  const simulateVideoGeneration = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Create a video project in Supabase
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        toast.error("You must be logged in to generate videos");
        navigate("/login");
        return;
      }

      const { data, error } = await supabase.from('video_projects').insert({
        title: textPrompt.slice(0, 50) + (textPrompt.length > 50 ? '...' : ''),
        prompt: textPrompt,
        style: videoStyle,
        media_source: mediaSource,
        brand_colors: brandColors,
        voice_type: voiceType,
        user_id: user.user.id,
        status: 'processing'
      }).select().single();

      if (error) {
        console.error("Error creating video project:", error);
        toast.error("Failed to create video project");
        setIsGenerating(false);
        return;
      }

      // Simulate a progress update
      const interval = setInterval(async () => {
        setGenerationProgress((prev) => {
          const newProgress = prev + 10;
          
          if (newProgress >= 100) {
            clearInterval(interval);
            setIsGenerating(false);
            setGeneratedVideoUrl("/placeholder.svg"); // Replace with actual video URL
            setCurrentStep("preview");

            // Update the video project with the generated URL
            supabase.from('video_projects').update({
              status: 'completed',
              video_url: '/placeholder.svg',
              thumbnail_url: '/placeholder.svg',
              duration: 45
            }).eq('id', data.id).then(({ error }) => {
              if (error) {
                console.error("Error updating video project:", error);
              }
            });

            toast.success("Your video has been generated successfully!");
            return 100;
          }
          
          return newProgress;
        });
      }, 800);
    } catch (error) {
      console.error("Error during video generation:", error);
      toast.error("An error occurred during video generation");
      setIsGenerating(false);
    }
  };

  const handleVideoGenerate = () => {
    if (!textPrompt) {
      toast.error("Please enter a text prompt for your video");
      return;
    }
    
    simulateVideoGeneration();
  };

  const handleDownload = () => {
    toast.success("Your video is being downloaded");
  };

  const handleShare = () => {
    navigator.clipboard.writeText("https://example.com/share/video123");
    toast.success("Video link copied to clipboard");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Video</h1>
        <p className="text-muted-foreground">Follow the steps below to generate your video</p>
      </div>

      <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as GenerationStep)}>
        <TabsList className="grid grid-cols-7 mb-8">
          <TabsTrigger value="script" disabled={isGenerating}>Script</TabsTrigger>
          <TabsTrigger value="style" disabled={!textPrompt || isGenerating}>Style</TabsTrigger>
          <TabsTrigger value="media" disabled={!textPrompt || isGenerating}>Media</TabsTrigger>
          <TabsTrigger value="branding" disabled={!textPrompt || isGenerating}>Branding</TabsTrigger>
          <TabsTrigger value="voiceover" disabled={!textPrompt || isGenerating}>Voiceover</TabsTrigger>
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
              <CardTitle>Step 5: AI Voiceover (Optional)</CardTitle>
              <CardDescription>
                Add a professional voiceover to your video
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={voiceType} 
                onValueChange={setVoiceType}
                className="grid gap-4"
              >
                {voiceOptions.map((option) => (
                  <div key={option.value} className="flex items-start space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div className="grid gap-1.5">
                      <Label htmlFor={option.value}>{option.label}</Label>
                      {option.value !== "none" && (
                        <div className="flex items-center gap-2 mt-1">
                          <Button variant="outline" size="sm" className="h-8">
                            Preview Voice
                          </Button>
                          <select 
                            className="flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="natural">Natural</option>
                            <option value="professional">Professional</option>
                            <option value="friendly">Friendly</option>
                            <option value="authoritative">Authoritative</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </RadioGroup>

              {voiceType !== "none" && (
                <div className="mt-4 space-y-4">
                  <div>
                    <Label>Voice Speed</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Slow</span>
                      <Input type="range" min="0.5" max="2" step="0.1" defaultValue="1" className="flex-1" />
                      <span className="text-sm">Fast</span>
                    </div>
                  </div>
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
                        {generationProgress < 30
                          ? "Analyzing your prompt..."
                          : generationProgress < 60
                          ? "Finding the perfect clips..."
                          : generationProgress < 90
                          ? "Applying styles and transitions..."
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
                disabled={isGenerating} 
                className="bg-smartvid-600 hover:bg-smartvid-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
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
                  {generatedVideoUrl && (
                    <img 
                      src={generatedVideoUrl} 
                      alt="Generated video preview"
                      className="w-full h-full object-cover"
                    />
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
                    <span>00:45</span>
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
