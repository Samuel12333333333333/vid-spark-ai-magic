
-- Function to get the current user's video usage
CREATE OR REPLACE FUNCTION public.get_video_usage()
RETURNS TABLE (
  count INTEGER,
  reset_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vu.count,
    vu.reset_at
  FROM 
    public.video_usage vu
  WHERE 
    vu.user_id = auth.uid()
  LIMIT 1;
END;
$$;

-- Function to initialize video usage for the current user
CREATE OR REPLACE FUNCTION public.initialize_video_usage()
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
  _count INTEGER := 0;
  _reset_at TIMESTAMPTZ := date_trunc('month', now());
BEGIN
  -- Insert new usage record
  INSERT INTO public.video_usage (user_id, count, reset_at)
  VALUES (_user_id, _count, _reset_at);
  
  -- Return the newly created record
  RETURN QUERY
  SELECT 
    _count,
    _reset_at;
END;
$$;

-- Function to increment video usage for the current user
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
  _now TIMESTAMPTZ := now();
  _reset_at TIMESTAMPTZ;
  _count INTEGER;
BEGIN
  -- First, check if the user has a record
  SELECT 
    vu.count, 
    vu.reset_at 
  INTO 
    _count, 
    _reset_at
  FROM 
    public.video_usage vu
  WHERE 
    vu.user_id = _user_id
  LIMIT 1;
  
  -- If no record exists, create one
  IF _count IS NULL THEN
    _count := 0;
    _reset_at := date_trunc('month', _now);
    
    INSERT INTO public.video_usage (user_id, count, reset_at)
    VALUES (_user_id, _count, _reset_at);
  END IF;

  -- Check if we need to reset for a new month
  IF _reset_at < date_trunc('month', _now) THEN
    _count := 0;
    _reset_at := date_trunc('month', _now);
  END IF;
  
  -- Increment the count
  _count := _count + 1;
  
  -- Update the record
  UPDATE public.video_usage
  SET 
    count = _count,
    reset_at = _reset_at,
    updated_at = _now
  WHERE 
    user_id = _user_id;
  
  -- Return the updated values
  RETURN QUERY
  SELECT 
    _count,
    _reset_at;
END;
$$;
