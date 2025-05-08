
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import SEOMetadata from "@/components/SEOMetadata";
import { notificationService } from "@/services/notificationService";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { refreshSubscription } = useSubscription();

  // Create a payment notification on page load
  useEffect(() => {
    const createPaymentNotification = async () => {
      if (!session?.user) return;
      
      try {
        console.log("Creating payment success notification");
        
        // Use the notification service instead of direct DB access
        await notificationService.createNotification({
          userId: session.user.id,
          title: "Payment Successful",
          message: "Your subscription payment was processed successfully. Thank you for your support!",
          type: 'payment',
          metadata: { source: 'payment_success_page' }
        });
        
        console.log("Payment notification created");
        
        // Also refresh subscription data
        await refreshSubscription();
      } catch (error) {
        console.error("Error creating payment notification:", error);
      }
    };
    
    createPaymentNotification();
  }, [session, refreshSubscription]);

  return (
    <>
      <SEOMetadata
        title="Payment Successful"
        description="Your payment was successful"
        keywords="payment, subscription, success"
      />
      
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Card className="max-w-md w-full p-8 shadow-lg">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Payment Successful!</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Thank you for your payment. Your subscription has been activated successfully.
              </p>
            </div>
            
            <div className="pt-4 w-full">
              <Button 
                className="w-full" 
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
