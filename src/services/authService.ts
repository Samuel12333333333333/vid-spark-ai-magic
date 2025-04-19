
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const authService = {
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  },
};
