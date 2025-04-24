
import { useState, useEffect } from "react";
import { CreditCard, ExternalLink, Loader2, Tag, Clock, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentMethod {
  id: string;
  brand: string; // visa, mastercard, etc
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface SubscriptionPlan {
  name: string;
  status: "active" | "canceled" | "trialing" | "past_due";
  currentPeriodEnd: Date;
  price: number;
  interval: "month" | "year";
}

interface PaymentHistory {
  id: string;
  amount: number;
  status: "succeeded" | "processing" | "failed";
  date: Date;
  receiptUrl?: string;
}

export function BillingSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);

  useEffect(() => {
    // Mock data loading for demonstration purposes
    const loadData = async () => {
      setIsLoading(true);
      
      // Simulate API fetch delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For now, we just simulate the data
      // This would be replaced with actual API calls
      if (Math.random() > 0.5) {
        // Simulate having subscription data
        setSubscription({
          name: "Pro Plan",
          status: "active",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          price: 29.99,
          interval: "month"
        });
        
        setPaymentMethods([
          {
            id: "pm_123456",
            brand: "visa",
            last4: "4242",
            expMonth: 12,
            expYear: 2025,
            isDefault: true
          }
        ]);
        
        setPaymentHistory([
          {
            id: "pi_123456",
            amount: 29.99,
            status: "succeeded",
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            receiptUrl: "#"
          },
          {
            id: "pi_123455",
            amount: 29.99,
            status: "succeeded",
            date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
          }
        ]);
      }
      
      setIsLoading(false);
    };
    
    if (user) {
      loadData();
    }
  }, [user]);

  // Helper function to format card brand
  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };
  
  // Helper function to format payment status
  const formatPaymentStatus = (status: string) => {
    switch(status) {
      case "succeeded":
        return <Badge variant="success">Paid</Badge>;
      case "processing":
        return <Badge variant="outline">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Section */}
      <div className="border rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg">Current Plan</h3>
            {isLoading ? (
              <div className="mt-1">
                <Skeleton className="h-6 w-24" />
              </div>
            ) : subscription ? (
              <div className="flex items-center mt-1">
                <Badge variant="default">{subscription.name}</Badge>
                <span className="text-sm text-muted-foreground ml-2">
                  {subscription.price.toFixed(2)} / {subscription.interval}
                </span>
              </div>
            ) : (
              <div className="flex items-center mt-1">
                <Badge>Free</Badge>
                <span className="text-sm text-muted-foreground ml-2">1 video per day</span>
              </div>
            )}
          </div>
          
          <Button variant="default">
            {subscription ? "Manage Subscription" : "Upgrade Plan"}
          </Button>
        </div>
        
        {isLoading ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : subscription ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                Your subscription renews {formatDistanceToNow(subscription.currentPeriodEnd, { addSuffix: true })}
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
        ) : (
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
        )}
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
                    <Button variant="outline" size="sm">Remove</Button>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </div>
              ))}
              <Button className="w-full" variant="outline">Add New Payment Method</Button>
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
                <Button variant="outline">Add Method</Button>
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
                        <p className="font-medium">${payment.amount.toFixed(2)}</p>
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
