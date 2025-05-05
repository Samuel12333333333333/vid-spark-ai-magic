
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Notification, notificationService } from '@/services/notificationService';
import { NotificationItem } from './NotificationItem';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { showErrorToast } from '@/lib/error-handler';

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      console.log("Fetching notifications for user:", user.id);
      const fetchedNotifications = await notificationService.getUserNotifications(user.id);
      console.log("Fetched notifications:", fetchedNotifications);
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);
  
  // Subscribe to notifications table changes for real-time updates
  useEffect(() => {
    if (!user?.id) return;
    
    console.log("Setting up real-time notifications for user:", user.id);
    
    // Create filter for user's notifications
    const userFilter = `user_id=eq.${user.id}`;
    
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: userFilter
        }, 
        (payload) => {
          console.log('New notification received via realtime:', payload);
          // Add the new notification to the list
          if (payload.new) {
            setNotifications(prev => [
              {
                ...payload.new as Notification,
                type: notificationService.validateNotificationType((payload.new as any).type)
              },
              ...prev
            ]);
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });
      
    // Cleanup
    return () => {
      console.log("Cleaning up notification subscription");
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      showErrorToast(error);
    }
  };
  
  const handleDeleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      // Remove from local state
      setNotifications(prev =>
        prev.filter(notification => notification.id !== id)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
      showErrorToast(error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      if (!user?.id) return;
      await notificationService.markAllAsRead(user.id);
      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      showErrorToast(error);
    }
  };
  
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  if (!user) {
    return null;
  }
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-[10px] rounded-full p-0 bg-red-500"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-[70vh] overflow-hidden flex flex-col p-0"
        onCloseAutoFocus={() => {
          // Re-fetch notifications when dropdown is closed
          if (!isOpen) {
            fetchNotifications();
          }
        }}
      >
        <div className="p-2 font-medium border-b flex justify-between items-center">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button 
              variant="link" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs h-auto p-0"
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <div className="overflow-y-auto max-h-[calc(70vh-40px)]">
          {isLoading ? (
            <div className="text-center p-4 text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">No notifications yet.</div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDeleteNotification}
              />
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="justify-center text-center text-sm text-muted-foreground cursor-pointer"
              onClick={() => {
                setIsOpen(false);
                navigate('/dashboard/notifications');
              }}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
