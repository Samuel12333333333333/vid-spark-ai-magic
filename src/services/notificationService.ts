
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
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Supabase error fetching notifications:", error);
        throw error;
      }
      
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
      const notification = {
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        metadata
      };
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();
        
      if (error) {
        console.error("Supabase error creating notification:", error);
        throw error;
      }
      
      toast.success(`New notification: ${title}`);
      
      // Cast the returned data and validate the type
      return {
        ...data,
        type: this.validateNotificationType(data.type)
      } as Notification;
    } catch (error) {
      console.error("Error creating notification:", error);
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
