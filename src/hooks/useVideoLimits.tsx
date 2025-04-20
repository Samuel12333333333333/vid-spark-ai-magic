
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define proper types for the RPC responses
interface VideoUsageResponse {
  count: number;
  reset_at: string;
}

// Helper function to get the default reset date
const getDefaultResetDate = () =>
  new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

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

      // Provide both return type and parameters type (empty object for params)
      const { data, error } = await supabase.rpc<VideoUsageResponse, {}>('get_video_usage');

      if (error) {
        console.error("Usage error:", error);
        console.error("Using default usage values due to error");

        setUsageCount(0);
        setResetDate(getDefaultResetDate());
        return;
      }

      if (data) {
        setUsageCount(data.count);
        setResetDate(
          data.reset_at ? new Date(data.reset_at) : getDefaultResetDate()
        );
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
      toast.error(
        `You've reached your limit of ${maxVideosPerMonth} videos this month. Your limit will reset on ${resetDate?.toLocaleDateString()}.`
      );
      return false;
    }

    try {
      // Provide both return type and parameters type (empty object for params)
      const { data, error } = await supabase.rpc<VideoUsageResponse, {}>('increment_video_usage');

      if (error) {
        console.error("Error incrementing video usage:", error);
        return false;
      }

      if (data) {
        setUsageCount(data.count);
        setResetDate(
          data.reset_at ? new Date(data.reset_at) : getDefaultResetDate()
        );
      } else {
        setUsageCount((prev) => prev + 1);
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
    maxVideosPerMonth,
  };
}
