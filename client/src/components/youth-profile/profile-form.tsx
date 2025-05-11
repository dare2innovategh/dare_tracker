import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertYouthProfileSchema, districtEnum, dareModelEnum, serviceCategoryEnum } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ProfileImageUpload } from "@/components/profile/profile-image-upload";
import { SkillsSelection, type SelectedSkill } from "./skills-selection";
import { TrainingSectionNew } from "./training-section-new";
import { FormTooltip } from "@/components/ui/form-tooltip";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, InfoIcon } from "lucide-react";

// Extended schema with validation rules, making most fields optional
const formSchema = insertYouthProfileSchema.extend({
  // All fields are optional now except fullName and district
  fullName: z.string().min(1, { message: "Full name is required" }),
  district: z.string().min(1, { message: "District is required" }),

  // Optional fields with transformations
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email({ message: "Please enter a valid email address" }).optional().or(z.literal('')).nullable(),
  town: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  maritalStatus: z.string().optional(),
  childrenCount: z.number().optional(),
  yearOfBirth: z.number().optional(),
  age: z.number().optional(),
  ageGroup: z.string().optional(),
  
  // Emergency contact fields
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email({ message: "Please enter a valid email address" }).optional().or(z.literal('')),
    address: z.string().optional(),
    relation: z.string().optional()
  }).optional().default({}),
  
  // Transition framework fields
  transitionStatus: z.enum(["Not Started", "In Progress", "Operational"]).optional().default("Not Started"),
  onboardedToTracker: z.boolean().optional().default(false),
  localMentorName: z.string().optional(),
  localMentorContact: z.string().optional(),
  
  // Transform string inputs to arrays
  primarySkills: z.string().transform((val) => val ? val.split(',').map(s => s.trim()) : []).optional(),
  secondarySkills: z.string().transform((val) => val ? val.split(',').map(s => s.trim()) : []).optional(),
  languagesSpoken: z.string().transform((val) => val ? val.split(',').map(s => s.trim()) : []).optional(), 
  portfolioLinks: z.string().transform((val) => val ? val.split(',').map(s => s.trim()) : []).optional(),
  workSamples: z.string().transform((val) => val ? val.split(',').map(s => s.trim()) : []).optional(),
  caseStudies: z.string().transform((val) => val ? val.split(',').map(s => s.trim()) : []).optional(),
  workHistory: z.string().transform((val) => val ? val.split(',').map(s => s.trim()) : []).optional(),
  education: z.string().transform((val) => val ? val.split(',').map(s => s.trim()) : []).optional(),
  dareTraining: z.string().transform((val) => val ? val.split(',').map(s => s.trim()) : []).optional(),
  otherTraining: z.string().transform((val) => val ? val.split(',').map(s => s.trim()) : []).optional(),
  
  // Other optional fields
  skillLevel: z.string().optional(),
  industryExpertise: z.string().optional(),
  communicationStyle: z.string().optional(),
  yearsOfExperience: z.number().optional(),
  businessInterest: z.string().optional(),
  employmentStatus: z.string().optional(),
  specificJob: z.string().optional(),
  pwdStatus: z.string().optional(),
  dareModel: z.enum(["Collaborative", "MakerSpace", "Madam Anchor"]).optional(),
  isMadam: z.boolean().optional().default(false),
  isApprentice: z.boolean().optional().default(false),
  madamName: z.string().optional(),
  madamPhone: z.string().optional(),
  apprenticePhone: z.string().optional(),
  guarantor: z.string().optional(),
  guarantorPhone: z.string().optional(),
  digitalSkills: z.string().optional(),
  digitalSkills2: z.string().optional(),
  financialAspirations: z.string().optional(),
  dependents: z.string().optional(),
  nationalId: z.string().optional(),
  trainingStatus: z.string().optional(),
  programStatus: z.string().optional(),
});

type ProfileFormData = z.infer<typeof formSchema>;

interface ProfileFormProps {
  profileData?: any;
  userId: number;
  isEdit?: boolean;
}

