
-- Add narration_script column to video_projects table
ALTER TABLE public.video_projects
ADD COLUMN IF NOT EXISTS narration_script TEXT;

-- Add comment to explain the purpose of this column
COMMENT ON COLUMN public.video_projects.narration_script IS 'Stores the narration script used for voiceover and captions';
