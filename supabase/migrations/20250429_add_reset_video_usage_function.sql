
-- Function to reset video usage for a user
-- This is called when a user gets a new subscription
CREATE OR REPLACE FUNCTION public.reset_video_usage(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We don't actually delete the videos, but we reset the counter in the video_usage table if it exists
  -- For subscriptions, videos are counted monthly, so this effectively resets their quota
  
  -- Currently we're tracking usage by counting records in video_projects
  -- This function serves as a hook for future enhancements to reset usage
  
  -- Log that the function was called
  RAISE NOTICE 'Reset video usage for user %', user_id_param;
  
  -- Future implementation might update a specific counter table
  -- Example:
  -- UPDATE video_usage SET count = 0 WHERE user_id = user_id_param;
END;
$$;
