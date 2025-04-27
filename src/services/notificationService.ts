
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'video' | 'payment' | 'account' | 'newsletter';
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export const notificationService = {
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      console.log("Fetching notifications for user:", userId);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Supabase error fetching notifications:", error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} notifications for user`);
      
      // Cast and validate the data to ensure type compatibility
      return (data || []).map(notification => ({
        ...notification,
        // Ensure type is one of our expected values or default to 'account'
        type: this.validateNotificationType(notification.type)
      })) as Notification[];
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  },
  
  async createNotification({
    userId,
    title,
    message,
    type,
    metadata = {}
  }: {
    userId: string;
    title: string;
    message: string;
    type: 'video' | 'payment' | 'account' | 'newsletter';
    metadata?: Record<string, any>;
  }): Promise<Notification | null> {
    try {
      console.log(`⏳ Creating notification for user ${userId}: ${title}`);
      console.log(`Type: ${type}, Message: ${message}`);
      
      if (!userId) {
        console.error("❌ Cannot create notification: user_id is missing");
        return null;
      }
      
      // Ensure metadata is JSON-compatible
      let safeMetadata: Record<string, any> = {};
      
      try {
        if (metadata && Object.keys(metadata).length > 0) {
          // For safety, stringify and parse the object to remove any non-serializable content
          safeMetadata = JSON.parse(JSON.stringify(metadata));
        }
      } catch (e) {
        console.error("Error serializing metadata, using empty object:", e);
        // Use empty object if serialization fails
      }
      
      const notification = {     
        user_id: userId,
        title: title.substring(0, 255), // Ensure title isn't too long
        message: message.substring(0, 1000), // Ensure message isn't too long
        type,
        is_read: false,
        metadata: safeMetadata
      };

      console.log("Notification payload:", JSON.stringify(notification));
      
      // Direct database insertion
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert([notification])
          .select();
          
        if (error) {
          console.error("❌ Notification insert failed:", error);
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log("✅ Notification created successfully:", data[0].id);
          return data[0] as Notification;
        }
        
        throw new Error("No data returned from notification insert");
      } catch (insertError) {
        // If the insert fails due to metadata, try without it
        console.error("❌ Initial insert failed, trying without metadata:", insertError);
        
        const simplifiedNotification = {
          user_id: userId,
          title: title.substring(0, 255),
          message: message.substring(0, 1000),
          type,
          is_read: false
        };
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('notifications')
          .insert([simplifiedNotification])
          .select();
          
        if (fallbackError) {
          console.error("❌ Fallback insert also failed:", fallbackError);
          return null;
        }
        
        if (fallbackData && fallbackData.length > 0) {
          console.log("✅ Fallback notification created successfully:", fallbackData[0].id);
          return fallbackData[0] as Notification;
        }
      }
      
      return null;
    } catch (error) {
      console.error("❌ Error creating notification:", error);
      return null;
    }
  },
  
  // Helper method to validate notification types
  validateNotificationType(type: string): 'video' | 'payment' | 'account' | 'newsletter' {
    const validTypes = ['video', 'payment', 'account', 'newsletter'];
    return validTypes.includes(type) 
      ? type as 'video' | 'payment' | 'account' | 'newsletter'
      : 'account'; // Default fallback type
  },
  
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
        
      if (error) {
        console.error("Supabase error marking notification as read:", error);
        throw error;
      }
      
      console.log(`Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  },
  
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
        
      if (error) {
        console.error("Supabase error marking all notifications as read:", error);
        throw error;
      }
      
      console.log(`All notifications for user ${userId} marked as read`);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  },
  
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
        
      if (error) {
        console.error("Supabase error deleting notification:", error);
        throw error;
      }
      
      console.log(`Notification ${notificationId} deleted`);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }
};
