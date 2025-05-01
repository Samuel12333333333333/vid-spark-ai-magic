
import { useState, useEffect } from "react";
import { CreditCard, ExternalLink, Loader2, Tag, Clock, Receipt, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface PaymentHistory {
  id: string;
  amount: number;
  status: "succeeded" | "processing" | "failed";
  date: Date;
  receiptUrl?: string | null;
}

export function BillingSettings() {
  const { user } = useAuth();
  const { subscription, hasActiveSubscription, isPro, isBusiness, refreshSubscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment methods and history
  const fetchBillingData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Refresh subscription data first
      await refreshSubscription();
      
      try {
        // Fetch payment methods from the edge function
        const { data: methodsData, error: methodsError } = await supabase.functions.invoke("get-payment-methods");
        
        if (methodsError) {
          console.error("Error fetching payment methods:", methodsError);
          setError("Could not fetch payment information");
        } else if (methodsData?.paymentMethods) {
          setPaymentMethods(methodsData.paymentMethods);
        }
      } catch (methodsError) {
        console.error("Exception fetching payment methods:", methodsError);
      }
      
      try {
        // Fetch payment history
        const { data: historyData, error: historyError } = await supabase.functions.invoke("get-payment-history");
        
        if (historyError) {
          console.error("Error fetching payment history:", historyError);
          if (!error) { // Only set error if no previous error
            setError("Could not fetch payment history");
          }
        } else if (historyData?.paymentHistory) {
          // Format dates from timestamps
          const formattedHistory = historyData.paymentHistory.map(payment => ({
            ...payment,
            date: new Date(payment.created * 1000)
          }));
          setPaymentHistory(formattedHistory);
        }
      } catch (historyError) {
        console.error("Exception fetching payment history:", historyError);
        if (!error) { // Only set error if no previous error
          setError("Could not fetch payment history");
        }
      }
    } catch (err) {
      console.error("Error fetching billing data:", err);
      setError("An unexpected error occurred while fetching your billing information");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [user]);

  // Open Stripe Customer Portal
  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) {
        console.error("Error accessing customer portal:", error);
        toast.error("Could not open customer portal. Please try again.");
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not generate customer portal link");
      }
    } catch (err) {
      console.error("Error opening customer portal:", err);
      toast.error("Could not open customer portal. Please try again.");
    } finally {
      setIsPortalLoading(false);
    }
  };

  // Helper function to format card brand
  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };
  
  // Helper function to format payment status
  const formatPaymentStatus = (status: string) => {
    switch(status) {
      case "succeeded":
        return <Badge variant="outline" className="text-green-500 border-green-500">Paid</Badge>;
      case "processing":
        return <Badge variant="outline">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderCurrentPlan = () => {
    if (isLoading) {
      return (
        <div className="mt-1">
          <Skeleton className="h-6 w-24" />
        </div>
      );
    }
    
    if (hasActiveSubscription && subscription) {
      return (
        <div className="flex items-center mt-1">
          <Badge variant="default">{subscription.plan_name}</Badge>
          <span className="text-sm text-muted-foreground ml-2">
            {subscription.status === "active" ? "Active" : subscription.status}
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center mt-1">
        <Badge>Free</Badge>
        <span className="text-sm text-muted-foreground ml-2">1 video per day</span>
      </div>
    );
  };
  
  const renderSubscriptionDetails = () => {
    if (isLoading) {
      return (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      );
    }
    
    if (hasActiveSubscription && subscription && subscription.current_period_end) {
      const endDate = typeof subscription.current_period_end === 'string' 
        ? parseISO(subscription.current_period_end)
        : new Date(subscription.current_period_end);
        
      return (
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              Your subscription renews {formatDistanceToNow(endDate, { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {subscription.status === "active" ? "Your subscription is active" : 
               subscription.status === "canceled" ? "Your subscription is canceled but still active until the end of the billing period" : 
               "Your subscription needs attention"}
            </span>
          </div>
        </div>
      );
    }
    
    return (
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Your free plan includes:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>1 video per day (30 per month)</li>
          <li>720p video quality</li>
          <li>30-second maximum duration</li>
          <li>Basic templates</li>
          <li>SmartVid watermark</li>
        </ul>
      </div>
    );
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Button onClick={fetchBillingData}>
          Retry Loading Billing Information
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Section */}
      <div className="border rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg">Current Plan</h3>
            {renderCurrentPlan()}
          </div>
          
          {hasActiveSubscription ? (
            <Button 
              variant="default" 
              onClick={handleManageSubscription}
              disabled={isPortalLoading}
            >
              {isPortalLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Manage Subscription"
              )}
            </Button>
          ) : (
            <Button 
              variant="default" 
              onClick={() => window.location.href = "/dashboard/upgrade"}
            >
              Upgrade Plan
            </Button>
          )}
        </div>
        
        {renderSubscriptionDetails()}
      </div>

      {/* Payment Methods Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-8 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ) : paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {paymentMethods.map(method => (
                <div key={method.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-8 bg-muted flex items-center justify-center rounded mr-4">
                      {method.brand === "visa" && <span className="font-bold text-blue-600">VISA</span>}
                      {method.brand === "mastercard" && <span className="font-bold text-red-500">MC</span>}
                      {!["visa", "mastercard"].includes(method.brand) && <span className="font-bold">{formatCardBrand(method.brand).substring(0, 2)}</span>}
                    </div>
                    <div>
                      <p className="font-medium">{formatCardBrand(method.brand)} •••• {method.last4}</p>
                      <p className="text-sm text-muted-foreground">Expires {method.expMonth}/{method.expYear}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.isDefault && (
                      <Badge variant="outline" className="mr-2">Default</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPortalLoading} 
                      onClick={handleManageSubscription}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={handleManageSubscription}
                disabled={isPortalLoading}
              >
                {isPortalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Manage Payment Methods"
                )}
              </Button>
            </div>
          ) : (
            <div>
              <div className="border rounded-lg p-4 mb-4 flex justify-between items-center">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="font-medium">No payment method</p>
                    <p className="text-sm text-muted-foreground">Add a payment method to upgrade</p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = "/dashboard/upgrade"}
                >
                  Add Method
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-3">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : paymentHistory.length > 0 ? (
            <div>
              {paymentHistory.map((payment, index) => (
                <div key={payment.id}>
                  <div className="flex justify-between items-center py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">${(payment.amount / 100).toFixed(2)}</p>
                        {formatPaymentStatus(payment.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(payment.date, "MMM d, yyyy")}
                      </p>
                    </div>
                    {payment.receiptUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex items-center gap-1"
                        asChild
                      >
                        <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                          <Receipt className="h-3 w-3" />
                          Receipt
                        </a>
                      </Button>
                    )}
                  </div>
                  {index < paymentHistory.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No billing history available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
