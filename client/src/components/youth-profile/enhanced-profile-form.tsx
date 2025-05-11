import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertYouthProfileSchema, districtEnum, dareModelEnum, serviceCategoryEnum, Education } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useSelectSafety } from "@/hooks/use-select-safety";
import { ProfileImageUpload } from "@/components/profile/profile-image-upload";
import { SkillsSelection, type SelectedSkill } from "./skills-selection";
import { TrainingSectionNew } from "./training-section-new";
import { CertificationsSection } from "./certifications-section";
import NewCertificationManager from "./new-certification-manager";
import { FormTooltip } from "@/components/ui/form-tooltip";
import { EducationSection } from "./education-section-new";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SafeSelect as Select,
  SafeSelectItem as SelectItem,
} from "@/components/ui/safe-select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, InfoIcon, GraduationCap, Save, UserCog, Briefcase, User, Map, BadgeAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Extended schema with validation rules, making most fields optional
const formSchema = insertYouthProfileSchema.extend({
  // Required core fields
  fullName: z.string().min(2, { message: "Full name is required" }),
  district: z.string().min(1, { message: "District is required" }),

  // Optional fields with transformations
  phoneNumber: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address" }).optional().or(z.literal('')),
  town: z.string().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  childrenCount: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable().optional()
  ),
  yearOfBirth: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable().optional()
  ),
  ageGroup: z.string().optional(),
  yearsOfExperience: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable().optional()
  ),
  age: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable().optional()
  ),
  socialMediaLinks: z.any().optional(),
  // Make fields related to skills and expertise optional
  coreSkills: z.string().optional(),
  skillLevel: z.string().optional(),
  industryExpertise: z.string().optional(),
  languagesSpoken: z.any().optional(),
  communicationStyle: z.string().optional(),
  // Optional links and work history
  portfolioLinks: z.any().optional(),
  workSamples: z.any().optional(),
  caseStudies: z.any().optional(),
  workHistory: z.any().optional(),
  // Optional business-related fields
  businessInterest: z.string().optional(),
  employmentStatus: z.string().optional(),
  specificJob: z.string().optional(),
  pwdStatus: z.string().optional(),
  dareModel: dareModelEnum.optional(),
  isMadam: z.boolean().optional(),
  isApprentice: z.boolean().optional(),
  madamName: z.string().optional(),
  madamPhone: z.string().optional(),
  apprenticeNames: z.any().optional(),
  apprenticePhone: z.string().optional(),
  // Optional guarantor and support network information
  guarantor: z.string().optional(),
  guarantorPhone: z.string().optional(),
  // Optional financial and digital skills information
  digitalSkills: z.string().optional(),
  digitalSkills2: z.string().optional(),
  financialAspirations: z.string().optional(),
  // Optional additional fields
  dependents: z.string().optional(),
  nationalId: z.string().optional(),
  trainingStatus: z.string().optional(),
  programStatus: z.string().optional(),
});

// Type for the form data based on the schema
type ProfileFormData = z.infer<typeof formSchema>;

// Props for the profile form component
interface EnhancedProfileFormProps {
  profileData?: any;
  userId: number;
  isEdit?: boolean;
}

