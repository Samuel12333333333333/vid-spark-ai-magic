
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Project URL and key are from the project settings
const SUPABASE_URL = "https://rtzitylynowjenfoztum.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0eml0eWx5bm93amVuZm96dHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDAyMDUsImV4cCI6MjA2MjI3NjIwNX0.SwmjgSYe5r2nD69YLPu9ZXOBZKYFc9EDTU0SSdc4_mA";

// Create a custom database type that integrates with our existing types
export type CustomDatabase = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          content: string | null;
          description: string | null;
          thumbnail: string | null;
          category: string | null;
          is_premium: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
      };
      templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          thumbnail: string | null;
          category: string | null;
          is_premium: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
      };
      video_projects: {
        Row: {
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
      };
      notifications: {
        Row: {
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
      };
      subscriptions: {
        Row: {
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
      };
      video_usage: {
        Row: {
          id: string;
          user_id: string;
          count: number | null;
          reset_at: string;
          created_at: string | null;
          updated_at: string | null;
        };
      };
    };
    Views: {};
    Functions: {
      get_video_usage: {
        Args: Record<string, never>;
        Returns: { count: number; reset_at: string }[];
      };
      increment_video_usage: {
        Args: Record<string, never>;
        Returns: { count: number; reset_at: string }[];
      };
      reset_video_usage: {
        Args: { user_id_param: string };
        Returns: undefined;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};

// Export the supabase client with our custom type definition
export const supabase = createClient<CustomDatabase>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
