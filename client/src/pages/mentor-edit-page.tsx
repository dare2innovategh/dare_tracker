import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Mentor, insertMentorSchema, districtEnum } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { FileUpload } from "@/components/profile/file-upload";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { 
  ArrowLeft, 
  UserCog, 
  Save, 
  Loader2, 
  MapPin, 
  Mail, 
  Phone, 
  GraduationCap,
  FileText,
  FileQuestion,
  AlertTriangle
} from "lucide-react";

// Mastercard color theme - matching other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

// Extend the insert schema with custom validations
const formSchema = insertMentorSchema.extend({
  id: z.number().optional(),
  userId: z.number(), // Ensure userId is included and required
  email: z.string().email("Please enter a valid email address").optional().nullable(),
  phone: z.string().min(10, "Phone number should be at least 10 digits").optional().nullable(),
  specialization: z.string().min(3, "Specialization should be at least 3 characters").optional().nullable(),
  bio: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function MentorEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // Fetch mentor details
  const {
    data: mentor,
    isLoading,
    error,
  } = useQuery<Mentor>({
    queryKey: [`/api/mentors/${id}`],
    enabled: !!id,
  });

  // Set up the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: 0,
      userId: 0, // Add default userId
      name: "",
      email: "",
      phone: "",
      assignedDistrict: undefined,
      assignedDistricts: [],
      specialization: "",
      bio: "",
      profilePicture: null,
      isActive: true
    }
  });
  
  // Use the district options directly for MultiSelect
  const districtOptions: Option[] = [
    { value: "Bekwai", label: "Bekwai" },
    { value: "Gushegu", label: "Gushegu" },
    { value: "Lower Manya Krobo", label: "Lower Manya Krobo" },
    { value: "Yilo Krobo", label: "Yilo Krobo" }
  ];

  // Update form when mentor data is fetched
  useEffect(() => {
    if (mentor) {
      // Handle assignedDistricts property if it exists
      let districts: string[] = [];
      if (mentor.assignedDistricts && Array.isArray(mentor.assignedDistricts)) {
        districts = mentor.assignedDistricts as string[];
      } else if (mentor.assignedDistrict) {
        // For backward compatibility
        districts = [mentor.assignedDistrict];
      }
      
      form.reset({
        id: mentor.id,
        userId: mentor.userId, // Make sure to include userId
        name: mentor.name,
        email: mentor.email,
        phone: mentor.phone,
        assignedDistrict: mentor.assignedDistrict,
        assignedDistricts: districts,
        specialization: mentor.specialization,
        bio: mentor.bio,
        profilePicture: mentor.profilePicture,
        isActive: mentor.isActive
      });
      setProfileImageUrl(mentor.profilePicture);
    }
  }, [mentor, form]);

  // Handle profile image upload
  const handleImageUpload = (imageUrl: string) => {
    setProfileImageUrl(imageUrl);
    form.setValue("profilePicture", imageUrl);
  };

  // Handle form submission
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Log the starting point for debugging
      console.log("Starting mentor update mutation with form data:", data);
      
      // Ensure consistent handling of districts
      // Set the primary assignedDistrict to the first district in the array
      const dataToSubmit = {
        ...data,
        // Ensure we always include assignedDistricts array
        assignedDistricts: Array.isArray(data.assignedDistricts) ? data.assignedDistricts : [],
      };
      
      // If assignedDistricts array has values, set primary district accordingly
      if (Array.isArray(dataToSubmit.assignedDistricts) && dataToSubmit.assignedDistricts.length > 0) {
        dataToSubmit.assignedDistrict = dataToSubmit.assignedDistricts[0];
      }
      
      // Set a default value for specialization if it's empty
      if (!dataToSubmit.specialization) {
        dataToSubmit.specialization = "General Business Support"; // Default specialization value
      }
      
      // Add timestamp as URL parameter instead of in body
      const timestamp = Date.now();
      
      console.log("Submitting mentor update:", dataToSubmit);
      
      // Clean and validate the mentor ID
      const cleanId = id.toString().trim().replace(/\D/g, '');
      const numericId = parseInt(cleanId);
      
      if (isNaN(numericId)) {
        console.error("Invalid mentor ID format:", id);
        throw new Error("Invalid mentor ID");
      }
      
      try {
        // Make sure we're using the correct URL, add timestamp to prevent caching issues
        const url = `/api/mentors/${numericId}?t=${timestamp}`;
        console.log(`Sending PATCH request to ${url}`);
        
        // Use the updated apiRequest that includes auth handling and error handling
        const res = await apiRequest("PATCH", url, dataToSubmit, true);
        
        // Log response status for debugging
        console.log(`Response status: ${res.status} ${res.statusText}`);
        
        if (!res.ok) {
          // Try to extract error message
          let errorMessage = "Failed to update mentor";
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
            console.error("Error updating mentor:", errorData);
          } catch (parseError) {
            console.error("Error parsing error response:", parseError);
          }
          throw new Error(errorMessage);
        }
        
        const result = await res.json();
        console.log("Update successful, received data:", result);
        return result;
      } catch (error) {
        console.error("Exception in update request:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Update successful:", data);
      toast({
        title: "Success",
        description: "Mentor profile updated successfully",
      });
      
      // Clean the mentor ID for consistent handling
      const cleanId = id.toString().trim().replace(/\D/g, '');
      const numericId = parseInt(cleanId);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['/api/mentors'],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/mentors/${numericId}`],
      });
      
      // Also invalidate mentor businesses as districts may have changed
      queryClient.invalidateQueries({
        queryKey: ['/api/mentor-businesses'],
      });
      
      // Navigate back to mentor details
      navigate(`/mentors/${numericId}`);
    },
    onError: (error: Error) => {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update mentor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Form submission with data:", data);
    
    // Form validation
    if (!data.name || data.name.trim() === '') {
      toast({
        title: "Validation Error",
        description: "Mentor name is required",
        variant: "destructive"
      });
      return;
    }
    
    // If assignedDistricts is empty but assignedDistrict has a value
    if ((!Array.isArray(data.assignedDistricts) || data.assignedDistricts.length === 0) && data.assignedDistrict) {
      // Convert single district to array for consistency
      data.assignedDistricts = [data.assignedDistrict as string];
    }

    // Set a default specialization if it's empty
    if (!data.specialization || data.specialization.trim() === '') {
      toast({
        title: "Validation Warning",
        description: "Mentor specialization is recommended - using default value",
      });
      // Use a default value
      data.specialization = "General Business Support";
    }
    
    // Create a clean copy without undefined values 
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    
    console.log("Clean submission data:", cleanData);
    updateMutation.mutate(cleanData as FormValues);
  };

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10 px-4">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-10 text-center shadow-sm"
          >
            <div className="inline-block p-4 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-red-700 mb-3">Error Loading Mentor</h3>
            <p className="text-red-600 mb-6">
              We couldn't load the mentor profile. Please try again or contact support if the problem persists.
            </p>
            <Button 
              className="shadow-sm hover:shadow-md transition-all duration-300 mr-2"
              variant="outline"
              onClick={() => navigate("/mentors")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Mentors
            </Button>
            <Button 
              className="shadow-sm hover:shadow-md transition-all duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                border: "none" 
              }}
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Not found state
  if (!isLoading && !mentor) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10 px-4">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-xl p-10 text-center shadow-sm"
          >
            <div className="inline-block p-4 rounded-full bg-blue-100 mb-4">
              <FileQuestion className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-blue-700 mb-3">Mentor Not Found</h3>
            <p className="text-blue-600 mb-6">
              The requested mentor could not be found. They may have been deleted or you may not have permission to view this profile.
            </p>
            <Button 
              className="shadow-sm hover:shadow-md transition-all duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                border: "none" 
              }}
              onClick={() => navigate("/mentors")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Mentors
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10 px-4">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex items-center mb-8"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/mentors/${id}`)}
            className="mr-4 rounded-full hover:bg-gray-100 transition-colors duration-300"
            style={{ color: THEME.primary }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: THEME.dark }}>Edit Mentor Profile</h1>
            <p className="text-gray-500">Update mentor information and settings</p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full" style={{ backgroundColor: `${THEME.secondary}20` }}></div>
                <div className="w-16 h-16 rounded-full absolute top-0 left-0" style={{ 
                  borderTopColor: THEME.secondary, 
                  borderRightColor: 'transparent', 
                  borderBottomColor: 'transparent', 
                  borderLeftColor: THEME.primary, 
                  borderWidth: '3px', 
                  animation: 'spin 1s linear infinite' 
                }}></div>
              </div>
              <p className="mt-4 text-gray-500">Loading mentor profile...</p>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Profile Image Upload Section */}
                  <Card className="border-gray-100 shadow-sm overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-center">
                        <div className="mr-2 h-8 w-8 rounded-full flex items-center justify-center" style={{ 
                          background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}20 100%)` 
                        }}>
                          <UserCog className="h-4 w-4" style={{ color: THEME.primary }} />
                        </div>
                        <CardTitle className="text-lg" style={{ color: THEME.dark }}>Profile Image</CardTitle>
                      </div>
                      <CardDescription>Update the mentor's profile photo</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                      <Avatar className="h-32 w-32 mb-6">
                        <AvatarImage src={profileImageUrl || undefined} alt={form.getValues("name")} />
                        <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700">
                          {form.getValues("name")?.charAt(0) || "M"}
                        </AvatarFallback>
                      </Avatar>
                      <FileUpload onImageUploaded={handleImageUpload} currentImage={profileImageUrl || undefined} />
                    </CardContent>
                  </Card>

                  {/* Main Form Content */}
                  <Card className="border-gray-100 shadow-sm overflow-hidden lg:col-span-2">
                    <CardHeader className="pb-4">
                      <div className="flex items-center">
                        <div className="mr-2 h-8 w-8 rounded-full flex items-center justify-center" style={{ 
                          background: `linear-gradient(135deg, ${THEME.primary}20 0%, ${THEME.accent}20 100%)` 
                        }}>
                          <FileText className="h-4 w-4" style={{ color: THEME.accent }} />
                        </div>
                        <CardTitle className="text-lg" style={{ color: THEME.dark }}>Mentor Details</CardTitle>
                      </div>
                      <CardDescription>Update the mentor's personal and professional information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-md font-semibold" style={{ color: THEME.dark }}>Basic Information</h3>
                        
                        {/* Read-only User ID field */}
                        <FormField
                          control={form.control}
                          name="userId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Associated User ID (Read-only)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  value={field.value || ""}
                                  disabled 
                                  className="bg-gray-50 cursor-not-allowed text-gray-500"
                                />
                              </FormControl>
                              <FormDescription>
                                The user account linked to this mentor profile cannot be changed.
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <UserCog className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                  <Input placeholder="Enter mentor's full name" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input placeholder="Enter email address" className="pl-10" {...field} value={field.value || ''} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input placeholder="Enter phone number" className="pl-10" {...field} value={field.value || ''} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="assignedDistricts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assigned Districts</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={districtOptions}
                                  selected={field.value as string[]}
                                  onChange={field.onChange}
                                  placeholder="Select districts"
                                  icon={<MapPin className="h-4 w-4" />}
                                />
                              </FormControl>
                              <FormDescription>
                                The districts where this mentor will be assigned to work
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Professional Information */}
                      <div className="space-y-4">
                        <h3 className="text-md font-semibold" style={{ color: THEME.dark }}>Professional Information</h3>
                        
                        <FormField
                          control={form.control}
                          name="specialization"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Specialization</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                  <Input 
                                    placeholder="Enter mentor's specialization" 
                                    className="pl-10" 
                                    {...field} 
                                    value={field.value || ''} 
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Professional field or area of expertise
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mentor Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter a brief professional biography" 
                                  className="min-h-32" 
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormDescription>
                                Brief description of professional background and expertise
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end border-t bg-gray-50 p-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="mr-2"
                        onClick={() => navigate(`/mentors/${id}`)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={updateMutation.isPending}
                        style={{ 
                          background: updateMutation.isPending 
                            ? "#ccc" 
                            : `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                          border: "none" 
                        }}
                        className="shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        {updateMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </form>
            </Form>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}