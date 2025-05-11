import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
// Import the useSelectSafety hook
import { useSelectSafety } from "@/hooks/use-select-safety";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FormTooltipNew } from "@/components/ui/form-tooltip-new";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  User,
  Map,
  UserCog,
  Briefcase,
  GraduationCap,
  Loader2,
  Save,
  BadgeAlert,
  BarChart,
  Smartphone,
  Timer,
  CalendarClock
} from "lucide-react";

import { SkillsSelection as SkillSection } from "./skills-selection";
import { EducationSection } from "./education-section-new";
import { TrainingSectionNew } from "./training-section-new";
import { CertificationsSection } from "./certifications-section";
import { ProfileImageUpload } from "@/components/profile/profile-image-upload";

// We're using the imported useSelectSafety hook instead of this local one

// Form schema with validations - only fullName and district are required
const formSchema = z.object({
  // Only these two fields are required
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  district: z.enum(["Bekwai", "Gushegu", "Lower Manya Krobo", "Yilo Krobo"]),
  // All other fields are optional
  participantCode: z.string().optional().nullable(),
  email: z.string().optional().nullable(), // Removed email validation to make it truly optional
  phoneNumber: z.string().optional().nullable(),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  nationalId: z.string().optional().nullable(),
  yearOfBirth: z.number().optional().nullable(),
  age: z.number().optional().nullable(),
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]).optional().nullable(),
  childrenCount: z.number().optional().nullable(),
  dependents: z.string().optional().nullable(),
  town: z.string().optional().nullable(),
  locationDescription: z.string().optional().nullable(),
  gpsCoordinates: z.string().optional().nullable(),
  educationLevel: z
    .enum([
      "None",
      "Primary",
      "JHS",
      "SHS",
      "Tertiary",
      "Vocational",
      "Technical",
      "Apprenticeship",
      "Other",
    ])
    .optional()
    .nullable(),
  otherQualifications: z.string().optional().nullable(),
  employmentStatus: z
    .enum([
      "Unemployed",
      "Self-employed",
      "Employed",
      "Student",
      "Apprentice",
    ])
    .optional()
    .nullable(),
  specificJob: z.string().optional().nullable(),
  pwdStatus: z.enum(["Yes", "No"]).optional().nullable(),
  businessInterest: z.string().optional().nullable(),
  businessGoals: z.string().optional().nullable(),
  skillsTraining: z.string().optional().nullable(),
  financialAspirations: z.string().optional().nullable(),
  digitalSkills: z.string().optional().nullable(),
  dareModel: z.enum(["Collaborative", "Makerspace", "Job Anchor", "Madam Anchor", "Other"]).optional().nullable(),
  isMadam: z.boolean().optional().nullable(),
  isApprentice: z.boolean().optional().nullable(),
  madamName: z.string().optional().nullable(),
  madamPhone: z.string().optional().nullable(),
  apprenticeNames: z.string().optional().nullable(),
  apprenticePhone: z.string().optional().nullable(),
  guarantor: z.string().optional().nullable(),
  guarantorPhone: z.string().optional().nullable(),
  trainingStatus: z.enum(["Not Started", "In Progress", "Completed", "Dropped Out"]).optional().nullable(),
  programStatus: z.enum(["Active", "Inactive", "Completed", "Dropped Out"]).optional().nullable(),
  profilePicture: z.string().optional().nullable(),
  coreSkills: z.string().optional().nullable(),
  skillsTrainingNeeds: z.any().optional(),
});

// Define the type based on the schema
type ProfileFormData = z.infer<typeof formSchema>;

// Props interface
interface EnhancedProfileFormProps {
  profileData?: any;
  userId: number;
  isEdit?: boolean;
}

