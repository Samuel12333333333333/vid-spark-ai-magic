
import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "@/services/notificationService";

export const testNotification = async (userId: string) => {
  console.log("🔍 Testing notification creation for user:", userId);
  
  // Method 1: Using the notification service with edge function
  console.log("Method 1: Using notificationService...");
  try {
    const notif1 = await notificationService.createNotification({
      user_id: userId, 
      title: "Test Notification (Service)",
      message: "This is a test notification using the notification service.",
      type: 'video',
      metadata: { test: true, method: 'service' }
    });
    
    console.log("✅ Method 1 result:", notif1);
  } catch (err) {
    console.error("❌ Method 1 error:", err);
  }

  // Method 2: Using the edge function directly
  console.log("Method 2: Using edge function directly...");
  try {
    const response = await fetch('/api/create-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        title: "Test Notification (Direct)",
        message: "This is a test notification using direct API call.",
        type: 'video',
        is_read: false
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API responded with status: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    console.log("✅ Method 2 result:", data);
  } catch (err) {
    console.error("❌ Method 2 error:", err);
  }
  
  return "Notification test complete - check console for results";
};
