
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VideoUsageResponse {
  count: number;
  reset_at: string;
}

export function useVideoLimits() {
  const [usageCount, setUsageCount] = useState<number>(0);
  const [resetDate, setResetDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const maxVideosPerMonth = 5; // Free tier limit

  // Check if user can generate a video
  const canGenerateVideo = usageCount < maxVideosPerMonth;
  const remainingVideos = maxVideosPerMonth - usageCount;

  useEffect(() => {
    checkUsage();
  }, []);

  const checkUsage = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch video usage from the database
      const { data, error } = await supabase.rpc('get_video_usage');
      
      if (error) {
        console.error("Usage error:", error);
        console.error("Using default usage values due to error");
        
        // Default values if we can't get usage data
        setUsageCount(0);
        setResetDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));
        return;
      }
      
      if (data && Array.isArray(data) && data.length > 0) {
        const usageData = data[0] as VideoUsageResponse;
        setUsageCount(usageData.count || 0);
        
        if (usageData.reset_at) {
          setResetDate(new Date(usageData.reset_at));
        } else {
          // Default to first day of next month if no reset date
          setResetDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));
        }
      } else {
        // No data returned or empty array
        setUsageCount(0);
        setResetDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));
      }
    } catch (error) {
      console.error("Error checking video usage:", error);
      
      // Default values on error
      setUsageCount(0);
      setResetDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const incrementUsage = useCallback(async (): Promise<boolean> => {
    if (!canGenerateVideo) {
      toast.error(`You've reached your limit of ${maxVideosPerMonth} videos this month. Your limit will reset on ${resetDate?.toLocaleDateString()}.`);
      return false;
    }

    try {
      // Increment usage count in the database
      const { data, error } = await supabase.rpc('increment_video_usage');
      
      if (error) {
        console.error("Error incrementing video usage:", error);
        return false;
      }
      
      // Update local state based on response
      if (data && Array.isArray(data) && data.length > 0) {
        const usageData = data[0] as VideoUsageResponse;
        setUsageCount(usageData.count || 0);
        
        if (usageData.reset_at) {
          setResetDate(new Date(usageData.reset_at));
        }
      } else {
        // If we can't get the updated count, increment locally
        setUsageCount(prev => prev + 1);
      }
      
      return true;
    } catch (error) {
      console.error("Error incrementing video usage:", error);
      return false;
    }
  }, [canGenerateVideo, maxVideosPerMonth, resetDate]);

  return {
    usageCount,
    resetDate,
    isLoading,
    canGenerateVideo,
    remainingVideos,
    incrementUsage,
    maxVideosPerMonth
  };
}
