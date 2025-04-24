
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export const authService = {
  validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  async updatePassword(newPassword: string): Promise<void> {
    try {
      // Validate password before sending to Supabase
      const validation = this.validatePassword(newPassword);
      
      if (!validation.isValid) {
        const errorMessage = validation.errors.join('. ');
        console.error('Password validation failed:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Error updating password:', error);
        throw new Error(error.message || 'Error updating password');
      }
    } catch (error) {
      console.error('Error in updatePassword:', error);
      throw error;
    }
  },
  
  async resetPassword(email: string): Promise<void> {
    try {
      if (!email || !email.includes('@')) {
        throw new Error('Please provide a valid email address');
      }
      
      console.log('Sending password reset email to:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard/settings?tab=security`,
      });

      if (error) {
        console.error('Error sending reset password email:', error);
        throw new Error(error.message || 'Error sending reset password email');
      }
    } catch (error) {
      console.error('Error in resetPassword:', error);
      throw error;
    }
  }
};
