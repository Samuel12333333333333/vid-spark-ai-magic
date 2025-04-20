
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VideoUsageResponse {
  count: number;
  reset_at: string;
}

interface UsageData {
  count: number;
  reset_at: string | null;
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
      
      const { data, error } = await supabase
        .rpc<UsageData>('get_video_usage')
        .single();
      
      if (error) {
        console.error("Usage error:", error);
        console.error("Using default usage values due to error");
        
        setUsageCount(0);
        setResetDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));
        return;
      }
      
      if (data) {
        setUsageCount(data.count);
        
        if (data.reset_at) {
          setResetDate(new Date(data.reset_at));
        } else {
          setResetDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));
        }
      } else {
        setUsageCount(0);
        setResetDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));
      }
    } catch (error) {
      console.error("Error checking video usage:", error);
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
      const { data, error } = await supabase
        .rpc<UsageData>('increment_video_usage')
        .single();
      
      if (error) {
        console.error("Error incrementing video usage:", error);
        return false;
      }
      
      if (data) {
        setUsageCount(data.count);
        
        if (data.reset_at) {
          setResetDate(new Date(data.reset_at));
        }
      } else {
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
