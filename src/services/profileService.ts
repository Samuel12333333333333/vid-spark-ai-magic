
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  },
  
  async updateProfile(userId: string, updates: UpdateProfileData): Promise<UserProfile | null> {
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
  },
  
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      // Check if bucket exists, if not show a friendly error
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error checking storage buckets:', bucketsError);
        toast.error('Storage service unavailable');
        throw bucketsError;
      }
      
      const avatarBucketExists = buckets.some(bucket => bucket.name === 'avatars');
      
      if (!avatarBucketExists) {
        console.error('Avatars bucket does not exist');
        toast.error('Avatar storage not configured. Please contact support.');
        throw new Error('Avatar storage not configured');
      }
      
      // Generate a unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;
      
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        toast.error('Failed to upload avatar. Please try again.');
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // Update the user's profile with the new avatar URL
      await this.updateProfile(userId, { avatar_url: data.publicUrl });
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error in avatar upload process:', error);
      throw error;
    }
  }
};
