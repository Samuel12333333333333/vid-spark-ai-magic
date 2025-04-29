
import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { videoService } from "@/services/videoService";
import { validateVideoPrompt } from "@/lib/input-validator";
import { useVideoLimits } from "@/hooks/useVideoLimits";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { AlertCircle, Info } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

export function VideoGenerator() {
  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<string>('modern');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showTips, setShowTips] = useState<boolean>(false);
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
      // Clear location state to prevent persistent prefill
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
  // Refresh limits when component mounts
  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

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
      // First increment usage count
      const incrementResult = await incrementUsage();
      
      if (!incrementResult) {
        toast.error("Could not validate your video limits. Please try again.");
        setIsLoading(false);
        return;
      }
      
      // Show longer processing toast
      toast.loading("Generating video from your prompt...", {
        duration: 10000,
        id: "video-generation"
      });
      
      const result = await videoService.generateVideo({
        prompt,
        style,
        userId: session?.user.id || '',
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
      <Card className="border-0 shadow-none">
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
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
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
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
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
        </CardFooter>
      </Card>
    </div>
  );
}