export default function EnhancedProfileForm({ profileData, userId, isEdit = false }: EnhancedProfileFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("personal");
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitAttemptCount, setSubmitAttemptCount] = useState(0);

  // Track the youth ID for skills and education
  const youthId = profileData?.id || null;

  // Education state
  const [educationSaved, setEducationSaved] = useState(false);

  // Define how to map API skill data to our local SelectedSkill format
  const mapApiSkillToSelectedSkill = useCallback((apiSkill: any): SelectedSkill => {
    return {
      id: apiSkill.id,
      name: apiSkill.skillName || '',
      proficiency: apiSkill.proficiency || 'Intermediate',
      isPrimary: apiSkill.isPrimary || false,
      yearsOfExperience: apiSkill.yearsOfExperience || 0
    };
  }, []);

  // Pull any existing skills if editing
  useEffect(() => {
    if (isEdit && profileData?.id) {
      // Fetch existing skills for this profile
      queryClient.fetchQuery({
        queryKey: ['/api/youth-skills', profileData.id],
      }).then((data: any) => {
        if (data && Array.isArray(data)) {
          const formattedSkills = data.map(skill => mapApiSkillToSelectedSkill(skill));
          setSelectedSkills(formattedSkills);
        }
      }).catch(error => {
        console.error("Error fetching skills:", error);
      });
    }
  }, [isEdit, profileData, queryClient, mapApiSkillToSelectedSkill]);

  // If editing, get the profile picture URL
  useEffect(() => {
    if (isEdit && profileData?.profilePicture) {
      setProfileImageUrl(profileData.profilePicture);
    }
  }, [isEdit, profileData]);

  // Create form with default values
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Set default values from profileData if editing
      fullName: profileData?.fullName || "",
      district: profileData?.district || "",
      participantCode: profileData?.participantCode || "",
      town: profileData?.town || "",
      phoneNumber: profileData?.phoneNumber || "",
      email: profileData?.email || "",
      gender: profileData?.gender || "",
      maritalStatus: profileData?.maritalStatus || "",
      childrenCount: profileData?.childrenCount || null,
      yearOfBirth: profileData?.yearOfBirth || null,
      age: profileData?.age || null,
      ageGroup: profileData?.ageGroup || "",

      // Skills and expertise fields
      coreSkills: profileData?.coreSkills || "",
      skillLevel: profileData?.skillLevel || "",
      industryExpertise: profileData?.industryExpertise || "",
      yearsOfExperience: profileData?.yearsOfExperience || null,
      communicationStyle: profileData?.communicationStyle || "",

      // Business-related fields
      businessInterest: profileData?.businessInterest || "",
      employmentStatus: profileData?.employmentStatus || "",
      specificJob: profileData?.specificJob || "",
      pwdStatus: profileData?.pwdStatus || "",
      dareModel: profileData?.dareModel || undefined,
      isMadam: profileData?.isMadam || false,
      isApprentice: profileData?.isApprentice || false,
      madamName: profileData?.madamName || "",
      madamPhone: profileData?.madamPhone || "",
      apprenticePhone: profileData?.apprenticePhone || "",

      // Guarantor and support network
      guarantor: profileData?.guarantor || "",
      guarantorPhone: profileData?.guarantorPhone || "",

      // Financial and digital skills
      digitalSkills: profileData?.digitalSkills || "",
      digitalSkills2: profileData?.digitalSkills2 || "",
      financialAspirations: profileData?.financialAspirations || "",

      // Additional fields
      dependents: profileData?.dependents || "",
      nationalId: profileData?.nationalId || "",
      trainingStatus: profileData?.trainingStatus || "",
      programStatus: profileData?.programStatus || "",
    },
  });

  // File handling functions
  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);

      // Create a preview of the selected image
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setFilePreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setFilePreview(null);
  }

  function handleProfileImageChange(newImageUrl: string | null) {
    if (newImageUrl) {
      setProfileImageUrl(newImageUrl);
    } else {
      setProfileImageUrl('');
    }
  }

  // Mutation for submitting profile data
  const mutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      console.log("Starting profile mutation...");

      // Preserve empty strings and null values properly
      // We need to explicitly include empty strings in the data
      // so the server knows to clear those fields
      console.log("Original form data:", data);
      
      // Extra logging for district field
      console.log("District from form data:", data.district);
      console.log("District type:", typeof data.district);
      
      // Clean the data but preserve empty strings
      const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );
      
      // Force district into cleaned data if it exists
      if (data.district) {
        cleanedData.district = data.district;
        console.log("District added to cleaned data:", cleanedData.district);
      }
      
      console.log("Cleaned data for submission:", cleanedData);

      // Prepare FormData for file uploads
      const formData = new FormData();

      // Add all profile data fields to FormData
      // Important: We must handle empty strings properly for field clearing
      Object.entries(cleanedData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          // Convert value to string, which preserves empty strings
          formData.append(key, value.toString());
          console.log(`Adding form field: ${key} = ${value.toString()}`);
        }
      });
      
      // Make extra sure the district field is included
      if (data.district) {
        // Force override with original district value
        formData.delete('district');
        formData.append('district', data.district);
        console.log(`Explicitly setting district field: ${data.district}`);
      }

      // Always add userId for server-side assignment
      formData.append('userId', userId.toString());

      // Add file if it exists
      if (selectedFile) {
        console.log("Attaching file to FormData");
        formData.append('profilePicture', selectedFile);
      }

      // Determine API endpoint and method
      const isNewProfile = !isEdit;
      const endpoint = isNewProfile 
        ? '/api/youth-profiles' 
        : `/api/youth-profiles/${profileData.id}`;

      const method = isNewProfile 
        ? 'POST' 
        : (selectedFile ? 'PUT' : 'PATCH');

      console.log(`API Request: ${method} ${endpoint}`);

      try {
        // For file uploads or new profiles, use FormData
        if (selectedFile || isNewProfile) {
          console.log("Using FormData submission");
          
          // Create a direct object for debugging
          const directData = {
            fullName: data.fullName,
            district: data.district,
            userId: userId
          };
          
          console.log("CRITICAL DEBUG - Using direct object for submission:", directData);
          
          // Try JSON submission first for basic fields
          const res = await fetch(endpoint, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(directData),
            credentials: 'include',
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error("API Error:", errorText);
            throw new Error(`Request failed with status: ${res.status}. ${errorText}`);
          }

          const jsonResponse = await res.json();
          console.log("API Response:", jsonResponse);
          return jsonResponse;
        } 
        // For data-only updates, use JSON
        else {
          console.log("Using JSON submission with data:", cleanedData);
          
          // This is critical for empty string handling
          // Explicitly ensure guarantor and other fields get properly sent
          // even when they're empty strings
          let dataToSubmit = { ...cleanedData };
          
          if (dataToSubmit.guarantor === '') {
            console.log("Ensuring empty guarantor is explicitly included");
            
            // Make extra sure the guarantor field is included in the data
            dataToSubmit = {
              ...dataToSubmit,
              guarantor: '' // Explicit empty string assignment
            };
            
            console.log("Modified submission data with explicit empty guarantor:", dataToSubmit);
          }
          
          const res = await fetch(endpoint, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSubmit),
            credentials: 'include',
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error("API Error:", errorText);
            throw new Error(`Request failed with status: ${res.status}. ${errorText}`);
          }

          const jsonResponse = await res.json();
          console.log("API Response:", jsonResponse);
          return jsonResponse;
        }
      } catch (error) {
        console.error("Profile submission error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Mutation success:", data);
      
      // Show success toast
      toast({
        title: isEdit ? "Profile updated" : "Profile created",
        description: isEdit 
          ? "The profile has been updated successfully" 
          : "New profile has been created successfully",
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['/api/youth-profiles'],
      });

      if (profileData?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/youth-profiles/${profileData.id}`],
        });
      }

      setIsSaving(false);

      // For new profiles, redirect to profiles list after successful save
      if (!isEdit) {
        // Short delay to ensure toast is visible before redirect
        setTimeout(() => {
          console.log("Redirecting to profiles list after successful creation");
          navigate('/youth-profiles');
        }, 1000);
      }
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? 'update' : 'create'} profile: ${error.message}`,
        variant: "destructive",
      });
      setIsSaving(false);
    },
    onSettled: () => {
      setIsSaving(false);
    }
  });

  // Skills mutation for batch updating skills
  const skillsMutation = useMutation({
    mutationFn: async (skills: SelectedSkill[]) => {
      if (!youthId) return null;

      console.log(`Updating skills for youth ID: ${youthId}`, skills);

      const res = await apiRequest(
        'POST', 
        `/api/youth-skills/${youthId}/batch`,
        skills
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/youth-skills', youthId],
      });
    },
    onError: (error: Error) => {
      console.error("Skills mutation error:", error);
      toast({
        title: "Skills Error",
        description: `Failed to update skills: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  async function onSubmit(data: ProfileFormData) {
    try {
      // Prevent multiple submissions
      if (isSaving) {
        console.log("Submission already in progress, preventing duplicate");
        return;
      }

      // We're now in saving mode
      setIsSaving(true);
      
      // Use the data directly from the form without defaulting
      // This ensures we only use what the user entered
      console.log("Form data being submitted:", data);
      
      // Simple validation for required fields
      if (!data.fullName || !data.district) {
        console.error("Missing required fields:", {
          fullName: data.fullName ? "✓" : "✗", 
          district: data.district ? "✓" : "✗"
        });
        
        toast({
          title: "Missing Required Fields",
          description: "Please provide both Full Name and District",
          variant: "destructive"
        });
        
        setIsSaving(false);
        return;
      }

      // Increment submission attempt counter for debugging
      setSubmitAttemptCount(prev => prev + 1);

      // Debug information
      console.log("Form submitted with data:", data);
      console.log("Form is valid:", form.formState.isValid);
      console.log("Form errors:", form.formState.errors);
      console.log("Submission attempt:", submitAttemptCount + 1);
      
      // Ensure guarantor field is explicitly included even when empty
      // This is critical for the case we're fixing
      console.log("Guarantor field value:", data.guarantor);
      if (data.guarantor === '') {
        console.log("Empty guarantor field detected - this should be sent to the server");
      }

      // We add this to track the form submission more reliably in the console
      console.warn("PROFILE FORM SUBMISSION STARTED", data);

      // Add validation check before proceeding
      if (!form.formState.isValid) {
        console.error("Form validation failed:", form.formState.errors);
        setIsSaving(false);

        // Show toast for validation error
        toast({
          title: "Validation Error",
          description: "Please check the form for errors before submitting",
          variant: "destructive",
        });
        return;
      }
      
      // Submit the main profile data directly from the form
      // This ensures all fields are captured properly
      console.log("Submitting with complete form data");
      const profileResponse = await mutation.mutateAsync(data);
      console.log("Profile mutation completed successfully:", profileResponse);

      // Get the ID from the response for new profiles
      const profileId = isEdit ? profileData?.id : profileResponse.id;

      // Once we have a profile ID, update skills if there are any
      if (profileId && selectedSkills.length > 0) {
        console.log("Updating skills for profile:", profileId);
        const formattedSkills = selectedSkills.map(skill => ({
          ...skill,
          youthId: profileId
        }));

        await skillsMutation.mutateAsync(formattedSkills);
      }

      if (!isEdit) {
        // For new profiles, remind user to add education
        toast({
          title: "Education records",
          description: "Don't forget to add education records on the Education tab"
        });
      }

      // Success message and navigation is handled in mutation.onSuccess
      setSaveAttempted(true);

      // Force refresh of the cache
      queryClient.invalidateQueries({
        queryKey: ['/api/youth-profiles'],
      });

      if (isEdit && profileData?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/youth-profiles/${profileData.id}`],
        });
      }

    } catch (error) {
      // This catch block provides additional debugging
      console.error("CRITICAL ERROR in profile form submission:", error);

      // Errors are also handled in mutation.onError, but this ensures they're caught
      toast({
        title: "Error during form submission",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      // Always make sure to reset the saving state
      setIsSaving(false);
    }
  }

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  // Add custom function to navigate back to profile list
  const handleFinish = () => {
    navigate('/youth-profiles');
  };

  // Create the current year and possible year options for birth year
  const currentYear = new Date().getFullYear();
  const birthYearOptions = Array.from(
    { length: 70 }, 
    (_, index) => currentYear - 15 - index
  );

  // Function to directly submit the form
  const handleSubmit = () => {
    console.log("Form submission triggered");
    form.handleSubmit(onSubmit)();
  };
  
  // Function for save button clicks
  const handleSaveClick = () => {
    console.log("Save button clicked");
    handleSubmit();
  };

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
                            <FormTooltip content="Enter the participant's complete name as it appears on official documents" />
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
                            <FormTooltip content="Unique identifier for the participant in format D00XXXXXXX" />
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
                                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="maritalStatus"
                      render={({ field }) => {
                        // Use the select safety hook to handle empty strings
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
                                              <SelectItem value="Separated">Separated</SelectItem>
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
                                            placeholder="0"
                                            {...field}
                                            value={field.value === null ? '' : field.value}
                                            onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="yearOfBirth"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Year of Birth</FormLabel>
                                        <Select 
                                          onValueChange={(value) => field.onChange(value === '' ? null : parseInt(value))}
                                          defaultValue={field.value?.toString() || ''}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select year" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="">Not specified</SelectItem>
                                            {birthYearOptions.map((year) => (
                                              <SelectItem key={year} value={year.toString()}>
                                                {year}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
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
                                            min={0}
                                            placeholder="Enter age"
                                            {...field}
                                            value={field.value === null ? '' : field.value}
                                            onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="ageGroup"
                                    render={({ field }) => {
                                      // Use the select safety hook to handle empty strings
                                      const safeSelect = useSelectSafety(field.value);
                                      return (
                                        <FormItem>
                                          <FormLabel>Age Group</FormLabel>
                                          <Select 
                                            onValueChange={(val) => {
                                              field.onChange(val);
                                              safeSelect.onChange(val);
                                            }} 
                                            value={safeSelect.value}
                                          >
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select age group" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              <SelectItem value="15-19">15-19</SelectItem>
                                              <SelectItem value="20-24">20-24</SelectItem>
                                              <SelectItem value="25-29">25-29</SelectItem>
                                              <SelectItem value="30-34">30-34</SelectItem>
                                              <SelectItem value="35+">35+</SelectItem>
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
                                      // Use the select safety hook to handle empty strings
                                      const safeSelect = useSelectSafety(field.value);
                                      return (
                                        <FormItem>
                                          <FormLabel>PWD Status</FormLabel>
                                          <Select 
                                            onValueChange={(val) => {
                                              field.onChange(val);
                                              safeSelect.onChange(val);
                                            }} 
                                            value={safeSelect.value}
                                          >
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select PWD status" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              <SelectItem value="None">None</SelectItem>
                                              <SelectItem value="Visual Impairment">Visual Impairment</SelectItem>
                                              <SelectItem value="Hearing Impairment">Hearing Impairment</SelectItem>
                                              <SelectItem value="Physical Disability">Physical Disability</SelectItem>
                                              <SelectItem value="Cognitive Disability">Cognitive Disability</SelectItem>
                                              <SelectItem value="Multiple Disabilities">Multiple Disabilities</SelectItem>
                                              <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormDescription>
                                            Person with Disability status, if applicable
                                          </FormDescription>
                                          <FormMessage />
                                        </FormItem>
                                      );
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="flex justify-between pt-2">
                                <Button 
                                  type="button" 
                                  variant="outline"
                                  onClick={() => navigate('/youth-profiles')}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="button"
                                  onClick={() => setSelectedTab("location")}
                                >
                                  Next: Location
                                </Button>
                              </div>
                            </TabsContent>

                            <TabsContent value="location" className="space-y-6 mt-0">
                              <div>
                                <h3 className="text-lg font-medium">Location Information</h3>
                                <p className="text-sm text-gray-500 mb-4">Where the participant is located</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <FormField
                                    control={form.control}
                                    name="district"
                                    render={({ field }) => {
                                      const [selectedDistrict, setSelectedDistrict] = useState(field.value || "");
                                      
                                      // This function will be called when the Select value changes
                                      const handleDistrictChange = (value: string) => {
                                        console.log("District selected:", value);
                                        setSelectedDistrict(value);
                                        field.onChange(value);
                                      };
                                      
                                      return (
                                        <FormItem>
                                          <div className="flex items-center">
                                            <FormLabel>Rural District</FormLabel>
                                            <FormTooltip content="The district where the participant lives or works. This is used for regional statistics and mentor assignment." />
                                          </div>
                                          <Select 
                                            onValueChange={handleDistrictChange}
                                            value={selectedDistrict}
                                            defaultValue={field.value}
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
                                          {selectedDistrict ? (
                                            <p className="text-xs text-green-600">Selected: {selectedDistrict}</p>
                                          ) : (
                                            <p className="text-xs text-orange-600">Please select a district</p>
                                          )}
                                        </FormItem>
                                      );
                                    }}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="town"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Town/Community</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Town or community name" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>

                              <Separator />

                              <div>
                                <h3 className="text-lg font-medium">Guarantor Information</h3>
                                <p className="text-sm text-gray-500 mb-4">Contact details for guarantor or reference</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <FormField
                                    control={form.control}
                                    name="guarantor"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Guarantor Name</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Full name of guarantor" {...field} value={field.value || ''} />
                                        </FormControl>
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
                                          <Input placeholder="+233 XX XXX XXXX" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>

                              <div className="flex justify-between pt-2">
                                <Button 
                                  type="button" 
                                  onClick={() => setSelectedTab("personal")}
                                  variant="outline"
                                >
                                  Previous: Personal Info
                                </Button>
                                <Button 
                                  type="button"
                                  onClick={() => setSelectedTab("skills")}
                                >
                                  Next: Skills
                                </Button>
                              </div>
                            </TabsContent>
              <TabsContent value="skills" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-medium">Skills & Expertise</h3>
                  <p className="text-sm text-gray-500 mb-4">Participant's skills and professional experience</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="coreSkills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Core Skills</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter key skills" 
                              {...field} 
                              value={field.value || ''} 
                              className="min-h-[120px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Summarize the participant's core skills and competencies
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="yearsOfExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              {...field}
                              value={field.value === null ? '' : field.value}
                              onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Total years of relevant work experience
                          </FormDescription>
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
                              placeholder="Digital skills and computer literacy" 
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
                      name="industryExpertise"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry Expertise</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Specific industries of expertise" 
                              {...field} 
                              value={field.value || ''} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-8">
                    <h4 className="font-medium mb-4">Specific Skills</h4>
                    <SkillsSelection 
                      selectedSkills={selectedSkills}
                      onChange={setSelectedSkills}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button 
                    type="button" 
                    onClick={() => setSelectedTab("location")}
                    variant="outline"
                  >
                    Previous: Location
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setSelectedTab("business")}
                  >
                    Next: Business
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="business" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-medium">Business & Employment</h3>
                  <p className="text-sm text-gray-500 mb-4">Work status and business interests</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="employmentStatus"
                      render={({ field }) => {
                        // Use the select safety hook to handle empty strings
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
                                <SelectItem value="Employed">Employed</SelectItem>
                                <SelectItem value="Self-employed">Self-employed</SelectItem>
                                <SelectItem value="Unemployed">Unemployed</SelectItem>
                                <SelectItem value="Student">Student</SelectItem>
                                <SelectItem value="Apprentice">Apprentice</SelectItem>
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
                      name="specificJob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specific Job/Occupation</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Current job title or occupation" 
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
                      name="businessInterest"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center">
                            <FormLabel>Business Interest</FormLabel>
                            <FormTooltip content="The type of business the participant is interested in starting or already runs" />
                          </div>
                          <FormControl>
                            <Textarea 
                              placeholder="Description of business interests" 
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
                      name="financialAspirations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Financial Aspirations</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Financial goals and aspirations" 
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

                <Separator />

                <div>
                  <h3 className="text-lg font-medium">DARE Program Details</h3>
                  <p className="text-sm text-gray-500 mb-4">Participation in the DARE program</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="dareModel"
                      render={({ field }) => {
                        // Use the select safety hook to handle empty strings
                        const safeSelect = useSelectSafety(field.value);
                        return (
                          <FormItem>
                            <FormLabel>DARE Model</FormLabel>
                            <Select 
                              onValueChange={(val) => {
                                field.onChange(val);
                                safeSelect.onChange(val);
                              }} 
                              value={safeSelect.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Collaborative">Collaborative</SelectItem>
                                <SelectItem value="MakerSpace">MakerSpace</SelectItem>
                                <SelectItem value="Madam Anchor">Madam Anchor</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The DARE model this participant is associated with
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="trainingStatus"
                      render={({ field }) => {
                        // Use the select safety hook to handle empty strings
                        const safeSelect = useSelectSafety(field.value);
                        return (
                          <FormItem>
                            <FormLabel>Training Status</FormLabel>
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
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Dropped">Dropped</SelectItem>
                                <SelectItem value="Not Started">Not Started</SelectItem>
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
                        // Use the select safety hook to handle empty strings
                        const safeSelect = useSelectSafety(field.value);
                        return (
                          <FormItem>
                            <FormLabel>Program Status</FormLabel>
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
                                <SelectItem value="Graduated">Graduated</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="isMadam"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Is a Madam</FormLabel>
                              <FormDescription>
                                Check if this participant is a "Madam" (has apprentices)
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isApprentice"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Is an Apprentice</FormLabel>
                              <FormDescription>
                                Check if this participant is an apprentice under a "Madam"
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {form.watch('isMadam') && (
                      <>
                        <FormField
                          control={form.control}
                          name="apprenticeNames"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Apprentice Names</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter names of apprentices (one per line)" 
                                  {...field} 
                                  value={
                                    Array.isArray(field.value) 
                                      ? field.value.join('\n') 
                                      : field.value || ''
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const apprentices = value.split('\n').filter(name => name.trim() !== '');
                                    field.onChange(apprentices);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Enter each apprentice name on a new line
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
                              <FormLabel>Apprentice Contact</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Contact number for apprentices" 
                                  {...field} 
                                  value={field.value || ''} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {form.watch('isApprentice') && (
                      <>
                        <FormField
                          control={form.control}
                          name="madamName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Madam's Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Name of supervising madam" 
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
                              <FormLabel>Madam's Phone</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Contact number for madam" 
                                  {...field} 
                                  value={field.value || ''} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                    </div>
                    </div>

                    <div className="flex justify-between pt-2">
                    <Button 
                    type="button" 
                    onClick={() => setSelectedTab("skills")}
                    variant="outline"
                    >
                    Previous: Skills
                    </Button>

                    <div className="space-x-2">
                    <Button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSubmit();
                      }}
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
                                type="button"
                                onClick={handleSaveClick}
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
                            onClick={handleSaveClick}
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
                              <NewCertificationManager youthId={youthId} />
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
                                type="button"
                                onClick={handleSaveClick}
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
                            onClick={handleSaveClick}
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
                                  type="button"
                                  onClick={handleSaveClick}
                                  className="gap-2"
                                  disabled={isSaving}
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