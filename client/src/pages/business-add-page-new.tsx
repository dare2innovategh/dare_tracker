import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  BusinessProfile, 
  YouthProfile, 
  insertBusinessProfileSchema,
  dareModelEnum,
  districtEnum,
  enterpriseTypeEnum,
  enterpriseSizeEnum,
  businessSectorEnum,
} from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  ArrowLeft, 
  Building, 
  CheckCircle2, 
  Loader2, 
  Plus, 
  Users, 
  FileText, 
  Store, 
  MapPin, 
  Phone, 
  Calendar, 
  Tag, 
  PlusCircle,
  Briefcase,
  User,
  BookText,
  FileCheck,
  Upload,
  Mail,
  Target,
  Goal,
  Image as ImageIcon,
  DollarSign,
  CreditCard,
  TrendingUp,
  Percent,
  Link as LinkIcon,
  Facebook,
  Instagram,
  Globe,
  Twitter
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

// Mastercard color theme
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

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

// Service category mapping to subcategories
const categoryToSubcategories: Record<number, { id: number, name: string }[]> = {
  1: [ // Building & Construction
    { id: 1, name: "Carpentry & Woodworking" },
    { id: 2, name: "General Contracting" },
    { id: 3, name: "Electrical Services" },
    { id: 4, name: "Plumbing & Pipefitting" },
    { id: 5, name: "Masonry & Tiling" },
    { id: 6, name: "Painting & Decorating" },
    { id: 7, name: "HVAC" },
    { id: 8, name: "Landscaping & Gardening" },
    { id: 9, name: "Construction Project Management" }
  ],
  2: [ // Food & Beverage
    { id: 10, name: "Food Processing & Manufacturing" },
    { id: 11, name: "Catering & Event Services" },
    { id: 12, name: "Private Chefs & Meal Preparation" },
    { id: 13, name: "Baking & Pastry" },
    { id: 14, name: "Bartending & Beverage Services" },
    { id: 15, name: "Food Styling & Photography" },
    { id: 16, name: "Food Retail and sales" }
  ],
  3: [ // Fashion & Apparel
    { id: 17, name: "Fashion Design & Pattern Making" },
    { id: 18, name: "Sewing & Tailoring" },
    { id: 19, name: "Textile & Cloth Manufacturing" },
    { id: 20, name: "Fashion Accessories & Jewelry" },
    { id: 21, name: "Fashion Styling & Consulting" },
    { id: 22, name: "Fashion Photography & Modeling" },
    { id: 23, name: "Fashion retail" }
  ],
  4: [ // Beauty & Wellness
    { id: 24, name: "Hair Styling & Care" },
    { id: 25, name: "Makeup Artistry" },
    { id: 26, name: "Nail Care & Manicures/Pedicures" },
    { id: 27, name: "Skincare & Esthetics" },
    { id: 28, name: "Massage Therapy & Bodywork" },
    { id: 29, name: "Personal Training & Fitness" },
    { id: 30, name: "Beauty retail" }
  ],
  5: [ // Media & Creative Arts
    { id: 31, name: "Photography & Videography" },
    { id: 32, name: "Graphic Design & Illustration" },
    { id: 33, name: "Content Writing & Editing" },
    { id: 34, name: "Social Media Management & Marketing" },
    { id: 35, name: "Influencer Marketing & Content Creation" },
    { id: 36, name: "Web Design & Development" },
    { id: 37, name: "Music Production and Audio" },
    { id: 38, name: "Acting and voice over work" }
  ]
};

// Extended schema for business creation
const businessFormSchema = insertBusinessProfileSchema
  .extend({
    youthIds: z.array(z.number())
      .min(1, { message: "At least one youth owner is required" })
      .max(3, { message: "Maximum of 3 youth owners allowed" }),
    mentorId: z.number().optional(),
  });

type BusinessFormData = z.infer<typeof businessFormSchema>;

