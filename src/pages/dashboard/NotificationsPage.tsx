
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Check, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import SEOMetadata from "@/components/SEOMetadata";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
};

export default function NotificationsPage() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session?.user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setNotifications(data || []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        toast.error("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Set up a realtime subscription
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session?.user?.id}`
        },
        (_) => {
          fetchNotifications();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);
  
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
        
      if (error) throw error;
      
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
      
      toast.success("Notification marked as read");
    } catch (err) {
      console.error("Error marking notification as read:", err);
      toast.error("Failed to update notification");
    }
  };
  
  const markAllAsRead = async () => {
    if (!session?.user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false);
        
      if (error) throw error;
      
      setNotifications(prevNotifications =>
        prevNotifications.map(notif => ({ ...notif, is_read: true }))
      );
      
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      toast.error("Failed to update notifications");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '🎬';
      case 'system':
        return '🔔';
      case 'payment':
        return '💰';
      default:
        return '📄';
    }
  };

  return (
    <>
      <SEOMetadata
        title="Notifications"
        description="Manage your SmartVid notifications"
        keywords="notifications, alerts, messages, updates"
      />

      <div className="container px-4 py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with the latest activity on your account
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={markAllAsRead} 
            disabled={!notifications.some(n => !n.is_read)}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading notifications...</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="bg-muted rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BellOff className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">No notifications yet</h3>
                <p className="text-muted-foreground mt-2">
                  When you receive notifications, they'll appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id} 
                    className={`p-4 transition-colors ${!notification.is_read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at))} ago
                          </span>
                          {!notification.is_read && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2 text-xs"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
