import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Mentor, insertMentorSchema, districtEnum } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  FileText
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
  email: z.string().email("Please enter a valid email address").optional().nullable(),
  phone: z.string().min(10, "Phone number should be at least 10 digits").optional().nullable(),
  specialization: z.string().min(3, "Specialization should be at least 3 characters").optional().nullable(),
  bio: z.string().optional().nullable(),
  userId: z.number({ required_error: "Please select a user account for this mentor" }), // User ID is required
});

type FormValues = z.infer<typeof formSchema>;

// Define the User interface matching the schema
interface User {
  id: number;
  username: string;
  fullName: string;
  email?: string | null;
  role?: string;
}

export default function MentorAddPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  
  // Set up the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      assignedDistrict: undefined,
      assignedDistricts: [],
      specialization: "",
      bio: "",
      profilePicture: null,
      isActive: true,
      userId: undefined // We'll require the user to select a user
    }
  });
  
  // Fetch users when component mounts
  useEffect(() => {
    async function fetchUsers() {
      setIsLoadingUsers(true);
      try {
        const res = await apiRequest("GET", "/api/users-for-mentors");
        if (res.ok) {
          const userData = await res.json();
          console.log("API Response:", userData);
          // Handle both formats (admin and non-admin)
          if (Array.isArray(userData)) {
            console.log("Setting users from array:", userData.length);
            setUsers(userData);
          } else if (userData.users && Array.isArray(userData.users)) {
            console.log("Setting users from userData.users:", userData.users.length);
            setUsers(userData.users);
          } else {
            console.error("Unexpected API response format:", userData);
            throw new Error("Unexpected API response format");
          }
        } else {
          console.error("Failed to fetch users");
          toast({
            title: "Error",
            description: "Failed to load users. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "An error occurred while loading users.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingUsers(false);
      }
    }
    
    fetchUsers();
  }, [toast]);
  
  // Use the district options directly for MultiSelect
  const districtOptions: Option[] = [
    { value: "Bekwai", label: "Bekwai" },
    { value: "Gushegu", label: "Gushegu" },
    { value: "Lower Manya Krobo", label: "Lower Manya Krobo" },
    { value: "Yilo Krobo", label: "Yilo Krobo" }
  ];

  // Handle profile image upload
  const handleImageUpload = (imageUrl: string) => {
    setProfileImageUrl(imageUrl);
    form.setValue("profilePicture", imageUrl);
  };

  // Handle form submission
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log("Submitting mentor data:", data);
      
      try {
        const res = await apiRequest("POST", "/api/mentors", data);
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error("Error creating mentor:", errorData);
          throw new Error(errorData.message || "Failed to create mentor");
        }
        
        return await res.json();
      } catch (error) {
        console.error("Mentor creation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Mentor profile created successfully",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['/api/mentors'],
      });
      
      // Navigate back to mentors list
      navigate("/mentors");
    },
    onError: (error: any) => {
      console.error("Mentor creation error in mutation:", error);
      
      let errorMessage = "Failed to create mentor";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract more information from the error
        errorMessage = JSON.stringify(error);
      }
      
      toast({
        title: "Failed to create mentor",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Form submitted with data:", data);
    
    // Make sure assignedDistricts is properly formatted as an array
    if (!data.assignedDistricts || !Array.isArray(data.assignedDistricts)) {
      data.assignedDistricts = [];
    }
    
    // Validate that a user is selected
    if (!data.userId) {
      toast({
        title: "Required field missing",
        description: "Please select a user account for this mentor",
        variant: "destructive"
      });
      return;
    }
    
    createMutation.mutate(data);
  };

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
            onClick={() => navigate("/mentors")}
            className="mr-4 rounded-full hover:bg-gray-100 transition-colors duration-300"
            style={{ color: THEME.primary }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: THEME.dark }}>Create New Mentor</h1>
            <p className="text-gray-500">Add a new mentor to the DARE program</p>
          </div>
        </motion.div>

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
                    <CardDescription>Upload a professional photo for the mentor</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <Avatar className="h-32 w-32 mb-6">
                      <AvatarImage src={profileImageUrl || undefined} />
                      <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700">
                        {form.getValues("name")?.charAt(0) || "M"}
                      </AvatarFallback>
                    </Avatar>
                    <FileUpload onImageUploaded={handleImageUpload} />
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
                    <CardDescription>Enter the mentor's personal and professional information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* User Account Selection */}
                    <div className="space-y-4">
                      <h3 className="text-md font-semibold" style={{ color: THEME.dark }}>User Account</h3>
                      
                      <FormField
                        control={form.control}
                        name="userId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select User Account</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={(value) => {
                                  const userId = parseInt(value);
                                  field.onChange(userId);
                                  
                                  // If a user is selected, auto-fill mentor details from user data
                                  if (userId) {
                                    const selectedUser = users.find(u => u.id === userId);
                                    if (selectedUser) {
                                      form.setValue("name", selectedUser.fullName);
                                      form.setValue("email", selectedUser.email || "");
                                    }
                                  }
                                }}
                                value={field.value?.toString()}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select a user account"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {isLoadingUsers ? (
                                    <div className="flex items-center justify-center p-2">
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      <span>Loading users...</span>
                                    </div>
                                  ) : users.length > 0 ? (
                                    users.map(user => (
                                      <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.fullName || user.username} {user.role ? `(${user.role})` : ''}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="p-2 text-sm text-gray-500">No users found</div>
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Select an existing user account for this mentor. The mentor will use this account to log in.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="text-sm">
                        <span className="text-gray-500">
                          Note: Only users with accounts can be mentors. If you need to create a new user, please do so 
                          in the user management section first.
                        </span>
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-md font-semibold" style={{ color: THEME.dark }}>Basic Information</h3>
                      
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
                      onClick={() => navigate("/mentors")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createMutation.isPending}
                      style={{ 
                        background: createMutation.isPending 
                          ? "#ccc" 
                          : `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                        border: "none" 
                      }}
                      className="shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Create Mentor
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}