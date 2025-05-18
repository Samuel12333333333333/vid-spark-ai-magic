
import { createClient } from '@supabase/supabase-js';
import type { CustomDatabase } from '@/integrations/supabase/client';

// Project URL and service role key - these should be set in environment variables in production
const SUPABASE_URL = "https://rtzitylynowjenfoztum.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create a Supabase client with the service role for admin operations
// IMPORTANT: This should ONLY be used in server-side code, never in the browser
export const supabaseAdmin = createClient<CustomDatabase>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);
