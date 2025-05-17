
import { Database } from '@/integrations/supabase/types';
import { VideoProject, Template } from '@/types/supabase';

// Define additional types or extend existing ones here
export interface ExtendedVideoProject extends VideoProject {
  // Add any additional properties that might be needed
  templateData?: Template;
}

// Define any utility types for working with the Supabase schema
export type VideoRenderOptions = {
  hasAudio: boolean;
  hasCaptions: boolean;
  audioUrl?: string;
  captionsUrl?: string;
  template?: any;
  style?: string;
};

// Define any request/response types for API calls
export type RenderRequestBody = {
  projectId: string;
  userId: string;
  prompt: string;
  style?: string;
  scenes?: any[];
  useStockMedia?: boolean;
  has_audio: boolean;
  has_captions: boolean;
  audioUrl?: string;
  captionsUrl?: string;
  template?: any;
};

// Add any other custom types needed for your application
