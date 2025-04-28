
import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { generateVideo } from "@/services/videoService";
import { validateVideoPrompt } from "@/lib/input-validator";
import { useVideoLimits } from "@/hooks/useVideoLimits";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export function VideoGenerator() {
  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<string>('modern');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { usageCount, canGenerateVideo, remainingVideos, incrementUsage, maxVideosPerMonth } = useVideoLimits();
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateVideoPrompt(prompt);
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }
    
    if (!canGenerateVideo) {
      toast.error(`You've reached your limit of ${maxVideosPerMonth} videos. Please upgrade your plan to create more videos.`);
      navigate('/dashboard/upgrade');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First increment usage count
      const incrementResult = await incrementUsage();
      
      if (!incrementResult) {
        toast.error("Could not validate your video limits. Please try again.");
        return;
      }
      
      const result = await generateVideo({
        prompt,
        style,
        userId: session?.user.id || '',
      });
      
      if (result.success && result.videoId) {
        toast.success("Your video is being generated! You'll be notified when it's ready.");
        navigate(`/dashboard/videos/${result.videoId}`);
      } else {
        toast.error(result.error || "Failed to start video generation. Please try again.");
      }
    } catch (error) {
      console.error("Error generating video:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Video</CardTitle>
          <CardDescription>
            Turn your text into a professional video with AI
          </CardDescription>
          
          <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <span className="font-semibold">Your usage: </span> 
              {usageCount} / {maxVideosPerMonth} videos {remainingVideos > 0 ? `(${remainingVideos} remaining)` : ''}
              {remainingVideos <= 2 && (
                <span className="block mt-1">
                  Consider <Link to="/dashboard/upgrade" className="font-medium underline">upgrading your plan</Link> for more videos.
                </span>
              )}
            </p>
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
            disabled={isLoading || !canGenerateVideo}
          >
            {isLoading ? 
              "Creating..." : 
              canGenerateVideo ? 
                "Create Video" : 
                "Upgrade to create more videos"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
