
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Save, CreditCard, Bell, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [fullName, setFullName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  
  const handleSaveProfile = () => {
    toast.success("Profile information saved");
  };
  
  const handleSaveBilling = () => {
    toast.success("Billing information updated");
  };
  
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
        
        <TabsContent value="account" className="mt-6">
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
                  <Avatar className="w-24 h-24">
                    <AvatarImage src="" alt="Profile" />
                    <AvatarFallback className="text-lg">JD</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input 
                      id="full-name" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Account Role</Label>
                    <Input id="role" value="Free User" disabled />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your account permissions and access level
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Account Security</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    
                    <div></div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="two-factor" />
                    <Label htmlFor="two-factor">Enable two-factor authentication</Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSaveProfile}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
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
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSaveBilling}>
                <Save className="mr-2 h-4 w-4" />
                Save Billing Preferences
              </Button>
            </CardFooter>
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
      </Tabs>
    </div>
  );
}
