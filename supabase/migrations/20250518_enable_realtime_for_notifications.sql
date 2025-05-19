
-- Add the notifications table to RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Add policies to allow users to read their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add policy to allow users to update their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add policy to allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for notifications table
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Add the notifications table to the realtime publication
BEGIN;
  -- Check if the supabase_realtime publication exists
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM pg_publication
      WHERE pubname = 'supabase_realtime'
    ) THEN
      -- If it exists, add the notifications table to it
      ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    ELSE
      -- If it doesn't exist, create it with the notifications table
      CREATE PUBLICATION supabase_realtime FOR TABLE notifications;
    END IF;
  END$$;
COMMIT;
