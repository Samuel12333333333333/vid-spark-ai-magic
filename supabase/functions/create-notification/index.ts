
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

// Define the notification type
interface Notification {
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read?: boolean;
  metadata?: any;
}

// Create a Supabase client with the service role key
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  try {
    // CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };

    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers });
    }

    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Parse the request body
    const notification: Notification = await req.json();

    // Validate required fields
    if (!notification.user_id || !notification.title || !notification.message || !notification.type) {
      return new Response(
        JSON.stringify({ error: "Missing required notification fields" }),
        {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" },
        }
      );
    }

    // Insert the notification using service role
    const { data, error } = await supabaseClient
      .from("notifications")
      .insert({
        user_id: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        is_read: notification.is_read !== undefined ? notification.is_read : false,
        metadata: notification.metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return new Response(
        JSON.stringify({ error: `Failed to create notification: ${error.message}` }),
        {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" },
        }
      );
    }

    // Return the created notification
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message}` }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        },
      }
    );
  }
});
