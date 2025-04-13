
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();
  const { refreshSubscription } = useSubscription();
  const { session } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // If there's no user session, redirect to login
    if (!session) {
      navigate("/login");
      return;
    }

    // Verify the payment was successful and update subscription status
    const verifyPayment = async () => {
      try {
        setIsVerifying(true);
        // Wait a moment to let Stripe webhook process
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Update subscription status
        await refreshSubscription();
      } catch (error) {
        console.error("Error verifying payment:", error);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [session, sessionId, navigate, refreshSubscription]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-smartvid-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-950 rounded-lg shadow-lg text-center">
        {isVerifying ? (
          <>
            <div className="flex justify-center mb-6">
              <Loader2 className="h-16 w-16 text-smartvid-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Verifying your payment</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Please wait while we confirm your payment with Stripe...
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Thank you for subscribing to SmartVid. Your account has been upgraded and you now have
              access to all premium features.
            </p>
            <div className="space-y-4">
              <Button className="w-full bg-smartvid-600 hover:bg-smartvid-700" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard/generator")}>
                Create Your First Video
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
