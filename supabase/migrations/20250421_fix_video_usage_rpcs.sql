
-- Update the get_video_usage function to handle errors gracefully
CREATE OR REPLACE FUNCTION public.get_video_usage()
RETURNS TABLE (
  count INTEGER,
  reset_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _user_id UUID := auth.uid();
BEGIN
  -- Check if the user has a usage record
  PERFORM 1 FROM public.video_usage WHERE user_id = _user_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.video_usage (user_id, count, reset_at)
    VALUES (_user_id, 0, date_trunc('day', now() + interval '1 month'));
  END IF;
  
  -- Return the usage data
  RETURN QUERY
  SELECT 
    vu.count,
    vu.reset_at
  FROM 
    public.video_usage vu
  WHERE 
    vu.user_id = _user_id
  LIMIT 1;
END;
$$;

-- Create or replace increment_video_usage RPC function
CREATE OR REPLACE FUNCTION public.increment_video_usage()
RETURNS TABLE (
  count INTEGER,
  reset_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _user_id UUID := auth.uid();
  now_ts TIMESTAMPTZ := now();
BEGIN
  -- Check if the user has a usage record
  PERFORM 1 FROM public.video_usage WHERE user_id = _user_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.video_usage (user_id, count, reset_at)
    VALUES (_user_id, 1, date_trunc('day', now_ts + interval '1 month'));
  ELSE
    -- Update existing record
    UPDATE public.video_usage
    SET 
      count = count + 1,
      reset_at = CASE 
        -- If reset_at is in the past, set a new reset date
        WHEN reset_at < now_ts THEN date_trunc('day', now_ts + interval '1 month')
        ELSE reset_at
      END
    WHERE user_id = _user_id;
  END IF;
  
  -- Return updated usage data
  RETURN QUERY
  SELECT 
    vu.count,
    vu.reset_at
  FROM 
    public.video_usage vu
  WHERE 
    vu.user_id = _user_id
  LIMIT 1;
END;
$$;
