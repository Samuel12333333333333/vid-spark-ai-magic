
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { testNotification } from '@/utils/testNotification';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';

export function NotificationDebug() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ message: string; results: string[] } | null>(null);
  
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
  
  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Debug Panel</CardTitle>
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
      </CardContent>
    </Card>
  );
}
