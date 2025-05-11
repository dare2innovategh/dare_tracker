import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Settings, Save, Database, Globe, Lock, Mail, Shield, Users, CheckSquare, UserCog } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function SystemSettingsPage() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState("admin");

  // Define our permission modules structure
  const modules = {
    userManagement: {
      name: "User Management",
      icon: <Users className="h-4 w-4" />,
      resources: [
        { id: "users", name: "Users" },
        { id: "roles", name: "Roles" },
        { id: "permissions", name: "Permissions" }
      ]
    },
    youthModule: {
      name: "Youth Profiles",
      icon: <UserCog className="h-4 w-4" />,
      resources: [
        { id: "youth_profiles", name: "Youth Profiles" },
        { id: "youth_education", name: "Education Records" },
        { id: "youth_certifications", name: "Certifications" },
        { id: "youth_skills", name: "Skills" }
      ]
    },
    businessModule: {
      name: "Business Module",
      icon: <Globe className="h-4 w-4" />,
      resources: [
        { id: "businesses", name: "Business Profiles" },
        { id: "business_youth", name: "Business-Youth Relationships" }
      ]
    },
    mentorModule: {
      name: "Mentor Module",
      icon: <UserCog className="h-4 w-4" />,
      resources: [
        { id: "mentors", name: "Mentors" },
        { id: "mentor_assignments", name: "Mentor Assignments" }
      ]
    },
    adminModule: {
      name: "Admin Module",
      icon: <Shield className="h-4 w-4" />,
      resources: [
        { id: "reports", name: "Reports" },
        { id: "system_settings", name: "System Settings" }
      ]
    }
  };

  const roles = [
    { id: "admin", name: "Administrator" },
    { id: "reviewer", name: "Reviewer" },
    { id: "mentor", name: "Mentor" },
    { id: "manager", name: "Manager" },
    { id: "user", name: "User" }
  ];

  // Mastercard theme colors
  const mastercardTheme = {
    primary: "#FF5F00", // Mastercard orange
    secondary: "#EB001B", // Mastercard red
    tertiary: "#F79E1B", // Mastercard yellow
    dark: "#1A1F36",
    light: "#FFFFFF"
  };

  // Mock permission data structure - in reality this would come from API
  const [permissions, setPermissions] = useState({
    admin: {
      // Admin has all permissions by default (structure preserved from original code)
      users: { view: true, create: true, edit: true, delete: true, manage: true },
      roles: { view: true, create: true, edit: true, delete: true, manage: true },
      permissions: { view: true, create: true, edit: true, delete: true, manage: true },

      youth_profiles: { view: true, create: true, edit: true, delete: true, manage: true },
      youth_education: { view: true, create: true, edit: true, delete: true, manage: true },
      youth_certifications: { view: true, create: true, edit: true, delete: true, manage: true },
      youth_skills: { view: true, create: true, edit: true, delete: true, manage: true },

      businesses: { view: true, create: true, edit: true, delete: true, manage: true },
      business_youth: { view: true, create: true, edit: true, delete: true, manage: true },

      mentors: { view: true, create: true, edit: true, delete: true, manage: true },
      mentor_assignments: { view: true, create: true, edit: true, delete: true, manage: true },
      mentorship_messages: { view: true, create: true, edit: true, delete: true, manage: true },
      business_advice: { view: true, create: true, edit: true, delete: true, manage: true },

      reports: { view: true, create: true, edit: true, delete: true, manage: true },
      system_settings: { view: true, create: true, edit: true, delete: true, manage: true }
    },
    mentor: {
      // Mentors can view most resources
      youth_profiles: { view: true, create: false, edit: false, delete: false, manage: false },
      youth_education: { view: true, create: false, edit: false, delete: false, manage: false },
      youth_certifications: { view: true, create: false, edit: false, delete: false, manage: false },
      youth_skills: { view: true, create: false, edit: false, delete: false, manage: false },

      businesses: { view: true, create: false, edit: false, delete: false, manage: false },
      business_youth: { view: true, create: false, edit: false, delete: false, manage: false },

      mentors: { view: true, create: false, edit: false, delete: false, manage: false },
      mentor_assignments: { view: true, create: false, edit: false, delete: false, manage: false },
      mentorship_messages: { view: true, create: true, edit: true, delete: false, manage: false },
      business_advice: { view: true, create: true, edit: true, delete: false, manage: false },

      reports: { view: true, create: false, edit: false, delete: false, manage: false }
    },
    reviewer: {
      youth_profiles: { view: true, create: false, edit: false, delete: false, manage: false },
      businesses: { view: true, create: false, edit: false, delete: false, manage: false },
      reports: { view: true, create: true, edit: false, delete: false, manage: false }
    },
    manager: {
      // Managers have broader access than mentors
      users: { view: true, create: false, edit: false, delete: false, manage: false },
      roles: { view: true, create: false, edit: false, delete: false, manage: false },

      youth_profiles: { view: true, create: true, edit: true, delete: false, manage: false },
      youth_education: { view: true, create: true, edit: true, delete: false, manage: false },
      youth_certifications: { view: true, create: true, edit: true, delete: false, manage: false },
      youth_skills: { view: true, create: true, edit: true, delete: false, manage: false },

      businesses: { view: true, create: true, edit: true, delete: false, manage: false },
      business_youth: { view: true, create: true, edit: true, delete: false, manage: false },

      mentors: { view: true, create: true, edit: true, delete: false, manage: false },
      mentor_assignments: { view: true, create: true, edit: true, delete: false, manage: false },
      reports: { view: true, create: true, edit: true, delete: false, manage: false }
    },
    user: {
      // Regular users have very limited access
      youth_profiles: { view: true, create: false, edit: false, delete: false, manage: false },
      businesses: { view: true, create: false, edit: false, delete: false, manage: false },
    }
  });

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your system settings have been saved successfully.",
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6" style={{ maxWidth: '1200px' }}>
        {/* Header Section with Mastercard styling */}
        <div 
          className="mb-8 p-6 rounded-lg" 
          style={{ 
            background: `linear-gradient(135deg, ${mastercardTheme.secondary} 0%, ${mastercardTheme.primary} 50%, ${mastercardTheme.tertiary} 100%)`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">System Settings</h1>
              <p className="text-white opacity-90 mt-1">
                Configure system-wide settings for the DARE Youth-in-Jobs Tracker Platform
              </p>
            </div>
            <Button 
              onClick={handleSave} 
              className="shadow-lg"
              style={{ 
                background: mastercardTheme.light,  
                color: mastercardTheme.dark,
                fontWeight: 'bold'
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <Tabs defaultValue="general" className="space-y-6">
            {/* Tabs with Mastercard styling */}
            <div className="w-full overflow-x-auto pb-2 no-scrollbar">
              <TabsList 
                className="inline-flex w-auto min-w-full md:w-full flex-nowrap md:flex-wrap rounded-full p-1"
                style={{ 
                  background: '#F0F0F0', 
                  border: '1px solid #E0E0E0'
                }}
              >
                <TabsTrigger 
                  value="general" 
                  className="rounded-full transition-all duration-200 ease-in-out" 
                  style={{ 
                    '--tab-active-bg': mastercardTheme.primary,
                    '--tab-active-text': mastercardTheme.light
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>General</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="database" 
                  className="rounded-full transition-all duration-200 ease-in-out"
                  style={{ 
                    '--tab-active-bg': mastercardTheme.primary,
                    '--tab-active-text': mastercardTheme.light
                  }}
                >
                  <Database className="mr-2 h-4 w-4" />
                  <span>Database</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="rounded-full transition-all duration-200 ease-in-out"
                  style={{ 
                    '--tab-active-bg': mastercardTheme.primary,
                    '--tab-active-text': mastercardTheme.light
                  }}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Security</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="rounded-full transition-all duration-200 ease-in-out"
                  style={{ 
                    '--tab-active-bg': mastercardTheme.primary,
                    '--tab-active-text': mastercardTheme.light
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* General Tab Content */}
            <TabsContent value="general" className="space-y-6">
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader style={{ background: mastercardTheme.primary, color: 'white' }}>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    Manage general platform settings and appearance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="platform-name" className="font-medium">Platform Name</Label>
                      <Input
                        id="platform-name"
                        defaultValue="DARE Youth-in-Jobs Tracker"
                        className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone" className="font-medium">Default Timezone</Label>
                      <Input
                        id="timezone"
                        defaultValue="Africa/Accra"
                        className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date-format" className="font-medium">Date Format</Label>
                      <Input
                        id="date-format"
                        defaultValue="DD/MM/YYYY"
                        className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border border-gray-100 bg-gray-50">
                      <Label htmlFor="maintenance-mode" className="font-medium">Maintenance Mode</Label>
                      <Switch 
                        id="maintenance-mode" 
                        style={{ 
                          '--switch-on-bg': mastercardTheme.primary,
                          '--switch-off-bg': '#CBD5E1' 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader style={{ background: mastercardTheme.secondary, color: 'white' }}>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    Customize the look and feel of the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <Label htmlFor="logo-url" className="font-medium">Logo URL</Label>
                      <Input
                        id="logo-url"
                        defaultValue="/img/dare-logo.png"
                        className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <h3 className="font-semibold mb-3" style={{ color: mastercardTheme.secondary }}>
                      Mastercard Color Scheme
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(mastercardTheme).map(([name, color]) => (
                        <div key={name} className="flex flex-col items-center">
                          <div 
                            className="w-12 h-12 rounded-full border-2 border-white shadow"
                            style={{ background: color }}
                          />
                          <span className="text-xs mt-1 text-gray-700 capitalize">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Database Tab Content */}
            <TabsContent value="database" className="space-y-6">
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader style={{ background: mastercardTheme.tertiary, color: 'white' }}>
                  <CardTitle>Database Management</CardTitle>
                  <CardDescription style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    Configure database backup and maintenance settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="backup-frequency" className="font-medium">Backup Frequency (days)</Label>
                      <Input
                        id="backup-frequency"
                        type="number"
                        defaultValue="7"
                        className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backup-retention" className="font-medium">Backup Retention (days)</Label>
                      <Input
                        id="backup-retention"
                        type="number"
                        defaultValue="30"
                        className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <h3 className="font-semibold mb-3" style={{ color: mastercardTheme.tertiary }}>
                      Database Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">Last Backup</p>
                        <p className="font-semibold mt-1">Apr 18, 2025</p>
                      </div>
                      <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">Size</p>
                        <p className="font-semibold mt-1">254.3 MB</p>
                      </div>
                      <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="font-semibold mt-1 text-green-600">Healthy</p>
                      </div>
                      <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">Backup Count</p>
                        <p className="font-semibold mt-1">4</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />
                  <div className="flex justify-end space-x-3">
                    <Button 
                      variant="outline" 
                      style={{ borderColor: mastercardTheme.tertiary, color: mastercardTheme.tertiary }}
                    >
                      Run Diagnostics
                    </Button>
                    <Button 
                      style={{ 
                        background: mastercardTheme.tertiary, 
                        color: 'white' 
                      }}
                    >
                      Backup Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab Content */}
            <TabsContent value="security" className="space-y-6">
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader style={{ background: '#1A1F36', color: 'white' }}>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    Configure security and access control settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="session-timeout" className="font-medium">Session Timeout (minutes)</Label>
                      <Input
                        id="session-timeout"
                        type="number"
                        defaultValue="60"
                        className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-login-attempts" className="font-medium">Max Login Attempts</Label>
                      <Input
                        id="max-login-attempts"
                        type="number"
                        defaultValue="5"
                        className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <h3 className="font-semibold mb-3 text-gray-900">
                      Security Measures
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between space-x-2 p-3 rounded bg-white border border-gray-100">
                        <div>
                          <Label htmlFor="two-factor-auth" className="font-medium">Enable Two-Factor Authentication</Label>
                          <p className="text-sm text-gray-500 mt-1">Require 2FA for all admin users</p>
                        </div>
                        <Switch 
                          id="two-factor-auth" 
                          style={{ 
                            '--switch-on-bg': mastercardTheme.primary,
                            '--switch-off-bg': '#CBD5E1' 
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between space-x-2 p-3 rounded bg-white border border-gray-100">
                        <div>
                          <Label htmlFor="enforce-password-policy" className="font-medium">Enforce Strong Password Policy</Label>
                          <p className="text-sm text-gray-500 mt-1">Require complex passwords for all users</p>
                        </div>
                        <Switch 
                          id="enforce-password-policy" 
                          defaultChecked 
                          style={{ 
                            '--switch-on-bg': mastercardTheme.primary,
                            '--switch-off-bg': '#CBD5E1' 
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-yellow-800">
                    <h3 className="font-semibold flex items-center">
                      <Lock className="h-4 w-4 mr-2" />
                      Security Recommendation
                    </h3>
                    <p className="text-sm mt-1">
                      For enhanced security, we recommend enabling two-factor authentication for all administrator accounts.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab Content */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader style={{ background: mastercardTheme.primary, color: 'white' }}>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    Configure email and system notification settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <h3 className="font-semibold text-lg" style={{ color: mastercardTheme.primary }}>
                        Email Configuration
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="smtp-server" className="font-medium">SMTP Server</Label>
                          <Input
                            id="smtp-server"
                            defaultValue="smtp.dare.org"
                            className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-port" className="font-medium">SMTP Port</Label>
                          <Input
                            id="smtp-port"
                            type="number"
                            defaultValue="587"
                            className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-username" className="font-medium">SMTP Username</Label>
                          <Input
                            id="smtp-username"
                            defaultValue="notifications@dare.org"
                            className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-password" className="font-medium">SMTP Password</Label>
                          <Input
                            id="smtp-password"
                            type="password"
                            defaultValue="********"
                            className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sender-email" className="font-medium">Sender Email</Label>
                          <Input
                            id="sender-email"
                            defaultValue="no-reply@dare.org"
                            className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
                          />
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full mt-2"
                        style={{ borderColor: mastercardTheme.primary, color: mastercardTheme.primary }}
                      >
                        Test Email Configuration
                      </Button>
                    </div>

                    <div className="space-y-6">
                      <h3 className="font-semibold text-lg" style={{ color: mastercardTheme.primary }}>
                        Notification Preferences
                      </h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between space-x-2 p-4 rounded-lg bg-white border border-gray-100 shadow-sm">
                          <div>
                            <Label htmlFor="system-notifications" className="font-medium">System Notifications</Label>
                            <p className="text-sm text-gray-500 mt-1">Automated alerts and system health</p>
                          </div>
                          <Switch 
                            id="system-notifications" 
                            defaultChecked
                            style={{ 
                              '--switch-on-bg': mastercardTheme.primary,
                              '--switch-off-bg': '#CBD5E1' 
                            }}
                          />
                        </div>

                        <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-100">
                          <h4 className="font-medium mb-2">Notification Schedule</h4>
                          <div className="flex items-center justify-between text-sm">
                            <span>Daily Digest</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Enabled</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-2">
                            <span>Weekly Summary</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Enabled</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 bg-gray-50 px-6 py-4">
                  <Button 
                    style={{ 
                      background: 'white',
                      color: mastercardTheme.dark,
                      border: `1px solid ${mastercardTheme.primary}`
                    }}
                  >
                    Reset to Defaults
                  </Button>
                  <Button 
                    style={{ 
                      background: mastercardTheme.primary,
                      color: 'white'
                    }}
                  >
                    Save Notification Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom "Save All Changes" button */}
        <div className="mt-8 text-center">
          <Button 
            onClick={handleSave}
            className="px-8 py-2 shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${mastercardTheme.secondary} 0%, ${mastercardTheme.primary} 70%)`,
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            <Save className="mr-2 h-5 w-5" />
            Save All Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}