// Main component
export default function EnhancedProfileForm({ profileData, userId, isEdit = false }: EnhancedProfileFormProps) {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("personal");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    profileData?.profilePicture || null
  );
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [youthId, setYouthId] = useState<number | null>(profileData?.id || null);
  const [isSaving, setIsSaving] = useState(false);

  // Setup form with default values
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: profileData?.fullName || "",
      district: profileData?.district || undefined,
      participantCode: profileData?.participantCode || "",
      email: profileData?.email || "",
      phoneNumber: profileData?.phoneNumber || "",
      gender: profileData?.gender || undefined,
      nationalId: profileData?.nationalId || "",
      yearOfBirth: profileData?.yearOfBirth || null,
      age: profileData?.age || null,
      maritalStatus: profileData?.maritalStatus || undefined,
      childrenCount: profileData?.childrenCount || null,
      dependents: profileData?.dependents || "",
      town: profileData?.town || "",
      locationDescription: profileData?.locationDescription || "",
      gpsCoordinates: profileData?.gpsCoordinates || "",
      educationLevel: profileData?.educationLevel || undefined,
      otherQualifications: profileData?.otherQualifications || "",
      employmentStatus: profileData?.employmentStatus || undefined,
      specificJob: profileData?.specificJob || "",
      pwdStatus: profileData?.pwdStatus || undefined,
      businessInterest: profileData?.businessInterest || "",
      businessGoals: profileData?.businessGoals || "",
      skillsTraining: profileData?.skillsTraining || "",
      financialAspirations: profileData?.financialAspirations || "",
      digitalSkills: profileData?.digitalSkills || "",
      dareModel: profileData?.dareModel || undefined,
      isMadam: profileData?.isMadam || false,
      isApprentice: profileData?.isApprentice || false,
      madamName: profileData?.madamName || "",
      madamPhone: profileData?.madamPhone || "",
      apprenticeNames: profileData?.apprenticeNames || "",
      apprenticePhone: profileData?.apprenticePhone || "",
      guarantor: profileData?.guarantor || "",
      guarantorPhone: profileData?.guarantorPhone || "",
      trainingStatus: profileData?.trainingStatus || undefined,
      programStatus: profileData?.programStatus || undefined,
      profilePicture: profileData?.profilePicture || null,
      coreSkills: profileData?.coreSkills || "",
      skillsTrainingNeeds: profileData?.skillsTrainingNeeds || null,
    },
  });

  // Tab change handler
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  // Completion handler
  const handleFinish = () => {
    navigate("/youth-profiles");
  };

  // Create/Update profile mutation
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      // Different approach for edit vs create
      if (isEdit && profileData?.id) {
        // For editing, use a plain JSON request
        const jsonData = { ...data, userId };
        
        // Log the request details for debugging
        console.log(`Sending PATCH request to /api/youth-profiles/${profileData.id}`, jsonData);
        
        try {
          const response = await apiRequest(
            "PATCH", 
            `/api/youth-profiles/${profileData.id}`, 
            jsonData
          );
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Profile update failed with status:", response.status);
            console.error("Error response:", errorText);
            throw new Error(errorText || "Failed to update profile");
          }
          
          return await response.json();
        } catch (error) {
          console.error("Exception during profile update:", error);
          throw error;
        }
      } else {
        // For creating, use FormData to handle file upload
        const formData = new FormData();
        
        // Add file if selected
        if (selectedFile) {
          formData.append("profileImage", selectedFile);
        }

        // Add all form data as JSON
        const profileData = JSON.stringify({ ...data, userId });
        formData.append("profileData", profileData);
        
        // Log the request details for debugging
        console.log("Sending POST request to /api/youth-profiles with FormData", {
          hasFile: !!selectedFile,
          profileDataSize: profileData.length
        });
        
        try {
          const response = await apiRequest(
            "POST", 
            "/api/youth-profiles", 
            formData
          );
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Profile creation failed with status:", response.status);
            console.error("Error response:", errorText);
            throw new Error(errorText || "Failed to create profile");
          }
          
          return await response.json();
        } catch (error) {
          console.error("Exception during profile creation:", error);
          throw error;
        }
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/youth-profiles"] });
      
      // Update local state with the new profile ID
      setYouthId(data.id);
      setSaveAttempted(true);
      
      toast({
        title: isEdit ? "Profile Updated" : "Profile Created",
        description: isEdit
          ? "The youth profile has been updated successfully."
          : "The youth profile has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? "update" : "create"} profile: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // 5MB size limit
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // Handle removing selected file
  function handleRemoveFile() {
    setFilePreview(null);
    setSelectedFile(null);
    
    // Clear the file input by resetting the form value
    form.setValue("profilePicture", null);
  }

  // Handle profile image changes (for edit mode)
  function handleProfileImageChange(newImageUrl: string | null) {
    setProfileImageUrl(newImageUrl);
    form.setValue("profilePicture", newImageUrl);
  }

  // Submit handler
  async function onSubmit(data: ProfileFormData) {
    try {
      setIsSaving(true);
      console.log("Submitting profile form data:", data);
      
      const result = await profileMutation.mutateAsync(data);
      console.log("Profile submission successful:", result);
      
      // For new profiles, navigate to the education tab after saving
      if (!isEdit && selectedTab === "personal") {
        setSelectedTab("location");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      console.error("Form submission error:", data);
      
      toast({
        title: "Error Saving Profile",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Generate years for year of birth dropdown
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: 70 }, 
    (_, index) => currentYear - 15 - index
  );

  return (
    <Card className="w-full">
      <CardHeader className="bg-muted/50">
        <CardTitle>{isEdit ? "Edit Youth Profile" : "Create New Youth Profile"}</CardTitle>
      </CardHeader>

      <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
        <div className="px-6 pt-6 border-b">
          <TabsList className="w-full justify-start mb-2">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User size={16} />
              <span>Personal Info</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <Map size={16} />
              <span>Location</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <UserCog size={16} />
              <span>Skills</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Briefcase size={16} />
              <span>Business</span>
            </TabsTrigger>
            <TabsTrigger value="education" className="flex items-center gap-2">
              <GraduationCap size={16} />
              <span>Education</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <GraduationCap size={16} />
              <span>Training</span>
            </TabsTrigger>
            <TabsTrigger value="certification" className="flex items-center gap-2">
              <BadgeAlert size={16} />
              <span>Certification</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <TabsContent value="personal" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-medium">Core Identification</h3>
                  <p className="text-sm text-gray-500 mb-4">Basic personal information</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center">
                            <FormLabel>Full Name</FormLabel>
                            <FormTooltipNew content="Enter the participant's complete name as it appears on official documents" />
                          </div>
                          <FormControl>
                            <Input placeholder="Full name" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="profilePicture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Picture</FormLabel>
                          <div className="flex justify-center py-4">
                            {isEdit && profileData?.id ? (
                              <ProfileImageUpload
                                profileId={profileData.id}
                                profileImage={profileImageUrl}
                                name={form.getValues().fullName || "Profile"}
                                onImageChange={handleProfileImageChange}
                              />
                            ) : (
                              <div className="text-center flex flex-col items-center">
                                <div className="mb-2">
                                  {filePreview ? (
                                    <div className="relative">
                                      <Avatar className="h-24 w-24 border-2 border-border">
                                        <AvatarImage src={filePreview} alt="Profile preview" />
                                        <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                          {(form.getValues().fullName || 'Profile').charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <Button
                                        size="icon"
                                        variant="destructive"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                        type="button"
                                        onClick={handleRemoveFile}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                      </Button>
                                    </div>
                                  ) : (
                                    <Avatar className="h-24 w-24 border-2 border-border">
                                      <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                        {(form.getValues().fullName || 'Profile').charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                                <div className="flex flex-col items-center mt-2">
                                  <label htmlFor="profile-image-upload" className="cursor-pointer text-primary hover:underline">
                                    {filePreview ? 'Change image' : 'Upload a profile picture'}
                                  </label>
                                  <input
                                    id="profile-image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    JPG, PNG or GIF, max 5MB
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                          <input type="hidden" {...field} value={field.value || ''} />
                          <FormDescription>
                            {isEdit 
                              ? "Upload or replace the profile picture" 
                              : "Add a profile picture now or after creating your profile"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="participantCode"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center">
                            <FormLabel>Participant Code</FormLabel>
                            <FormTooltipNew content="Unique identifier for the participant in format D00XXXXXXX" />
                          </div>
                          <FormControl>
                            <Input placeholder="e.g. D00123456" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>
                            Enter the assigned participant code (e.g., D001234567)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+233 XX XXX XXXX" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>
                            Include country code when entering phone number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="email@example.com" 
                              {...field} 
                              value={field.value || ''} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nationalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>National ID</FormLabel>
                          <FormControl>
                            <Input placeholder="National ID number" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium">Personal Information</h3>
                  <p className="text-sm text-gray-500 mb-4">Demographic and personal details</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => {
                        // Use the select safety hook to handle empty strings
                        const safeSelect = useSelectSafety(field.value);
                        return (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select 
                              onValueChange={(val) => {
                                field.onChange(val);
                                safeSelect.onChange(val);
                              }} 
                              value={safeSelect.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="yearOfBirth"
                      render={({ field }) => {
                        const safeSelect = useSelectSafety(
                          field.value ? String(field.value) : undefined
                        );
                        return (
                          <FormItem>
                            <FormLabel>Year of Birth</FormLabel>
                            <Select
                              onValueChange={(val) => {
                                field.onChange(Number(val));
                                safeSelect.onChange(val);
                              }}
                              value={safeSelect.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {years.map((year) => (
                                  <SelectItem key={year} value={String(year)}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={15}
                              max={100}
                              placeholder="Age"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : Number(e.target.value);
                                field.onChange(val);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maritalStatus"
                      render={({ field }) => {
                        const safeSelect = useSelectSafety(field.value);
                        return (
                          <FormItem>
                            <FormLabel>Marital Status</FormLabel>
                            <Select
                              onValueChange={(val) => {
                                field.onChange(val);
                                safeSelect.onChange(val);
                              }}
                              value={safeSelect.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Single">Single</SelectItem>
                                <SelectItem value="Married">Married</SelectItem>
                                <SelectItem value="Divorced">Divorced</SelectItem>
                                <SelectItem value="Widowed">Widowed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="childrenCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Children</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="Number of children"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : Number(e.target.value);
                                field.onChange(val);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dependents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dependents</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Description of dependents" 
                              {...field} 
                              value={field.value || ''} 
                            />
                          </FormControl>
                          <FormDescription>
                            Describe any other dependents being supported
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => {
                        const safeSelect = useSelectSafety(field.value);
                        return (
                          <FormItem>
                            <div className="flex items-center">
                              <FormLabel>District <span className="text-red-500">*</span></FormLabel>
                              <FormTooltipNew content="Select the district where the participant is registered" />
                            </div>
                            <Select
                              onValueChange={(val) => {
                                field.onChange(val);
                                safeSelect.onChange(val);
                              }}
                              value={safeSelect.value}
                              required
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select district" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Bekwai">Bekwai</SelectItem>
                                <SelectItem value="Gushegu">Gushegu</SelectItem>
                                <SelectItem value="Lower Manya Krobo">Lower Manya Krobo</SelectItem>
                                <SelectItem value="Yilo Krobo">Yilo Krobo</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="pwdStatus"
                      render={({ field }) => {
                        const safeSelect = useSelectSafety(field.value);
                        return (
                          <FormItem>
                            <FormLabel>Person with Disability?</FormLabel>
                            <Select
                              onValueChange={(val) => {
                                field.onChange(val);
                                safeSelect.onChange(val);
                              }}
                              value={safeSelect.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Yes">Yes</SelectItem>
                                <SelectItem value="No">No</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="programStatus"
                      render={({ field }) => {
                        const safeSelect = useSelectSafety(field.value);
                        return (
                          <FormItem>
                            <div className="flex items-center">
                              <FormLabel>Program Status</FormLabel>
                              <FormTooltipNew content="Current status in the overall DARE program" />
                            </div>
                            <Select
                              onValueChange={(val) => {
                                field.onChange(val);
                                safeSelect.onChange(val);
                              }}
                              value={safeSelect.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Dropped Out">Dropped Out</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    className="gap-2"
                    disabled={isSaving}
                  >
                    {isSaving && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <Save className="h-4 w-4" />
                    Save & Continue
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="location" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-medium">Location Information</h3>
                  <p className="text-sm text-gray-500 mb-4">Location details for the participant</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="town"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Town/Village</FormLabel>
                          <FormControl>
                            <Input placeholder="Name of town or village" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="locationDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Description</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Additional location details" 
                              {...field} 
                              value={field.value || ''} 
                            />
                          </FormControl>
                          <FormDescription>
                            Provide landmarks or directions to help locate
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gpsCoordinates"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GPS Coordinates</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="GPS coordinates (if available)" 
                              {...field} 
                              value={field.value || ''} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    onClick={() => setSelectedTab("personal")}
                    variant="outline"
                  >
                    Previous: Personal Info
                  </Button>

                  <div className="space-x-2">
                  <Button 
                    type="submit"
                    className="gap-2"
                    disabled={isSaving}
                  >
                    {isSaving && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <Save className="h-4 w-4" />
                    Save Profile
                  </Button>

                  <Button 
                    type="button"
                    onClick={() => setSelectedTab("skills")}
                    variant="outline"
                  >
                    Next: Skills
                  </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="skills" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-medium">Skills Assessment</h3>
                  <p className="text-sm text-gray-500 mb-4">Skills, competencies and digital literacy</p>

                  <div className="grid grid-cols-1 gap-6">
                    {youthId && (
                      <div className="mb-4">
                        <h4 className="text-base font-medium mb-3">Skill Proficiency</h4>
                        <SkillSection 
                          selectedSkills={profileData?.selectedSkills || []}
                          onChange={(skills) => {
                            // This would typically update the form state
                            console.log("Skills updated:", skills);
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="coreSkills"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Core Skills</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe core skills and competencies" 
                                {...field} 
                                value={field.value || ''} 
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="digitalSkills"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Digital Skills</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe digital literacy and skills" 
                                {...field} 
                                value={field.value || ''} 
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="skillsTraining"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previous Skills Training</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe previous training received" 
                                {...field} 
                                value={field.value || ''} 
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="skillsTrainingNeeds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Skills Training Needs</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe specific training needs" 
                                {...field}
                                value={field.value || ''} 
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    onClick={() => setSelectedTab("location")}
                    variant="outline"
                  >
                    Previous: Location
                  </Button>

                  <div className="space-x-2">
                  <Button 
                    type="submit"
                    className="gap-2"
                    disabled={isSaving}
                  >
                    {isSaving && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <Save className="h-4 w-4" />
                    Save Profile
                  </Button>

                  <Button 
                    type="button"
                    onClick={() => setSelectedTab("business")}
                    variant="outline"
                  >
                    Next: Business
                  </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="business" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-medium">Business & Employment</h3>
                  <p className="text-sm text-gray-500 mb-4">Business interests, employment and entrepreneurship details</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="employmentStatus"
                      render={({ field }) => {
                        const safeSelect = useSelectSafety(field.value);
                        return (
                          <FormItem>
                            <FormLabel>Employment Status</FormLabel>
                            <Select
                              onValueChange={(val) => {
                                field.onChange(val);
                                safeSelect.onChange(val);
                              }}
                              value={safeSelect.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Unemployed">Unemployed</SelectItem>
                                <SelectItem value="Self-employed">Self-employed</SelectItem>
                                <SelectItem value="Employed">Employed</SelectItem>
                                <SelectItem value="Student">Student</SelectItem>
                                <SelectItem value="Apprentice">Apprentice</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="specificJob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specific Job/Role</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Current job title or role" 
                              {...field} 
                              value={field.value || ''} 
                            />
                          </FormControl>
                          <FormDescription>
                            If employed or self-employed, provide specific job title or role
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessInterest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Interest</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe business interests or ideas" 
                              {...field} 
                              value={field.value || ''} 
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessGoals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Goals</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe short and long term business goals" 
                              {...field} 
                              value={field.value || ''} 
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="financialAspirations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Financial Aspirations</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Financial goals and aspirations" 
                              {...field} 
                              value={field.value || ''} 
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <h4 className="text-base font-medium mb-3">Digital Access for Rural Empowerment Model Information</h4>
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="dareModel"
                          render={({ field }) => {
                            const safeSelect = useSelectSafety(field.value);
                            return (
                              <FormItem>
                                <FormLabel>Digital Access for Rural Empowerment Model</FormLabel>
                                <Select
                                  onValueChange={(val) => {
                                    field.onChange(val);
                                    safeSelect.onChange(val);
                                  }}
                                  value={safeSelect.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Digital Access for Rural Empowerment model" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Collaborative">Collaborative</SelectItem>
                                    <SelectItem value="Makerspace">Makerspace</SelectItem>
                                    <SelectItem value="Job Anchor">Job Anchor</SelectItem>
                                    <SelectItem value="Madam Anchor">Madam Anchor</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />

                        <div className="mt-8 mb-2">
                          <h3 className="text-lg font-medium">Madam/Apprentice Information</h3>
                          <p className="text-sm text-gray-500 mb-4">Information about madam and apprentice relationships</p>
                        </div>

                        <div className="border border-gray-200 rounded-md p-4 bg-gray-50 mb-4">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name="isMadam"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value || false}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal cursor-pointer">
                                      Is a Madam
                                    </FormLabel>
                                    <FormDescription>
                                      Participant has apprentices
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="isApprentice"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value || false}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal cursor-pointer">
                                      Is an Apprentice
                                    </FormLabel>
                                    <FormDescription>
                                      Participant has a madam
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>

                          {form.watch("isMadam") && (
                            <div className="border-t border-gray-200 pt-4 mt-2">
                              <h4 className="text-sm font-medium mb-3">Apprentice Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="apprenticeNames"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Apprentice Names</FormLabel>
                                      <FormControl>
                                        <Input 
                                          placeholder="Names of apprentices" 
                                          {...field} 
                                          value={field.value || ''} 
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        List multiple names separated by commas
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="apprenticePhone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Apprentice Phone</FormLabel>
                                      <FormControl>
                                        <Input 
                                          placeholder="Phone number of main apprentice" 
                                          {...field} 
                                          value={field.value || ''} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          )}

                          {form.watch("isApprentice") && (
                            <div className="border-t border-gray-200 pt-4 mt-2">
                              <h4 className="text-sm font-medium mb-3">Madam Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="madamName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Madam Name</FormLabel>
                                      <FormControl>
                                        <Input 
                                          placeholder="Name of madam" 
                                          {...field} 
                                          value={field.value || ''} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="madamPhone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Madam Phone</FormLabel>
                                      <FormControl>
                                        <Input 
                                          placeholder="Phone number of madam" 
                                          {...field} 
                                          value={field.value || ''} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 mb-2">
                      <h3 className="text-lg font-medium">Guarantor Information</h3>
                      <p className="text-sm text-gray-500 mb-4">Information about financial guarantor</p>
                      
                      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="guarantor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Guarantor Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Name of guarantor" 
                                    {...field} 
                                    value={field.value || ''} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Full name of financial guarantor
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="guarantorPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Guarantor Phone</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Phone number of guarantor" 
                                    {...field} 
                                    value={field.value || ''} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    onClick={() => setSelectedTab("skills")}
                    variant="outline"
                  >
                    Previous: Skills
                  </Button>

                  <div className="space-x-2">
                  <Button 
                    type="submit"
                    className="gap-2"
                    disabled={isSaving}
                  >
                    {isSaving && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <Save className="h-4 w-4" />
                    Save Profile
                  </Button>

                  <Button 
                    type="button"
                    onClick={() => setSelectedTab("education")}
                    variant="outline"
                  >
                    Next: Education
                  </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="education" className="space-y-6 mt-0">
                {saveAttempted || isEdit ? (
                  <div>
                    <h3 className="text-lg font-medium">Education Records</h3>
                    <p className="text-sm text-gray-500 mb-4">Manage education history and qualifications</p>

                    <EducationSection 
                      youthId={isEdit ? profileData.id : (youthId || 0)} 
                      isEditable={true}
                    />

                    <div className="flex justify-between pt-6">
                      <Button 
                        type="button" 
                        onClick={() => setSelectedTab("business")}
                        variant="outline"
                      >
                        Previous: Business
                      </Button>

                      <Button 
                        type="button"
                        onClick={handleFinish}
                      >
                        Complete & Return to Profiles
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <BadgeAlert className="h-16 w-16 text-amber-500 mb-4" />
                    <h3 className="text-xl font-medium text-center">Save Profile First</h3>
                    <p className="text-gray-500 text-center mt-2 mb-6 max-w-md">
                      You need to save the profile information first before adding education records. 
                      Please go to the Business tab and save your profile.
                    </p>
                    <Button 
                      onClick={() => setSelectedTab("business")}
                    >
                      Go to Business Tab
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="training" className="space-y-6 mt-0">
                {saveAttempted || isEdit ? (
                  <div>
                    <h3 className="text-lg font-medium">Training Programs</h3>
                    <p className="text-sm text-gray-500 mb-4">Manage training programs and completion status</p>
                    
                    {youthId && (
                      <div className="mt-4">
                        <TrainingSectionNew youthId={youthId} />
                      </div>
                    )}
                    
                    <div className="flex justify-between mt-6">
                      <Button 
                        type="button" 
                        onClick={() => setSelectedTab("education")}
                        variant="outline"
                      >
                        Previous: Education
                      </Button>
                      
                      <div className="space-x-2">
                        <Button 
                          type="submit"
                          className="gap-2"
                          disabled={isSaving}
                        >
                          {isSaving && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          <Save className="h-4 w-4" />
                          Save Profile
                        </Button>
                        
                        <Button 
                          type="button"
                          onClick={() => setSelectedTab("certification")}
                        >
                          Next: Certification
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <BadgeAlert className="h-16 w-16 text-amber-500 mb-4" />
                    <h3 className="text-xl font-medium text-center">Save Profile First</h3>
                    <p className="text-gray-500 text-center mt-2 mb-6 max-w-md">
                      You need to save the profile before adding training records.
                      Complete the required fields and click "Save Profile".
                    </p>
                    <Button 
                      type="button"
                      onClick={() => form.handleSubmit(onSubmit)()}
                    >
                      Save Profile Now
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="certification" className="space-y-6 mt-0">
                {saveAttempted || isEdit ? (
                  <div>
                    <h3 className="text-lg font-medium">Certifications</h3>
                    <p className="text-sm text-gray-500 mb-4">Manage certifications and credentials</p>
                    
                    {youthId && (
                      <div className="mt-4">
                        <CertificationsSection youthId={youthId} />
                      </div>
                    )}
                    
                    <div className="flex justify-between mt-6">
                      <Button 
                        type="button" 
                        onClick={() => setSelectedTab("training")}
                        variant="outline"
                      >
                        Previous: Training
                      </Button>
                      
                      <div className="space-x-2">
                        <Button 
                          type="submit"
                          className="gap-2"
                          disabled={isSaving}
                        >
                          {isSaving && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          <Save className="h-4 w-4" />
                          Save Profile
                        </Button>
                        
                        <Button 
                          type="button"
                          onClick={handleFinish}
                        >
                          Complete & Return to Profiles
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <BadgeAlert className="h-16 w-16 text-amber-500 mb-4" />
                    <h3 className="text-xl font-medium text-center">Save Profile First</h3>
                    <p className="text-gray-500 text-center mt-2 mb-6 max-w-md">
                      You need to save the profile before adding certification records.
                      Complete the required fields and click "Save Profile".
                    </p>
                    <Button 
                      type="button"
                      onClick={() => form.handleSubmit(onSubmit)()}
                    >
                      Save Profile Now
                    </Button>
                  </div>
                )}
              </TabsContent>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="border-t bg-muted/30 flex justify-between py-4 px-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/youth-profiles')}
          >
            Cancel
          </Button>

          <Button 
            type="submit"
            className="gap-2"
            disabled={isSaving}
            onClick={(e) => {
              e.preventDefault();
              console.log("Save button clicked - submitting form");
              const formValues = form.getValues();
              console.log("Form values:", formValues);
              form.handleSubmit((data) => {
                console.log("Form submission handler called with data:", data);
                onSubmit(data);
              })();
            }}
          >
            {isSaving && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <Save className="h-4 w-4" />
            Save Profile
          </Button>
        </CardFooter>
      </Tabs>
    </Card>
  );
}