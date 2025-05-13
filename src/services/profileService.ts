
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at?: string;
  updated_at?: string;
}

async function getProfile(userId: string): Promise<Profile | null> {
  try {
    if (!userId) {
      console.error("No user ID provided to getProfile");
      return null;
    }
    
    console.log("Fetching profile for user:", userId);
    
    // First try to get the profile
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url, email')
      .eq('id', userId)
      .maybeSingle(); // Using maybeSingle instead of single to prevent 406 errors
      
    if (error) {
      console.error("Error fetching profile:", error);
      
      // Check if it might be because the profile doesn't exist
      if (error.code === 'PGRST116' || error.message.includes('404') || error.message.includes('406')) {
        // Try to get user from auth and create a profile
        return await createProfileIfMissing(userId);
      }
      
      throw error;
    }

    if (!data) {
      // Profile doesn't exist, let's create it
      return await createProfileIfMissing(userId);
    }
    
    return {
      id: userId,
      ...data
    };
  } catch (error) {
    console.error("Error in getProfile:", error);
    return null;
  }
}

async function createProfileIfMissing(userId: string): Promise<Profile | null> {
  try {
    console.log("Creating missing profile for user:", userId);
    
    // Get user info from auth.users
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error("Error getting user data:", userError);
      return null;
    }
    
    // Create a new profile
    const newProfile = {
      id: userId,
      username: user.user.user_metadata?.name || user.user.email?.split('@')[0] || null,
      email: user.user.email,
      avatar_url: user.user.user_metadata?.avatar_url || null
    };
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(newProfile);
      
    if (insertError) {
      console.error("Error creating profile:", insertError);
      return null;
    }
    
    return newProfile;
  } catch (error) {
    console.error("Error creating profile:", error);
    return null;
  }
}

async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<{ success: boolean; profile?: Profile }> {
  try {
    // First check if profile exists
    const profile = await getProfile(userId);
    
    if (!profile) {
      // Create profile first
      await createProfileIfMissing(userId);
    }
    
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) throw error;

    toast.success("Profile updated successfully");
    return { success: true, profile: { ...profile!, ...updates } };
  } catch (error) {
    console.error("Error updating profile:", error);
    toast.error("Failed to update profile");
    return { success: false };
  }
}

async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ success: boolean; url?: string }> {
  try {
    // Create a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Check if avatars bucket exists, create if not
    const { data: bucketData } = await supabase.storage.listBuckets();
    if (!bucketData?.find(bucket => bucket.name === "avatars")) {
      await supabase.storage.createBucket("avatars", {
        public: true,
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/svg+xml"
        ],
        fileSizeLimit: 1024 * 1024, // 1MB
      });
    }

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(`public/${fileName}`, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = await supabase.storage
      .from("avatars")
      .getPublicUrl(`public/${fileName}`);

    const avatarUrl = data?.publicUrl;

    // Update user profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId);

    if (updateError) throw updateError;

    toast.success("Avatar uploaded successfully");
    return { success: true, url: avatarUrl };
  } catch (error) {
    console.error("Error uploading avatar:", error);
    toast.error("Failed to upload avatar");
    return { success: false };
  }
}

async function fetchAllProfiles(): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }
}

// Export all functions as part of the profileService object
export const profileService = {
  getProfile,
  updateProfile,
  uploadAvatar,
  fetchAllProfiles,
  createProfileIfMissing
};

// Also export individual functions for backward compatibility
export {
  getProfile,
  updateProfile,
  uploadAvatar,
  fetchAllProfiles,
  createProfileIfMissing
};
