
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define the proper response type from the RPC function
interface VideoUsageResponse {
  count: number;
  reset_at: string;
}

// Helper function to get the default reset date
const getDefaultResetDate = () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

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
      
      // Use the fetch API through the Supabase client to call the RPC function
      const { data, error } = await supabase.from('video_usage')
        .select('count, reset_at')
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error("Usage error:", error);
        console.error("Using default usage values due to error");
        
        setUsageCount(0);
        setResetDate(getDefaultResetDate());
        return;
      }
      
      if (data) {
        // Handle the response properly
        setUsageCount(data.count);
        setResetDate(data.reset_at ? new Date(data.reset_at) : getDefaultResetDate());
      } else {
        setUsageCount(0);
        setResetDate(getDefaultResetDate());
      }
    } catch (error) {
      console.error("Error checking video usage:", error);
      setUsageCount(0);
      setResetDate(getDefaultResetDate());
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
      // Use a direct POST request using the REST API feature of Supabase
      const { data, error } = await supabase.from('video_usage')
        .upsert({ 
          count: usageCount + 1, 
          reset_at: resetDate?.toISOString() || getDefaultResetDate().toISOString() 
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error incrementing video usage:", error);
        return false;
      }
      
      if (data) {
        setUsageCount(data.count);
        setResetDate(data.reset_at ? new Date(data.reset_at) : getDefaultResetDate());
      } else {
        setUsageCount(prev => prev + 1);
      }
      
      return true;
    } catch (error) {
      console.error("Error incrementing video usage:", error);
      return false;
    }
  }, [canGenerateVideo, maxVideosPerMonth, resetDate, usageCount]);

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
