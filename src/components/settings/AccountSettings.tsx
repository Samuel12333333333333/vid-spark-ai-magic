
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

const profileSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function AccountSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
    },
  });

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const profileData = await profileService.getProfile(user.id);
        if (profileData) {
          setProfile(profileData);
          setAvatarPreview(profileData.avatar_url);
          form.setValue("username", profileData.username || "");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          variant: "destructive",
          title: "Failed to load profile",
          description: "There was an error loading your profile information."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const result = await profileService.updateProfile(user.id, data);
      
      if (result.success && result.profile) {
        setProfile(result.profile);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully."
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was an error updating your profile."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) {
      return;
    }
    
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        variant: "destructive",
        title: "File too large",
        description: "File size must be less than 5MB"
      });
      return;
    }

    // Create a local preview
    const fileUrl = URL.createObjectURL(file);
    setAvatarPreview(fileUrl);
    setAvatarFile(file);

    try {
      setIsLoading(true);
      const result = await profileService.uploadAvatar(user.id, file);
      if (result.success && result.url) {
        // Here's the fix: we're using result.url instead of the whole result object
        setAvatarPreview(result.url);
        setProfile(prev => prev ? {...prev, avatar_url: result.url} : null);
        toast({
          title: "Avatar updated",
          description: "Your avatar has been updated successfully."
        });
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setAvatarPreview(profile?.avatar_url || null);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error uploading your avatar."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const userInitials = user?.email
    ?.split("@")[0]
    .substring(0, 2)
    .toUpperCase() || "U";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-24 h-24 ring-2 ring-primary/10 transition-all duration-300 hover:ring-primary/30">
            <AvatarImage 
              src={avatarPreview || ""} 
              alt="Profile"
              className="object-cover"
            />
            <AvatarFallback className="text-lg bg-primary/5">
              <User className="h-8 w-8 text-primary/40" />
            </AvatarFallback>
          </Avatar>
          <div>
            <Input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Label
              htmlFor="avatar-upload"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-all duration-300 hover:bg-primary/90 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer disabled:pointer-events-none disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Change Avatar"
              )}
            </Label>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {isLoading ? "This may take a moment..." : "JPG, PNG or GIF, max 5MB"}
            </p>
          </div>
        </div>
        
        <div className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={user?.email || ""}
                  disabled
                  className="bg-muted/5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your email address is associated with your account and cannot be changed
                </p>
              </div>
              
              <Button 
                type="submit" 
                disabled={isLoading}
                className="transition-all duration-300 hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
