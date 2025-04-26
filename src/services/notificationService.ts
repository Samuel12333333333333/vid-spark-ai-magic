
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
      
      if (!userId) {
        console.error("❌ Cannot create notification: user_id is missing");
        return null;
      }
      
      const notification = {
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        metadata
      };
      
      console.log("Notification payload:", JSON.stringify(notification));
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();
        
      if (error) {
        console.error("❌ Supabase error creating notification:", error);
        console.error("Error details:", JSON.stringify(error));
        
        // Try a simplified insert as fallback
        try {
          console.log("Attempting simplified insert without select...");
          const { error: insertError } = await supabase
            .from('notifications')
            .insert([notification]);
            
          if (insertError) {
            console.error("❌ Fallback insert also failed:", insertError);
            throw insertError;
          } else {
            console.log("✅ Fallback insert succeeded but no data returned");
            // Return a placeholder since we didn't get the inserted object back
            return {
              ...notification,
              id: 'unknown-id',
              created_at: new Date().toISOString(),
              type: this.validateNotificationType(notification.type),
            } as Notification;
          }
        } catch (fallbackError) {
          console.error("❌ Fallback insert attempt failed:", fallbackError);
          throw fallbackError;
        }
      }
      
      if (!data) {
        console.error("❌ No data returned from notification insert");
        return null;
      }
      
      console.log("✅ Notification created successfully:", data?.id);
      
      // Cast the returned data and validate the type
      return {
        ...data,
        type: this.validateNotificationType(data.type)
      } as Notification;
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
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }
};
