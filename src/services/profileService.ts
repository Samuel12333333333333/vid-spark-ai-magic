
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
      // First check if the avatars bucket exists
      const { data: bucketExists, error: bucketError } = await supabase.storage
        .from('avatars')
        .list();
        
      if (bucketError && bucketError.message.includes('The resource was not found')) {
        toast.error('Avatar storage not configured. Please create an "avatars" bucket in Supabase.');
        throw new Error('Avatars bucket does not exist');
      }
      
      // Generate a unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;
      
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
