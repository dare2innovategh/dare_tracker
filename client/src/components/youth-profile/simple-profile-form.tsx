import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Loader2, 
  User, 
  CheckCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  PlusCircle, 
  Camera, 
  UserCircle, 
  Upload, 
  X 
} from "lucide-react";

// Form schema that covers all fields in the database schema
const formSchema = z.object({
  // Personal Information - Required fields
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  middleName: z.string().optional().nullable(),
  preferredName: z.string().optional().nullable(),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  fullName: z.string().optional(),
  yearOfBirth: z.number().optional().nullable(),
  age: z.number().optional().nullable(),
  ageGroup: z.string().optional().nullable(),
  
  // Location fields
  district: z.string().min(1, { message: "District is required" }),
  town: z.string().optional().nullable(),
  homeAddress: z.string().optional().nullable(),
  country: z.string().default("Ghana").optional().nullable(),
  adminLevel1: z.string().optional().nullable(),
  adminLevel2: z.string().optional().nullable(),
  adminLevel3: z.string().optional().nullable(),
  adminLevel4: z.string().optional().nullable(),
  adminLevel5: z.string().optional().nullable(),

  // Contact information
  phoneNumber: z.string().optional().nullable(),
  additionalPhoneNumber1: z.string().optional().nullable(),
  additionalPhoneNumber2: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  
  // Basic profile info
  profilePicture: z.string().optional().nullable(),
  participantCode: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  childrenCount: z.number().optional().nullable(),
  dependents: z.string().optional().nullable(),
  nationalId: z.string().optional().nullable(),
  pwdStatus: z.string().optional().nullable(),

  // Emergency Contact
  emergencyContactName: z.string().optional().nullable(), 
  emergencyContactRelation: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactEmail: z.string().optional().nullable(),
  emergencyContactAddress: z.string().optional().nullable(),

  // Education fields
  highestEducationLevel: z.string().optional().nullable(),
  activeStudentStatus: z.boolean().optional().nullable(),

  // Professional background
  yearsOfExperience: z.number().optional().nullable(),
  workHistory: z.string().optional().nullable(),
  industryExpertise: z.string().optional().nullable(),
  coreSkills: z.string().optional().nullable(),
  skillLevel: z.string().optional().nullable(),
  languagesSpoken: z.string().optional().nullable(),
  communicationStyle: z.string().optional().nullable(),

  // Digital skills
  digitalSkills: z.string().optional().nullable(),
  digitalSkills2: z.string().optional().nullable(),
  
  // Financial
  financialAspirations: z.string().optional().nullable(),

  // Program fields
  employmentStatus: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
  specificJob: z.string().optional().nullable(),
  businessInterest: z.string().optional().nullable(),
  trainingStatus: z.string().optional().nullable(),
  programStatus: z.string().optional().nullable(),
  transitionStatus: z.string().optional().nullable(),
  onboardedToTracker: z.boolean().optional().nullable(),
  
  // Mentor info
  localMentorName: z.string().optional().nullable(),
  localMentorContact: z.string().optional().nullable(),
  guarantor: z.string().optional().nullable(),
  guarantorPhone: z.string().optional().nullable(),

  // Madam/Apprentice details
  madamName: z.string().optional().nullable(),
  madamPhone: z.string().optional().nullable(),
  
  // Partner program fields
  implementingPartnerName: z.string().optional().nullable(),
  refugeeStatus: z.boolean().optional().nullable(),
  idpStatus: z.boolean().optional().nullable(),
  communityHostsRefugees: z.boolean().optional().nullable(),
  partnerStartDate: z.date().optional().nullable(),
  programName: z.string().optional().nullable(),
  programDetails: z.string().optional().nullable(),
  programContactPerson: z.string().optional().nullable(),
  cohort: z.string().optional().nullable(),
  programContactPhoneNumber: z.string().optional().nullable(),

  // DARE Model
  dareModel: z.enum(["Collaborative", "MakerSpace", "Madam Anchor"]).optional().nullable(),

  // Social media & portfolio
  socialMediaLinks: z.string().optional().nullable(),

  // Flags & Meta
  hostCommunityStatus: z.string().optional().nullable(),
  newDataSubmission: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
});

type ProfileFormData = z.infer<typeof formSchema>;

interface YouthProfileFormProps {
  userId?: number;
  profileData?: any;
  isEdit?: boolean;
}

