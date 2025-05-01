
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { notificationService, Notification } from "@/services/notificationService";
import { Check, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NotificationSettings() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  const [preferences, setPreferences] = useState({
    emailNotifications: {
      videoGeneration: true,
      accountUpdates: true,
      newFeatures: true,
      marketing: false
    },
    appNotifications: {
      videoStatus: true,
      commentsAndShares: true,
      usageLimits: true
    }
  });

  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const data = await notificationService.getUserNotifications(user.id);
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotifications();
  }, [user]);
  
  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    ));
  };
  
  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      setMarkingAllAsRead(true);
      await notificationService.markAllAsRead(user.id);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    } finally {
      setMarkingAllAsRead(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    await notificationService.deleteNotification(id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleToggleChange = (category: keyof typeof preferences, setting: string) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: !prev[category as keyof typeof prev][setting as keyof typeof prev[typeof category]]
      }
    }));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Recent Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markingAllAsRead}
              >
                {markingAllAsRead ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Mark all as read
              </Button>
            )}
          </div>
          
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="w-6 h-6 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  {notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </ScrollArea>
              ) : (
                <div className="py-20 text-center text-muted-foreground">
                  <XCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>You don't have any notifications yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Control which emails you receive from us
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Video Generation</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails when your videos finish generating
                  </p>
                </div>
                <Switch 
                  checked={preferences.emailNotifications.videoGeneration}
                  onCheckedChange={() => handleToggleChange('emailNotifications', 'videoGeneration')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Account Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about account changes or security
                  </p>
                </div>
                <Switch 
                  checked={preferences.emailNotifications.accountUpdates}
                  onCheckedChange={() => handleToggleChange('emailNotifications', 'accountUpdates')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">New Features</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new features and improvements
                  </p>
                </div>
                <Switch 
                  checked={preferences.emailNotifications.newFeatures}
                  onCheckedChange={() => handleToggleChange('emailNotifications', 'newFeatures')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive tips, special offers, and promotional emails
                  </p>
                </div>
                <Switch 
                  checked={preferences.emailNotifications.marketing}
                  onCheckedChange={() => handleToggleChange('emailNotifications', 'marketing')}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>In-App Notifications</CardTitle>
              <CardDescription>
                Manage your in-app notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Video Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your videos are ready or if there's an error
                  </p>
                </div>
                <Switch 
                  checked={preferences.appNotifications.videoStatus}
                  onCheckedChange={() => handleToggleChange('appNotifications', 'videoStatus')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Comments & Shares</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone comments on or shares your video
                  </p>
                </div>
                <Switch 
                  checked={preferences.appNotifications.commentsAndShares}
                  onCheckedChange={() => handleToggleChange('appNotifications', 'commentsAndShares')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Usage Limits</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when approaching daily or monthly video limits
                  </p>
                </div>
                <Switch 
                  checked={preferences.appNotifications.usageLimits}
                  onCheckedChange={() => handleToggleChange('appNotifications', 'usageLimits')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
