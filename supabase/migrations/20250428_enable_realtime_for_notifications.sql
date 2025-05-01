
-- Enable row-level changes on the notifications table for real-time updates
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
