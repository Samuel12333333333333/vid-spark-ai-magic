
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { testNotification } from '@/utils/testNotification';

export function NotificationTester() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleTest = async () => {
    if (!session?.user) {
      toast.error("You must be logged in to test notifications");
      return;
    }
    
    setIsLoading(true);
    try {
      await testNotification(session.user.id);
      toast.success("Test completed! Check console for results");
    } catch (error) {
      console.error("Test notification error:", error);
      toast.error("Error testing notification");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!session?.user) {
    return null;
  }

  return (
    <Button 
      onClick={handleTest}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="ml-2"
    >
      {isLoading ? "Testing..." : "Test Notification"}
    </Button>
  );
}