export default function CompleteYouthProfileForm({ userId, profileData, isEdit = false }: YouthProfileFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("personal");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Derive full name from other fields
  const getFullName = (first: string, middle: string | null, last: string): string => {
    if (middle) {
      return `${first} ${middle} ${last}`;
    }
    return `${first} ${last}`;
  };

  // Calculate age and year of birth from date of birth
  const calculateAgeAndYear = (dateOfBirth: Date): { age: number, yearOfBirth: number } => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return {
      age,
      yearOfBirth: birthDate.getFullYear()
    };
  };

  // Determine age group based on age
  const determineAgeGroup = (age: number): string => {
    if (age < 18) return "Under 18";
    if (age < 25) return "18-24";
    if (age < 35) return "25-34";
    if (age < 45) return "35-44";
    return "45+";
  };

  // Extract names from full name for editing mode
  const extractNames = (fullName?: string) => {
    if (!fullName) return { firstName: '', middleName: null, lastName: '' };
    
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return { firstName: parts[0], middleName: null, lastName: '' };
    } else if (parts.length === 2) {
      return { firstName: parts[0], middleName: null, lastName: parts[1] };
    } else {
      return { 
        firstName: parts[0], 
        middleName: parts.slice(1, -1).join(' '), 
        lastName: parts[parts.length - 1] 
      };
    }
  };

  // Parse a date string 
  const parseDate = (dateString?: string | null) => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  };

  // Initialize form data
 const form = useForm<ProfileFormData>({
  resolver: zodResolver(formSchema),
  defaultValues: (() => {
    // Fix error: "const n" was incomplete
    const names = profileData?.fullName 
      ? extractNames(profileData.fullName) 
      : { firstName: '', middleName: null, lastName: '' };
    
    // Parse emergency contact data properly
    let emergencyContact = { name: '', relation: '', phone: '', email: '', address: '' };
    if (profileData?.emergencyContact) {
      try {
        // Handle case where it's already an object
        if (typeof profileData.emergencyContact === 'object') {
          emergencyContact = profileData.emergencyContact;
        } 
        // Handle case where it's a JSON string
        else if (typeof profileData.emergencyContact === 'string') {
          emergencyContact = JSON.parse(profileData.emergencyContact);
        }
      } catch (e) {
        console.error('Error parsing emergency contact:', e);
      }
    }

      return {
        // Required fields
        firstName: profileData?.firstName || names.firstName || '',
        lastName: profileData?.lastName || names.lastName || '',
        middleName: profileData?.middleName || names.middleName || '',
        dateOfBirth: profileData?.dateOfBirth ? new Date(profileData.dateOfBirth) : undefined,
        district: profileData?.district || '',
        fullName: profileData?.fullName || '',
        
        // Age-related fields
        yearOfBirth: profileData?.yearOfBirth || null,
        age: profileData?.age || null,
        ageGroup: profileData?.ageGroup || '',
        
        // All other fields - setting defaults or empty values
        preferredName: profileData?.preferredName || '',
        town: profileData?.town || '',
        homeAddress: profileData?.homeAddress || '',
        country: profileData?.country || 'Ghana',
        adminLevel1: profileData?.adminLevel1 || '',
        adminLevel2: profileData?.adminLevel2 || '',
        adminLevel3: profileData?.adminLevel3 || '',
        adminLevel4: profileData?.adminLevel4 || '',
        adminLevel5: profileData?.adminLevel5 || '',
        
        phoneNumber: profileData?.phoneNumber || '',
        additionalPhoneNumber1: profileData?.additionalPhoneNumber1 || '',
        additionalPhoneNumber2: profileData?.additionalPhoneNumber2 || '',
        email: profileData?.email || '',
        
        profilePicture: profileData?.profilePicture || '',
        participantCode: profileData?.participantCode || '',
        gender: profileData?.gender || '',
        maritalStatus: profileData?.maritalStatus || '',
        childrenCount: profileData?.childrenCount || null,
        dependents: profileData?.dependents || '',
        nationalId: profileData?.nationalId || '',
        pwdStatus: profileData?.pwdStatus || '',
        
        // Emergency contact fields - extracted from the parsed object
        emergencyContactName: emergencyContact.name || '',
        emergencyContactRelation: emergencyContact.relation || '',
        emergencyContactPhone: emergencyContact.phone || '',
        emergencyContactEmail: emergencyContact.email || '',
        emergencyContactAddress: emergencyContact.address || '',
        
        highestEducationLevel: profileData?.highestEducationLevel || '',
        activeStudentStatus: profileData?.activeStudentStatus || false,
        
        yearsOfExperience: profileData?.yearsOfExperience || null,
        workHistory: profileData?.workHistory || '',
        industryExpertise: profileData?.industryExpertise || '',
        coreSkills: profileData?.coreSkills || '',
        skillLevel: profileData?.skillLevel || '',
        languagesSpoken: Array.isArray(profileData?.languagesSpoken) 
          ? profileData.languagesSpoken.join(', ') 
          : profileData?.languagesSpoken || '',
        communicationStyle: profileData?.communicationStyle || '',
        
        digitalSkills: profileData?.digitalSkills || '',
        digitalSkills2: profileData?.digitalSkills2 || '',
        
        financialAspirations: profileData?.financialAspirations || '',
        
        employmentStatus: profileData?.employmentStatus || '',
        employmentType: profileData?.employmentType || '',
        specificJob: profileData?.specificJob || '',
        businessInterest: profileData?.businessInterest || '',
        trainingStatus: profileData?.trainingStatus || '',
        programStatus: profileData?.programStatus || '',
        transitionStatus: profileData?.transitionStatus || '',
        onboardedToTracker: profileData?.onboardedToTracker || false,
        
        localMentorName: profileData?.localMentorName || '',
        localMentorContact: profileData?.localMentorContact || '',
        guarantor: profileData?.guarantor || '',
        guarantorPhone: profileData?.guarantorPhone || '',
        
        madamName: profileData?.madamName || '',
        madamPhone: profileData?.madamPhone || '',
        
        implementingPartnerName: profileData?.implementingPartnerName || 'University of Ghana Business School (UGBS)',
        refugeeStatus: profileData?.refugeeStatus || false,
        idpStatus: profileData?.idpStatus || false,
        communityHostsRefugees: profileData?.communityHostsRefugees || false,
        partnerStartDate: parseDate(profileData?.partnerStartDate),
        programName: profileData?.programName || 'Digital Access for Rural Empowerment (DARE)',
        programDetails: profileData?.programDetails || 'Support for youth-led businesses in Ghana',
        programContactPerson: profileData?.programContactPerson || 'Prof. Richard Boateng',
        programContactPhoneNumber: profileData?.programContactPhoneNumber || '+233248852426',
        
        dareModel: profileData?.dareModel || null,
        socialMediaLinks: profileData?.socialMediaLinks || '',
        hostCommunityStatus: profileData?.hostCommunityStatus || '',
        
        newDataSubmission: true,
        isDeleted: profileData?.isDeleted || false,
      };
    })(),
  });
  
  // Update derived fields when date of birth changes
  useEffect(() => {
    const dateOfBirth = form.watch('dateOfBirth');
    
    if (dateOfBirth) {
      const { age, yearOfBirth } = calculateAgeAndYear(dateOfBirth);
      const ageGroup = determineAgeGroup(age);
      
      form.setValue('age', age);
      form.setValue('yearOfBirth', yearOfBirth);
      form.setValue('ageGroup', ageGroup);
    }
  }, [form.watch('dateOfBirth')]);

  // Add this function to preprocess the profile image before upload
const preprocessProfileImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create a canvas with passport photo dimensions (35mm x 45mm ratio)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set passport photo dimensions (35mm x 45mm proportions, but sized appropriately for web)
        canvas.width = 300;  // Width for good quality
        canvas.height = 400; // Maintain passport photo ratio (slightly wider than 3:4)
        
        // Calculate scaling and positioning for best face placement
        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
        
        // If image is wider than needed for passport ratio
        if (img.width / img.height > canvas.width / canvas.height) {
          sWidth = img.height * (canvas.width / canvas.height);
          sx = (img.width - sWidth) / 2; // Center horizontally
        } 
        // If image is taller than needed for passport ratio
        else {
          sHeight = img.width * (canvas.height / canvas.width);
          sy = (img.height - sHeight) / 5; // Position toward top for better face framing
        }
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the image centered
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        
        // Convert to file with JPEG format
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name || 'profile.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.92); // 92% quality for good balance
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};

  // Functions for handling profile picture
 const handleProfilePictureUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setIsUploading(true);
  
  try {
    // Preprocess the image first
    const processedFile = await preprocessProfileImage(file);
    
    // Create FormData with processed image
    const formData = new FormData();
    formData.append('file', processedFile);
    
    // Send the file to the server
    const response = await fetch('/api/upload/profile-picture', {
      method: 'POST',
      body: formData,
    });
    
    // Check if the Content-Type is application/json
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      // If not JSON, get the response as text
      const textResponse = await response.text();
      console.error('Server returned non-JSON response:', textResponse);
      throw new Error('Server did not return a JSON response');
    }
    
    // Parse the JSON response
    const data = await response.json();
    
    if (data.success && data.url) {
      // Update form state with the new image URL
      form.setValue('profilePicture', data.url);
      
      toast({
        title: "Success",
        description: "Profile picture uploaded successfully",
      });
    } else {
      throw new Error(data.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Upload error:', error instanceof Error ? error.message : String(error));
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to upload profile picture",
      variant: "destructive",
    });
  } finally {
    setIsUploading(false);
  }
};
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeProfilePicture = () => {
    form.setValue('profilePicture', '');
  };

  // Add this code to your page component (outside the form component) to debug API calls
