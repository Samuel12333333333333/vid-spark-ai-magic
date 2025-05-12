
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  username?: string;
  avatar_url?: string;
}

export const profileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to prevent errors when no rows are found
        
      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          // Get user email from auth
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            const newProfile = {
              id: userId,
              email: userData.user.email,
              username: userData.user.user_metadata?.name || null,
              avatar_url: userData.user.user_metadata?.avatar_url || null
            };
            
            const { data: insertedProfile, error: insertError } = await supabase
              .from('profiles')
              .insert(newProfile)
              .select('*')
              .single();
              
            if (!insertError) {
              return insertedProfile;
            }
          }
        }
        
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  },
  
  async updateProfile(userId: string, updates: UpdateProfileData): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  },
  
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      // First, check if the file size is within acceptable limits
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("File size must be less than 5MB");
        return null;
      }

      // Generate a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        toast.error('Failed to upload avatar. Please try again.');
        return null;
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // Update the user's profile with the new avatar URL
      await this.updateProfile(userId, { avatar_url: publicUrl });
      
      toast.success('Avatar uploaded successfully');
      return publicUrl;
    } catch (error) {
      console.error('Unexpected error in avatar upload:', error);
      toast.error('An unexpected error occurred. Please try again.');
      return null;
    }
  }
};
