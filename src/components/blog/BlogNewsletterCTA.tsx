import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { notificationService } from "@/services/notificationService";
import { Mail, Sparkles } from "lucide-react";

export function BlogNewsletterCTA() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      toast.success("Thank you for subscribing! Check your inbox for updates.");

      if (user) {
        await notificationService.createNotification({
          user_id: user.id,
          title: "Newsletter Subscription",
          message:
            "Thank you for subscribing to our newsletter. You'll receive updates about new features and tips.",
          type: "newsletter",
          metadata: {
            email,
            subscribed_at: new Date().toISOString(),
            source: "blog_post",
          },
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
    <div className="mt-12 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        
        <h3 className="text-xl font-bold mb-2">
          Enjoyed this article?
        </h3>
        
        <p className="text-muted-foreground mb-6 max-w-md">
          Subscribe to our newsletter and get the latest video marketing tips, AI updates, and exclusive content delivered to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <Input
            type="email"
            placeholder="Enter your email"
            className="flex-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {isSubmitting ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>

        <p className="mt-3 text-xs text-muted-foreground">
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
