import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters")
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function PasswordSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<{isValid: boolean, errors: string[]}>({
    isValid: true,
    errors: []
  });
  const { user } = useAuth();

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const onSubmit = async (data: PasswordFormValues) => {
    try {
      setIsLoading(true);
      
      // Validate password strength
      const validation = authService.validatePassword(data.newPassword);
      setPasswordValidation(validation);
      
      if (!validation.isValid) {
        setIsLoading(false);
        return;
      }

      await authService.updatePassword(data.newPassword);
      toast.success("Password updated successfully");
      form.reset();
    } catch (error) {
      console.error("Error updating password:", error);
      
      if (error instanceof Error) {
        toast.error(`Failed to update password: ${error.message}`);
      } else {
        toast.error("Failed to update password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Change Password</h3>
      
      {!passwordValidation.isValid && (
        <Alert variant="destructive" className="mb-4 animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Password Requirements</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 text-sm">
              {passwordValidation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    {...field}
                    className="transition-all duration-300 focus:ring-primary/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    {...field}
                    className="transition-all duration-300 focus:ring-primary/30"
                    onChange={(e) => {
                      field.onChange(e);
                      // Only validate when actively typing
                      if (e.target.value) {
                        setPasswordValidation(authService.validatePassword(e.target.value));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    {...field}
                    className="transition-all duration-300 focus:ring-primary/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full md:w-auto transition-all duration-300 hover:scale-105"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Password
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="border-t pt-6 space-y-4">
        <h3 className="text-lg font-medium">Forgot Password</h3>
        <p className="text-sm text-muted-foreground">
          If you've forgotten your password, you can request a password reset email.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      if (!email) {
        toast.error("Please enter your email address");
        return;
      }
      
      // Use current user's email if available
      const emailToUse = user?.email || email;
      
      await authService.resetPassword(emailToUse);
      toast.success("Password reset email sent. Please check your inbox.");
      setEmail("");
    } catch (error) {
      console.error("Error resetting password:", error);
      
      if (error instanceof Error) {
        toast.error(`Password reset failed: ${error.message}`);
      } else {
        toast.error("Password reset failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={user?.email || "Enter your email"}
          className="mt-1"
        />
      </div>
      
      <Button 
        type="submit"
        variant="outline"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Reset Email"
        )}
      </Button>
    </form>
  );
}
