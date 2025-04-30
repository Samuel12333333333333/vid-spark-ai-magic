
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface VideoUsageResponse {
  count: number;
  limit: number;
  reset_at: string;
  is_subscribed: boolean;
  is_pro: boolean;
  is_business: boolean;
  subscription_start?: string;
  remaining?: number;
}

const getDefaultResetDate = () =>
  new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

export function useVideoLimits() {
  const { hasActiveSubscription, isPro, isBusiness } = useSubscription();
  const [usageCount, setUsageCount] = useState<number>(0);
  const [resetDate, setResetDate] = useState<Date | null>(null);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  
  // Set maximum videos based on subscription tier
  const maxVideosPerMonth = hasActiveSubscription 
    ? isPro 
      ? 20 
      : isBusiness 
        ? 50 
        : 2 // Free tier
    : 2; // Default free tier

  // Check if user can generate a video
  const canGenerateVideo = usageCount < maxVideosPerMonth; 
  const remainingVideos = Math.max(0, maxVideosPerMonth - usageCount);

  const checkUsage = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      // Call the get_video_usage edge function
      const { data, error } = await supabase.functions.invoke<VideoUsageResponse>("get_video_usage");

      if (error) {
        console.error("Usage error:", error);
        setIsError(true);
        setUsageCount(0);
        setResetDate(getDefaultResetDate());
        return;
      }

      if (data) {
        console.log("Video usage data received:", data);
        setUsageCount(data.count);
        setResetDate(
          data.reset_at ? new Date(data.reset_at) : getDefaultResetDate()
        );
        
        // Set subscription start date if available
        if (data.subscription_start) {
          setSubscriptionStartDate(new Date(data.subscription_start));
        }
      } else {
        console.log("No video usage data received, using defaults");
        setUsageCount(0);
        setResetDate(getDefaultResetDate());
      }
      
    } catch (error) {
      console.error("Error checking video usage:", error);
      setIsError(true);
      setUsageCount(0);
      setResetDate(getDefaultResetDate());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUsage();
    
    // Set up automatic refresh interval (every 5 minutes)
    const interval = setInterval(() => {
      checkUsage();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkUsage]);

  const incrementUsage = useCallback(async (): Promise<boolean> => {
    if (!canGenerateVideo) {
      if (hasActiveSubscription) {
        toast.error(
          `You've reached your limit of ${maxVideosPerMonth} videos this billing period. Your limit will reset on ${resetDate?.toLocaleDateString()}.`
        );
      } else {
        toast.error(
          `You've reached your limit of ${maxVideosPerMonth} total videos on the free tier. Please upgrade to create more videos.`
        );
      }
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke<VideoUsageResponse>("increment_video_usage");

      if (error) {
        console.error("Error incrementing video usage:", error);
        return false;
      }

      if (data) {
        console.log("Video usage incremented:", data);
        setUsageCount(data.count);
        setResetDate(
          data.reset_at ? new Date(data.reset_at) : getDefaultResetDate()
        );
        
        // If close to limit, show warning
        if (data.remaining !== undefined && data.remaining <= 2 && data.remaining > 0) {
          toast.warning(
            `You have ${data.remaining} video${data.remaining === 1 ? '' : 's'} remaining in your ${hasActiveSubscription ? 'current billing period' : 'free tier'}.`
          );
        }
      } else {
        setUsageCount((prev) => prev + 1);
      }

      return true;
    } catch (error) {
      console.error("Error incrementing video usage:", error);
      return false;
    }
  }, [canGenerateVideo, maxVideosPerMonth, resetDate, hasActiveSubscription]);

  // This method allows external components to refresh the usage data
  const refreshUsage = useCallback(() => {
    return checkUsage();
  }, [checkUsage]);

  return {
    usageCount,
    resetDate,
    subscriptionStartDate,
    isLoading,
    isError,
    canGenerateVideo,
    remainingVideos,
    incrementUsage,
    refreshUsage,
    maxVideosPerMonth,
  };
}
