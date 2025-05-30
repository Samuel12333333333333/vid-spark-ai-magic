
import type { VideoProject } from "@/services/videoService";
import type { Json } from "@/types/supabase";

export type RenderStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface RenderResponse {
  status: RenderStatus;
  url?: string;
  thumbnail?: string;
  error?: string;
  projectId?: string;
  renderId?: string;
  progress?: number;
  estimatedTimeRemaining?: number;
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
  brand_colors?: string;
  voice_type?: string;
  video_url?: string;
  thumbnail_url?: string;
  narration_script?: string;
  error_message?: string;
  has_audio?: boolean;
  has_captions?: boolean;
  duration?: number;
  render_id?: string;
  updated_at?: string;
  scenes?: Json;
  audio_url?: string;
}

export interface VideoAnalytics {
  totalVideos: number;
  completedVideos: number;
  failedVideos: number;
  processingVideos: number;
  averageDuration: number;
  usageByDay: { date: string; count: number }[];
}

// Use the NotificationType from the central types file
export type { NotificationType } from "@/types/supabase";
