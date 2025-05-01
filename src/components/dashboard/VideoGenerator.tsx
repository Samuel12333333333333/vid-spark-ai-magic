import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { videoService } from "@/services/videoService";
import { validateVideoPrompt } from "@/lib/input-validator";
import { useVideoLimits } from "@/hooks/useVideoLimits";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { AlertCircle, Info, Image, Music, Upload, Video, Headphones } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

const VOICE_OPTIONS = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Warm and professional female voice" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", description: "Confident and strong female voice" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Professional and clear female voice" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", description: "Approachable and friendly female voice" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Trustworthy male voice" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", description: "Deep and authoritative male voice" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Josh", description: "Warm and engaging male voice" },
];

export function VideoGenerator() {
  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<string>('modern');
  const [format, setFormat] = useState<string>('16:9');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showTips, setShowTips] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('content');
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Brand kit options
  const [useBrandKit, setUseBrandKit] = useState<boolean>(false);
  const [primaryColor, setPrimaryColor] = useState<string>('#0ea5e9');
  const [secondaryColor, setSecondaryColor] = useState<string>('#6366f1');
  const [selectedFont, setSelectedFont] = useState<string>('inter');
  
  // Media options
  const [mediaSource, setMediaSource] = useState<string>('stock');
  const [uploadedMedia, setUploadedMedia] = useState<File[]>([]);
  
  // Voice options
  const [useVoiceover, setUseVoiceover] = useState<boolean>(false);
  const [voiceId, setVoiceId] = useState<string>("21m00Tcm4TlvDq8ikWAM");
  const [voiceScript, setVoiceScript] = useState<string>('');
  const [autoGenerateScript, setAutoGenerateScript] = useState<boolean>(true);
  
  const { usageCount, canGenerateVideo, remainingVideos, incrementUsage, maxVideosPerMonth, refreshUsage } = useVideoLimits();
  const { session } = useAuth();
  const { hasActiveSubscription, isPro, isBusiness } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Handle prefilling from a failed project
  useEffect(() => {
    const state = location.state as { projectToRetry?: any };
    if (state?.projectToRetry) {
      setPrompt(state.projectToRetry.prompt || '');
      setStyle(state.projectToRetry.style || 'modern');
      // If available, also restore other settings
      if (state.projectToRetry.format) setFormat(state.projectToRetry.format);
      if (state.projectToRetry.narration_script) {
        setVoiceScript(state.projectToRetry.narration_script);
        setUseVoiceover(true);
      }
      // Clear location state to prevent persistent prefill
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
  // Refresh limits when component mounts
  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedMedia(prev => [...prev, ...newFiles]);
    }
  };
  
  // Remove uploaded file
  const handleRemoveFile = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };
  
  // Auto-generate voice script from prompt when enabled
  useEffect(() => {
    if (autoGenerateScript && prompt && prompt.length > 30) {
      // Create a simplified version of the prompt for narration
      const simplifiedScript = prompt.split('.').slice(0, 3).join('.') + '.';
      setVoiceScript(simplifiedScript);
    }
  }, [prompt, autoGenerateScript]);
  
  // Navigate between steps
  const goToNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      
      // Update active tab based on step
      switch (currentStep + 1) {
        case 1:
          setActiveTab('content');
          break;
        case 2:
          setActiveTab('style');
          break;
        case 3:
          setActiveTab('media');
          break;
        case 4:
          setActiveTab('voice');
          break;
      }
    }
  };
  
  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      
      // Update active tab based on step
      switch (currentStep - 1) {
        case 1:
          setActiveTab('content');
          break;
        case 2:
          setActiveTab('style');
          break;
        case 3:
          setActiveTab('media');
          break;
        case 4:
          setActiveTab('voice');
          break;
      }
    }
  };
  
  // Set active tab and corresponding step
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    switch (value) {
      case 'content':
        setCurrentStep(1);
        break;
      case 'style':
        setCurrentStep(2);
        break;
      case 'media':
        setCurrentStep(3);
        break;
      case 'voice':
        setCurrentStep(4);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      toast.error("You must be logged in to create videos");
      navigate('/login');
      return;
    }
    
    const validation = validateVideoPrompt(prompt);
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }
    
    if (!canGenerateVideo) {
      if (hasActiveSubscription) {
        toast.error(`You've reached your limit of ${maxVideosPerMonth} videos for this billing period.`);
      } else {
        toast.error(`You've reached your limit of ${maxVideosPerMonth} total videos on the free tier.`);
      }
      navigate('/dashboard/upgrade');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First increment usage count - but continue on error
      try {
        await incrementUsage();
      } catch (usageError) {
        console.error("Error incrementing usage:", usageError);
        // Continue with video generation even if usage tracking fails
      }
      
      // Show longer processing toast
      toast.loading("Generating video from your prompt...", {
        duration: 10000,
        id: "video-generation"
      });
      
      // Upload media if necessary
      let mediaUrls: string[] = [];
      if (mediaSource === 'upload' && uploadedMedia.length > 0) {
        try {
          for (const file of uploadedMedia) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${session.user.id}/${fileName}`;
            
            const { error: uploadError, data } = await supabase.storage
              .from('user-media')
              .upload(filePath, file);
              
            if (uploadError) {
              console.error('Error uploading file:', uploadError);
              throw new Error(`Failed to upload media: ${uploadError.message}`);
            }
            
            const { data: { publicUrl } } = supabase.storage
              .from('user-media')
              .getPublicUrl(filePath);
              
            mediaUrls.push(publicUrl);
          }
        } catch (uploadError) {
          console.error("Error uploading media:", uploadError);
          toast.error("Failed to upload media. Using stock videos instead.");
          // Fall back to stock videos
          mediaUrls = [];
        }
      }
      
      // Prepare brand kit data if enabled
      const brandKit = useBrandKit ? {
        primaryColor,
        secondaryColor,
        font: selectedFont,
      } : undefined;
      
      // Prepare voice data if enabled
      const voiceSettings = useVoiceover ? {
        voiceId,
        script: voiceScript,
      } : undefined;
      
      const result = await videoService.generateVideo({
        prompt,
        style,
        format,
        userId: session?.user.id || '',
        brandKit,
        mediaUrls,
        useStockMedia: mediaSource === 'stock',
        voiceSettings,
        modelVersion: 'gemini-2.0-flash', // Explicitly use Gemini 2.0 Flash
      });
      
      // Dismiss loading toast
      toast.dismiss("video-generation");
      
      if (result.success && result.videoId) {
        toast.success("Your video is being generated! You'll be notified when it's ready.");
        navigate(`/dashboard/videos/${result.videoId}`);
      } else {
        toast.error(result.error || "Failed to start video generation. Please try again.");
        // Show tips if there's an error
        setShowTips(true);
      }
    } catch (error) {
      console.error("Error generating video:", error);
      toast.dismiss("video-generation");
      toast.error("An unexpected error occurred. Please try again.");
      // Show tips if there's an error
      setShowTips(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const promptTips = [
    "Be specific about what you want to see in the video",
    "Include the purpose or message of your video",
    "Mention visual elements or style preferences",
    "Keep your prompt between 50-200 characters for best results",
    "Try to avoid very abstract concepts or vague descriptions"
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Video</CardTitle>
          <CardDescription>
            Turn your text into a professional video with AI
          </CardDescription>
          
          <div className={`mt-2 p-3 rounded-md border ${
            !canGenerateVideo 
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" 
              : remainingVideos <= 3
              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
              : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
          }`}>
            <div className="flex items-start gap-2">
              {!canGenerateVideo ? (
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              ) : remainingVideos <= 3 ? (
                <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Info className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              )}
              
              <div>
                <p className={`text-sm ${
                  !canGenerateVideo 
                    ? "text-red-800 dark:text-red-300" 
                    : remainingVideos <= 3
                    ? "text-amber-800 dark:text-amber-300"
                    : "text-emerald-800 dark:text-emerald-300"
                }`}>
                  <span className="font-semibold">Your usage: </span> 
                  {usageCount} / {maxVideosPerMonth} videos {remainingVideos > 0 ? `(${remainingVideos} remaining)` : ''}
                </p>
                
                {!hasActiveSubscription && (
                  <p className="text-sm mt-1 text-amber-800 dark:text-amber-300">
                    Free tier limits you to {maxVideosPerMonth} videos total.{" "}
                    <Link to="/dashboard/upgrade" className="font-medium underline">Upgrade your plan</Link> for more videos.
                  </p>
                )}
                
                {hasActiveSubscription && remainingVideos <= 3 && (
                  <p className="text-sm mt-1 text-amber-800 dark:text-amber-300">
                    Your {isPro ? "Pro" : isBusiness ? "Business" : ""} plan renews on{" "}
                    {new Date().toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Step Indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              {["Content", "Style", "Media", "Voice"].map((step, index) => (
                <div 
                  key={index}
                  className={`flex flex-col items-center ${index < currentStep ? "text-smartvid-600" : "text-muted-foreground"}`}
                >
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      index + 1 === currentStep 
                        ? "bg-smartvid-600 text-white" 
                        : index + 1 < currentStep 
                        ? "bg-smartvid-100 text-smartvid-600 border border-smartvid-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`text-xs ${index + 1 === currentStep ? "font-medium" : ""}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div 
                className="bg-smartvid-600 h-full transition-all duration-300 ease-in-out" 
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Describe your video
                </label>
                <Textarea
                  id="prompt"
                  placeholder="Describe what you want in your video. For example: A product showcase for a new smartphone, highlighting its key features with sleek animations and modern graphics."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-32"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Be descriptive! Include the purpose, style, and any specific visuals you want.
                </p>
                
                {showTips && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                      Tips for better video generation:
                    </h4>
                    <ul className="list-disc pl-5 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      {promptTips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="style" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="style" className="text-sm font-medium">
                    Video Style
                  </label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern & Clean</SelectItem>
                      <SelectItem value="cinematic">Cinematic</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="energetic">Energetic & Dynamic</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="format" className="text-sm font-medium">
                    Video Format
                  </label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                      <SelectItem value="9:16">Vertical / Stories (9:16)</SelectItem>
                      <SelectItem value="1:1">Square (1:1)</SelectItem>
                      <SelectItem value="4:5">Instagram (4:5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <label htmlFor="use-brand-kit" className="text-sm font-medium">
                    Use Brand Kit
                  </label>
                  <Switch
                    id="use-brand-kit"
                    checked={useBrandKit}
                    onCheckedChange={setUseBrandKit}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Apply your brand colors and styling to the video
                </p>
              </div>
              
              {useBrandKit && (
                <div className="space-y-4 p-4 border rounded-md mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="flex space-x-2">
                        <Input 
                          type="color" 
                          id="primary-color" 
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input 
                          type="text" 
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondary-color">Secondary Color</Label>
                      <div className="flex space-x-2">
                        <Input 
                          type="color" 
                          id="secondary-color" 
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input 
                          type="text" 
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="font">Font Style</Label>
                    <Select value={selectedFont} onValueChange={setSelectedFont}>
                      <SelectTrigger id="font">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inter">Inter (Modern)</SelectItem>
                        <SelectItem value="roboto">Roboto (Clean)</SelectItem>
                        <SelectItem value="montserrat">Montserrat (Elegant)</SelectItem>
                        <SelectItem value="playfair">Playfair Display (Classic)</SelectItem>
                        <SelectItem value="opensans">Open Sans (Readable)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <Link to="/dashboard/brand-kit" className="text-sm text-smartvid-600 hover:underline">
                      Edit Brand Kit
                    </Link>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="media" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Media Source</label>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div 
                    className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      mediaSource === 'stock' ? 'border-smartvid-600 bg-smartvid-50 dark:bg-smartvid-900/20' : ''
                    }`}
                    onClick={() => setMediaSource('stock')}
                  >
                    <Video className="h-10 w-10 mb-2 text-smartvid-600" />
                    <h3 className="font-medium">Stock Videos</h3>
                    <p className="text-xs text-center text-muted-foreground mt-1">
                      Use high-quality stock videos from our library
                    </p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      mediaSource === 'upload' ? 'border-smartvid-600 bg-smartvid-50 dark:bg-smartvid-900/20' : ''
                    }`}
                    onClick={() => setMediaSource('upload')}
                  >
                    <Upload className="h-10 w-10 mb-2 text-smartvid-600" />
                    <h3 className="font-medium">Upload Media</h3>
                    <p className="text-xs text-center text-muted-foreground mt-1">
                      Use your own videos and images
                    </p>
                  </div>
                </div>
              </div>
              
              {mediaSource === 'upload' && (
                <div className="mt-4 space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept="image/*, video/*"
                      onChange={handleFileUpload}
                      multiple
                    />
                    <label 
                      htmlFor="file-upload" 
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-10 w-10 mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Drag & drop files or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports images and videos (max 10MB each)
                      </p>
                    </label>
                  </div>
                  
                  {uploadedMedia.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Uploaded Files ({uploadedMedia.length})</h4>
                      <ScrollArea className="h-32 rounded border p-2">
                        {uploadedMedia.map((file, index) => (
                          <div key={index} className="flex items-center justify-between py-2">
                            <div className="flex items-center">
                              {file.type.includes('image') ? (
                                <Image className="h-4 w-4 mr-2 text-muted-foreground" />
                              ) : (
                                <Video className="h-4 w-4 mr-2 text-muted-foreground" />
                              )}
                              <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="voice" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="use-voiceover" className="text-sm font-medium">
                    Add Voice Narration
                  </label>
                  <Switch
                    id="use-voiceover"
                    checked={useVoiceover}
                    onCheckedChange={setUseVoiceover}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Add professional AI voice narration to your video using ElevenLabs
                </p>
              </div>
              
              {useVoiceover && (
                <div className="space-y-4 p-4 border rounded-md mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="voice">Select Voice</Label>
                    <Select value={voiceId} onValueChange={setVoiceId}>
                      <SelectTrigger id="voice">
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {VOICE_OPTIONS.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name} - {voice.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="script">Voice Script</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="auto-generate"
                          checked={autoGenerateScript}
                          onCheckedChange={setAutoGenerateScript}
                        />
                        <Label htmlFor="auto-generate" className="text-xs">
                          Auto-generate from prompt
                        </Label>
                      </div>
                    </div>
                    <Textarea
                      id="script"
                      placeholder="Write the script for your voice narration here"
                      value={voiceScript}
                      onChange={(e) => setVoiceScript(e.target.value)}
                      className="min-h-24"
                      disabled={autoGenerateScript}
                    />
                    <p className="text-xs text-muted-foreground">
                      {autoGenerateScript ? 
                        "Script will be automatically generated based on your video description" : 
                        "Write a script for the narration that accompanies your video"}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <Headphones className="h-5 w-5 text-blue-500" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Voice powered by ElevenLabs AI - Professional, natural-sounding voices
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          {currentStep > 1 ? (
            <Button variant="outline" onClick={goToPrevStep}>
              Back
            </Button>
          ) : (
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
          )}
          
          {currentStep < 4 ? (
            <Button onClick={goToNextStep}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || !canGenerateVideo || !session}
              className={!canGenerateVideo ? "bg-gray-300 hover:bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:hover:bg-gray-700" : ""}
            >
              {isLoading ? 
                "Creating..." : 
                !session ? 
                  "Sign in to create" :
                  canGenerateVideo ? 
                    "Create Video" : 
                    "Upgrade to create more videos"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
