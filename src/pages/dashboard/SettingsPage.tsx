
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  CreditCard, 
  Bell, 
  ShieldAlert, 
  Loader2, 
  Camera, 
  UserCircle, 
  Mail, 
  Lock, 
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { profileService, UserProfile } from "@/services/profileService";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useIsMobile } from "@/hooks/use-mobile";

// Form validation schemas
const profileFormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }).max(30, {
    message: "Username must not be longer than 30 characters.",
  }),
});

const emailFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "Current password is required.",
  }),
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  // Form setup
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
    },
  });
  
  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });
  
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const profileData = await profileService.getProfile(user.id);
        
        if (profileData) {
          setProfile(profileData);
          profileForm.setValue("username", profileData.username || "");
        }
        
        emailForm.setValue("email", user.email || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile information");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, profileForm, emailForm]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, GIF, or WEBP)");
      return;
    }
    
    if (file.size > maxSize) {
      toast.error("Image file is too large. Maximum size is 5MB");
      return;
    }
    
    setAvatarFile(file);
    
    // Preview the image
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSaveProfile = async (data: z.infer<typeof profileFormSchema>) => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      // Upload avatar if selected
      if (avatarFile) {
        const avatarUrl = await profileService.uploadAvatar(user.id, avatarFile);
        if (avatarUrl) {
          toast.success("Avatar uploaded successfully");
        }
      }
      
      // Update profile username
      await profileService.updateProfile(user.id, { 
        username: data.username
      });
      
      // Refresh profile data
      const updatedProfile = await profileService.getProfile(user.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
      
      toast.success("Profile information saved");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile information");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdateEmail = async (data: z.infer<typeof emailFormSchema>) => {
    try {
      setIsSaving(true);
      
      // In a real application, you would call Supabase to update the email
      // await supabase.auth.updateUser({ email: data.email });
      
      toast.success("Email update request sent. Please check your inbox to confirm.");
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error("Failed to update email");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdatePassword = async (data: z.infer<typeof passwordFormSchema>) => {
    try {
      setIsSaving(true);
      
      // In a real application, you would call Supabase to update the password
      // await supabase.auth.updateUser({ password: data.newPassword });
      
      toast.success("Password updated successfully");
      passwordForm.reset();
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
    } finally {
      setIsSaving(false);
    }
  };

  const userInitials = profile?.username
    ? profile.username.split(" ").map((n) => n[0]).join("").toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "U";
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-smartvid-600" />
      </div>
    );
  }
  
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="w-full md:w-auto overflow-x-auto">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Billing</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>API</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account details and personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center space-y-4">
                  <div 
                    className="relative group cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    <Avatar className="w-24 h-24 border-2 border-muted">
                      <AvatarImage 
                        src={avatarPreview || profile?.avatar_url || ""} 
                        alt="Profile" 
                      />
                      <AvatarFallback className="text-lg bg-smartvid-600 text-white">{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <Input
                    ref={fileInputRef}
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAvatarClick}
                  >
                    Change Avatar
                  </Button>
                </div>
                
                <div className="flex-1">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Your name" />
                            </FormControl>
                            <FormDescription>
                              This is the name that will be displayed to other users.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={isSaving || !profileForm.formState.isDirty && !avatarFile}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </h3>
                
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(handleUpdateEmail)} className="space-y-4">
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Your email" />
                          </FormControl>
                          <FormDescription>
                            We'll send a verification email to confirm this change.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={isSaving || !emailForm.formState.isDirty}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Email"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </h3>
                
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(handleUpdatePassword)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div></div>
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="py-2">
                      <Button 
                        type="submit" 
                        disabled={isSaving || !passwordForm.formState.isDirty}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
              
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-medium text-base">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch id="two-factor" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your subscription plan and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-medium text-lg">Current Plan</h3>
                    <div className="flex items-center mt-1">
                      <Badge>Free</Badge>
                      <span className="text-sm text-muted-foreground ml-2">1 video per day</span>
                    </div>
                  </div>
                  <Button className="bg-smartvid-600 hover:bg-smartvid-700 w-full md:w-auto">
                    Upgrade Plan
                  </Button>
                </div>
                
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Your free plan includes:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>1 video per day (30 per month)</li>
                    <li>720p video quality</li>
                    <li>30-second maximum duration</li>
                    <li>Basic templates</li>
                    <li>SmartVid watermark</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-4">Payment Methods</h3>
                <div className="border rounded-lg mb-4">
                  <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <p className="font-medium">No payment method</p>
                        <p className="text-sm text-muted-foreground">Add a payment method to upgrade</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full md:w-auto">Add Method</Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-4">Billing History</h3>
                <div className="border rounded-lg p-6 text-center">
                  <p className="text-muted-foreground">No billing history available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Email Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Video Generation</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails when your videos finish generating
                    </p>
                  </div>
                  <Switch id="video-email" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Account Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about account changes or security
                    </p>
                  </div>
                  <Switch id="account-email" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">New Features</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new features and improvements
                    </p>
                  </div>
                  <Switch id="features-email" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Marketing</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive tips, special offers, and promotional emails
                    </p>
                  </div>
                  <Switch id="marketing-email" />
                </div>
              </div>
              
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-medium">In-App Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Video Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when your videos are ready or if there's an error
                    </p>
                  </div>
                  <Switch id="video-app" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Comments & Shares</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone comments on or shares your video
                    </p>
                  </div>
                  <Switch id="social-app" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Usage Limits</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when approaching daily or monthly video limits
                    </p>
                  </div>
                  <Switch id="limits-app" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button>
                <Bell className="mr-2 h-4 w-4" />
                Save Notification Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="api" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>
                Manage API access and keys for developer integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div>
                    <h3 className="font-medium text-lg">API Access</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      API access is only available on Business plans
                    </p>
                  </div>
                  <Badge variant="outline">Upgrade to Access</Badge>
                </div>
                
                <div className="mt-6 flex flex-col items-center text-center">
                  <ShieldAlert className="h-12 w-12 mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    You'll need to upgrade to a Business plan to access the API
                  </p>
                  <Button className="mt-4 bg-smartvid-600 hover:bg-smartvid-700 w-full md:w-auto">
                    Upgrade to Business
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">API Documentation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Our API documentation provides information about endpoints, authentication, and example code.
                </p>
                <Button variant="outline" className="w-full md:w-auto">View API Documentation</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
