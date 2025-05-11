import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  BusinessProfile, 
  YouthProfile, 
  insertBusinessProfileSchema,
  dareModelEnum,
  enterpriseTypeEnum,
  enterpriseSizeEnum,
  businessSectorEnum,
} from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { queryClient } from "@/lib/queryClient";
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
  Image as ImageIcon,
  Mail,
  Target,
  Goal,
  DollarSign,
  CreditCard,
  TrendingUp,
  Percent,
  Link as LinkIcon,
  Facebook,
  Instagram,
  Globe,
  Twitter,
  AlertTriangle
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

// Mastercard color theme
const THEME = {
  primary: "#FF5F00",
  secondary: "#EB001B",
  accent: "#F79E1B",
  dark: "#1A1F71",
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
  1: [
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
  2: [
    { id: 10, name: "Food Processing & Manufacturing" },
    { id: 11, name: "Catering & Event Services" },
    { id: 12, name: "Private Chefs & Meal Preparation" },
    { id: 13, name: "Baking & Pastry" },
    { id: 14, name: "Bartending & Beverage Services" },
    { id: 15, name: "Food Styling & Photography" },
    { id: 16, name: "Food Retail and sales" }
  ],
  3: [
    { id: 17, name: "Fashion Design & Pattern Making" },
    { id: 18, name: "Sewing & Tailoring" },
    { id: 19, name: "Textile & Cloth Manufacturing" },
    { id: 20, name: "Fashion Accessories & Jewelry" },
    { id: 21, name: "Fashion Styling & Consulting" },
    { id: 22, name: "Fashion Photography & Modeling" },
    { id: 23, name: "Fashion retail" }
  ],
  4: [
    { id: 24, name: "Hair Styling & Care" },
    { id: 25, name: "Makeup Artistry" },
    { id: 26, name: "Nail Care & Manicures/Pedicures" },
    { id: 27, name: "Skincare & Esthetics" },
    { id: 28, name: "Massage Therapy & Bodywork" },
    { id: 29, name: "Personal Training & Fitness" },
    { id: 30, name: "Beauty retail" }
  ],
  5: [
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

// Extended schema for business editing
const businessFormSchema = insertBusinessProfileSchema.extend({
  youthIds: z.array(z.number()).min(1, { message: "At least one youth member is recommended" }).optional(),
  enterpriseType: z.enum([
    'Sole Proprietorship',
    'Partnership',
    'Limited Liability Company',
    'Cooperative',
    'Social Enterprise',
    'Other',
  ]).optional(),
  enterpriseSize: z.enum(['Micro', 'Small', 'Medium', 'Large']).optional(),
  implementingPartnerName: z.string().optional(),
  totalYouthInWorkReported: z.number().int().optional().default(0),
  youthRefugeeCount: z.number().int().optional().default(0),
  youthIdpCount: z.number().int().optional().default(0),
  youthHostCommunityCount: z.number().int().optional().default(0),
  youthPlwdCount: z.number().int().optional().default(0),
  paymentStructure: z.string().optional(),
  expectedWeeklyRevenue: z.number().optional(),
  expectedMonthlyRevenue: z.number().optional(),
  anticipatedMonthlyExpenditure: z.number().optional(),
  expectedMonthlyProfit: z.number().optional(),
  deliverySetup: z.boolean().optional(),
  deliveryType: z.string().optional(),
  socialMediaLinks: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessFormSchema>;

export default function BusinessEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedYouth, setSelectedYouth] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredYouth, setHoveredYouth] = useState<number | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);
  const [availableSubcategories, setAvailableSubcategories] = useState<{ id: number, name: string }[]>(categoryToSubcategories[1]);
  const [activeTab, setActiveTab] = useState("basic");
  const [businessLogo, setBusinessLogo] = useState<string | undefined>(undefined);
  const [currentMembers, setCurrentMembers] = useState<number[]>([]);
  const [formInitialized, setFormInitialized] = useState(false);

  // Debug mode
  const DEBUG = true;
  const debugLog = (...args: any[]) => {
    if (DEBUG) {
      console.log(...args);
    }
  };

  // Fetch business details
  const {
    data: business,
    isLoading: isLoadingBusiness,
    error: businessError,
  } = useQuery<BusinessProfile>({
    queryKey: [`/api/business-profiles/${id}`],
    enabled: !!id,
  });

  // Fetch all youth profiles
  const {
    data: youthProfiles,
    isLoading: isLoadingYouth,
    error: youthError
  } = useQuery<YouthProfile[]>({
    queryKey: ['/api/youth-profiles'],
  });

  // Fetch current business members
  const {
    data: businessMembers,
    isLoading: isLoadingMembers,
  } = useQuery<YouthProfile[]>({
    queryKey: [`/api/business-profiles/${id}/members`],
    enabled: !!id,
    onSuccess: (data) => {
      if (data) {
        const memberIds = data.map(member => member.id);
        debugLog("Business members loaded, setting IDs:", memberIds);
        setSelectedYouth(memberIds);
        setCurrentMembers(memberIds);
      }
    }
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

  // Helper function to parse JSON fields from business data
  const parseJsonField = (field: any): any[] => {
    if (!field) return [];
    
    try {
      if (typeof field === 'string') {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [];
      } else if (Array.isArray(field)) {
        return field;
      }
    } catch (e) {
      debugLog("Error parsing JSON field:", e);
    }
    
    return [];
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "mastercard") {
      populateDefaultValues();
    }
  };

  const populateDefaultValues = () => {
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

  // Initialize form with business data when available
  useEffect(() => {
    if (business && !formInitialized) {
      debugLog("Initializing form with business data:", business);
      
      setBusinessLogo(business.businessLogo || undefined);
      
      if (business.serviceCategoryId) {
        setSelectedCategoryId(business.serviceCategoryId);
        setAvailableSubcategories(categoryToSubcategories[business.serviceCategoryId] || []);
      }

      const businessObjectives = parseJsonField(business.businessObjectives);
      const shortTermGoals = parseJsonField(business.shortTermGoals);
      const subPartnerNames = parseJsonField(business.subPartnerNames);

      const formattedStartDate = business.businessStartDate 
        ? business.businessStartDate.split('T')[0] 
        : new Date().toISOString().split('T')[0];
      
      const formattedRegistrationDate = business.registrationDate
        ? typeof business.registrationDate === 'string'
          ? business.registrationDate.split('T')[0]
          : business.registrationDate
        : undefined;

      const formattedPartnerStartDate = business.partnerStartDate
        ? typeof business.partnerStartDate === 'string'
          ? business.partnerStartDate.split('T')[0]
          : business.partnerStartDate
        : undefined;

      form.reset({
        businessName: business.businessName || "",
        businessDescription: business.businessDescription || "",
        businessContact: business.businessContact || "",
        businessLocation: business.businessLocation || "",
        businessLogo: business.businessLogo || "",
        district: business.district || "Bekwai",
        dareModel: business.dareModel || "Collaborative",
        serviceCategoryId: business.serviceCategoryId || 1,
        serviceSubcategoryId: business.serviceSubcategoryId || 1,
        businessModel: business.businessModel || "Service",
        registrationStatus: business.registrationStatus || "Unregistered",
        registrationNumber: business.registrationNumber || "",
        taxIdentificationNumber: business.taxIdentificationNumber || "",
        businessStartDate: formattedStartDate,
        registrationDate: formattedRegistrationDate,
        businessObjectives: businessObjectives,
        shortTermGoals: shortTermGoals,
        targetMarket: business.targetMarket || "",
        youthIds: selectedYouth.length > 0 ? selectedYouth : currentMembers,
        country: business.country || "Ghana",
        enterpriseType: business.enterpriseType as any || "Sole Proprietorship",
        enterpriseSize: business.enterpriseSize as any || "Micro",
        implementingPartnerName: business.implementingPartnerName || "University of Ghana Business School (UGBS)",
        sector: business.sector || "Retail",
        totalYouthInWorkReported: typeof business.totalYouthInWorkReported === 'number' ? business.totalYouthInWorkReported : 0,
        youthRefugeeCount: typeof business.youthRefugeeCount === 'number' ? business.youthRefugeeCount : 0,
        youthIdpCount: typeof business.youthIdpCount === 'number' ? business.youthIdpCount : 0,
        youthHostCommunityCount: typeof business.youthHostCommunityCount === 'number' ? business.youthHostCommunityCount : 0,
        youthPlwdCount: typeof business.youthPlwdCount === 'number' ? business.youthPlwdCount : 0,
        primaryPhoneNumber: business.primaryPhoneNumber || "",
        additionalPhoneNumber1: business.additionalPhoneNumber1 || "",
        additionalPhoneNumber2: business.additionalPhoneNumber2 || "",
        businessEmail: business.businessEmail || "",
        adminLevel1: business.adminLevel1 || "",
        adminLevel2: business.adminLevel2 || "",
        adminLevel3: business.adminLevel3 || "",
        adminLevel4: business.adminLevel4 || "",
        adminLevel5: business.adminLevel5 || "",
        partnerStartDate: formattedPartnerStartDate,
        programName: business.programName || "Digital Access for Rural Empowerment (DARE)",
        programDetails: business.programDetails || "Support for youth-led businesses in Ghana",
        programContactPerson: business.programContactPerson || "Prof. Richard Boateng",
        programContactPhoneNumber: business.programContactPhoneNumber || "+233248852426",
        subPartnerNames: subPartnerNames,
        paymentStructure: business.paymentStructure || "Self-Pay",
        expectedWeeklyRevenue: typeof business.expectedWeeklyRevenue === 'number' ? business.expectedWeeklyRevenue : 0,
        expectedMonthlyRevenue: typeof business.expectedMonthlyRevenue === 'number' ? business.expectedMonthlyRevenue : 0,
        anticipatedMonthlyExpenditure: typeof business.anticipatedMonthlyExpenditure === 'number' ? business.anticipatedMonthlyExpenditure : 0,
        expectedMonthlyProfit: typeof business.expectedMonthlyProfit === 'number' ? business.expectedMonthlyProfit : 0,
        deliverySetup: business.deliverySetup !== undefined ? business.deliverySetup : false,
        deliveryType: business.deliveryType || "",
        socialMediaLinks: business.socialMediaLinks || ""
      });
      
      setFormInitialized(true);
      debugLog("Form reset complete with business data");
    }
  }, [business, form, selectedYouth, currentMembers, formInitialized]);

  // Update youth IDs in form when business members are loaded
  useEffect(() => {
    if (businessMembers && businessMembers.length > 0) {
      const memberIds = businessMembers.map(member => member.id);
      debugLog("Setting youth IDs from business members:", memberIds);
      
      setSelectedYouth(memberIds);
      setCurrentMembers(memberIds);
      form.setValue('youthIds', memberIds);
    }
  }, [businessMembers, form]);

  // Financial calculations 
  useEffect(() => {
    const weeklyRevenue = form.watch('expectedWeeklyRevenue') || 0;
    const monthlyExpenditure = form.watch('anticipatedMonthlyExpenditure') || 0;

    const calculatedMonthlyRevenue = weeklyRevenue * 4;
    const calculatedProfit = calculatedMonthlyRevenue - monthlyExpenditure;
    
    form.setValue('expectedMonthlyRevenue', calculatedMonthlyRevenue);
    form.setValue('expectedMonthlyProfit', calculatedProfit);
  }, [form.watch('expectedWeeklyRevenue'), form.watch('anticipatedMonthlyExpenditure')]);

  // Upload business logo
  const uploadLogo = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        body: formData,
      });
      
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

  // Get district name without country
  const getDistrictShortName = (district: string) => {
    return district.split(',')[0];
  };

  // Compare arrays for equality
  const arraysEqual = (a: number[], b: number[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  };

  // Update Business mutation with enhanced logging
  const updateBusiness = useMutation({
    mutationFn: async (formData: BusinessFormData) => {
      debugLog("Starting business update, raw form data:", formData);

      const { youthIds, ...businessData } = formData;

      const cleanedBusinessData = {
        ...businessData,
        businessObjectives: Array.isArray(businessData.businessObjectives)
          ? JSON.stringify(businessData.businessObjectives)
          : "[]",
        shortTermGoals: Array.isArray(businessData.shortTermGoals)
          ? JSON.stringify(businessData.shortTermGoals)
          : "[]",
        subPartnerNames: Array.isArray(businessData.subPartnerNames)
          ? JSON.stringify(businessData.subPartnerNames)
          : "[]",
        businessStartDate: businessData.businessStartDate instanceof Date
          ? businessData.businessStartDate.toISOString().split('T')[0]
          : businessData.businessStartDate,
        registrationDate: businessData.registrationDate instanceof Date
          ? businessData.registrationDate.toISOString().split('T')[0]
          : businessData.registrationDate,
        partnerStartDate: businessData.partnerStartDate instanceof Date
          ? businessData.partnerStartDate.toISOString().split('T')[0]
          : businessData.partnerStartDate,
        serviceCategoryId: typeof businessData.serviceCategoryId === 'string'
          ? parseInt(businessData.serviceCategoryId)
          : businessData.serviceCategoryId,
        serviceSubcategoryId: typeof businessData.serviceSubcategoryId === 'string'
          ? parseInt(businessData.serviceSubcategoryId)
          : businessData.serviceSubcategoryId,
        expectedWeeklyRevenue: typeof businessData.expectedWeeklyRevenue === 'string'
          ? Number(businessData.expectedWeeklyRevenue)
          : businessData.expectedWeeklyRevenue || 0,
        expectedMonthlyRevenue: typeof businessData.expectedMonthlyRevenue === 'string'
          ? Number(businessData.expectedMonthlyRevenue)
          : businessData.expectedMonthlyRevenue || 0,
        anticipatedMonthlyExpenditure: typeof businessData.anticipatedMonthlyExpenditure === 'string'
          ? Number(businessData.anticipatedMonthlyExpenditure)
          : businessData.anticipatedMonthlyExpenditure || 0,
        expectedMonthlyProfit: typeof businessData.expectedMonthlyProfit === 'string'
          ? Number(businessData.expectedMonthlyProfit)
          : businessData.expectedMonthlyProfit || 0,
        totalYouthInWorkReported: typeof businessData.totalYouthInWorkReported === 'string'
          ? Number(businessData.totalYouthInWorkReported)
          : businessData.totalYouthInWorkReported || 0,
        youthRefugeeCount: typeof businessData.youthRefugeeCount === 'string'
          ? Number(businessData.youthRefugeeCount)
          : businessData.youthRefugeeCount || 0,
        youthIdpCount: typeof businessData.youthIdpCount === 'string'
          ? Number(businessData.youthIdpCount)
          : businessData.youthIdpCount || 0,
        youthHostCommunityCount: typeof businessData.youthHostCommunityCount === 'string'
          ? Number(businessData.youthHostCommunityCount)
          : businessData.youthHostCommunityCount || 0,
        youthPlwdCount: typeof businessData.youthPlwdCount === 'string'
          ? Number(businessData.youthPlwdCount)
          : businessData.youthPlwdCount || 0,
      };

      debugLog("Cleaned business data for update:", cleanedBusinessData);

      const businessResponse = await fetch(`/api/business-profiles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedBusinessData),
      });

      debugLog("Business update response status:", businessResponse.status);

      if (!businessResponse.ok) {
        const errorText = await businessResponse.text();
        debugLog("Error response from business update:", errorText);

        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || errorJson.error || "Failed to update business");
        } catch (e) {
          throw new Error(`Failed to update business: ${errorText}`);
        }
      }

      const updatedBusiness = await businessResponse.json();
      debugLog("Business successfully updated:", updatedBusiness);

      if (youthIds && youthIds.length > 0 && !arraysEqual(youthIds, currentMembers)) {
        debugLog("Youth selection changed. Updating youth relationships:", {
          current: currentMembers,
          new: youthIds,
        });

        const relationshipResponse = await fetch("/api/business-profiles/youth-relationships", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessId: parseInt(id),
            youthIds: youthIds,
          }),
        });

        debugLog("Youth relationship update response status:", relationshipResponse.status);

        if (!relationshipResponse.ok) {
          const errorText = await relationshipResponse.text();
          debugLog("Error response from relationship update:", errorText);

          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || errorJson.error || "Failed to associate youth with business");
          } catch (e) {
            throw new Error(`Failed to associate youth with business: ${errorText}`);
          }
        }

        debugLog("Youth relationships successfully updated");
      } else {
        debugLog("No change in youth selection, skipping relationship update");
      }

      return updatedBusiness;
    },
    onSuccess: (data) => {
      toast({
        title: "Business updated",
        description: "Business profile has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/business-profiles'] });
      queryClient.invalidateQueries({ queryKey: [`/api/business-profiles/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/business-profiles/${id}/members`] });
      navigate(`/businesses/${id}`);
    },
    onError: (error: Error) => {
      debugLog("Mutation error:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update business",
        variant: "destructive",
      });
    },
    onMutate: () => {
      debugLog("Mutation started");
    },
    onSettled: () => {
      debugLog("Mutation settled");
    },
  });

  const onUpdateSubmit = async (data: BusinessFormData) => {
    debugLog("onUpdateSubmit triggered with data:", data);
    debugLog("Selected youth:", selectedYouth);
    debugLog("Form errors:", form.formState.errors);

    const isValid = await form.trigger();
    debugLog("Form is valid:", isValid);

    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    const parsedData = {
      ...data,
      serviceCategoryId: typeof data.serviceCategoryId === 'string'
        ? parseInt(data.serviceCategoryId)
        : data.serviceCategoryId,
      serviceSubcategoryId: typeof data.serviceSubcategoryId === 'string'
        ? parseInt(data.serviceSubcategoryId)
        : data.serviceSubcategoryId,
      expectedWeeklyRevenue: data.expectedWeeklyRevenue !== undefined ? Number(data.expectedWeeklyRevenue) : 0,
      expectedMonthlyRevenue: data.expectedMonthlyRevenue !== undefined ? Number(data.expectedMonthlyRevenue) : 0,
      anticipatedMonthlyExpenditure: data.anticipatedMonthlyExpenditure !== undefined ? Number(data.anticipatedMonthlyExpenditure) : 0,
      expectedMonthlyProfit: data.expectedMonthlyProfit !== undefined ? Number(data.expectedMonthlyProfit) : 0,
      totalYouthInWorkReported: data.totalYouthInWorkReported !== undefined ? Number(data.totalYouthInWorkReported) : 0,
      youthRefugeeCount: data.youthRefugeeCount !== undefined ? Number(data.youthRefugeeCount) : 0,
      youthIdpCount: data.youthIdpCount !== undefined ? Number(data.youthIdpCount) : 0,
      youthHostCommunityCount: data.youthHostCommunityCount !== undefined ? Number(data.youthHostCommunityCount) : 0,
      youthPlwdCount: data.youthPlwdCount !== undefined ? Number(data.youthPlwdCount) : 0,
    };

    const finalData = {
      ...parsedData,
      youthIds: selectedYouth,
      businessLogo: businessLogo || data.businessLogo || "",
      enterpriseType: data.enterpriseType || "Sole Proprietorship",
      enterpriseSize: data.enterpriseSize || "Micro",
    };

    debugLog("Submitting final data:", finalData);
    updateBusiness.mutate(finalData);
  };

  useEffect(() => {
    console.log("Selected youth updated:", selectedYouth);
  }, [selectedYouth]);

  useEffect(() => {
    if (businessMembers) {
      console.log("Business members loaded:", businessMembers);
      console.log("Member IDs:", businessMembers.map(member => member.id));
    }
  }, [businessMembers]);

  const toggleYouthSelection = (id: number) => {
    if (selectedYouth.includes(id)) {
      setSelectedYouth(selectedYouth.filter(yId => yId !== id));
    } else {
      if (selectedYouth.length >= 3) {
        const newSelection = [...selectedYouth.slice(0, 2), id];
        setSelectedYouth(newSelection);
      } else {
        setSelectedYouth([...selectedYouth, id]);
      }
    }

    const updatedYouthIds = selectedYouth.includes(id)
      ? selectedYouth.filter(yId => yId !== id)
      : selectedYouth.length >= 3
        ? [...selectedYouth.slice(0, 2), id]
        : [...selectedYouth, id];

    form.setValue('youthIds', updatedYouthIds);
  };

  if (isLoadingBusiness || isLoadingYouth) {
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
              Loading Business Data
            </h3>
            <p className="text-gray-500">Please wait while we prepare the business edit form</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (businessError) {
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
            <h3 className="text-xl font-bold text-red-700 mb-3">Error Loading Business</h3>
            <p className="text-red-600 mb-6">
              There was an error loading the business details. Please try again or contact support if the problem persists.
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => window.location.reload()}
              >
                <Loader2 className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button 
                className="shadow-sm hover:shadow-md transition-all duration-300"
                style={{ 
                  background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                  border: "none" 
                }}
                onClick={() => navigate("/businesses")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Businesses
              </Button>
            </div>
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
            onClick={() => navigate(`/businesses/${id}`)}
            className="mr-4 rounded-full hover:bg-gray-100 transition-colors duration-300"
            style={{ color: THEME.primary }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: THEME.dark }}>
              Edit Business: {business?.businessName}
            </h1>
            <p className="text-gray-500 mt-1">Update business details and manage members</p>
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
                      Update the details for this business
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
                    <TabsTrigger value="financial" style={{ 
                      color: activeTab === "financial" ? "white" : THEME.dark,
                      background: activeTab === "financial" ? THEME.primary : "transparent"
                    }}>
                      Financial
                    </TabsTrigger>
                    <TabsTrigger value="mastercard" style={{ 
                      color: activeTab === "mastercard" ? "white" : THEME.dark,
                      background: activeTab === "mastercard" ? THEME.primary : "transparent"
                    }}>
                      MasterCard Fields
                    </TabsTrigger>
                  </TabsList>

                  <Form {...form}>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        debugLog("Form submission triggered");
                        form.handleSubmit(onUpdateSubmit)();
                      }}
                      className="space-y-6"
                    >
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
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-gray-200 focus:ring-offset-1">
                                        <SelectValue placeholder="Select district" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
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
                                    value={field.value || ""}
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
                                      form.setValue('serviceSubcategoryId', categoryToSubcategories[categoryId]?.[0]?.id || 1);
                                    }} 
                                    defaultValue={field.value?.toString()}
                                    value={field.value?.toString()}
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
                                    value={field.value?.toString()}
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
                                    value={field.value || ""}
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
                                    value={field.value || ""}
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

                      <TabsContent value="financial">
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
                                  value={field.value || ""}
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
                      </TabsContent>

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
                                    value={field.value || ""}
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
  
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <FormField
                                control={form.control}
                                name="totalYouthInWorkReported"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                      <Users className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                                      Total Youth in Work
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
                                      Total number of youth currently working in this business
                                    </FormDescription>
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
                                      Refugee Youth Count
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
                                      Number of refugee youth in the business
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
  
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <FormField
                                control={form.control}
                                name="youthIdpCount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                      <Users className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                      IDP Youth Count
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
                                      Number of internally displaced youth in the business
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
  
                              <FormField
                                control={form.control}
                                name="youthHostCommunityCount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                      <Users className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                                      Host Community Youth Count
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
                                      Number of youth from host communities
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
  
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <FormField
                                control={form.control}
                                name="youthPlwdCount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                      <Users className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                      PLWD Youth Count
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
                                      Number of youth with disabilities (PLWD)
                                    </FormDescription>
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
                                      <Calendar className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
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
                                    <FormDescription className="text-xs text-gray-500">
                                      Date when partnership with implementing partner began
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
  
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
                              name="programDetails"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <FileText className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                    Program Details
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Describe the program" 
                                      className="min-h-[80px] border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
  
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
  
                              <FormField
                                control={form.control}
                                name="programContactPhoneNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                      <Phone className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
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
  
                            <FormField
                              control={form.control}
                              name="subPartnerNames"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                                    <Users className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                                    Sub-Partner Names
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Enter sub-partner names, one per line" 
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
                                    Enter each sub-partner name on a new line
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>
  
                        <CardFooter className="pt-6 flex justify-end space-x-4">
                          <Button 
                            variant="outline" 
                            type="button"
                            onClick={() => navigate(`/businesses/${id}`)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={updateBusiness.isLoading}
                            className="shadow-sm hover:shadow-md transition-all duration-300"
                            style={{ 
                              background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                              border: "none",
                              color: "white"
                            }}
                          >
                            {updateBusiness.isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Update Business
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </form>
                    </Form>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
  
            <motion.div 
              variants={cardVariant}
              className="lg:col-span-1"
            >
              <Card className="border-gray-100 shadow-md sticky top-4">
                <div className="h-1 w-full" style={{ 
                  background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})` 
                }}></div>
                <CardHeader className="pb-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center mr-3" style={{ 
                      background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}10 100%)` 
                    }}>
                      <Users className="h-5 w-5" style={{ color: THEME.primary }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg" style={{ color: THEME.dark }}>
                        Team Members
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Manage youth members associated with this business
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
  
                <CardContent className="p-6">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {youthProfiles?.map((youth) => (
                        <motion.div
                          key={youth.id}
                          variants={itemVariant}
                          onMouseEnter={() => setHoveredYouth(youth.id)}
                          onMouseLeave={() => setHoveredYouth(undefined)}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={youth.profilePicture || ''} alt={youth.firstName} />
                              <AvatarFallback style={{ backgroundColor: THEME.primary, color: 'white' }}>
                                {youth.firstName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium" style={{ color: THEME.dark }}>
                                {youth.firstName} {youth.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {youth.email || 'No email provided'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={selectedYouth.includes(youth.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleYouthSelection(youth.id)}
                            className="transition-all duration-200"
                            style={{
                              background: selectedYouth.includes(youth.id)
                                ? THEME.primary
                                : 'transparent',
                              borderColor: selectedYouth.includes(youth.id)
                                ? THEME.primary
                                : '#d1d5db',
                              color: selectedYouth.includes(youth.id)
                                ? 'white'
                                : THEME.dark,
                            }}
                          >
                            {selectedYouth.includes(youth.id) ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Selected
                              </>
                            ) : (
                              <>
                                <PlusCircle className="h-4 w-4 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
  
                <CardFooter className="p-6 pt-0">
                  <div className="w-full text-center">
                    <p className="text-sm text-gray-500">
                      {selectedYouth.length} youth member{selectedYouth.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }