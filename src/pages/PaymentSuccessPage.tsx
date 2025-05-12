
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import SEOMetadata from "@/components/SEOMetadata";
import { notificationService } from "@/services/notificationService";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { refreshSubscription } = useSubscription();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!session?.user) {
        setIsVerifying(false);
        return;
      }

      try {
        setIsVerifying(true);
        
        // Get reference from URL if available
        const params = new URLSearchParams(location.search);
        const reference = params.get('reference');
        const plan = params.get('plan') || 'pro';
        
        if (reference) {
          // Payment reference found, assume payment is successful
          // In a production app, you might verify this on the server side
          console.log("Payment reference found:", reference);
          setIsSuccess(true);
          
          // Create payment notification
          await notificationService.createNotification({
            user_id: session.user.id,
            title: "Payment Successful",
            message: `Your ${plan} subscription payment was processed successfully. Thank you for your support!`,
            type: 'payment',
            metadata: { source: 'payment_success_page', reference, plan }
          });
          
          // Refresh subscription data
          await refreshSubscription();
        } else {
          // No reference found, but we're on the success page - likely a direct navigation
          console.log("No reference found, but we're on the success page");
          setIsSuccess(true);
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setIsSuccess(false);
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyPayment();
  }, [session, refreshSubscription, location]);

  return (
    <>
      <SEOMetadata
        title="Payment Successful"
        description="Your payment was successful"
        keywords="payment, subscription, success"
      />
      
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Card className="max-w-md w-full p-8 shadow-lg">
          {isVerifying ? (
            <div className="flex flex-col items-center text-center space-y-6">
              <Loader2 className="h-12 w-12 text-smartvid-600 animate-spin" />
              <h1 className="text-2xl font-bold tracking-tight">Verifying Payment</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Please wait while we verify your payment...
              </p>
            </div>
          ) : isSuccess ? (
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
          ) : (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-12 w-12 text-yellow-600" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Payment Verification Failed</h1>
                <p className="text-gray-500 dark:text-gray-400">
                  We couldn't verify your payment status. If you believe this is an error, please contact support.
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
          )}
        </Card>
      </div>
    </>
  );
}
