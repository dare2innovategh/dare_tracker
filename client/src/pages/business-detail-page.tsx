import React, { useState, useEffect  } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient  } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BusinessProfile, YouthProfile, Mentor } from "@shared/schema";
import MentorAssignmentDialog from "@/components/mentors/mentor-assignment-dialog";
import { MakerspaceAssignmentDialog } from "@/components/business/makerspace-assignment-dialog";
import FeasibilityAssessmentDialog from "@/components/business/feasibility-assessment-dialog";
import BusinessAssessmentsTab from "@/components/business/business-assessments-tab";
import BusinessGalleryTab from "@/components/business/business-gallery-tab";
import { MentorRemoveButton } from "@/components/MentorRemoveButton";
import { BusinessTrackingTable } from "@/components/business/business-tracking-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  Briefcase,
  Building2,
  Calendar,
  Edit,
  FileText,
  Loader2,
  MapPin,
  Phone,
  User,
  UserCog,
  UserMinus,
  Users,
  ArrowLeft,
  BarChart2,
  AlertTriangle,
  FileQuestion,
  ChevronRight,
  Store,
  Target,
  Tag,
  Clock,
  PlusCircle,
  Eye,
  FileCheck,
  BookText,
  Trash2,
  Image as ImageIcon,
  ClipboardCheck,
  CheckSquare,
  ClipboardList,
  Package,
  Plus,
  RefreshCw,
  Building,
  Mail,
  Goal
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

// Get service category name by ID
const getCategoryNameById = (id: number | null): string => {
  if (!id) return "Uncategorized";
  const categories = {
    1: "Building & Construction",
    2: "Food & Beverage",
    3: "Fashion & Apparel",
    4: "Beauty & Wellness",
    5: "Media & Creative Arts"
  };
  return categories[id as keyof typeof categories] || "Uncategorized";
};

