
import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "@/services/notificationService";
import { toast } from "sonner";
import { withRetry } from "@/lib/error-handler";

export const testNotification = async (userId: string) => {
  console.log("🔍 Testing notification creation for user:", userId);
  let results = [];
  
  // Use a unique timestamp to avoid duplicate notifications
  const timestamp = new Date().toISOString();
  const uniqueReference = `test_${Date.now()}`;
  
  console.log("Using edge function to create test notification...");
  try {
    const response = await withRetry(
      async () => {
        return fetch('https://rtzitylynowjenfoztum.supabase.co/functions/v1/create-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            title: "Test Notification",
            message: "This is a test notification with unique reference: " + uniqueReference,
            type: 'video',
            is_read: false,
            metadata: { 
              test: true, 
              method: 'direct', 
              timestamp: timestamp,
              uniqueReference: uniqueReference
            }
          }),
        });
      },
      { maxRetries: 1, delayMs: 1000 }
    );
    
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
    console.log("✅ Test notification created successfully:", data);
    toast.success("Notification created successfully");
    results.push("Success: Notification created via edge function");
  } catch (err) {
    console.error("❌ Error creating test notification:", err);
    toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    results.push(`Error: ${err instanceof Error ? err.message : String(err)}`);
  }
  
  return {
    message: "Notification test complete - check console and toasts for results",
    results
  };
};
