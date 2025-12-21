
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { notificationService } from "@/services/notificationService"; 

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you would send this to your newsletter service
      
      toast.success("Thank you for subscribing to our newsletter!");
      
      // Create a notification if user is logged in
      if (user) {
        await notificationService.createNotification({
          user_id: user.id,
          title: "Newsletter Subscription",
          message: "Thank you for subscribing to our newsletter. You'll receive updates about new features and tips.",
          type: 'newsletter',
          metadata: { 
            email, 
            subscribed_at: new Date().toISOString() 
          }
        });
      }
      
      setEmail("");
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      toast.error("Failed to subscribe. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-muted/50 py-16">
      <div className="container px-4 mx-auto max-w-5xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="lg:w-1/2">
            <h2 className="text-3xl font-bold tracking-tight">
              Stay updated with our newsletter
            </h2>
            <p className="mt-3 text-muted-foreground">
              Get the latest Smart Video updates, tips, and special offers delivered straight to your inbox.
            </p>
          </div>
          <div className="lg:w-1/2">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
