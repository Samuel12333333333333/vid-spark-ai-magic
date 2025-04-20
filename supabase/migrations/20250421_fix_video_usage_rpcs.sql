
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
    VALUES (_user_id, 0, date_trunc('month', now()));
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
