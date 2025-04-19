import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Save, CreditCard, Bell, ShieldAlert, Loader2, User, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { profileService, UserProfile } from "@/services/profileService";
import { authService, PasswordValidationResult } from "@/services/authService";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult>({ isValid: true, errors: [] });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const profileData = await profileService.getProfile(user.id);
        
        if (profileData) {
          setProfile(profileData);
          setFullName(profileData.username || "");
          setAvatarPreview(profileData.avatar_url);
        }
        
        setEmail(user.email || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile information");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    try {
      setIsSavingProfile(true);
      const updatedProfile = await profileService.updateProfile(user.id, { username: fullName });
      if (updatedProfile) {
        setProfile(updatedProfile);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async (data: PasswordFormValues) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    // Validate the new password
    const validation = authService.validatePassword(data.newPassword);
    setPasswordValidation(validation);
    
    if (!validation.isValid) {
      return;
    }

    try {
      setIsSaving(true);
      await authService.updatePassword(data.newPassword);
      toast.success("Password updated successfully");
      form.reset();
      setPasswordValidation({ isValid: true, errors: [] });
    } catch (error) {
      console.error("Error updating password:", error);
      
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update password");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) {
      return;
    }
    
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("File size must be less than 5MB");
      return;
    }

    // Create a local preview
    const fileUrl = URL.createObjectURL(file);
    setAvatarPreview(fileUrl);
    setAvatarFile(file);

    try {
      setIsSaving(true);
      const publicUrl = await profileService.uploadAvatar(user.id, file);
      if (publicUrl) {
        setAvatarPreview(publicUrl);
        setProfile(prev => prev ? {...prev, avatar_url: publicUrl} : null);
        toast.success("Avatar updated successfully");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      // Revert to previous avatar if available
      setAvatarPreview(profile?.avatar_url || null);
      toast.error("Failed to upload avatar. Please check if the avatars bucket exists in Supabase.");
    } finally {
      setIsSaving(false);
    }
  };

  const form = useForm<PasswordFormValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
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
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Change Avatar"
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {isSaving ? "This may take a moment..." : "JPG, PNG or GIF, max 5MB"}
                    </p>
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input 
                      id="full-name" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="transition-all duration-300 focus:ring-primary/30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email}
                      disabled
                      className="bg-muted/5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your email address is associated with your account and cannot be changed
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleProfileUpdate} 
                    disabled={isSavingProfile}
                    className="mt-4 transition-all duration-300 hover:scale-105"
                  >
                    {isSavingProfile ? (
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
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Change Password</h3>
                
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
                  <form onSubmit={form.handleSubmit(handlePasswordUpdate)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      
                      <div></div>
                      
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
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isSaving}
                      className="w-full md:w-auto transition-all duration-300 hover:scale-105"
                    >
                      {isSaving ? (
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
              </div>
            </CardContent>
          </Card>
          
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
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">Current Plan</h3>
                      <div className="flex items-center mt-1">
                        <Badge>Free</Badge>
                        <span className="text-sm text-muted-foreground ml-2">1 video per day</span>
                      </div>
                    </div>
                    <Button className="bg-smartvid-600 hover:bg-smartvid-700">
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
                    <div className="p-4 flex justify-between items-center">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                        <div>
                          <p className="font-medium">No payment method</p>
                          <p className="text-sm text-muted-foreground">Add a payment method to upgrade</p>
                        </div>
                      </div>
                      <Button variant="outline">Add Method</Button>
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
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">API Access</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        API access is only available on Business plans
                      </p>
                    </div>
                    <Badge variant="outline">Upgrade to Access</Badge>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">
                      You'll need to upgrade to a Business plan to access the API
                    </p>
                    <Button className="mt-4 bg-smartvid-600 hover:bg-smartvid-700">
                      Upgrade to Business
                    </Button>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">API Documentation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our API documentation provides information about endpoints, authentication, and example code.
                  </p>
                  <Button variant="outline">View API Documentation</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </TabsContent>
      </Tabs>
    </div>
  );
}
