
import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "@/services/notificationService";
import { toast } from "sonner";

export const testNotification = async (userId: string) => {
  console.log("🔍 Testing notification creation for user:", userId);
  let results = [];
  
  // Method 1: Using the notification service with edge function
  console.log("Method 1: Using notificationService...");
  try {
    const notif1 = await notificationService.createNotification({
      user_id: userId, 
      title: "Test Notification (Service)",
      message: "This is a test notification using the notification service.",
      type: 'video',
      metadata: { test: true, method: 'service', timestamp: new Date().toISOString() }
    });
    
    console.log("✅ Method 1 result:", notif1);
    if (notif1) {
      toast.success("Notification created successfully via service");
      results.push("Method 1: Success");
    } else {
      toast.error("Failed to create notification via service");
      results.push("Method 1: Failed");
    }
  } catch (err) {
    console.error("❌ Method 1 error:", err);
    toast.error(`Method 1 error: ${err instanceof Error ? err.message : String(err)}`);
    results.push(`Method 1: Error - ${err instanceof Error ? err.message : String(err)}`);
  }

  // Method 2: Using the edge function directly
  console.log("Method 2: Using edge function directly...");
  try {
    const response = await fetch('https://rtzitylynowjenfoztum.supabase.co/functions/v1/create-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        title: "Test Notification (Direct)",
        message: "This is a test notification using direct API call.",
        type: 'video',
        is_read: false,
        metadata: { test: true, method: 'direct', timestamp: new Date().toISOString() }
      }),
    });
    
    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = JSON.stringify(errorData);
      } catch (e) {
        // If parsing fails, use status text
      }
      throw new Error(`API responded with status: ${response.status} - ${errorMessage}`);
    }
    
    const data = await response.json();
    console.log("✅ Method 2 result:", data);
    toast.success("Notification created successfully via direct API call");
    results.push("Method 2: Success");
  } catch (err) {
    console.error("❌ Method 2 error:", err);
    toast.error(`Method 2 error: ${err instanceof Error ? err.message : String(err)}`);
    results.push(`Method 2: Error - ${err instanceof Error ? err.message : String(err)}`);
  }
  
  // Update existing notification related components in Video Render service
  
  return {
    message: "Notification test complete - check console and toasts for results",
    results
  };
};
