
import { Database } from '@/integrations/supabase/types';

// Re-export the basic types from the generated types file 
// with additional shaping for easier use in the app
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Define database table row types 
export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type BlogPost = {
  id: string;
  title: string;
  content: string | null;
  description: string | null;
  thumbnail: string | null;
  category: string | null;
  is_premium: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  slug?: string;
};

export type Template = {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  category: string | null;
  is_premium: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type VideoProject = {
  id: string;
  user_id: string;
  title: string;
  prompt: string | null;
  status: string | null;
  style: string | null;
  media_source: string | null;
  brand_colors: string | null;
  voice_type: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  narration_script: string | null;
  error_message: string | null;
  has_audio: boolean | null;
  has_captions: boolean | null;
  duration: number | null;
  render_id: string | null;
  scenes: any | null;
  audio_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean | null;
  metadata: any | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Subscription = {
  id: string;
  user_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_name: string;
  status: string;
  current_period_end: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type VideoUsage = {
  id: string;
  user_id: string;
  count: number | null;
  reset_at: string;
  created_at: string | null;
  updated_at: string | null;
};

// Define the notification type that can be used across the application
export type NotificationType = 
  | 'video' 
  | 'payment' 
  | 'account' 
  | 'newsletter'
  | 'video_complete'
  | 'video_failed'
  | 'video_deleted';
