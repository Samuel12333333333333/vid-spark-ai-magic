
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';

const newsletterSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

export function NewsletterSection() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: NewsletterFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Here you would normally send this to your backend
      console.log("Subscribing email:", data.email);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success("Successfully subscribed to our newsletter!");
      
      // Create a notification if user is logged in
      if (user) {
        await notificationService.createNotification({
          userId: user.id,
          title: "Newsletter Subscription Confirmed",
          message: "You've been successfully subscribed to our newsletter.",
          type: 'newsletter'
        });
      }
      
      form.reset();
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-12 md:py-16 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-4">
            Get AI Video Updates
          </h2>
          <p className="text-muted-foreground mb-6 md:mb-8">
            Subscribe to our newsletter for the latest AI video generation tips, tutorials, and industry news.
          </p>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Email</FormLabel>
                    <FormControl>
                      <div className="flex w-full max-w-sm items-center space-x-2">
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          className="flex-1"
                          aria-label="Email address for newsletter"
                          disabled={isSubmitting}
                        />
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Subscribing..." : "Subscribe"}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          
          <p className="text-xs text-muted-foreground mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
}
