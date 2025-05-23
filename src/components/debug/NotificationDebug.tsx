
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { testNotification } from '@/utils/testNotification';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export function NotificationDebug() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [results, setResults] = useState<{ message: string; results: string[] } | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const handleTest = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to test notifications");
      return;
    }
    
    setIsLoading(true);
    try {
      const results = await testNotification(user.id);
      setResults(results);
      toast.success("Test completed! Check console and results below");
      
      // Refresh notifications after creating a new one
      await fetchNotifications();
    } catch (error) {
      console.error("Test notification error:", error);
      toast.error("Error testing notification");
      setResults({
        message: "Test failed",
        results: [`Error: ${error instanceof Error ? error.message : String(error)}`]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setIsRefreshing(true);
    try {
      const notifs = await notificationService.getNotifications(user.id);
      setNotifications(notifs.slice(0, 5)); // Show only the 5 most recent
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Fetch notifications when component mounts
  useState(() => {
    if (user?.id) {
      fetchNotifications();
    }
  });
  
  if (!user) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Notification Debug Panel</span>
            <Button 
              onClick={fetchNotifications} 
              variant="outline" 
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Test notification creation to verify the notification system is working properly.
            </p>
            <Button 
              onClick={handleTest}
              disabled={isLoading}
              variant="default"
            >
              {isLoading ? "Testing..." : "Test Notifications"}
            </Button>
          </div>
          
          {results && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">Test Results:</h3>
                <div className="space-y-2">
                  {results.results.map((result, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {result.includes('Success') ? (
                        <CheckCircle className="text-green-500 h-4 w-4" />
                      ) : (
                        <AlertCircle className="text-red-500 h-4 w-4" />
                      )}
                      <span className="text-sm">
                        {result}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {notifications.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">Recent Notifications:</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notifications.map((notif) => (
                    <Card key={notif.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">{notif.title}</div>
                          <div className="text-xs text-muted-foreground">{notif.message}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Type: <span className="font-mono">{notif.type}</span> | 
                            Read: <span className="font-mono">{notif.is_read ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(notif.created_at).toLocaleString()}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}
