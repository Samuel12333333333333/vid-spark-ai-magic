
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Notification, NotificationType } from "@/types/supabase";

export type { Notification, NotificationType };

export const notificationService = {
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      
      return data as Notification[];
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return [];
    }
  },
  
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { data, error, count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false);
        
      if (error) {
        console.error('Error fetching unread count:', error);
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  },
  
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
        
      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
      toast.error('Failed to mark notification as read');
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
        console.error('Error marking all notifications as read:', error);
        throw error;
      }
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      toast.error('Failed to mark all notifications as read');
    }
  },
  
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
        
      if (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      toast.error('Failed to delete notification');
    }
  },
  
  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }
      
      return data as Notification;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return null;
    }
  }
};

export default notificationService;