// This will intercept and log all fetch requests
const originalFetch = window.fetch;
window.fetch = async function(input, init) {
  // Only log API calls to youth profiles
  if (input.toString().includes('/api/youth/profiles')) {
    console.log('API CALL TO:', input);
    console.log('REQUEST METHOD:', init?.method);
    console.log('REQUEST HEADERS:', init?.headers);
    
    // Log the request body with careful formatting
    if (init?.body) {
      try {
        const bodyObj = JSON.parse(init.body.toString());
        console.log('REQUEST BODY (formatted):', JSON.stringify(bodyObj, null, 2));
        
        // Special validation of JSON fields
        if (bodyObj.emergencyContact) {
          console.log('EMERGENCY CONTACT VALIDATION:');
          console.log('  - Type:', typeof bodyObj.emergencyContact);
          console.log('  - Value:', bodyObj.emergencyContact);
          
          // Test if it can be parsed as JSON
          try {
            if (typeof bodyObj.emergencyContact === 'string') {
              JSON.parse(bodyObj.emergencyContact);
              console.log('  - Valid JSON string? YES');
            } else {
              console.log('  - Not a string, won\'t parse as JSON');
            }
          } catch (e) {
            console.log('  - Valid JSON string? NO', e.message);
          }
        }
        
        if (bodyObj.languagesSpoken) {
          console.log('LANGUAGES SPOKEN VALIDATION:');
          console.log('  - Type:', typeof bodyObj.languagesSpoken);
          console.log('  - Value:', bodyObj.languagesSpoken);
          
          // Test if it can be parsed as JSON
          try {
            if (typeof bodyObj.languagesSpoken === 'string') {
              JSON.parse(bodyObj.languagesSpoken);
              console.log('  - Valid JSON string? YES');
            } else {
              console.log('  - Not a string, won\'t parse as JSON');
            }
          } catch (e) {
            console.log('  - Valid JSON string? NO', e.message);
          }
        }
      } catch (e) {
        console.log('REQUEST BODY (raw):', init.body);
      }
    }
  }
  
  // Call the original fetch
  const response = await originalFetch(input, init);
  
  // Only log API responses for youth profiles
  if (input.toString().includes('/api/youth/profiles')) {
    console.log('RESPONSE STATUS:', response.status);
    
    // Clone the response to not consume it
    const clonedResponse = response.clone();
    try {
      const responseBody = await clonedResponse.json();
      console.log('RESPONSE BODY:', responseBody);
    } catch (e) {
      console.log('RESPONSE is not JSON');
      const text = await clonedResponse.text();
      console.log('RESPONSE TEXT:', text);
    }
  }
  
  return response;
};


// Updated frontend mutation function to handle "None" values correctly

// Complete frontend mutation function with comprehensive JSON handling