// Get subcategory name by ID
const getSubcategoryNameById = (categoryId: number | null, subcategoryId: number | null): string => {
  if (!categoryId || !subcategoryId) return "Not specified";
  
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
  
  const subcategories = categoryToSubcategories[categoryId];
  if (!subcategories) return "Not specified";
  const subcategory = subcategories.find(s => s.id === subcategoryId);
  return subcategory?.name || "Not specified";
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

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

const rowVariant = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [mentorAssignmentOpen, setMentorAssignmentOpen] = useState(false);
  const [makerspaceAssignmentOpen, setMakerspaceAssignmentOpen] = useState(false);
 
  
  // Mutation to remove youth from business
  const removeMemberMutation = useMutation({
    mutationFn: async (youthId: number) => {
      const response = await apiRequest(
        "DELETE", 
        `/api/youth-profiles/${youthId}/businesses/${id}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove member");
      }
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/business-profiles/${id}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/youth-profiles`] });
      
      toast({
        title: "Owner Removed",
        description: "The youth has been removed from this business successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove business owner",
        variant: "destructive",
      });
    }
  });
  
  // Handler for removing a member
  const handleRemoveMember = (youthId: number) => {
    if (confirm("Are you sure you want to remove this owner from the business? This action cannot be undone.")) {
      removeMemberMutation.mutate(youthId);
    }
  };

  // Fetch business details
  const {
    data: business,
    isLoading: isLoadingBusiness,
    error: businessError,
    refetch: refetchBusiness
  } = useQuery<BusinessProfile>({
    queryKey: [`/api/business-profiles/${id}`],
    enabled: !!id,
  });

  // Fetch youth members
  const {
    data: members,
    isLoading: isLoadingMembers,
    error: membersError,
  } = useQuery<YouthProfile[]>({
    queryKey: [`/api/business-profiles/${id}/members`],
    enabled: !!id,
  });
  
  // Define a type for mentor assignments that includes mentor information
  interface MentorAssignment {
    mentorId: number;
    businessId: number;
    assignedDate: string;
    isActive: boolean;
    mentorshipFocus: "Business Growth" | "Operations Improvement" | "Market Expansion" | "Financial Management" | "Team Development" | null;
    meetingFrequency: "Weekly" | "Bi-weekly" | "Monthly" | "Quarterly" | "As Needed";
    lastMeetingDate: string | null;
    nextMeetingDate: string | null;
    mentorshipGoals: string[];
    mentorshipProgress: string | null;
    progressRating: number | null;
    mentor?: {
      id: number;
      name: string;
      email: string | null;
      phone: string | null;
      profilePicture: string | null;
      specialization?: string;
    }
  }

  // Fetch assigned mentors
  const {
    data: mentorAssignments,
    isLoading: isLoadingMentorAssignments,
    error: mentorAssignmentsError,
  } = useQuery<MentorAssignment[]>({
    queryKey: [`/api/business-profiles/${id}/mentor-assignments`],
    enabled: !!id,
  });
  
  // Fetch feasibility assessments for this business
  const {
    data: assessments,
    isLoading: isLoadingAssessments,
    refetch: refetchAssessments,
    isSuccess: assessmentsLoaded,
  } = useQuery({
    queryKey: [`/api/feasibility/assessments`, id], // Use id directly from useParams
    queryFn: async () => {
      console.log("Fetching assessments for business:", id);
      const response = await apiRequest(
        "GET", 
        `/api/feasibility/assessments?businessId=${id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch assessments");
      }
      const data = await response.json();
      console.log("Fetched assessments:", data);
      return data;
    },
    enabled: !!id,
    staleTime: 5000
  });

  const parseJsonField = (field: any): any[] => {
    if (!field) return [];
    
    try {
      // If it's already an array, return it
      if (Array.isArray(field)) {
        return field;
      }
      
      // If it's a string, try to parse it
      if (typeof field === 'string') {
        // Check if it looks like a JSON string
        if (field.trim().startsWith('[') && field.trim().endsWith(']')) {
          const parsed = JSON.parse(field);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
        
        // If not a JSON array but a string with content, split by newlines
        if (field.trim().length > 0) {
          return field.split('\n').filter(item => item.trim().length > 0);
        }
      }
      
      console.warn("Unexpected field type for JSON parsing:", field);
      return [];
    } catch (error) {
      console.error("Error parsing JSON field:", error, field);
      return [];
    }
  };
  
  // Add this effect to process business data when it's received
  // Place this inside your BusinessDetailPage component
  useEffect(() => {
    if (business) {
      console.log("Raw business data:", business);
      
      // Process business objectives
      if (business.businessObjectives) {
        console.log("Raw business objectives:", business.businessObjectives);
        console.log("Type:", typeof business.businessObjectives);
        
        try {
          if (typeof business.businessObjectives === 'string') {
            business.businessObjectives = parseJsonField(business.businessObjectives);
            console.log("Parsed business objectives:", business.businessObjectives);
          }
        } catch (error) {
          console.error("Error parsing business objectives:", error);
          business.businessObjectives = [];
        }
      }
      
      // Process short-term goals
      if (business.shortTermGoals) {
        console.log("Raw short-term goals:", business.shortTermGoals);
        console.log("Type:", typeof business.shortTermGoals);
        
        try {
          if (typeof business.shortTermGoals === 'string') {
            business.shortTermGoals = parseJsonField(business.shortTermGoals);
            console.log("Parsed short-term goals:", business.shortTermGoals);
          }
        } catch (error) {
          console.error("Error parsing short-term goals:", error);
          business.shortTermGoals = [];
        }
      }
    }
  }, [business]);

  
  // Mutation to delete feasibility assessment
  const deleteAssessmentMutation = useMutation({
    mutationFn: async (assessmentId: number) => {
      console.log("Deleting assessment:", assessmentId);
      const response = await apiRequest(
        "DELETE", 
        `/api/feasibility/assessments/${assessmentId}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete assessment");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Delete successful, response:", data);
      
      toast({
        title: "Assessment Deleted",
        description: "The feasibility assessment has been deleted successfully.",
      });
      
      // Reset state variables
      setHasFeasibilityAssessment(false);
      setCurrentAssessment(null);
      
      // Clear localStorage
      try {
        localStorage.removeItem(`business_${id}_has_assessment`);
        localStorage.removeItem(`business_${id}_assessment_id`);
      } catch (e) {
        console.error("Error clearing localStorage:", e);
      }
      
      // Force data invalidation and refetch
      queryClient.invalidateQueries([`/api/feasibility/assessments`]);
      
      // Add a small delay before refetching to ensure the server has processed the delete
      setTimeout(() => {
        refetchAssessments();
        refetchBusiness();
      }, 300);
    },
    onError: (error: Error) => {
      console.error("Delete error:", error);
      toast({
        title: "Delete Error",
        description: error.message || "Failed to delete assessment",
        variant: "destructive",
      });
    }
  });
  // Delete business mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/business-profiles/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete business");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Business Deleted",
        description: "The business has been successfully deleted",
        variant: "default",
      });
      navigate("/businesses");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete business",
        variant: "destructive",
      });
    }
  });

  // Handler for deleting a business
  const handleDeleteBusiness = () => {
    if (confirm("Are you sure you want to delete this business? This action cannot be undone and will remove all related data.")) {
      deleteMutation.mutate();
    }
  };

  const [localMentorAssignments, setLocalMentorAssignments] = useState<MentorAssignment[]>([]);

