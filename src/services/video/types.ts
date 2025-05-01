
import { VideoProject } from "../videoService";

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
  scenes?: any[];
  audioBase64?: string;
}

// This interface was missing the scenes property
export interface VideoProjectUpdate {
  title?: string;
  prompt?: string;
  status?: RenderStatus;
  style?: string;
  media_source?: string;
  brand_colors?: string;
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
  scenes?: any[];
  audio_url?: string;
}