const mutation = useMutation({
  mutationFn: async (data: ProfileFormData) => {
    try {
      // Validate required fields
      if (!data.firstName || !data.firstName.trim()) {
        throw new Error("First name is required");
      }
      if (!data.lastName || !data.lastName.trim()) {
        throw new Error("Last name is required");
      }
      if (!data.district) {
        throw new Error("District is required");
      }
      if (!data.dateOfBirth) {
        throw new Error("Date of birth is required");
      }
      
      // Create a clean copy of the form data to work with
      const cleanData = { ...data };
      
      // Replace all "None" values with null throughout the data
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === 'None') {
          console.log(`Converting "None" value in field ${key} to null`);
          cleanData[key] = null;
        }
      });
      
      // Create the fullName field
      const fullName = `${cleanData.firstName.trim()} ${cleanData.middleName ? cleanData.middleName.trim() + ' ' : ''}${cleanData.lastName.trim()}`;
      
      // Create a clean payload with properly structured JSON objects
      const payload = {
        // Core required fields
        firstName: cleanData.firstName.trim(),
        lastName: cleanData.lastName.trim(),
        middleName: cleanData.middleName || '',
        fullName: fullName,
        district: cleanData.district,
        dateOfBirth: cleanData.dateOfBirth,
        
        // Include userId if available
        ...(userId ? { userId } : {}),
        
        // Set up default values for calculated fields
        yearOfBirth: cleanData.yearOfBirth || null,
        age: cleanData.age || null,
        ageGroup: cleanData.ageGroup || '',
      };
      
      // IMPORTANT: Create properly structured JSON fields
      
      // For emergency contact, create a proper structure
      payload.emergencyContact = {
        name: cleanData.emergencyContactName || '',
        relation: cleanData.emergencyContactRelation || '',
        phone: cleanData.emergencyContactPhone || '',
        email: cleanData.emergencyContactEmail || '',
        address: cleanData.emergencyContactAddress || ''
      };
      
      // For languages, create a proper array
      if (cleanData.languagesSpoken && cleanData.languagesSpoken.trim() !== '' && cleanData.languagesSpoken !== 'None') {
        // Split the comma-separated list into an array
        payload.languagesSpoken = cleanData.languagesSpoken
          .split(',')
          .map(lang => lang.trim())
          .filter(Boolean);
      } else {
        // Empty array if no languages provided
        payload.languagesSpoken = [];
      }
      
      // Special handling for workHistory which has caused problems
      if (cleanData.workHistory && cleanData.workHistory !== 'None') {
        payload.workHistory = cleanData.workHistory;
      } else {
        payload.workHistory = '';
      }
      
      // Handle social media links properly
      if (cleanData.socialMediaLinks && cleanData.socialMediaLinks !== 'None') {
        payload.socialMediaLinks = cleanData.socialMediaLinks;
      } else {
        payload.socialMediaLinks = '';
      }
      
      // Add optional fields that have values and are not "None"
      const optionalFields = [
        'preferredName', 'town', 'homeAddress', 'country',
        'adminLevel1', 'adminLevel2', 'adminLevel3', 'adminLevel4', 'adminLevel5','phoneNumber',
        'additionalPhoneNumber1', 'additionalPhoneNumber2', 'email',
        'profilePicture', 'participantCode', 'maritalStatus', 'childrenCount', 
        'dependents', 'nationalId', 'pwdStatus',
        'highestEducationLevel', 'activeStudentStatus', 'yearsOfExperience',
        'industryExpertise', 'coreSkills', 'skillLevel', 'communicationStyle',
        'digitalSkills', 'digitalSkills2', 'financialAspirations',
        'employmentStatus', 'employmentType', 'specificJob', 'businessInterest',
        'trainingStatus', 'programStatus', 'transitionStatus', 'onboardedToTracker',
        'localMentorName', 'localMentorContact', 'guarantor', 'guarantorPhone',
        'madamName', 'madamPhone',
        'implementingPartnerName', 'refugeeStatus', 'idpStatus', 'communityHostsRefugees',
        'partnerStartDate', 'programName', 'programDetails', 'programContactPerson',
        'programContactPhoneNumber', 'dareModel', 'hostCommunityStatus',
        'newDataSubmission', 'isDeleted', 'cohort'
      ];
      
      // Only include fields that have values and are not "None"
      optionalFields.forEach(field => {
        if (cleanData[field] !== undefined && cleanData[field] !== null && cleanData[field] !== '' && cleanData[field] !== 'None') {
          payload[field] = cleanData[field];
        }
      });
      
      // Log the payload for debugging
      console.log("Submitting profile data:", {
        fullName: payload.fullName,
        emergencyContact: payload.emergencyContact,
        languagesSpoken: payload.languagesSpoken
      });
      
      // Determine endpoint
      const url = isEdit && profileData?.id 
        ? `/api/youth/profiles/${profileData.id}` 
        : '/api/youth/profiles';
      
      const method = isEdit ? 'PATCH' : 'POST';
      
      // Send the request
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      // Handle response errors
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        let errorDetail = '';
        let errorType = '';
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
            errorDetail = errorData.detail || '';
            errorType = errorData.errorType || '';
            
            console.error("Server error details:", errorData);
            
            // If we get a "None" token error, provide more specific help
            if (errorType === 'none_token_error' || errorMessage.includes('None')) {
              throw new Error("Error: The form contains 'None' values that cannot be processed. Please try again or contact support.");
            }
          } else {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
              console.error("Server error text:", errorText);
            }
          }
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in mutation function:", error);
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/youth/profiles'] });
    toast({
      title: "Success",
      description: isEdit ? "Profile updated successfully" : "Profile created successfully",
    });
    navigate('/youth/profiles');
  },
  onError: (error: Error) => {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  }
});

  // Submit handler
  function onSubmit(data: ProfileFormData) {
    mutation.mutate(data);
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Youth Profile" : "Create Youth Profile"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-6 mb-6">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="program">Program</TabsTrigger>
                <TabsTrigger value="extras">Other</TabsTrigger>
              </TabsList>

             {/* Personal Tab */}
             <TabsContent value="personal">
                <div className="flex flex-col items-center mb-6">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureUpload}
                  />
                  
                  <div className="relative">
                    <Avatar className="h-24 w-24 mb-2 cursor-pointer" onClick={triggerFileInput}>
                      <AvatarImage src={form.watch('profilePicture') || ''} />
                      <AvatarFallback className="bg-primary/10">
                        <UserCircle className="h-12 w-12 text-primary/80" />
                      </AvatarFallback>
                    </Avatar>
                    
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                    
                    {form.watch('profilePicture') && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={removeProfilePicture}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={triggerFileInput}
                      className="text-xs"
                    >
                      <Camera className="h-3 w-3 mr-1" />
                      {form.watch('profilePicture') ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    
                    {!form.watch('profilePicture') && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                          >
                            <PlusCircle className="h-3 w-3 mr-1" />
                            Choose Default
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Choose Default Avatar</DialogTitle>
                            <DialogDescription>
                              Select a default avatar for this youth profile.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-3 gap-4 py-4">
                            {/* Default avatar options */}
                            {[
                              '/img/districts-hero.jpg',
                              '/img/avatars/default-1.png',
                              '/img/avatars/default-2.png',
                            ].map((src, index) => (
                              <Avatar 
                                key={index} 
                                className="h-16 w-16 cursor-pointer hover:ring-2 hover:ring-primary"
                                onClick={() => {
                                  form.setValue('profilePicture', src);
                                }}
                              >
                                <AvatarImage src={src} alt={`Default avatar ${index + 1}`} />
                                <AvatarFallback>
                                  <UserCircle className="h-8 w-8" />
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="middleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Middle Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Middle name" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="preferredName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Preferred name" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="participantCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Participant Code (ID)</FormLabel>
                          <FormControl>
                            <Input placeholder="D00XXXXXXX" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <div className="min-w-[380px] p-3">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1920-01-01")
                                  }
                                  initialFocus
                                  captionLayout="dropdown-buttons"
                                  fromYear={1920}
                                  toYear={new Date().getFullYear()}
                                  styles={{
                                    caption_dropdowns: { display: "flex", justifyContent: "space-between", padding: "8px" },
                                    dropdown_month: { minWidth: "140px", marginRight: "8px" },
                                    dropdown_year: { minWidth: "80px" },
                                    caption: { display: "flex", justifyContent: "space-between", alignItems: "center" },
                                    root: { width: "100%" }
                                  }}
                                  classNames={{
                                    dropdown_icon: "ml-2",
                                    dropdown_month: "p-2 font-medium",
                                    dropdown_year: "p-2 font-medium"
                                  }}
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input readOnly value={field.value || ''} className="bg-gray-50" />
                          </FormControl>
                          <FormDescription>Calculated from date of birth</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
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
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maritalStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marital Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
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
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                              min="0"
                              {...field} 
                              value={field.value === null ? '' : field.value}
                              onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
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
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select age group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Under 18">Under 18</SelectItem>
                              <SelectItem value="18-24">18-24</SelectItem>
                              <SelectItem value="25-34">25-34</SelectItem>
                              <SelectItem value="35-44">35-44</SelectItem>
                              <SelectItem value="45+">45+</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Usually calculated from date of birth, but can be manually set
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
                   
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dependents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dependents</FormLabel>
                          <FormControl>
                            <Input placeholder="List of dependents" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>Dependents other than children</FormDescription>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="pwdStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disability Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select disability status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button type="button" onClick={() => setActiveTab("contact")}>Next: Contact Info</Button>
                </div>
              </TabsContent>
               {/* Contact Tab */}
               <TabsContent value="contact">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rural District *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
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
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="town"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Town</FormLabel>
                          <FormControl>
                            <Input placeholder="Town name" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="homeAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed home address" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Administrative Levels */}
                  <div className="space-y-4 pt-2 border-t mt-2">
                    <h3 className="font-medium">Administrative Levels</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="adminLevel1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Level 1</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="adminLevel2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Level 2</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="adminLevel3"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Level 3</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="adminLevel4"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Level 4</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="adminLevel5"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Level 5</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || 'Ghana'} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-2 border-t mt-2">
                    <h3 className="font-medium">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+233 XX XXX XXXX" {...field} value={field.value || ''} />
                            </FormControl>
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
                              <Input placeholder="email@example.com" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="additionalPhoneNumber1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Phone 1</FormLabel>
                            <FormControl>
                              <Input placeholder="+233 XX XXX XXXX" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                     <FormField
                        control={form.control}
                        name="additionalPhoneNumber2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Phone 2</FormLabel>
                            <FormControl>
                              <Input placeholder="+233 XX XXX XXXX" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t mt-4">
                    <h3 className="font-medium">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="emergencyContactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Name</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="emergencyContactRelation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="emergencyContactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+233 XX XXX XXXX" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="emergencyContactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Email</FormLabel>
                            <FormControl>
                              <Input placeholder="email@example.com" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="emergencyContactAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Emergency contact address" 
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
                
                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("personal")}>Previous</Button>
                  <Button type="button" onClick={() => setActiveTab("education")}>Next: Education</Button>
                </div>
              </TabsContent>
              {/* Education Tab */}
              <TabsContent value="education">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="highestEducationLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Highest Education Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select education level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="No Formal Education">No Formal Education</SelectItem>
                              <SelectItem value="Primary School">Primary School</SelectItem>
                              <SelectItem value="Junior High School (JHS)">Junior High School (JHS)</SelectItem>
                              <SelectItem value="Senior High School (SHS)">Senior High School (SHS)</SelectItem>
                              <SelectItem value="Technical/Vocational">Technical/Vocational</SelectItem>
                              <SelectItem value="Diploma">Diploma</SelectItem>
                              <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                              <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                              <SelectItem value="Doctorate">Doctorate</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="activeStudentStatus"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-8">
                          <FormControl>
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Currently a Student</FormLabel>
                            <FormDescription>
                              Check if participant is currently studying
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("contact")}>Previous</Button>
                  <Button type="button" onClick={() => setActiveTab("skills")}>Next: Skills</Button>
                </div>
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="coreSkills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Core Skills</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Main business/technical skills" 
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
                      name="skillLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skill Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select skill level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Basic">Basic</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="madamName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Skills Trainer's Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Name of madam/master" {...field} value={field.value || ''} />
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
                            <FormLabel>Skills Trainer's Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+233 XX XXX XXXX" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="yearsOfExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Number of years" 
                              min="0"
                              {...field} 
                              value={field.value === null ? '' : field.value}
                              onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
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
                            <Input placeholder="e.g., Fashion, Construction, Food" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="workHistory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work History</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description of previous work experience" 
                              {...field} 
                              value={field.value || ''} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="languagesSpoken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Languages Spoken</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., English, Twi, Hausa (comma-separated)" {...field} value={field.value || ''} />
                          </FormControl>
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
                            <Input placeholder="e.g., Verbal, Written, Both" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="digitalSkills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Digital Skills (Primary)</FormLabel>
                          <FormControl>
                            <Input placeholder="Primary digital competencies" {...field} value={field.value || ''} />
                          </FormControl>
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
                            <Input placeholder="Additional digital competencies" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="financialAspirations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Financial Aspirations</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Income and saving goals" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("education")}>Previous</Button>
                  <Button type="button" onClick={() => setActiveTab("program")}>Next: Program</Button>
                </div>
              </TabsContent>
              
              {/* Program Tab */}
              <TabsContent value="program">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="employmentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employment Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select employment status" />
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
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="employmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employment Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select employment type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Unemployed">Unemployed</SelectItem>
                              <SelectItem value="Self Employment">Self Employment</SelectItem>
                              <SelectItem value="Wage Employment">Wage Employment</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="specificJob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specific Job</FormLabel>
                          <FormControl>
                            <Input placeholder="Current job title or description" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="businessInterest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Interest</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Type of business participant wants to start/grow" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="trainingStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Training Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select training status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Dropped">Dropped</SelectItem>
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
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select program status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Mobilization">Mobilization</SelectItem>
                              <SelectItem value="Recruitment">Recruitment</SelectItem>
                              <SelectItem value="Outreach">Outreach</SelectItem>
                              <SelectItem value="Transition">Transition</SelectItem>
                              <SelectItem value="In Job">Youth-In-Work</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="transitionStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transition Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select transition status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Participant Profiling">Participant Profiling</SelectItem>
                              <SelectItem value="Business Profiling">Business Profiling</SelectItem>
                              <SelectItem value="Business Needs Assessment">Business Needs Assessment</SelectItem>
                              <SelectItem value="Resource Mobilization">Resource Mobilization</SelectItem>
                              <SelectItem value="Youth-In-Work (Business Startup and Mentoring)">Youth-In-Work (Business Startup and Mentoring)</SelectItem>
                              <SelectItem value="Business Launch">Business Launch</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="onboardedToTracker"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-8">
                          <FormControl>
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Onboarded to Tracker</FormLabel>
                            <FormDescription>
                              Added to Youth in Work tracker
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                 
                  <div className="space-y-4 pt-4 border-t mt-4">
                    <h3 className="font-medium">Guide & Guarantor Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="localMentorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Local Hub Guide Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Name of local hub guide" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="localMentorContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Local Hub Guide Contact</FormLabel>
                            <FormControl>
                              <Input placeholder="Contact info of local hub guide" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="guarantor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guarantor Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Name of guarantor" {...field} value={field.value || ''} />
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
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("skills")}>Previous</Button>
                  <Button type="button" onClick={() => setActiveTab("extras")}>Next: Other Info</Button>
                </div>
              </TabsContent>

              {/* Other/Extra Info Tab */}
              <TabsContent value="extras">
                <div className="space-y-4">
                  {/* DARE Model */}
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dareModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DARE Model</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select DARE model" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Collaborative">Collaborative</SelectItem>
                                <SelectItem value="MakerSpace">MakerSpace</SelectItem>
                                <SelectItem value="Madam Anchor">Madam Anchor</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the DARE model for this participant
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                 
                  <div className="space-y-4 pt-4 border-t mt-4">
                    <h3 className="font-medium">Partner Program Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="implementingPartnerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Implementing Partner Name</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="programName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Program Name</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="refugeeStatus"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value === true}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Refugee Status</FormLabel>
                              <FormDescription>
                                Participant has refugee status
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="idpStatus"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value === true}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>IDP Status</FormLabel>
                              <FormDescription>
                                Internally Displaced Person status
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="communityHostsRefugees"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value === true}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Community Hosts Refugees</FormLabel>
                              <FormDescription>
                                Participant's community hosts refugees
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="programDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Program Details</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="programContactPerson"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Program Contact Person</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="programContactPhoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Program Contact Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+233 XX XXX XXXX" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <FormField
                      control={form.control}
                      name="partnerStartDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Partner Program Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Select start date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <div className="min-w-[380px] p-3">
                                <Calendar
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={field.onChange}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                  captionLayout="dropdown-buttons"
                                  fromYear={1920}
                                  toYear={new Date().getFullYear()}
                                  styles={{
                                    caption_dropdowns: { display: "flex", justifyContent: "space-between", padding: "8px" },
                                    dropdown_month: { minWidth: "140px", marginRight: "8px" },
                                    dropdown_year: { minWidth: "80px" },
                                    caption: { display: "flex", justifyContent: "space-between", alignItems: "center" },
                                    root: { width: "100%" }
                                  }}
                                  classNames={{
                                    dropdown_icon: "ml-2",
                                    dropdown_month: "p-2 font-medium",
                                    dropdown_year: "p-2 font-medium"
                                  }}
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormDescription className="text-xs text-[#64748B]">
                            Date when participant started with the partner program
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      
                      <FormField
                        control={form.control}
                        name="cohort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cohort</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>    
                    
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t mt-4">
                    <h3 className="font-medium">Additional Information</h3>
         
                    <FormField
                      control={form.control}
                      name="socialMediaLinks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Social Media Links</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Social media profiles (Facebook, Instagram, etc.)" 
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
                
                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("program")}>Previous</Button>
                  <Button 
                    type="submit" 
                    disabled={mutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isEdit ? "Updating..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {isEdit ? "Update Profile" : "Save Profile"}
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Required Fields Warning */}
            {(!form.getValues('firstName') || !form.getValues('lastName') || !form.getValues('dateOfBirth') || !form.getValues('district')) && (
              <div className="mt-6 bg-amber-50 border border-amber-100 rounded-md p-4 flex items-start">
                <AlertCircle className="mr-3 h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Required Fields Missing</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Please fill in all required fields marked with * before submitting:
                    <ul className="list-disc pl-6 pt-1">
                      {!form.getValues('firstName') && <li>First Name</li>}
                      {!form.getValues('lastName') && <li>Last Name</li>}
                      {!form.getValues('dateOfBirth') && <li>Date of Birth</li>}
                      {!form.getValues('district') && <li>District</li>}
                    </ul>
                  </p>
                </div>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

              