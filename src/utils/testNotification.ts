
import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "@/services/notificationService";

export const testNotification = async (userId: string) => {
  console.log("🔍 Testing notification creation for user:", userId);
  
  // Method 1: Using the notification service
  console.log("Method 1: Using notificationService...");
  try {
    const notif1 = await notificationService.createNotification({
      user_id: userId, // Using the correct property name
      title: "Test Notification (Service)",
      message: "This is a test notification using the notification service.",
      type: 'video',
      metadata: { test: true, method: 'service' }
    });
    
    console.log("✅ Method 1 result:", notif1);
  } catch (err) {
    console.error("❌ Method 1 error:", err);
  }

  // Method 2: Direct database insert
  console.log("Method 2: Direct insert...");
  try {
    const { data: directData, error: directError } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title: "Test Notification (Direct)",
        message: "This is a test notification using direct insert.",
        type: 'video',
        is_read: false
      }])
      .select();
      
    if (directError) {
      console.error("❌ Method 2 error:", directError);
    } else {
      console.log("✅ Method 2 result:", directData);
    }
  } catch (err) {
    console.error("❌ Method 2 error:", err);
  }
  
  return "Notification test complete - check console for results";
};
