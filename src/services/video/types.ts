
import { VideoProject } from "../videoService";
import { Json } from "@/integrations/supabase/types";

export type RenderStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface RenderResponse {
  status: RenderStatus;
  url?: string;
  thumbnail?: string;
  error?: string;
  projectId?: string;
}

export interface RenderStartOptions {
  projectId: string;
  userId: string;
  prompt: string;
  style?: string;
  hasAudio?: boolean;
  hasCaptions?: boolean;
  narrationScript?: string;
  brandColors?: string;
  includeCaptions?: boolean;
  scenes?: Json;
  audioBase64?: string;
}

export interface VideoProjectUpdate {
  title?: string;
  prompt?: string;
  status?: RenderStatus;
  style?: string;
  media_source?: string;
  brand_colors?: string; // Using this field instead of brand_settings
  voice_type?: string;
  video_url?: string;
  thumbnail_url?: string;
  narration_script?: string;
  error_message?: string;
  has_captions?: boolean;
  has_audio?: boolean;
  duration?: number;
  render_id?: string;
  updated_at?: string;
  scenes?: Json;
  audio_url?: string;
}
