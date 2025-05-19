
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Notification, NotificationType } from "@/types/supabase";

export type { Notification, NotificationType };

// Define a function to validate notification types
const validateNotificationType = (type: string): NotificationType => {
  const validTypes: NotificationType[] = [
    'video',
    'payment',
    'account',
    'newsletter',
    'video_complete',
    'video_failed',
    'video_deleted'
  ];
  
  if (validTypes.includes(type as NotificationType)) {
    return type as NotificationType;
  }
  
  console.warn(`Invalid notification type: ${type}, defaulting to 'account'`);
  return 'account';
};

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
  
  // Alias for getNotifications to maintain backward compatibility
  getUserNotifications(userId: string): Promise<Notification[]> {
    return this.getNotifications(userId);
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
  
  async createNotification(notification: {
    userId?: string;
    user_id?: string;
    title: string;
    message: string;
    type: string;
    metadata?: any;
    is_read?: boolean;
  }): Promise<Notification | null> {
    try {
      // Handle both userId and user_id for backward compatibility
      const user_id = notification.user_id || notification.userId;
      if (!user_id) {
        throw new Error('User ID is required for creating notifications');
      }
      
      // Extract only the valid properties for the database
      const notificationData = {
        user_id,
        title: notification.title,
        message: notification.message,
        type: validateNotificationType(notification.type),
        metadata: notification.metadata || null,
        is_read: notification.is_read !== undefined ? notification.is_read : false
      };
      
      console.log('Creating notification with data:', notificationData);
      
      // Use edge function for notifications to bypass RLS
      // IMPORTANT: Use the FULL URL for the edge function
      const response = await fetch('https://rtzitylynowjenfoztum.supabase.co/functions/v1/create-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create notification (${response.status}): ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      return data as Notification;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return null;
    }
  },
  
  // Add validateNotificationType method
  validateNotificationType
};

export default notificationService;