export default function BusinessAddPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [selectedYouth, setSelectedYouth] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredYouth, setHoveredYouth] = useState<number | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);
  const [availableSubcategories, setAvailableSubcategories] = useState<{ id: number, name: string }[]>(categoryToSubcategories[1]);
  const [selectedMentor, setSelectedMentor] = useState<number | undefined>(undefined);
  const [businessLogo, setBusinessLogo] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("basic");

  // Parse the query parameters
  const params = new URLSearchParams(search);
  const youthIdFromQuery = params.get('youthId');

  // Fetch all youth profiles
  const {
    data: youthProfiles,
    isLoading: isLoadingYouth,
    error: youthError
  } = useQuery<YouthProfile[]>({
    queryKey: ['/api/youth-profiles'],
  });

  // Fetch youth-business relationships
  const {
    data: youthBusinessRelationships,
    isLoading: isLoadingRelationships,
    error: relationshipsError
  } = useQuery<Record<number, BusinessProfile[]>>({
    queryKey: ['/api/youth-business-relationships'],
  });

  // Fetch all mentors
  const {
    data: mentors,
    isLoading: isLoadingMentors,
    error: mentorsError
  } = useQuery<any[]>({
    queryKey: ['/api/mentors'],
  });

  // Initialize form
  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      businessName: "",
      businessDescription: "",
      businessContact: "",
      businessLocation: "",
      businessLogo: "",
      district: "Bekwai",
      dareModel: "Collaborative",
      serviceCategoryId: 1,
      serviceSubcategoryId: 1,
      businessModel: "Service",
      registrationStatus: "Unregistered", 
      registrationNumber: "",
      businessStartDate: new Date().toISOString().split('T')[0],
      youthIds: [],
      country: "Ghana",
      enterpriseSize: "Micro",
      enterpriseType: "Sole Proprietorship",
      implementingPartnerName: "University of Ghana Business School (UGBS)",
      sector: "Retail",
      paymentStructure: "Self-Pay",
      expectedWeeklyRevenue: 0,
      expectedMonthlyRevenue: 0,
      anticipatedMonthlyExpenditure: 0,
      expectedMonthlyProfit: 0,
      deliverySetup: false,
      deliveryType: "",
      socialMediaLinks: ""
    }
  });

  // Pre-select youth from query param if available
  useEffect(() => {
    if (youthIdFromQuery) {
      const youthId = parseInt(youthIdFromQuery, 10);
      if (!isNaN(youthId)) {
        setSelectedYouth([youthId]);
        form.setValue('youthIds', [youthId]);
      }
    }
  }, [youthIdFromQuery, form]);

  // Upload business logo
  const uploadLogo = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        body: formData,
      });
      
      // Check for non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Server returned non-JSON response:', await response.text());
        throw new Error('Server error: Invalid response format');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBusinessLogo(data.url);
        form.setValue('businessLogo', data.url);
        toast({
          title: "Logo uploaded",
          description: "Business logo has been uploaded successfully",
        });
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: "destructive",
      });
    }
  };  

  const populateDefaultValues = () => {
    // Only set these if they're not already set
    if (!form.getValues('implementingPartnerName')) {
      form.setValue('implementingPartnerName', 'University of Ghana Business School (UGBS)');
    }
    if (!form.getValues('programName')) {
      form.setValue('programName', 'Digital Access for Rural Empowerment (DARE)');
    }
    if (!form.getValues('programDetails')) {
      form.setValue('programDetails', 'Support for youth-led businesses in Ghana');
    }
    if (!form.getValues('programContactPerson')) {
      form.setValue('programContactPerson', 'Prof. Richard Boateng');
    }
    if (!form.getValues('programContactPhoneNumber')) {
      form.setValue('programContactPhoneNumber', '+233248852426');
    }
  };

  // Call this function when the component mounts
  useEffect(() => {
    populateDefaultValues();
  }, []);

  // Financial calculations 
  useEffect(() => {
    const weeklyRevenue = form.watch('expectedWeeklyRevenue') || 0;
    const monthlyExpenditure = form.watch('anticipatedMonthlyExpenditure') || 0;

    // Calculate monthly revenue (weekly * 4)
    const calculatedMonthlyRevenue = weeklyRevenue * 4;
    
    // Calculate expected profit
    const calculatedProfit = calculatedMonthlyRevenue - monthlyExpenditure;
    
    // Update the form values
    form.setValue('expectedMonthlyRevenue', calculatedMonthlyRevenue);
    form.setValue('expectedMonthlyProfit', calculatedProfit);
  }, [form.watch('expectedWeeklyRevenue'), form.watch('anticipatedMonthlyExpenditure')]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "mastercard") {
      populateDefaultValues();
    }
  };

  // Get district color
  const getDistrictColor = (district: string) => {
    if (district.includes("Bekwai")) return THEME.secondary;
    if (district.includes("Gushegu")) return THEME.primary;
    if (district.includes("Lower Manya")) return THEME.accent;
    if (district.includes("Yilo Krobo")) return THEME.dark;
    return "#6c757d";
  };

  // Get Digital Access for Rural Empowerment model color
  const getModelColor = (model: string) => {
    switch (model) {
      case "Collaborative":
        return THEME.primary;
      case "MakerSpace":
        return THEME.secondary;
      case "Madam Anchor":
        return THEME.accent;
      default:
        return THEME.primary;
    }
  };

  // Create Business mutation
  const createBusiness = useMutation({
    mutationFn: async (formData: BusinessFormData) => {
      // Extract youthIds and mentorId and prepare business data
      const { youthIds, mentorId, ...businessData } = formData;

      // First create the business
      const businessResponse = await apiRequest(
        "POST",
        "/api/business-profiles",
        businessData
      );

      if (!businessResponse.ok) {
        const error = await businessResponse.json();
        throw new Error(error.message || "Failed to create business");
      }

      const business = await businessResponse.json();

      // Only associate youth if there are any selected
      if (youthIds.length > 0) {
        // Associate the youth with the business
        const relationshipResponse = await apiRequest(
          "POST",
          "/api/business-profiles/youth-relationships",
          {
            businessId: business.id,
            youthIds: youthIds
          }
        );

        if (!relationshipResponse.ok) {
          const error = await relationshipResponse.json();
          throw new Error(error.message || "Failed to associate youth with business");
        }
      }

      return business;
    },
    onSuccess: (data) => {
      toast({
        title: "Business created",
        description: "Business has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/business-profiles'] });
      navigate(`/businesses/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create business",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  // Handle form submission
  const onSubmit = (data: BusinessFormData) => {
    // Validate youth owners are selected
    if (selectedYouth.length === 0) {
      toast({
        title: "Error",
        description: "At least one youth owner is required",
        variant: "destructive",
      });
      return;
    }
    
    // Check max youth owners
    if (selectedYouth.length > 3) {
      toast({
        title: "Error",
        description: "Maximum of 3 youth owners allowed",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Ensure the logo and enterprise fields are included
    const finalData = {
      ...data,
      youthIds: selectedYouth,
      mentorId: selectedMentor,
      businessLogo: businessLogo || data.businessLogo,
      enterpriseType: data.enterpriseType || "Sole Proprietorship",
      enterpriseSize: data.enterpriseSize || "Micro"
    };
    
    createBusiness.mutate(finalData);
  };

  // Toggle youth selection
  const toggleYouthSelection = (id: number) => {
    if (selectedYouth.includes(id)) {
      setSelectedYouth(selectedYouth.filter(yId => yId !== id));
    } else {
      // If we already have 3 youth selected, replace the last one
      if (selectedYouth.length >= 3) {
        const newSelection = [...selectedYouth.slice(0, 2), id];
        setSelectedYouth(newSelection);
      } else {
        setSelectedYouth([...selectedYouth, id]);
      }
    }

    // Also update the form value
    const updatedYouthIds = selectedYouth.includes(id)
      ? selectedYouth.filter(yId => yId !== id)
      : selectedYouth.length >= 3
        ? [...selectedYouth.slice(0, 2), id]
        : [...selectedYouth, id];

    form.setValue('youthIds', updatedYouthIds);
  };

  // Get district name without country
  const getDistrictShortName = (district: string) => {
    return district.split(',')[0];
  };

  // Loading state
  if (isLoadingYouth) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10 px-4">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full" style={{ backgroundColor: `${THEME.secondary}20` }}></div>
              <div className="w-24 h-24 rounded-full absolute top-0 left-0" style={{ 
                borderTopColor: THEME.secondary, 
                borderRightColor: 'transparent', 
                borderBottomColor: 'transparent', 
                borderLeftColor: THEME.primary, 
                borderWidth: '4px', 
                animation: 'spin 1s linear infinite' 
              }}></div>
            </div>
            <h3 className="text-xl font-medium mb-2" style={{ color: THEME.dark }}>
              Loading Youth Profiles
            </h3>
            <p className="text-gray-500">Please wait while we prepare the business creation form</p>
          </div>
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
            onClick={() => navigate('/businesses')}
            className="mr-4 rounded-full hover:bg-gray-100 transition-colors duration-300"
            style={{ color: THEME.primary }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: THEME.dark }}>Create New Business</h1>
            <p className="text-gray-500 mt-1">Fill in the details and select owners for the new enterprise</p>
          </div>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <motion.div 
            variants={cardVariant}
            className="lg:col-span-2"
          >
            <Card className="border-gray-100 shadow-md overflow-hidden">
              <div className="h-1 w-full" style={{ 
                background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})` 
              }}></div>
              <CardHeader className="pb-3">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center mr-3" style={{ 
                    background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}10 100%)` 
                  }}>
                    <Store className="h-5 w-5" style={{ color: THEME.primary }} />
                  </div>
                  <div>
                    <CardTitle className="text-lg" style={{ color: THEME.dark }}>
                      Business Information
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Fill in the details for the new business
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <Tabs defaultValue="basic" value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="mb-6 grid grid-cols-4">
                    <TabsTrigger value="basic" style={{ 
                      color: activeTab === "basic" ? "white" : THEME.dark,
                      background: activeTab === "basic" ? THEME.primary : "transparent"
                    }}>
                      Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="details" style={{ 
                      color: activeTab === "details" ? "white" : THEME.dark,
                      background: activeTab === "details" ? THEME.primary : "transparent"
                    }}>
                      Business Details
                    </TabsTrigger>
                    {/* <TabsTrigger value="financial" style={{ 
                      color: activeTab === "financial" ? "white" : THEME.dark,
                      background: activeTab === "financial" ? THEME.primary : "transparent"
                    }}>
                      Financial
                    </TabsTrigger> */}
                    <TabsTrigger value="mastercard" style={{ 
                      color: activeTab === "mastercard" ? "white" : THEME.dark,
                      background: activeTab === "mastercard" ? THEME.primary : "transparent"
                    }}>
                      MasterCard Fields
                    </TabsTrigger>
                  </TabsList>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Basic Info Tab */}
                      <TabsContent value="basic">
                        <div className="space-y-6">
                          <FormField
                            control={form.control}
                            name="businessName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                  <Store className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                  Enterprise Name <span className="text-red-500 ml-1">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter business name" 
                                    {...field} 
                                    className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
   
                            <FormField
                              control={form.control}
                              name="district"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <MapPin className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                                    District <span className="text-red-500 ml-1">*</span>
                                  </FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-gray-200 focus:ring-offset-1">
                                        <SelectValue placeholder="Select district" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {/* Option 1: Hardcode if you know the values */}
                                      {["Bekwai", "Gushegu", "Lower Manya Krobo", "Yilo Krobo"].map((district) => (
                                        <SelectItem key={district} value={district}>
                                          <div className="flex items-center">
                                            <div 
                                              className="w-2 h-2 rounded-full mr-2" 
                                              style={{ backgroundColor: getDistrictColor(district) }}
                                            ></div>
                                            {getDistrictShortName(district)}
                                          </div>
                                        </SelectItem>
                                      ))}
                                      
                                      {/* Option 2: If the enum values are available in a different format */}
                                      {/* {Object.values(districtEnum.Values).map((district) => (
                                        <SelectItem key={district} value={district}>
                                          <div className="flex items-center">
                                            <div 
                                              className="w-2 h-2 rounded-full mr-2" 
                                              style={{ backgroundColor: getDistrictColor(district) }}
                                            ></div>
                                            {getDistrictShortName(district)}
                                          </div>
                                        </SelectItem>
                                      ))} */}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="dareModel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Briefcase className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                    DARE Model <span className="text-red-500 ml-1">*</span>
                                  </FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value || ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-gray-200 focus:ring-offset-1">
                                        <SelectValue placeholder="Select model" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {dareModelEnum.options.map((model) => (
                                        <SelectItem key={model} value={model}>
                                          <div className="flex items-center">
                                            <div 
                                              className="w-2 h-2 rounded-full mr-2" 
                                              style={{ backgroundColor: getModelColor(model) }}
                                            ></div>
                                            {model}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Controller
                            control={form.control}
                            name="businessDescription"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                  <FileText className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                  Description <span className="text-red-500 ml-1">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe the business" 
                                    className="min-h-[120px] border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Business Logo Field */}
                          <FormField
                            control={form.control}
                            name="businessLogo"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                  <ImageIcon className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                  Business Logo
                                </FormLabel>
                                <div className="mt-2 flex items-center gap-4">
                                  {(businessLogo || field.value) ? (
                                    <div className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-200">
                                      <img
                                        src={businessLogo || field.value || ''}
                                        alt="Business Logo"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-24 h-24 rounded-md border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                                      <ImageIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                  )}
                                  <div>
                                    <input
                                      type="file"
                                      id="logo-upload"
                                      className="hidden"
                                      accept="image/*"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          uploadLogo(e.target.files[0]);
                                        }
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => document.getElementById('logo-upload')?.click()}
                                      className="flex items-center"
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      Upload Logo
                                    </Button>
                                    <FormDescription className="mt-1 text-xs text-gray-500">
                                      Upload a logo for the business (optional)
                                    </FormDescription>
                                  </div>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>

                      {/* Business Details Tab */}
                      <TabsContent value="details">
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                              control={form.control}
                              name="serviceCategoryId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Tag className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                    Service Category <span className="text-red-500 ml-1">*</span>
                                  </FormLabel>
                                  <Select 
                                    onValueChange={(value) => {
                                      const categoryId = parseInt(value);
                                      field.onChange(categoryId);
                                      setSelectedCategoryId(categoryId);
                                      setAvailableSubcategories(categoryToSubcategories[categoryId] || []);
                                      
                                      // Reset subcategory when category changes
                                      const firstSubcategoryId = categoryToSubcategories[categoryId]?.[0]?.id || 1;
                                      form.setValue('serviceSubcategoryId', firstSubcategoryId);
                                    }} 
                                    defaultValue={field.value?.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-gray-200 focus:ring-offset-1">
                                        <SelectValue placeholder="Select service category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {["Building & Construction", "Food & Beverage", "Fashion & Apparel", "Beauty & Wellness", "Media & Creative Arts"].map((category, index) => (
                                        <SelectItem key={category} value={(index + 1).toString()}>
                                          {category}
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
                              name="serviceSubcategoryId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Tag className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                    Service Subcategory
                                  </FormLabel>
                                  <Select 
                                    onValueChange={(value) => field.onChange(parseInt(value))} 
                                    defaultValue={field.value?.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-gray-200 focus:ring-offset-1">
                                        <SelectValue placeholder="Select subcategory" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {availableSubcategories.map((subcategory) => (
                                        <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                                          {subcategory.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                              control={form.control}
                              name="businessModel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Briefcase className="h-4 w-4 mr-2" style={{ color: THEME.dark }} />
                                    Business Model <span className="text-red-500 ml-1">*</span>
                                  </FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value || ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-gray-200 focus:ring-offset-1">
                                        <SelectValue placeholder="Select business model" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Service">Service</SelectItem>
                                      <SelectItem value="Product">Product</SelectItem>
                                      <SelectItem value="Product & Service">Product & Service</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="registrationStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <FileCheck className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                                    Registration Status
                                  </FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value || ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-gray-200 focus:ring-offset-1">
                                        <SelectValue placeholder="Select registration status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Registered">Registered</SelectItem>
                                      <SelectItem value="Unregistered">Unregistered</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Show registration fields only if status is "Registered" */}
                          {form.watch('registrationStatus') === 'Registered' && (
                            <div className="grid grid-cols-1 p-5 rounded-lg bg-gray-50 border border-gray-100">
                              <div className="text-base font-medium mb-4" style={{ color: THEME.dark }}>Registration Details</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormField
                                  control={form.control}
                                  name="registrationNumber"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                        <BookText className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                        Registration Number
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter registration number"
                                          {...field}
                                          className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                  <FormField
                                      control={form.control}
                                      name="taxIdentificationNumber"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                            <FileText className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                            Tax ID Number
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              placeholder="Enter tax identification number"
                                              {...field}
                                              className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                              style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                
                                <FormField
                                  control={form.control}
                                  name="registrationDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                        <Calendar className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                        Registration Date
                                      </FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="date" 
                                          value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                                          onChange={field.onChange}
                                          onBlur={field.onBlur}
                                          ref={field.ref}
                                          className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <Controller
                              control={form.control}
                              name="businessLocation"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <MapPin className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                    Location
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter business location" 
                                      value={field.value || ''}
                                      onChange={field.onChange}
                                      onBlur={field.onBlur}
                                      ref={field.ref}
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Controller
                              control={form.control}
                              name="businessContact"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Phone className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                    Contact Information
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Phone number" 
                                      value={field.value || ''}
                                      onChange={field.onChange}
                                      onBlur={field.onBlur}
                                      ref={field.ref}
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="businessStartDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Calendar className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                                    Start Date
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date" 
                                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                                      onChange={field.onChange}
                                      onBlur={field.onBlur}
                                      ref={field.ref}
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Business email */}
                          <FormField
                            control={form.control}
                            name="businessEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                  <Mail className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                  Business Email
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="email" 
                                    placeholder="Enter business email" 
                                    {...field} 
                                    className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Delivery setup */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                              control={form.control}
                              name="deliverySetup"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base flex items-center">
                                      <Store className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                      Delivery Setup
                                    </FormLabel>
                                    <FormDescription>
                                      Does this business offer delivery services?
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            {form.watch('deliverySetup') && (
                              <FormField
                                control={form.control}
                                name="deliveryType"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                      <Store className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                      Delivery Type
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="Enter delivery type" 
                                        {...field} 
                                        className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      E.g. Self-delivery, Third-party delivery, etc.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>

                          <FormField
                            control={form.control}
                            name="targetMarket"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                  <Target className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                  Target Market
                                </FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe the target market for this business" 
                                    className="min-h-[80px] border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="businessObjectives"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                  <Target className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                  Business Objectives
                                </FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter the main objectives of this business" 
                                    className="min-h-[80px] border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    value={Array.isArray(field.value) ? field.value.join("\n") : ""}
                                    onChange={(e) => {
                                      const objectives = e.target.value.split("\n").filter(obj => obj.trim() !== "");
                                      field.onChange(objectives);
                                    }}
                                  />
                                </FormControl>
                                <FormDescription className="text-xs text-gray-500">
                                  Enter each objective on a new line
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="shortTermGoals"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                  <Goal className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                                  Short-Term Goals
                                </FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter the short-term goals for this business" 
                                    className="min-h-[80px] border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    value={Array.isArray(field.value) ? field.value.join("\n") : ""}
                                    onChange={(e) => {
                                      const goals = e.target.value.split("\n").filter(goal => goal.trim() !== "");
                                      field.onChange(goals);
                                    }}
                                  />
                                </FormControl>
                                <FormDescription className="text-xs text-gray-500">
                                  Enter each goal on a new line
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="socialMediaLinks"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                  <LinkIcon className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                  Social Media Links
                                </FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter social media links, separated by new lines" 
                                    className="min-h-[80px] border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    {...field}
                                  />
                                </FormControl>
                                <div className="flex items-center space-x-2 mt-2">
                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <Facebook className="h-3 w-3" />
                                    <span>Facebook</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <Instagram className="h-3 w-3" />
                                    <span>Instagram</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <Twitter className="h-3 w-3" />
                                    <span>Twitter</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <Globe className="h-3 w-3" />
                                    <span>Website</span>
                                  </div>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                      
                      {/* Financial Tab */}
                      {/* <TabsContent value="financial">
                        <div className="space-y-6">
                          <div className="p-4 border border-gray-100 rounded-md bg-gray-50">
                            <h3 className="text-lg font-medium mb-2" style={{ color: THEME.dark }}>
                              Financial Information
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                              Enter expected revenue and expenditure details for this business
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                              <FormField
                                control={form.control}
                                name="expectedWeeklyRevenue"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                      <DollarSign className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                      Expected Weekly Revenue
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="0" 
                                        {...field}
                                        value={field.value?.toString() || '0'}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                        className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                      />
                                    </FormControl>
                                    <FormDescription className="text-xs text-gray-500">
                                      Estimated weekly revenue in local currency
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="anticipatedMonthlyExpenditure"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                      <DollarSign className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                                      Monthly Expenditure
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="0" 
                                        {...field}
                                        value={field.value?.toString() || '0'}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                        className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                      />
                                    </FormControl>
                                    <FormDescription className="text-xs text-gray-500">
                                      Anticipated monthly expenses in local currency
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <FormField
                                control={form.control}
                                name="expectedMonthlyRevenue"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                      <TrendingUp className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                      Monthly Revenue (Calculated)
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="0" 
                                        {...field}
                                        value={field.value?.toString() || '0'}
                                        disabled
                                        className="border-gray-200 bg-gray-100 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                      />
                                    </FormControl>
                                    <FormDescription className="text-xs text-gray-500">
                                      Automatically calculated from weekly revenue (× 4)
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="expectedMonthlyProfit"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                      <TrendingUp className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                      Monthly Profit (Calculated)
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="0" 
                                        {...field}
                                        value={field.value?.toString() || '0'}
                                        disabled
                                        className="border-gray-200 bg-gray-100 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                      />
                                    </FormControl>
                                    <FormDescription className="text-xs text-gray-500">
                                      Automatically calculated (Revenue - Expenditure)
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name="paymentStructure"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                  <CreditCard className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                  Payment Structure
                                </FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value || ""}
                                >
                                  <FormControl>
                                    <SelectTrigger className="border-gray-200 focus:ring-offset-1">
                                      <SelectValue placeholder="Select payment structure" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Self-Pay">Self-Pay</SelectItem>
                                    <SelectItem value="Reinvestment">Reinvestment</SelectItem>
                                    <SelectItem value="Savings">Savings</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription className="text-xs text-gray-500">
                                  How do you plan to manage your business finances?
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent> */}

                      {/* MasterCard Fields Tab */}
                      <TabsContent value="mastercard">
                        <div className="space-y-6">
                          <div className="mb-4">
                            <div className="flex items-center mb-2">
                              <div className="h-6 w-6 mr-2 rounded-full flex items-center justify-center" 
                                style={{ backgroundColor: `${THEME.primary}10` }}>
                                <span style={{ color: THEME.primary }}>M</span>
                              </div>
                              <h3 className="text-base font-medium" style={{ color: THEME.dark }}>
                                MasterCard Enterprise Data
                              </h3>
                            </div>
                            <p className="text-sm text-gray-500">
                              These fields are required for MasterCard reporting
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                              control={form.control}
                              name="enterpriseType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Building className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                    Enterprise Type
                                  </FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-gray-200 focus:ring-offset-1">
                                        <SelectValue placeholder="Select enterprise type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {enterpriseTypeEnum.options.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
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
                              name="enterpriseSize"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Building className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                                    Enterprise Size
                                  </FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-gray-200 focus:ring-offset-1">
                                        <SelectValue placeholder="Select enterprise size" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {enterpriseSizeEnum.options.map((size) => (
                                        <SelectItem key={size} value={size}>
                                          {size}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                              control={form.control}
                              name="sector"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Briefcase className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                    Business Sector
                                  </FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value || ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-gray-200 focus:ring-offset-1">
                                        <SelectValue placeholder="Select business sector" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {businessSectorEnum.options.map((sector) => (
                                        <SelectItem key={sector} value={sector}>
                                          {sector}
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
                              name="implementingPartnerName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Users className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                    Implementing Partner
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter implementing partner" 
                                      {...field} 
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="enterpriseUniqueIdentifier"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                  <BookText className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                  Enterprise Unique Identifier
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Will be auto-generated if left blank" 
                                    {...field} 
                                    className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Unique identifier for this enterprise. Leave blank for auto-generation.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                              control={form.control}
                              name="primaryPhoneNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Phone className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                    Primary Phone Number
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter primary phone number" 
                                      {...field} 
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="additionalPhoneNumber1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Phone className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                    Additional Phone 1
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter additional phone number" 
                                      {...field} 
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="additionalPhoneNumber2"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                  <Phone className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                                  Additional Phone 2
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter additional phone number" 
                                    {...field} 
                                    className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <FormField
                              control={form.control}
                              name="totalYouthInWorkReported"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Users className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                                    Youth in Work
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      step="1"
                                      {...field} 
                                      value={field.value?.toString() || '0'} 
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="youthRefugeeCount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Users className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                    Refugee Count
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      step="1"
                                      {...field} 
                                      value={field.value?.toString() || '0'} 
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="youthIdpCount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Users className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                    IDP Count
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      step="1"
                                      {...field} 
                                      value={field.value?.toString() || '0'} 
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                              control={form.control}
                              name="youthHostCommunityCount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Users className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                    Host Community Count
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      step="1"
                                      {...field} 
                                      value={field.value?.toString() || '0'} 
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="youthPlwdCount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Users className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                    PLWD Count
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      step="1"
                                      {...field} 
                                      value={field.value?.toString() || '0'} 
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                              control={form.control}
                              name="programName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <BookText className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                                    Program Name
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter program name" 
                                      {...field} 
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="programContactPerson"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <User className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                    Program Contact Person
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter contact person name" 
                                      {...field} 
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                              control={form.control}
                              name="programDetails"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <FileText className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                    Program Details
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Enter program details" 
                                      className="min-h-[80px] border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                      value={field.value || ''}
                                      onChange={field.onChange}
                                      onBlur={field.onBlur}
                                      ref={field.ref}
                                    />
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
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Phone className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                    Program Contact Phone
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter contact phone number" 
                                      {...field} 
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                              control={form.control}
                              name="country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <MapPin className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                    Country
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Country" 
                                      {...field} 
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                      disabled
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="adminLevel1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <MapPin className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                                    Admin Level 1
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Region/State/Province" 
                                      {...field} 
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <FormField
                              control={form.control}
                              name="adminLevel2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <MapPin className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                    Admin Level 2
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="District/County" 
                                      {...field} 
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
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
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <MapPin className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                    Admin Level 3
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Sub-district" 
                                      {...field} 
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="adminLevel4"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <MapPin className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                                    Admin Level 4
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Village/Neighborhood" 
                                      {...field} 
                                      className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="adminLevel5"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                  <MapPin className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                  Admin Level 5
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Detailed location information" 
                                    {...field} 
                                    className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="partnerStartDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                  <Calendar className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                  Partner Start Date
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date" 
                                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                    className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="subPartnerNames"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                  <Users className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                  Sub-partner Names
                                </FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter sub-partner names (one per line)" 
                                    className="min-h-[80px] border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    value={Array.isArray(field.value) ? field.value.join("\n") : ""}
                                    onChange={(e) => {
                                      const partners = e.target.value.split("\n").filter(partner => partner.trim() !== "");
                                      field.onChange(partners);
                                    }}
                                  />
                                </FormControl>
                                <FormDescription className="text-xs text-gray-500">
                                  Enter each sub-partner on a new line
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="enterpriseOwnerName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                  <User className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                  Enterprise Owner Name
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Will be automatically populated from selected youth" 
                                    {...field} 
                                    disabled
                                    className="border-gray-200 bg-gray-50 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                  />
                                </FormControl>
                                <FormDescription className="text-xs text-gray-500">
                                  This field is auto-populated from the primary selected youth
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                      
                      {/* Form Controls & Youth Selection Display */}
                      <div className="pt-4 text-center space-y-4">
                        {/* Youth owners section */}
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                          <div className="text-sm text-blue-800">
                            <div className="font-medium flex items-center justify-center mb-1">
                              <Users className="h-4 w-4 mr-2" />
                              Youth Owners (Required)
                            </div>
                            <p className="text-blue-600 text-xs mb-2">
                              Select at least one youth owner from the panel on the right (max 3)
                            </p>

                            {selectedYouth.length > 0 ? (
                              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                                {selectedYouth.map((youthId) => {
                                  const youth = youthProfiles?.find(y => y.id === youthId);
                                  return youth ? (
                                    <Badge 
                                      key={youthId}
                                      className="bg-blue-100 text-blue-800 px-3 py-1 flex items-center"
                                    >
                                      <User className="h-3 w-3 mr-1" />
                                      {youth.fullName || `${youth.firstName} ${youth.lastName}`}
                                      {selectedYouth.indexOf(youthId) === 0 && (
                                        <span className="ml-1 text-xs bg-blue-200 px-1 rounded">Primary</span>
                                      )}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            ) : (
                              <p className="text-xs font-medium mt-2 text-red-500">
                                At least one youth owner is required
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 flex justify-between space-x-4 pt-4 border-t border-gray-100">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => navigate('/businesses')}
                          className="border-gray-200 hover:border-gray-300 transition-all duration-300"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        
                        <div className="flex space-x-2">
                          {activeTab !== "basic" && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                const tabs = ["basic", "details", "mastercard"];
                                const currentIndex = tabs.indexOf(activeTab);
                                setActiveTab(tabs[currentIndex - 1]);
                              }}
                              className="border-gray-200 hover:border-gray-300 transition-all duration-300"
                            >
                              Previous
                            </Button>
                          )}
                          {activeTab !== "mastercard" ? (
                            <Button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                const tabs = ["basic", "details", "mastercard"];
                                const currentIndex = tabs.indexOf(activeTab);
                                setActiveTab(tabs[currentIndex + 1]);
                              }}
                              className="shadow-sm hover:shadow-md transition-all duration-300"
                              style={{ 
                                background: THEME.primary,
                                border: "none" 
                              }}
                            >
                              Next
                            </Button>
                          ) : (
                            <Button 
                              type="submit"
                              disabled={isSubmitting}
                              className="shadow-sm hover:shadow-md transition-all duration-300"
                              style={{ 
                                background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                                border: "none" 
                              }}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Create Business
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </form>
                  </Form>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Youth Selection Panel */}
          <motion.div variants={cardVariant}>
            <Card className="border-gray-100 shadow-md overflow-hidden h-full">
              <div className="h-1 w-full" style={{ 
                background: `linear-gradient(to right, ${THEME.accent}, ${THEME.dark})` 
              }}></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center mr-3" style={{ 
                      background: `linear-gradient(135deg, ${THEME.accent}20 0%, ${THEME.dark}10 100%)` 
                    }}>
                      <Users className="h-5 w-5" style={{ color: THEME.dark }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg" style={{ color: THEME.dark }}>
                        Youth Owners <span className="text-red-500">*</span>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Select youth who will own this business
                      </CardDescription>
                    </div>
                  </div>

                  <Badge 
                    className="shadow-sm"
                    style={{ 
                      backgroundColor: selectedYouth.length === 0 ? "#ef4444" : "#10b981",
                      color: "white" 
                    }}
                  >
                    {selectedYouth.length}/3 Selected
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <ScrollArea className="h-[600px] pr-4">
                  <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {!youthProfiles || youthProfiles.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ 
                          background: `linear-gradient(135deg, ${THEME.primary}10 0%, ${THEME.accent}10 100%)` 
                        }}>
                          <Users className="h-8 w-8" style={{ color: THEME.primary }} />
                        </div>
                        <h3 className="text-lg font-medium" style={{ color: THEME.dark }}>No Youth Profiles</h3>
                        <p className="text-gray-500 mt-2 mb-6 max-w-md mx-auto">
                          No youth profiles are available. Create youth profiles before adding them to a business.
                        </p>
                        <Button
                          className="shadow-sm hover:shadow-md transition-all duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                            border: "none" 
                          }}
                          onClick={() => navigate("/profile/new")}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create Youth Profile
                        </Button>
                      </div>
                    ) : (
                      youthProfiles.map((youth) => (
                        <motion.div
                          key={youth.id}
                          variants={itemVariant}
                          className={`p-3 rounded-lg border transition-all duration-300 relative ${
                            selectedYouth.includes(youth.id) 
                              ? "border-green-200 bg-green-50" 
                              : hoveredYouth === youth.id 
                                ? "border-gray-200 bg-gray-50" 
                                : "border-gray-100 bg-white"
                          }`}
                          onMouseEnter={() => setHoveredYouth(youth.id)}
                          onMouseLeave={() => setHoveredYouth(undefined)}
                          onClick={() => toggleYouthSelection(youth.id)}
                        >
                          {selectedYouth.includes(youth.id) && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center bg-green-500 text-white shadow-sm">
                              <CheckCircle2 className="h-4 w-4" />
                              {selectedYouth.indexOf(youth.id) === 0 && (
                                <div className="absolute -bottom-3 right-0 bg-blue-500 text-xs text-white px-1 rounded shadow-sm">
                                  Primary
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex items-start">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={youth.profilePicture || ""} alt={youth.fullName || `${youth.firstName} ${youth.lastName}`} />
                              <AvatarFallback style={{ backgroundColor: `${THEME.primary}20` }}>
                                {(youth.fullName || `${youth.firstName} ${youth.lastName}`).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium mb-1" style={{ color: THEME.dark }}>
                                {youth.fullName || `${youth.firstName} ${youth.middleName ? youth.middleName + ' ' : ''}${youth.lastName}`}
                              </div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <div className="flex items-center text-xs text-gray-600">
                                  <MapPin className="h-3 w-3 mr-1" style={{ color: getDistrictColor(youth.district) }} />
                                  <span>{youth.district}{youth.town ? `, ${youth.town}` : ""}</span>
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-gray-500 flex items-center">
                                <Phone className="h-3 w-3 mr-1" style={{ color: THEME.primary }} />
                                <span>{youth.phoneNumber || "No phone"}</span>
                              </div>
                              {youth.businessInterest && (
                                <div className="mt-2 text-xs text-gray-500 flex items-center">
                                  <Briefcase className="h-3 w-3 mr-1" style={{ color: THEME.accent }} />
                                  <span>{youth.businessInterest}</span>
                                </div>
                              )}
                              {youth.dareModel && (
                                <Badge 
                                  className="mt-2 font-normal text-xs"
                                  style={{ 
                                    backgroundColor: `${getModelColor(youth.dareModel)}20`,
                                    color: getModelColor(youth.dareModel)
                                  }}
                                >
                                  {youth.dareModel}
                                </Badge>
                              )}
                              {youth.refugeeStatus && (
                                <Badge className="mt-2 ml-1 font-normal text-xs bg-yellow-100 text-yellow-800">
                                  Refugee
                                </Badge>
                              )}
                              {youth.idpStatus && (
                                <Badge className="mt-2 ml-1 font-normal text-xs bg-orange-100 text-orange-800">
                                  IDP
                                </Badge>
                              )}
                              {youth.pwdStatus === 'Yes' && (
                                <Badge className="mt-2 ml-1 font-normal text-xs bg-purple-100 text-purple-800">
                                  PLWD
                                </Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}