export default function ProfileForm({ profileData, userId, isEdit = false }: ProfileFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(profileData?.profilePicture || null);
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  
  // Fetch youth skills if editing an existing profile
  const youthId = profileData?.id;
  
  // Fetch youth skills data if editing an existing profile
  const { data: youthSkills } = useQuery({
    queryKey: ['/api/youth-skills', youthId],
    queryFn: async () => {
      if (!youthId) return [];
      const res = await fetch(`/api/youth-skills/${youthId}`);
      if (!res.ok) throw new Error('Failed to fetch skills');
      return res.json();
    },
    enabled: !!youthId && isEdit
  });
  
  // Initialize skills data when they're loaded
  // Transform skills data when it's loaded
  useEffect(() => {
    if (youthSkills && youthSkills.length > 0) {
      const formattedSkills: SelectedSkill[] = youthSkills.map((skill: any) => ({
        id: skill.skillId,
        name: skill.name,
        proficiency: skill.proficiency,
        isPrimary: skill.isPrimary,
        yearsOfExperience: skill.yearsOfExperience || 0
      }));
      setSelectedSkills(formattedSkills);
    }
  }, [youthSkills]);
  

  
  // Handler for profile picture changes
  const handleProfileImageChange = (imageUrl: string | null) => {
    setProfileImageUrl(imageUrl);
    // Explicitly cast null to empty string to avoid type errors
    form.setValue('profilePicture', imageUrl || '');
  };
  
  // Convert array fields to comma-separated strings for the form
  const getDefaultValue = (field: any): string => {
    if (!field) return '';
    return Array.isArray(field) ? field.join(', ') : field.toString();
  };

  // Set default values based on existing profile or init new values
  const defaultValues: Partial<ProfileFormData> = {
    userId: userId,
    fullName: profileData?.fullName || '',
    profilePicture: profileData?.profilePicture || '',
    participantCode: profileData?.participantCode || '',
    district: profileData?.district || '',
    town: profileData?.town || '',
    phoneNumber: profileData?.phoneNumber || '',
    email: profileData?.email || '',
    nationalId: profileData?.nationalId || '',

    // Emergency contact
    emergencyContact: profileData?.emergencyContact || {
      name: '',
      phone: '',
      email: '',
      address: '',
      relation: ''
    },

    // Demographic fields
    gender: profileData?.gender || '',
    maritalStatus: profileData?.maritalStatus || '',
    childrenCount: profileData?.childrenCount || 0,
    dependents: profileData?.dependents || '',
    yearOfBirth: profileData?.yearOfBirth || null,
    age: profileData?.age || null,
    ageGroup: profileData?.ageGroup || '',
    pwdStatus: profileData?.pwdStatus || '',
    
    // Handle array fields properly for the form
    primarySkills: typeof profileData?.primarySkills === 'string' 
      ? profileData.primarySkills 
      : getDefaultValue(profileData?.primarySkills),
    secondarySkills: typeof profileData?.secondarySkills === 'string' 
      ? profileData.secondarySkills 
      : getDefaultValue(profileData?.secondarySkills),
    skillLevel: profileData?.skillLevel || '',
    industryExpertise: profileData?.industryExpertise || '',
    languagesSpoken: typeof profileData?.languagesSpoken === 'string' 
      ? profileData.languagesSpoken 
      : getDefaultValue(profileData?.languagesSpoken),
    communicationStyle: profileData?.communicationStyle || '',

    portfolioLinks: typeof profileData?.portfolioLinks === 'string' 
      ? profileData.portfolioLinks 
      : getDefaultValue(profileData?.portfolioLinks),
    workSamples: typeof profileData?.workSamples === 'string' 
      ? profileData.workSamples 
      : getDefaultValue(profileData?.workSamples),
    caseStudies: typeof profileData?.caseStudies === 'string' 
      ? profileData.caseStudies 
      : getDefaultValue(profileData?.caseStudies),
    yearsOfExperience: profileData?.yearsOfExperience || 0,
    workHistory: typeof profileData?.workHistory === 'string' 
      ? profileData.workHistory 
      : getDefaultValue(profileData?.workHistory),
    education: typeof profileData?.education === 'string' 
      ? profileData.education 
      : getDefaultValue(profileData?.education),
    dareTraining: typeof profileData?.dareTraining === 'string' 
      ? profileData.dareTraining 
      : getDefaultValue(profileData?.dareTraining),
    otherTraining: typeof profileData?.otherTraining === 'string' 
      ? profileData.otherTraining 
      : getDefaultValue(profileData?.otherTraining),
    
    // Employment status fields
    employmentStatus: profileData?.employmentStatus || '',
    specificJob: profileData?.specificJob || '',
    businessInterest: profileData?.businessInterest || '',
    
    // Additional DARE fields
    dareModel: profileData?.dareModel || '',
    isMadam: profileData?.isMadam || false,
    isApprentice: profileData?.isApprentice || false,
    madamName: profileData?.madamName || '',
    madamPhone: profileData?.madamPhone || '',
    apprenticeNames: typeof profileData?.apprenticeNames === 'string' 
      ? profileData.apprenticeNames 
      : getDefaultValue(profileData?.apprenticeNames),
    apprenticePhone: profileData?.apprenticePhone || '',
    guarantor: profileData?.guarantor || '',
    guarantorPhone: profileData?.guarantorPhone || '',
    
    // Digital skills fields
    digitalSkills: profileData?.digitalSkills || '',
    digitalSkills2: profileData?.digitalSkills2 || '',
    financialAspirations: profileData?.financialAspirations || '',
    programStatus: profileData?.programStatus || '',
    
    // Transition framework fields
    transitionStatus: profileData?.transitionStatus || 'Not Started',
    onboardedToTracker: profileData?.onboardedToTracker || false,
    localMentorName: profileData?.localMentorName || '',
    localMentorContact: profileData?.localMentorContact || '',
  };

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });

  // Create or update profile mutation
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create file preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle file removal
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };
  
  const mutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      console.log("Starting profile mutation with data:", data);
      
      // First, validate the fullName is present
      if (!data.fullName || data.fullName.trim() === '') {
        console.error("fullName is missing or empty in the form data");
        throw new Error("Full name is required");
      }
      
      // CRITICAL FIX: Set up pure JSON approach for all submissions
      // Build JSON request object directly
      const profileData = {
        ...data,
        // Force include these critical fields
        fullName: data.fullName.trim(), // CRITICAL: Force trim and ensure fullName is set correctly
        district: data.district || "Bekwai", // Default district
        userId: userId
      };
      
      // Double-check that fullName is properly set in the request object
      console.log(`CRITICAL CHECK - Request object fullName: "${profileData.fullName}", type: ${typeof profileData.fullName}, length: ${profileData.fullName.length}`);
      
      // If fullName is still an issue, force inject it directly 
      if (!profileData.fullName || profileData.fullName.trim() === '') {
        console.error("EMERGENCY FIX: fullName still empty after transformation");
        const nameFromForm = form.getValues().fullName;
        if (nameFromForm && nameFromForm.trim() !== '') {
          console.log("Using name from form directly:", nameFromForm);
          profileData.fullName = nameFromForm.trim();
        } else {
          throw new Error("Full name is required but could not be retrieved from form");
        }
      }
      
      console.log("Using direct JSON approach with data:", profileData);
      
      // Determine API endpoint and method
      const isNewProfile = !isEdit;
      const endpoint = isNewProfile 
        ? '/api/youth-profiles' 
        : `/api/youth-profiles/${profileData.id}`;
      
      // For new profile or with file, we need to use FormData
      if (selectedFile || isNewProfile) {
        // Create FormData from our profileData object
        const formData = new FormData();
        
        // Add all profile data fields one by one to ensure they're included
        Object.entries(profileData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        });
        
        // Add file if it exists
        if (selectedFile) {
          formData.append('profilePicture', selectedFile);
        }
        
        console.log("FormData submission contents (keys):", Array.from(formData.keys()));
        
        // Double check fullName presence
        if (!formData.has('fullName')) {
          console.error("CRITICAL ERROR: fullName is missing from FormData after construction");
          formData.append('fullName', data.fullName.trim());
        }
        
        try {
          // Use POST for new, PUT for edit with file
          const method = isNewProfile ? 'POST' : 'PUT';
          console.log(`API Request: ${method} ${endpoint}`);
          
          const res = await fetch(endpoint, {
            method,
            body: formData,
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
        } catch (error) {
          console.error("FormData submission error:", error);
          throw error;
        }
      } 
      // For data-only updates, use JSON
      else {
        try {
          // Use PATCH for edit without file
          const method = 'PATCH';
          console.log(`API Request: ${method} ${endpoint}`);
          
          const res = await fetch(endpoint, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData),
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
        } catch (error) {
          console.error("JSON submission error:", error);
          throw error;
        }
      }
    },
    onSuccess: () => {
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
      
      // Navigate to profiles list
      navigate('/youth-profiles');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? 'update' : 'create'} profile: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Skills mutation for batch updating skills
  const skillsMutation = useMutation({
    mutationFn: async (skills: SelectedSkill[]) => {
      if (!youthId) return null;
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
    onError: (error) => {
      toast({
        title: "Skills Error",
        description: `Failed to update skills: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  


  async function onSubmit(data: ProfileFormData) {
    try {
      console.log("Form submission started with data:", data);
      console.log("fullName in submission:", data.fullName, 
                  "type:", typeof data.fullName, 
                  "length:", data.fullName ? data.fullName.length : 0);
      
      // Trim the fullName value for validation and ensure it's properly set for submission
      let trimmedName = data.fullName ? data.fullName.trim() : '';
      
      // Validate required fields
      if (!trimmedName) {
        console.log("fullName validation failed - empty after trimming");
        form.setError("fullName", { 
          type: "manual", 
          message: "Full name is required"
        });
        toast({
          title: "Validation error",
          description: "Please provide the participant's full name",
          variant: "destructive",
        });
        return;
      }
      
      // CRITICAL FIX: Ensure the fullName is properly set in the form data
      // This guarantees the fullName is correctly sent to the server
      data.fullName = trimmedName;
      console.log("Verified fullName:", data.fullName);
      
      if (!data.district) {
        form.setError("district", { 
          type: "manual", 
          message: "Please select a district"
        });
        toast({
          title: "Validation error",
          description: "Please select a district",
          variant: "destructive",
        });
        return;
      }
      
      // Submit profile data
      console.log("Form submitted with data:", data);
      
      // We add this to track the form submission more reliably in the console
      console.warn("PROFILE FORM SUBMISSION STARTED", { isEdit, profileId: profileData?.id });
      
      // Submit the main profile data first
      const profileResponse = await mutation.mutateAsync(data);
      
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
      
      // Success message and navigation is handled in mutation.onSuccess
    } catch (error) {
      // This catch block provides additional debugging
      console.error("CRITICAL ERROR in profile form submission:", error);
      
      // Errors are also handled in mutation.onError, but this ensures they're caught
      toast({
        title: "Error during form submission",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="w-full shadow-lg border-0">
      <CardHeader className="bg-[#EA6A10] text-white rounded-t-lg">
        <CardTitle className="text-2xl font-bold">{isEdit ? "Edit Youth Profile" : "Create New Youth Profile"}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-[#06315C] border-l-4 border-[#EA6A10] pl-3 mb-2">Core Identification & Contact</h3>
              <p className="text-sm text-gray-600 mb-5 pl-4">Personal information and contact details</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>Full Name <span className="text-red-500 ml-1">*</span></FormLabel>
                        <FormTooltip content="Enter the participant's complete name as it appears on official documents" />
                      </div>
                      <FormControl>
                        <Input 
                          placeholder="Enter participant's full name" 
                          {...field} 
                          value={field.value || ''} 
                          required
                          onChange={(e) => {
                            // Don't trim during typing, only store the value as is
                            const value = e.target.value;
                            field.onChange(value);
                            
                            // Debug the value
                            console.log("fullName value changed to:", value, "length:", value.length);
                            console.log("Form data:", form.getValues());
                            
                            // Clear any manual errors on the fullName field when user types
                            if (value && value.trim() !== '') {
                              form.clearErrors("fullName");
                            }
                          }}
                          // Add onBlur handler to ensure name is properly set
                          onBlur={(e) => {
                            // Ensure the value is stored correctly when field loses focus
                            const value = e.target.value.trim();
                            console.log("fullName onBlur value:", value);
                            if (value) {
                              field.onChange(value);
                              form.clearErrors("fullName");
                            }
                          }}
                          className={field.value ? undefined : "border-red-300 focus-visible:ring-red-300"}
                        />
                      </FormControl>
                      <FormDescription className="font-medium text-sm">
                        {field.value ? (
                          <span className="text-green-600">✓ Name provided</span>
                        ) : (
                          <span className="text-red-500 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            This field is required
                          </span>
                        )}
                      </FormDescription>
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
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>Rural District <span className="text-red-500 ml-1">*</span></FormLabel>
                        <FormTooltip content="The district where the participant lives or works. This is used for regional statistics and mentor assignment." />
                      </div>
                      <Select 
                        onValueChange={(value) => {
                          console.log("Selected district:", value);
                          field.onChange(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className={!field.value ? "border-red-300 focus-visible:ring-red-300" : undefined}>
                            <SelectValue placeholder="Select a district" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['Bekwai', 'Gushegu', 'Lower Manya Krobo', 'Yilo Krobo'].map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="font-medium text-sm">
                        {field.value ? (
                          <span className="text-green-600">✓ District selected</span>
                        ) : (
                          <span className="text-red-500 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            This field is required
                          </span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="town"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Town in District</FormLabel>
                      <FormControl>
                        <Input placeholder="Town name" {...field} value={field.value || ''} />
                      </FormControl>
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
                        <Input placeholder="e.g. +233 XX XXX XXXX" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Include country code (+233 for Ghana)
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
                        <Input placeholder="Optional email address" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Optional - used for notifications
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
                        <FormTooltip content="This is the unique identifier assigned to each participant in the DARE program. Format should be D00XXXXXXX." />
                      </div>
                      <FormControl>
                        <Input placeholder="D00XXXXXXX" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Official DARE program ID (format: D00XXXXXXX)
                      </FormDescription>
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
                        <Input placeholder="GHA-XXXXXXXXX" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Ghana Card or other national identification
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-xl font-bold text-[#06315C] border-l-4 border-[#EA6A10] pl-3 mb-2">Personal Demographics</h3>
              <p className="text-sm text-gray-600 mb-5 pl-4">Demographic information for program metrics</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Gender</FormLabel>
                        <FormTooltip content="The gender identity of the participant. This information is used for demographic reporting and program monitoring." />
                      </div>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                        defaultValue={field.value || undefined}
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
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select marital status" />
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
                  )}
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
                          placeholder="0" 
                          {...field}
                          value={field.value === undefined ? 0 : field.value} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                        Brief description of dependents (if applicable)
                      </FormDescription>
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
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="YYYY" 
                          {...field}
                          value={field.value || ''} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Age</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Current age" 
                          {...field}
                          value={field.value || ''} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ageGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Group</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                        defaultValue={field.value || undefined}
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
                          <SelectItem value="35-39">35-39</SelectItem>
                          <SelectItem value="40+">40+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pwdStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disability Status</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Leave blank if not applicable" 
                          {...field}
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormDescription>
                        Optional information about any disabilities
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-xl font-bold text-[#06315C] border-l-4 border-[#EA6A10] pl-3 mb-2">DARE Program Information</h3>
              <p className="text-sm text-gray-600 mb-5 pl-4">Program status and participation details</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DARE Model field removed as requested - now only tracked at business level */}
                
                <FormField
                  control={form.control}
                  name="employmentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Employment Status</FormLabel>
                        <FormTooltip content="Current employment situation of the participant. This helps track economic impact of the DARE program and identify appropriate support services." />
                      </div>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                        defaultValue={field.value || undefined}
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
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="specificJob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specific Job/Role</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Current job role if employed" 
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
                        <FormTooltip content="The specific business sector or type of business the youth is interested in or currently operating. This helps with matching to appropriate mentors and training programs." />
                      </div>
                      <FormControl>
                        <Input 
                          placeholder="Area of business interest" 
                          {...field}
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormDescription>
                        Sector or type of business interested in
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="trainingStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="programStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Status</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Current status in DARE program" 
                          {...field}
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormDescription>
                        Overall status in the DARE program
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-xl font-bold text-[#06315C] border-l-4 border-[#EA6A10] pl-3 mb-2">Madam/Apprentice Information</h3>
              <p className="text-sm text-gray-600 mb-5 pl-4">Only applicable for Madam Anchor model</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isMadam"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Is this person a Madam?
                          </FormLabel>
                          <FormDescription>
                            Indicate if this person is a Madam
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isApprentice"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Is this person an Apprentice?
                          </FormLabel>
                          <FormDescription>
                            Indicate if this person is an Apprentice
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="madamName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Madam's Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="For apprentices only" 
                          {...field}
                          value={field.value || ''} 
                          disabled={!form.getValues().isApprentice}
                        />
                      </FormControl>
                      <FormDescription>
                        If apprentice, name of supervising Madam
                      </FormDescription>
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
                          placeholder="For apprentices only" 
                          {...field}
                          value={field.value || ''} 
                          disabled={!form.getValues().isApprentice}
                        />
                      </FormControl>
                      <FormDescription>
                        If apprentice, phone number of supervising Madam
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="apprenticeNames"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Apprentice Names</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="For Madams only - list apprentice names, one per line" 
                          className="min-h-[100px]"
                          value={Array.isArray(field.value) ? field.value.join('\n') : (typeof field.value === 'string' ? field.value : '')} 
                          onChange={(e) => {
                            const value = e.target.value;
                            const nameArray = value.split('\n').filter(name => name.trim() !== '');
                            // Ensure we're passing a string array
                            field.onChange(nameArray);
                          }}
                          disabled={form.getValues().isMadam !== true}
                        />
                      </FormControl>
                      <FormDescription>
                        If Madam, names of apprentices (one per line)
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
                      <FormLabel>Apprentices' Contact</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="For Madams only" 
                          {...field}
                          value={field.value || ''} 
                          disabled={form.getValues().isMadam !== true}
                        />
                      </FormControl>
                      <FormDescription>
                        If Madam, contact number for apprentices
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-xl font-bold text-[#06315C] border-l-4 border-[#EA6A10] pl-3 mb-2">Guarantor Information</h3>
              <p className="text-sm text-gray-600 mb-5 pl-4">Details of guarantor or reference</p>
              
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
                        Full name of guarantor or reference
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
                      <FormDescription>
                        Contact number for guarantor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-xl font-bold text-[#06315C] border-l-4 border-[#EA6A10] pl-3 mb-2">Digital & Financial Information</h3>
              <p className="text-sm text-gray-600 mb-5 pl-4">Digital skills and financial goals</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="digitalSkills"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Digital Skills (Primary)</FormLabel>
                        <FormTooltip content="The main digital competencies of the participant, such as computer use, mobile applications, or internet skills. This helps in targeting appropriate digital training." />
                      </div>
                      <FormControl>
                        <Input 
                          placeholder="Primary digital skills" 
                          {...field}
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormDescription>
                        Main digital competencies
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="digitalSkills2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Digital Skills (Secondary)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Additional digital skills" 
                          {...field}
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormDescription>
                        Additional digital competencies
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="financialAspirations"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <div className="flex items-center gap-2">
                        <FormLabel>Financial Aspirations</FormLabel>
                        <FormTooltip content="The participant's financial goals and plans, such as saving for equipment, expanding a business, or investing in education. This helps mentors provide targeted financial guidance." />
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Financial goals and aspirations" 
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormDescription>
                        Financial goals, aspirations, and plans
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-xl font-bold text-[#06315C] border-l-4 border-[#EA6A10] pl-3 mb-2">Skills & Expertise</h3>
              <p className="text-sm text-gray-600 mb-5 pl-4">Professional skills and competencies</p>
              
              {/* Enhanced Skills Selection Component */}
              <div className="mb-6 rounded-md border p-4">
                <h4 className="text-md font-medium mb-2">Skills Selection</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Select skills and indicate proficiency level for each skill
                </p>
                <SkillsSelection 
                  selectedSkills={selectedSkills}
                  onChange={setSelectedSkills}
                />
              </div>
              
              {/* Industry Expertise Field */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <FormField
                  control={form.control}
                  name="industryExpertise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry Expertise</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Agriculture, Technology" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Main industry sectors of expertise
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-xl font-bold text-[#06315C] border-l-4 border-[#EA6A10] pl-3 mb-2">Communication & Professionalism</h3>
              <p className="text-sm text-gray-600 mb-5 pl-4">Languages and communication preferences</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="languagesSpoken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Languages Spoken</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter languages, comma separated" {...field} />
                      </FormControl>
                      <FormDescription>
                        List languages separated by commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="communicationStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Communication Style</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Formal, Direct, Visual" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-xl font-bold text-[#06315C] border-l-4 border-[#EA6A10] pl-3 mb-2">Portfolio & Work Samples</h3>
              <p className="text-sm text-gray-600 mb-5 pl-4">Examples of work and achievements</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
                
                <FormField
                  control={form.control}
                  name="workSamples"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Samples</FormLabel>
                      <FormControl>
                        <Input placeholder="URLs, comma separated" {...field} />
                      </FormControl>
                      <FormDescription>
                        Direct uploads or links to work samples
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="caseStudies"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Case Studies/Project Descriptions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief descriptions, comma separated for multiple" 
                          {...field}
                          className="min-h-[100px]"
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
              <h3 className="text-xl font-bold text-[#06315C] border-l-4 border-[#EA6A10] pl-3 mb-2">Professional Background & Experience</h3>
              <p className="text-sm text-gray-600 mb-5 pl-4">Work history, education, and training</p>
              
              {/* Legacy fields for backward compatibility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="yearsOfExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="workHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work History/Previous Clients</FormLabel>
                      <FormControl>
                        <Input placeholder="Past work experiences, comma separated" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Hidden legacy education field for backward compatibility */}
                <div className="hidden">
                  <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <input type="hidden" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Education Section */}
                <div className="col-span-2 mb-4">
                  <h4 className="text-md font-semibold mb-2">Education</h4>
                  <p className="text-gray-500 text-sm mb-4">
                    Detailed education records can be added after profile creation.
                  </p>
                </div>
                
                {/* Training Section - Using New Component for Edit Mode */}
                <div className="col-span-2">
                  {isEdit && youthId ? (
                    <div>
                      <h4 className="text-md font-semibold mb-3">Training Programs</h4>
                      <TrainingSectionNew youthId={youthId} isEditable={true} />
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-md font-semibold mb-3">Training Programs</h4>
                      <p className="text-gray-500 text-sm mb-4">
                        Training information can be added after profile creation. You'll be able to add specific training 
                        programs and certificates once the youth profile has been created.
                      </p>
                      
                      {/* Hide these fields but keep them for form validation */}
                      <div className="hidden">
                        <FormField
                          control={form.control}
                          name="dareTraining"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <input type="hidden" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="otherTraining"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <input type="hidden" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Transition Framework Section */}
            <div>
              <h3 className="text-xl font-bold text-[#06315C] border-l-4 border-[#EA6A10] pl-3 mb-2">DARE Transition Framework</h3>
              <p className="text-sm text-gray-600 mb-5 pl-4">Information related to the transition program</p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="transitionStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transition Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select transition status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Not Started">Not Started</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Operational">Operational</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Current status in the transition program
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="onboardedToTracker"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 h-full">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Onboarded to Transition Tracker</FormLabel>
                          <FormDescription>
                            Check if participant is onboarded to the transition tracking system
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="localMentorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local Mentor Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter local mentor name" {...field} />
                        </FormControl>
                        <FormDescription>
                          Name of non-DARE mentor assigned locally
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="localMentorContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local Mentor Contact</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact details" {...field} />
                        </FormControl>
                        <FormDescription>
                          Phone or email of local mentor
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/youth-profiles')}
                className="border-[#06315C] text-[#06315C] hover:bg-[#06315C]/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={mutation.isPending || skillsMutation.isPending}
                className="min-w-[150px] bg-[#EA6A10] hover:bg-[#D05800] text-white font-medium"
              >
                {mutation.isPending || skillsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  isEdit ? "Update Profile" : "Create Profile"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
