
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
