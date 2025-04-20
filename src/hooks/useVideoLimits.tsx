
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
  const [isError, setIsError] = useState<boolean>(false);
  const maxVideosPerMonth = 5; // Free tier limit

  // Check if user can generate a video - force to true for testing
  const canGenerateVideo = true; // Override to always allow video generation for testing
  const remainingVideos = Math.max(1, maxVideosPerMonth - usageCount); // Ensure at least 1 remaining

  const checkUsage = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      // For testing purposes, set default values directly
      setUsageCount(0); // Force usage to 0 for testing
      setResetDate(getDefaultResetDate());
      console.log("Using default usage values to enable video generation");
      
      // Uncomment this block when the edge function is fixed
      /*
      // Call the get_video_usage edge function
      const { data, error } = await supabase.functions.invoke("get_video_usage");

      if (error) {
        console.error("Usage error:", error);
        console.error("Using default usage values due to error");
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
      } else {
        console.log("No video usage data received, using defaults");
        setUsageCount(0);
        setResetDate(getDefaultResetDate());
      }
      */
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
  }, [checkUsage]);

  const incrementUsage = useCallback(async (): Promise<boolean> => {
    // For testing, always return true
    console.log("Incrementing usage (test mode - always succeeds)");
    return true;
    
    // Uncomment this when the edge function is fixed
    /*
    if (!canGenerateVideo) {
      toast.error(
        `You've reached your limit of ${maxVideosPerMonth} videos this month. Your limit will reset on ${resetDate?.toLocaleDateString()}.`
      );
      return false;
    }

    try {
      // Call the increment_video_usage edge function
      const { data, error } = await supabase.functions.invoke("increment_video_usage");

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
      } else {
        // Optimistically update client-side count if server didn't return data
        setUsageCount((prev) => prev + 1);
      }

      return true;
    } catch (error) {
      console.error("Error incrementing video usage:", error);
      return false;
    }
    */
  }, []);

  // This method allows external components to refresh the usage data
  const refreshUsage = useCallback(() => {
    return checkUsage();
  }, [checkUsage]);

  return {
    usageCount,
    resetDate,
    isLoading,
    isError,
    canGenerateVideo,
    remainingVideos,
    incrementUsage,
    refreshUsage,
    maxVideosPerMonth,
  };
}
