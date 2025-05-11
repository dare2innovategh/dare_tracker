import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Check, User, Bell, Shield, Palette, Camera } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("account");

  // Example preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmSNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");

  // Mastercard theme colors
  const mastercardTheme = {
    primary: "#FF5F00", // Mastercard orange
    secondary: "#EB001B", // Mastercard red
    tertiary: "#F79E1B", // Mastercard yellow
    dark: "#1A1F36",
    light: "#FFFFFF"
  };

  // Tab colors mapping
  const tabColors = {
    account: mastercardTheme.primary,
    preferences: mastercardTheme.tertiary,
    security: mastercardTheme.secondary,
    appearance: "#6C63FF" // Purple for appearance
  };

  // Get current tab color
  const getCurrentTabColor = () => {
    return tabColors[activeTab] || mastercardTheme.primary;
  };

  // Account form state
  const [accountForm, setAccountForm] = useState({
    fullName: user?.fullName || "",
    username: user?.username || "",
    email: user?.email || "",
    district: user?.district || "",
    profilePicture: user?.profilePicture || ""
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setAccountForm({
        fullName: user.fullName || "",
        username: user.username || "",
        email: user.email || "",
        district: user.district || "",
        profilePicture: user.profilePicture || ""
      });
    }
  }, [user]);

  // Handle account form change
  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle district selection change 
  const handleDistrictChange = (value) => {
    setAccountForm(prev => ({
      ...prev,
      district: value
    }));
  };

  // User profile update mutation
  const { toast } = useToast();
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (!user?.id) {
        throw new Error("User not found");
      }
      const res = await apiRequest("PATCH", `/api/users/${user.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate user data cache to refresh
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle account form submission
  const handleAccountSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(accountForm);
  };

  // Handle preferences form submission
  const handlePreferencesSubmit = (e) => {
    e.preventDefault();
    // Save preferences
    toast({
      title: "Preferences saved",
      description: "Your preferences have been updated",
      variant: "default",
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-7xl">
        {/* Header with Mastercard styling */}
        <div 
          className="rounded-lg p-6 mb-8" 
          style={{ 
            background: `linear-gradient(135deg, ${mastercardTheme.secondary} 0%, ${mastercardTheme.primary} 50%, ${mastercardTheme.tertiary} 100%)`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Account Settings</h1>
              <p className="text-white opacity-90 mt-1">
                Manage your account settings and preferences
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden md:block text-right">
                <p className="text-white font-medium">{user?.fullName || user?.username}</p>
                <Badge 
                  className="mt-1"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.2)', 
                    border: '1px solid rgba(255, 255, 255, 0.3)' 
                  }}
                >
                  {user?.role || "User"}
                </Badge>
              </div>
              <Avatar className="h-12 w-12 border-2 border-white">
                {user?.profilePicture ? (
                  <AvatarImage src={user.profilePicture} alt={user.fullName} />
                ) : (
                  <AvatarFallback className="text-lg bg-white text-orange-500">
                    {user?.fullName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-md overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="sticky top-0 z-10 bg-white border-b">
              <div className="px-4 md:px-6 pt-4 pb-3">
                <TabsList 
                  className="w-full flex rounded-lg p-1 h-auto gap-2 bg-gray-100"
                >
                  <TabsTrigger 
                    value="account" 
                    className="flex-1 py-3 rounded-lg data-[state=active]:shadow-md transition-all duration-200 ease-in-out flex flex-col items-center gap-1 h-auto"
                    style={{ 
                      backgroundColor: activeTab === "account" ? "white" : "transparent",
                      color: activeTab === "account" ? tabColors.account : "rgba(0,0,0,0.6)"
                    }}
                  >
                    <User className={`h-5 w-5 ${activeTab === "account" ? "text-current" : "text-gray-500"}`} />
                    <span className="text-sm font-medium">Account</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="preferences" 
                    className="flex-1 py-3 rounded-lg data-[state=active]:shadow-md transition-all duration-200 ease-in-out flex flex-col items-center gap-1 h-auto"
                    style={{ 
                      backgroundColor: activeTab === "preferences" ? "white" : "transparent",
                      color: activeTab === "preferences" ? tabColors.preferences : "rgba(0,0,0,0.6)"
                    }}
                  >
                    <Bell className={`h-5 w-5 ${activeTab === "preferences" ? "text-current" : "text-gray-500"}`} />
                    <span className="text-sm font-medium">Preferences</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="security" 
                    className="flex-1 py-3 rounded-lg data-[state=active]:shadow-md transition-all duration-200 ease-in-out flex flex-col items-center gap-1 h-auto"
                    style={{ 
                      backgroundColor: activeTab === "security" ? "white" : "transparent",
                      color: activeTab === "security" ? tabColors.security : "rgba(0,0,0,0.6)"
                    }}
                  >
                    <Shield className={`h-5 w-5 ${activeTab === "security" ? "text-current" : "text-gray-500"}`} />
                    <span className="text-sm font-medium">Security</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="appearance" 
                    className="flex-1 py-3 rounded-lg data-[state=active]:shadow-md transition-all duration-200 ease-in-out flex flex-col items-center gap-1 h-auto"
                    style={{ 
                      backgroundColor: activeTab === "appearance" ? "white" : "transparent",
                      color: activeTab === "appearance" ? tabColors.appearance : "rgba(0,0,0,0.6)"
                    }}
                  >
                    <Palette className={`h-5 w-5 ${activeTab === "appearance" ? "text-current" : "text-gray-500"}`} />
                    <span className="text-sm font-medium">Appearance</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="account" className="p-0">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-1" style={{ color: mastercardTheme.dark }}>Account Settings</h2>
                <p className="text-gray-500 mb-6">Manage your personal information and account details</p>

                <form onSubmit={handleAccountSubmit} className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-8 mb-8">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="relative group">
                        <Avatar className="h-32 w-32 border-2 border-gray-200">
                          {accountForm.profilePicture ? (
                            <AvatarImage src={accountForm.profilePicture} alt={accountForm.fullName} />
                          ) : (
                            <AvatarFallback className="text-3xl bg-white text-orange-500">
                              {accountForm.fullName?.charAt(0)?.toUpperCase() || accountForm.username?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <label 
                            htmlFor="profile-picture-upload" 
                            className="cursor-pointer text-white flex flex-col items-center p-2"
                          >
                            <Camera className="h-6 w-6 mb-1" />
                            <span className="text-xs">Change</span>
                          </label>
                          <input 
                            id="profile-picture-upload" 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Normally we'd upload to server here, but for now
                                // let's use a data URL for preview
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setAccountForm(prev => ({
                                    ...prev,
                                    profilePicture: reader.result as string
                                  }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">Profile Picture</p>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="font-medium">Full Name</Label>
                        <Input 
                          id="fullName" 
                          name="fullName" 
                          value={accountForm.fullName} 
                          onChange={handleAccountChange}
                          placeholder="Enter your full name" 
                          className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username" className="font-medium">Username</Label>
                        <Input 
                          id="username" 
                          name="username" 
                          value={accountForm.username} 
                          onChange={handleAccountChange}
                          placeholder="Enter your username" 
                          disabled 
                          className="border-gray-300 bg-gray-50"
                        />
                        <p className="text-xs text-gray-500">Username cannot be changed</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="font-medium">Email Address</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email" 
                          value={accountForm.email} 
                          onChange={handleAccountChange}
                          placeholder="Enter your email" 
                          className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="district" className="font-medium">District</Label>
                        <Select 
                          value={accountForm.district} 
                          onValueChange={handleDistrictChange}
                        >
                          <SelectTrigger 
                            id="district" 
                            className="w-full border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                          >
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bekwai">Bekwai</SelectItem>
                            <SelectItem value="Gushegu">Gushegu</SelectItem>
                            <SelectItem value="Lower Manya Krobo">Lower Manya Krobo</SelectItem>
                            <SelectItem value="Yilo Krobo">Yilo Krobo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <h3 className="text-sm font-medium mb-2 text-gray-700">Account Status</h3>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ background: mastercardTheme.tertiary }}
                      ></div>
                      <span className="text-sm">Your account is active and in good standing</span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="min-w-32"
                    disabled={updateProfileMutation.isPending}
                    style={{ 
                      background: getCurrentTabColor(),
                      color: 'white',
                      borderRadius: '999px'
                    }}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>Save Changes</>
                    )}
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="p-0">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-1" style={{ color: mastercardTheme.dark }}>Preferences</h2>
                <p className="text-gray-500 mb-6">Customize your notification settings and preferences</p>

                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  <div className="space-y-5">
                    <h3 className="text-lg font-medium" style={{ color: getCurrentTabColor() }}>Notifications</h3>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                        <p className="text-sm text-gray-500">Receive email notifications</p>
                      </div>
                      <Switch 
                        id="email-notifications" 
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                        style={{ 
                          '--switch-on-bg': getCurrentTabColor(),
                          '--switch-off-bg': '#CBD5E1' 
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="space-y-0.5">
                        <Label htmlFor="sms-notifications" className="font-medium">SMS Notifications</Label>
                        <p className="text-sm text-gray-500">Receive SMS notifications</p>
                      </div>
                      <Switch 
                        id="sms-notifications" 
                        checked={smsNotifications}
                        onCheckedChange={setSmSNotifications}
                        style={{ 
                          '--switch-on-bg': getCurrentTabColor(),
                          '--switch-off-bg': '#CBD5E1' 
                        }}
                      />
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-5">
                    <h3 className="text-lg font-medium" style={{ color: getCurrentTabColor() }}>Language</h3>

                    <div className="space-y-2">
                      <Label htmlFor="language" className="font-medium">Display Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger 
                          id="language" 
                          className="w-full md:w-72 border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                        >
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="min-w-32"
                      style={{ 
                        background: getCurrentTabColor(),
                        color: 'white',
                        borderRadius: '999px'
                      }}
                    >
                      Save Preferences
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="security" className="p-0">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-1" style={{ color: mastercardTheme.dark }}>Security</h2>
                <p className="text-gray-500 mb-6">Manage your password and security settings</p>

                <div className="space-y-8">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div 
                      className="px-5 py-4 border-b border-gray-100" 
                      style={{ background: `rgba(${getCurrentTabColor().includes('#EB001B') ? '235, 0, 27' : '255, 95, 0'}, 0.05)` }}
                    >
                      <h3 className="text-lg font-medium" style={{ color: getCurrentTabColor() }}>Change Password</h3>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password" className="font-medium">Current Password</Label>
                        <Input 
                          id="current-password" 
                          type="password" 
                          placeholder="Enter current password" 
                          className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="font-medium">New Password</Label>
                        <Input 
                          id="new-password" 
                          type="password" 
                          placeholder="Enter new password" 
                          className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="font-medium">Confirm New Password</Label>
                        <Input 
                          id="confirm-password" 
                          type="password" 
                          placeholder="Confirm new password" 
                          className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                        />
                      </div>

                      <Button 
                        className="min-w-32 mt-2"
                        style={{ 
                          background: getCurrentTabColor(),
                          color: 'white',
                          borderRadius: '999px'
                        }}
                      >
                        Update Password
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div 
                      className="px-5 py-4 border-b border-gray-100" 
                      style={{ background: `rgba(${getCurrentTabColor().includes('#EB001B') ? '235, 0, 27' : '255, 95, 0'}, 0.05)` }}
                    >
                      <h3 className="text-lg font-medium" style={{ color: getCurrentTabColor() }}>Login Sessions</h3>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="border rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">Current Session</p>
                            <p className="text-sm text-gray-500">Started: {new Date().toLocaleString()}</p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="border-none"
                            style={{
                              background: 'rgba(34, 197, 94, 0.1)',
                              color: '#16a34a'
                            }}
                          >
                            <Check className="h-3 w-3 mr-1" /> Active
                          </Badge>
                        </div>
                      </div>

                      <Button 
                        variant="destructive" 
                        style={{ 
                          background: mastercardTheme.secondary,
                          borderRadius: '999px'
                        }}
                      >
                        Log Out All Devices
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="p-0">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-1" style={{ color: mastercardTheme.dark }}>Appearance</h2>
                <p className="text-gray-500 mb-6">Customize the appearance of the application</p>

                <div className="space-y-8">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="space-y-0.5">
                      <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                      <p className="text-sm text-gray-500">Enable dark mode theme</p>
                    </div>
                    <Switch 
                      id="dark-mode" 
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                      style={{ 
                        '--switch-on-bg': getCurrentTabColor(),
                        '--switch-off-bg': '#CBD5E1' 
                      }}
                    />
                  </div>

                  <div className="space-y-5">
                    <h3 className="text-lg font-medium" style={{ color: getCurrentTabColor() }}>Theme Customization</h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {["Mastercard", "Purple", "Green", "Blue", "Orange", "Red"].map((color) => (
                        <div 
                          key={color}
                          className="border rounded-lg p-3 cursor-pointer transition-shadow hover:shadow-md"
                          style={{ 
                            borderColor: color === "Mastercard" ? mastercardTheme.primary : '#e5e7eb',
                            background: color === "Mastercard" ? 'rgba(255, 95, 0, 0.05)' : 'white'
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{color}</span>
                            {color === "Mastercard" && (
                              <Check 
                                className="h-4 w-4" 
                                style={{ color: mastercardTheme.primary }}
                              />
                            )}
                          </div>
                          <div 
                            className="mt-3 h-6 rounded-full"
                            style={{ 
                              background: 
                                color === "Mastercard" ? `linear-gradient(135deg, ${mastercardTheme.secondary} 0%, ${mastercardTheme.primary} 50%, ${mastercardTheme.tertiary} 100%)` :
                                color === "Purple" ? "linear-gradient(135deg, #6C63FF 0%, #EAEAFF 100%)" :
                                color === "Green" ? "linear-gradient(135deg, #2A9D8F 0%, #E9F5F3 100%)" :
                                color === "Blue" ? "linear-gradient(135deg, #1D3557 0%, #F1FAEE 100%)" :
                                color === "Orange" ? "linear-gradient(135deg, #F4A261 0%, #FFF8F0 100%)" :
                                "linear-gradient(135deg, #E63946 0%, #FFE8EA 100%)"
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium" style={{ color: getCurrentTabColor() }}>Custom Colors</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary-color" className="font-medium">Primary Color</Label>
                        <div className="flex items-center space-x-3">
                          <Input
                            id="primary-color"
                            defaultValue={mastercardTheme.primary}
                            type="color"
                            className="w-16 h-10 p-1 rounded border-gray-300"
                          />
                          <Input 
                            defaultValue={mastercardTheme.primary}
                            className="border-gray-300 flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondary-color" className="font-medium">Secondary Color</Label>
                        <div className="flex items-center space-x-3">
                          <Input
                            id="secondary-color"
                            defaultValue={mastercardTheme.secondary}
                            type="color"
                            className="w-16 h-10 p-1 rounded border-gray-300"
                          />
                          <Input 
                            defaultValue={mastercardTheme.secondary}
                            className="border-gray-300 flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    style={{ 
                      background: getCurrentTabColor(),
                      color: 'white',
                      borderRadius: '999px'
                    }}
                  >
                    Apply Theme
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
}