// Then add this effect to sync the query data with local state
  useEffect(() => {
    if (mentorAssignments) {
      setLocalMentorAssignments(mentorAssignments);
    }
  }, [mentorAssignments]);
 
  // Handle errors with useEffect to avoid re-renders
  React.useEffect(() => {
    if (businessError) {
      toast({
        title: "Error",
        description: "Failed to load business details",
        variant: "destructive",
      });
    }

    if (membersError) {
      toast({
        title: "Error",
        description: "Failed to load business owners",
        variant: "destructive",
      });
    }
    
    // Only show mentor assignment errors if it's not a 404 (which is expected when no mentors assigned)
    if (mentorAssignmentsError && mentorAssignmentsError.message !== "Not found") {
      toast({
        title: "Error",
        description: "Failed to load mentor assignments",
        variant: "destructive",
      });
    }
  }, [businessError, membersError, mentorAssignmentsError, toast]);

  // Get model badge color
  const getModelColor = (model: string) => {
    switch (model) {
      case "Collaborative":
        return { bg: THEME.primary, text: "white" };
      case "MakerSpace":
        return { bg: THEME.secondary, text: "white" };
      case "Madam Anchor":
        return { bg: THEME.accent, text: THEME.dark };
      default:
        return { bg: "#6c757d", text: "white" };
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

  // Loading state
  if (isLoadingBusiness || isLoadingMembers || isLoadingMentorAssignments) {
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
            <p className="text-gray-500">Please wait while we fetch the business information</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Not found state
  if (!business) {
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
            <h3 className="text-xl font-bold text-blue-700 mb-3">Business Not Found</h3>
            <p className="text-blue-600 mb-6">
              The requested business could not be found. It may have been deleted or you may not have permission to view it.
            </p>
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
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <MentorAssignmentDialog 
        open={mentorAssignmentOpen}
        onOpenChange={setMentorAssignmentOpen}
        business={business}
      />
      
      <MakerspaceAssignmentDialog
        open={makerspaceAssignmentOpen}
        onOpenChange={setMakerspaceAssignmentOpen}
        business={business}
      />
      

      <div className="container mx-auto py-10 px-4">
        {/* Header with back button */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
        >
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/businesses")}
              className="mr-4 rounded-full hover:bg-gray-100 transition-colors duration-300"
              style={{ color: THEME.primary }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: THEME.dark }}>{business.businessName}</h1>
                <div className="flex items-center mt-1">
                  <Badge 
                    className="mr-2 text-white shadow-sm"
                    style={{ backgroundColor: getDistrictColor(business.district) }}
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    {business.district.split(',')[0]}
                  </Badge>
                  <p className="text-gray-500 flex items-center">
                    <Store className="h-3.5 w-3.5 mr-1" />
                    {getCategoryNameById(business.serviceCategoryId) || "Uncategorized"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-3 rounded-full hover:bg-gray-100"
                onClick={() => {
                  refetchBusiness();
                  toast({
                    title: "Refreshing",
                    description: "Updating business information",
                    variant: "default",
                  });
                }}
              >
                <RefreshCw className="h-4 w-4" style={{ color: THEME.primary }} />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="border-gray-200 hover:border-gray-300 transition-all duration-300 group"
              onClick={() => navigate(`/businesses/${id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" style={{ color: THEME.accent }} />
              Edit Business
            </Button>
            <Button
              variant="outline"
              className="border-gray-200 hover:border-gray-300 transition-all duration-300 group"
              onClick={() => setMentorAssignmentOpen(true)}
            >
              <UserCog className="mr-2 h-4 w-4" style={{ color: THEME.primary }} />
              Assign Mentors
            </Button>
            
            {/* Makerspace Assignment button - Only show for MakerSpace model businesses */}
            {business.dareModel === "MakerSpace" && (
              <Button
                variant="outline"
                className="border-gray-200 hover:border-gray-300 transition-all duration-300 group"
                onClick={() => setMakerspaceAssignmentOpen(true)}
              >
                <Store className="mr-2 h-4 w-4" style={{ color: THEME.secondary }} />
                Assign Makerspace
              </Button>
            )}
            {/* Performance Tracking button */}
            <Button
              variant="default"
              className="bg-gradient-to-r from-[#FF5F00] via-[#EB001B] to-[#F79E1B] border-none text-white"
              onClick={() => navigate(`/businesses/${id}/performance`)}
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              Performance Tracking
            </Button>
            
            {/* Resource Management button */}
            {(business.dareModel === "MakerSpace" || business.dareModel === "Collaborative" || business.dareModel === "Madam Anchor") && (
              <Button
                variant="default"
                className="bg-gradient-to-r from-[#00A9A7] via-[#007F87] to-[#00576B] border-none text-white"
                onClick={() => navigate(`/businesses/${id}/resources`)}
              >
                <Package className="mr-2 h-4 w-4" />
                Manage Resources
              </Button>
            )}
            
            {/* Feasibility Assessment button */}
            <Button
              variant="default"
              className="bg-gradient-to-r from-[#1A1F71] via-[#2A3F9D] to-[#4263EB] border-none text-white"
              onClick={() => {
                // First refresh assessments to ensure we have the latest data
                refetchAssessments().then(() => {
                  // The BusinessAssessmentsTab will handle this now, so we need to switch to that tab
                  setTab("assessments");
                  
                  toast({
                    title: "Feasibility Matrix",
                    description: "Switched to assessments tab",
                    variant: "default",
                  });
                });
              }}
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              View Assessments
            </Button>
            
            {/* Delete Business button */}
            <Button
              variant="outline"
              className="border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 transition-all duration-300 group"
              onClick={handleDeleteBusiness}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Business
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <Tabs 
            value={tab} 
            onValueChange={setTab} 
            className="mb-6"
          >
            <TabsList 
              className="grid w-full max-w-5xl grid-cols-5 p-1 rounded-full"
              style={{ 
                backgroundColor: "#f3f4f6",
                border: "1px solid #e5e7eb"
              }}
            >
              <TabsTrigger 
                value="overview" 
                className="rounded-full data-[state=active]:shadow-md transition-all duration-300"
                style={{ 
                  color: tab === "overview" ? "white" : THEME.dark,
                  background: tab === "overview" 
                    ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                    : "transparent"
                }}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="members" 
                className="rounded-full data-[state=active]:shadow-md transition-all duration-300"
                style={{ 
                  color: tab === "members" ? "white" : THEME.dark,
                  background: tab === "members" 
                    ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                    : "transparent"
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                Owners ({members?.length || 0})
              </TabsTrigger>
              <TabsTrigger 
                value="mentors" 
                className="rounded-full data-[state=active]:shadow-md transition-all duration-300"
                style={{ 
                  color: tab === "mentors" ? "white" : THEME.dark,
                  background: tab === "mentors" 
                    ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                    : "transparent"
                }}
              >
                <UserCog className="mr-2 h-4 w-4" />
                Mentors ({mentorAssignments ? mentorAssignments.length : 0})
              </TabsTrigger>
              <TabsTrigger 
                value="assessments" 
                className="rounded-full data-[state=active]:shadow-md transition-all duration-300"
                style={{ 
                  color: tab === "assessments" ? "white" : THEME.dark,
                  background: tab === "assessments" 
                    ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                    : "transparent"
                }}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Assessments ({assessments?.length || 0})
              </TabsTrigger>
              <TabsTrigger 
                value="gallery" 
                className="rounded-full data-[state=active]:shadow-md transition-all duration-300"
                style={{ 
                  color: tab === "gallery" ? "white" : THEME.dark,
                  background: tab === "gallery" 
                    ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                    : "transparent"
                }}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Gallery
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8 mt-6">
              {/* Overview Section */}
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {/* Business Details */}
                <motion.div variants={cardVariant}>
                  <Card className="border-gray-100 shadow-md overflow-hidden h-full">
                    <div className="h-1 w-full" style={{ 
                      background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary})` 
                    }}></div>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-lg" style={{ color: THEME.dark }}>
                        <div className="h-9 w-9 rounded-full flex items-center justify-center mr-3" style={{ 
                          background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}10 100%)` 
                        }}>
                          <Briefcase className="h-5 w-5" style={{ color: THEME.primary }} />
                        </div>
                        Business Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Business Logo */}
                      {business.businessLogo && (
                        <div className="flex justify-center mb-2">
                          <div className="w-24 h-24 rounded-md overflow-hidden border border-gray-200 shadow-sm">
                            <img 
                              src={business.businessLogo} 
                              alt={`${business.businessName} logo`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500 flex items-center">
                            <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                            DARE Model
                          </span>
                          <Badge 
                            className="shadow-sm text-sm py-1"
                            style={{ 
                              backgroundColor: getModelColor(business.dareModel || "").bg,
                              color: getModelColor(business.dareModel || "").text
                            }}
                          >
                            {business.dareModel || "Not specified"}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-5 rounded-lg bg-gray-50">
                        <div className="space-y-6">
                          <div>
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              Location
                            </span>
                            <p className="mt-1 pl-6 text-gray-700">
                              {business.businessLocation || "No specific location provided"}
                            </p>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <Tag className="h-4 w-4 mr-2 text-gray-400" />
                              Service Category
                            </span>
                            <div className="mt-1 pl-6">
                              {business.serviceCategoryId ? (
                                <Badge 
                                  className="bg-gray-100 text-gray-800 border-gray-200 shadow-sm"
                                >
                                  {getCategoryNameById(business.serviceCategoryId)}
                                </Badge>
                              ) : (
                                <span className="text-gray-500 italic">Not categorized</span>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <Tag className="h-4 w-4 mr-2 text-gray-400" />
                              Service Subcategory
                            </span>
                            <div className="mt-1 pl-6">
                              {business.serviceCategoryId && business.serviceSubcategoryId ? (
                                <Badge 
                                  className="bg-gray-100 text-gray-800 border-gray-200 shadow-sm"
                                >
                                  {getSubcategoryNameById(business.serviceCategoryId, business.serviceSubcategoryId)}
                                </Badge>
                              ) : (
                                <span className="text-gray-500 italic">Not specified</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                              Business Model
                            </span>
                            <div className="mt-1 pl-6">
                              <Badge 
                                className="bg-gray-100 text-gray-800 border-gray-200 shadow-sm"
                              >
                                {business.businessModel || "Not specified"}
                              </Badge>
                            </div>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              Contact
                            </span>
                            <p className="mt-1 pl-6 text-gray-700">
                              {business.businessContact || "No contact information provided"}
                            </p>
                          </div>
                          
                          {/* Add email field */}
                          <div>
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              Email
                            </span>
                            <p className="mt-1 pl-6 text-gray-700">
                              {business.businessEmail || "No email provided"}
                            </p>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              Start Date
                            </span>
                            <p className="mt-1 pl-6 text-gray-700">
                              {business.businessStartDate
                                ? formatDate(business.businessStartDate)
                                : "No start date specified"}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <FileCheck className="h-4 w-4 mr-2 text-gray-400" />
                              Registration Status
                            </span>
                            <div className="mt-1 pl-6">
                              <Badge 
                                className={business.registrationStatus === "Registered" 
                                  ? "bg-green-100 text-green-800 border-green-200 shadow-sm" 
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200 shadow-sm"}
                              >
                                {business.registrationStatus || "Unspecified"}
                              </Badge>
                            </div>
                          </div>
                          
                          {business.registrationStatus === "Registered" && (
                            <>
                              <div>
                                <span className="text-sm font-medium text-gray-500 flex items-center">
                                  <BookText className="h-4 w-4 mr-2 text-gray-400" />
                                  Registration Number
                                </span>
                                <p className="mt-1 pl-6 text-gray-700">
                                  {business.registrationNumber || "Not provided"}
                                </p>
                              </div>
                              
                              <div>
                                <span className="text-sm font-medium text-gray-500 flex items-center">
                                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                                  Tax ID Number
                                </span>
                                <p className="mt-1 pl-6 text-gray-700">
                                  {business.taxIdentificationNumber || "Not provided"}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Business Description & MasterCard Data */}
                <motion.div variants={cardVariant}>
                  <Card className="border-gray-100 shadow-md overflow-hidden h-full">
                    <div className="h-1 w-full" style={{ 
                      background: `linear-gradient(to right, ${THEME.primary}, ${THEME.accent})` 
                    }}></div>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-lg" style={{ color: THEME.dark }}>
                        <div className="h-9 w-9 rounded-full flex items-center justify-center mr-3" style={{ 
                          background: `linear-gradient(135deg, ${THEME.primary}20 0%, ${THEME.accent}10 100%)` 
                        }}>
                          <FileText className="h-5 w-5" style={{ color: THEME.accent }} />
                        </div>
                        Business Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="p-5 rounded-lg bg-gray-50">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          {business.businessDescription || "No business description provided."}
                        </p>
                      </div>
                      
                      {/* Enterprise Type & Size Section */}
                      <div className="mt-8">
                        <h3 className="flex items-center font-medium mb-3" style={{ color: THEME.dark }}>
                          <Building className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                          Enterprise Details
                        </h3>
                        <div className="space-y-4 p-5 rounded-lg bg-gray-50">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Type</span>
                            <div className="mt-1">
                              <Badge className="bg-blue-100 text-blue-800 shadow-sm">
                                {business.enterpriseType || "Not specified"}
                              </Badge>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium text-gray-500">Size</span>
                            <div className="mt-1">
                              <Badge className="bg-purple-100 text-purple-800 shadow-sm">
                                {business.enterpriseSize || "Not specified"}
                              </Badge>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium text-gray-500">Sector</span>
                            <div className="mt-1">
                              <Badge className="bg-green-100 text-green-800 shadow-sm">
                                {business.sector || "Not specified"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* MasterCard Program Information */}
                      <div className="mt-4">
                        <h3 className="flex items-center font-medium mb-3" style={{ color: THEME.dark }}>
                          <div className="h-5 w-5 mr-2 rounded-full flex items-center justify-center" 
                            style={{ backgroundColor: `${THEME.primary}15` }}>
                            <span className="text-xs font-bold" style={{ color: THEME.primary }}>M</span>
                          </div>
                          Program Information
                        </h3>
                        <div className="space-y-4 p-5 rounded-lg bg-gray-50">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Implementing Partner</span>
                            <p className="mt-1 text-gray-700 text-sm">
                              {business.implementingPartnerName || "Not specified"}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium text-gray-500">Program Name</span>
                            <p className="mt-1 text-gray-700 text-sm">
                              {business.programName || "Not specified"}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium text-gray-500">Program Contact</span>
                            <p className="mt-1 text-gray-700 text-sm">
                              {business.programContactPerson || "Not specified"}
                              {business.programContactPhoneNumber && (
                                <span className="ml-2 text-gray-500 text-xs">
                                  ({business.programContactPhoneNumber})
                                </span>
                              )}
                            </p>
                          </div>
                          
                          {/* Youth Data Stats */}
                          <div className="grid grid-cols-3 gap-2 mt-4">
                            <div className="bg-blue-50 p-3 rounded-md">
                              <span className="text-xs font-medium text-blue-600">Total Youth</span>
                              <p className="text-xl font-semibold text-blue-700">
                                {business.totalYouthInWorkReported || 0}
                              </p>
                            </div>
                            <div className="bg-amber-50 p-3 rounded-md">
                              <span className="text-xs font-medium text-amber-600">Refugees</span>
                              <p className="text-xl font-semibold text-amber-700">
                                {business.youthRefugeeCount || 0}
                              </p>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-md">
                              <span className="text-xs font-medium text-orange-600">IDPs</span>
                              <p className="text-xl font-semibold text-orange-700">
                                {business.youthIdpCount || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
              
              {/* Business Objectives and Goals */}
              <motion.div variants={cardVariant}>
              <Card className="border-gray-100 shadow-md overflow-hidden">
                <div className="h-1 w-full" style={{ 
                  background: `linear-gradient(to right, ${THEME.dark}, ${THEME.secondary})` 
                }}></div>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg" style={{ color: THEME.dark }}>
                    <div className="h-9 w-9 rounded-full flex items-center justify-center mr-3" style={{ 
                      background: `linear-gradient(135deg, ${THEME.dark}10 0%, ${THEME.secondary}20 100%)` 
                    }}>
                      <Target className="h-5 w-5" style={{ color: THEME.secondary }} />
                    </div>
                    Objectives and Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Business Objectives */}
                    <div className="p-5 rounded-lg bg-gray-50 border border-gray-100">
                      <h4 className="font-medium mb-3 flex items-center" style={{ color: THEME.dark }}>
                        <Target className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                        Business Objectives
                      </h4>
                      {/* Dynamically handle different business.businessObjectives formats */}
                      {(() => {
                        const objectives = (() => {
                          if (!business.businessObjectives) return [];
                          if (Array.isArray(business.businessObjectives)) return business.businessObjectives;
                          if (typeof business.businessObjectives === 'string') {
                            try {
                              return parseJsonField(business.businessObjectives);
                            } catch (e) {
                              console.error("Error parsing objectives:", e);
                              return [];
                            }
                          }
                          return [];
                        })();
                        
                        if (objectives && objectives.length > 0) {
                          return (
                            <ul className="list-disc list-inside space-y-2 pl-4">
                              {objectives.map((objective: any, index: number) => (
                                <li key={index} className="text-gray-700">{objective}</li>
                              ))}
                            </ul>
                          );
                        } else {
                          return <p className="text-gray-500 italic">No business objectives specified</p>;
                        }
                      })()}
                    </div>
                    
                    {/* Short-Term Goals */}
                    <div className="p-5 rounded-lg bg-gray-50 border border-gray-100">
                      <h4 className="font-medium mb-3 flex items-center" style={{ color: THEME.dark }}>
                        <Goal className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                        Short-Term Goals
                      </h4>
                      {/* Dynamically handle different business.shortTermGoals formats */}
                      {(() => {
                        const goals = (() => {
                          if (!business.shortTermGoals) return [];
                          if (Array.isArray(business.shortTermGoals)) return business.shortTermGoals;
                          if (typeof business.shortTermGoals === 'string') {
                            try {
                              return parseJsonField(business.shortTermGoals);
                            } catch (e) {
                              console.error("Error parsing goals:", e);
                              return [];
                            }
                          }
                          return [];
                        })();
                        
                        if (goals && goals.length > 0) {
                          return (
                            <ul className="list-disc list-inside space-y-2 pl-4">
                              {goals.map((goal: any, index: number) => (
                                <li key={index} className="text-gray-700">{goal}</li>
                              ))}
                            </ul>
                          );
                        } else {
                          return <p className="text-gray-500 italic">No short-term goals specified</p>;
                        }
                      })()}
                    </div>
                  </div>
                  
                  {/* Target Market */}
                  <div className="mt-6 p-5 rounded-lg bg-gray-50 border border-gray-100">
                    <h4 className="font-medium mb-3 flex items-center" style={{ color: THEME.dark }}>
                      <Users className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                      Target Market
                    </h4>
                    <p className="text-gray-700">
                      {business.targetMarket || "No target market information specified"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <Card className="border-gray-100 shadow-md overflow-hidden">
                  <div className="h-1 w-full" style={{ 
                    background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})` 
                  }}></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full flex items-center justify-center mr-3" style={{ 
                          background: `linear-gradient(135deg, ${THEME.dark}20 0%, ${THEME.dark}10 100%)` 
                        }}>
                          <Users className="h-5 w-5" style={{ color: THEME.dark }} />
                        </div>
                        <div>
                          <CardTitle className="text-lg" style={{ color: THEME.dark }}>
                            Business Owners
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Youth who own and operate this business
                          </CardDescription>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 hover:border-gray-300 transition-all duration-300"
                        onClick={() => navigate(`/businesses/${id}/add-members`)}
                      >
                        <PlusCircle className="mr-2 h-3.5 w-3.5" style={{ color: THEME.primary }} />
                        Add Owner
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {members && members.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader style={{ background: "#f9fafb" }}>
                            <TableRow>
                              <TableHead className="font-semibold" style={{ color: THEME.dark }}>Name</TableHead>
                              <TableHead className="font-semibold" style={{ color: THEME.dark }}>Role</TableHead>
                              <TableHead className="font-semibold" style={{ color: THEME.dark }}>Joined Date</TableHead>
                              <TableHead className="font-semibold" style={{ color: THEME.dark }}>District</TableHead>
                              <TableHead className="text-right font-semibold" style={{ color: THEME.dark }}>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {members.map((member) => (
                                <motion.tr
                                  key={member.id}
                                  variants={rowVariant}
                                  className="cursor-pointer transition-all duration-300"
                                  style={{
                                    backgroundColor: hoveredRow === member.id ? '#f9fafb' : 'white',
                                    transform: hoveredRow === member.id ? 'scale(1.005)' : 'scale(1)',
                                    boxShadow: hoveredRow === member.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                  }}
                                  onMouseEnter={() => setHoveredRow(member.id)}
                                  onMouseLeave={() => setHoveredRow(null)}
                                  onClick={() => navigate(`/youth/profiles/${member.id}`)}
                                >
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Avatar className="h-8 w-8 mr-3">
                                        <AvatarImage src={member.profilePicture || undefined} alt={member.fullName} />
                                        <AvatarFallback style={{ 
                                          background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}20 50%, ${THEME.accent}20 100%)` 
                                        }}>
                                          {member.fullName.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium text-gray-900">{member.fullName}</div>
                                        <div className="text-xs text-gray-500">{member.phoneNumber || 'No contact'}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      className="bg-blue-100 text-blue-800 border-blue-200 shadow-sm"
                                    >
                                      Owner
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                      {(member as any).joinDate
                                        ? formatDate((member as any).joinDate)
                                        : "Not specified"}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      className="text-white shadow-sm"
                                      style={{ backgroundColor: getDistrictColor(member.district) }}
                                    >
                                      {member.district.split(',')[0]}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end space-x-1">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="rounded-full hover:bg-blue-50 transition-colors"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/youth/profiles/${member.id}`);
                                              }}
                                            >
                                              <Eye className="h-4 w-4 text-blue-600" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>View Profile</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="rounded-full hover:bg-red-50 transition-colors"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveMember(member.id);
                                              }}
                                            >
                                              <UserMinus className="h-4 w-4 text-red-600" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Remove Owner</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </TableCell>
                                </motion.tr>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ 
                          background: `linear-gradient(135deg, ${THEME.primary}10 0%, ${THEME.accent}10 100%)` 
                        }}>
                          <Users className="h-8 w-8" style={{ color: THEME.primary }} />
                        </div>
                        <h3 className="text-lg font-medium" style={{ color: THEME.dark }}>No Owners Yet</h3>
                        <p className="text-gray-500 mt-2 mb-6 max-w-md mx-auto">
                          This business doesn't have any owners yet. Add youth members to track ownership and participation in this business.
                        </p>
                        <Button
                          className="shadow-sm hover:shadow-md transition-all duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                            border: "none" 
                          }}
                          onClick={() => navigate(`/businesses/${id}/add-members`)}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Owners
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="mentors" className="mt-6">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <Card className="border-gray-100 shadow-md overflow-hidden">
                  <div className="h-1 w-full" style={{ 
                    background: `linear-gradient(to right, ${THEME.primary}, ${THEME.dark})` 
                  }}></div>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center text-lg" style={{ color: THEME.dark }}>
                        <div className="h-9 w-9 rounded-full flex items-center justify-center mr-3" style={{ 
                          background: `linear-gradient(135deg, ${THEME.primary}10 0%, ${THEME.dark}20 100%)` 
                        }}>
                          <UserCog className="h-5 w-5" style={{ color: THEME.primary }} />
                        </div>
                        Assigned Mentors
                      </CardTitle>
                      
                      <Button 
                        variant="outline" 
                        className="gap-1.5 text-xs"
                        onClick={() => setMentorAssignmentOpen(true)}
                      >
                        <UserCog className="mr-2 h-3.5 w-3.5" style={{ color: THEME.primary }} />
                        Assign Mentor
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(localMentorAssignments) && localMentorAssignments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader style={{ background: "#f9fafb" }}>
                            <TableRow>
                              <TableHead className="font-semibold" style={{ color: THEME.dark }}>Mentor</TableHead>
                              <TableHead className="font-semibold" style={{ color: THEME.dark }}>Specialization</TableHead>
                              <TableHead className="font-semibold" style={{ color: THEME.dark }}>Assigned Date</TableHead>
                              <TableHead className="font-semibold" style={{ color: THEME.dark }}>Status</TableHead>
                              <TableHead className="text-right font-semibold" style={{ color: THEME.dark }}>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {localMentorAssignments.map((assignment: MentorAssignment) => (
                              <motion.tr
                                key={assignment.mentorId}
                                variants={rowVariant}
                                className="transition-all duration-300"
                              >
                                <TableCell>
                                  <div className="flex items-center">
                                    <Avatar className="h-8 w-8 mr-3">
                                      {assignment.mentor?.profilePicture ? (
                                        <AvatarImage src={assignment.mentor.profilePicture} alt={assignment.mentor.name} />
                                      ) : null}
                                      <AvatarFallback style={{ 
                                        background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}20 50%, ${THEME.accent}20 100%)` 
                                      }}>
                                        {assignment.mentor?.name ? assignment.mentor.name.charAt(0) : 'M'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {assignment.mentor?.name || `Mentor #${assignment.mentorId}`}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {assignment.mentor?.email || "District Mentor"}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {assignment.mentor?.specialization || assignment.mentorshipFocus || "Not specified"}
                                </TableCell>
                                <TableCell>
                                  {assignment.assignedDate ? 
                                    formatDate(assignment.assignedDate) : 
                                    <span className="text-gray-400 italic">Not recorded</span>
                                  }
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    className={assignment.isActive ? 
                                      "bg-green-100 text-green-800 border-green-200" : 
                                      "bg-gray-100 text-gray-800 border-gray-200"}
                                  >
                                    {assignment.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end space-x-1">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-500">
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>View details</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    
                                    {/* Direct inline delete button instead of separate component */}
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-gray-500 hover:text-red-500"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (window.confirm(`Are you sure you want to remove ${assignment.mentor?.name || 'this mentor'} from ${business.businessName}?`)) {
                                                // Direct SQL approach
                                                apiRequest("DELETE", `/api/mentor-businesses/${assignment.mentorId}/${business.id}`)
                                                  .then(() => {
                                                    // Update local state
                                                    setLocalMentorAssignments(prev => 
                                                      prev.filter(a => a.mentorId !== assignment.mentorId)
                                                    );
                                                    
                                                    toast({
                                                      title: "Mentor Removed",
                                                      description: `Mentor has been removed from ${business.businessName}`,
                                                    });
                                                  })
                                                  .catch(error => {
                                                    console.error("Error removing mentor:", error);
                                                    
                                                    // Even if server request fails, update UI optimistically
                                                    setLocalMentorAssignments(prev => 
                                                      prev.filter(a => a.mentorId !== assignment.mentorId)
                                                    );
                                                    
                                                    toast({
                                                      title: "Removed from view",
                                                      description: "The mentor has been removed from view.",
                                                    });
                                                  });
                                              }
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Remove mentor</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                        <div className="rounded-full bg-gray-50 p-4 mb-4">
                          <UserCog className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-600 mb-1">No Mentors Assigned</h3>
                        <p className="text-gray-500 mb-4 max-w-md">
                          No mentors have been assigned to this business yet. Assign mentors to provide guidance and support to the business.
                        </p>
                        <Button 
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => setMentorAssignmentOpen(true)}
                        >
                          <UserCog className="mr-2 h-4 w-4" style={{ color: THEME.primary }} />
                          Assign Mentor
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            {/* Assessments Tab */}
            <TabsContent value="assessments" className="space-y-8 mt-6">
              <BusinessAssessmentsTab 
                business={business}
                id={id}
                isLoadingAssessments={isLoadingAssessments}
                assessments={assessments}
                refetchAssessments={refetchAssessments}
                refetchBusiness={refetchBusiness}
              />
            </TabsContent>
            
            {/* Gallery Tab - New */}
            <TabsContent value="gallery" className="space-y-8 mt-6">
              <BusinessGalleryTab 
                business={business}
                id={id}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}