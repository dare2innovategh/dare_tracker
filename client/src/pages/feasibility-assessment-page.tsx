import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  ChevronLeft, 
  Loader2, 
  Save, 
  Check as ClipboardCheck,
  Briefcase,
  BarChart2,
  DollarSign,
  Settings,
  Users,
  Shield,
  FileText 
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { FeasibilityAssessment, insertFeasibilityAssessmentSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type ScoreSelectProps = {
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
};

// Component for score selection (1-5) with Mastercard theme
const ScoreSelect = ({ value, onChange, disabled }: ScoreSelectProps) => {
  // Mastercard color theme
  const THEME = {
    primary: "#FF5F00", // Mastercard Orange
    secondary: "#EB001B", // Mastercard Red
    accent: "#F79E1B", // Mastercard Yellow
    dark: "#1A1F71", // Mastercard Dark Blue
  };
  
  return (
    <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full border-gray-200 focus:border-gray-300">
        <SelectValue placeholder="Select score (1-5)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1" className="flex items-center py-2">
          <span className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: THEME.secondary }}></span>
          1 - Very Poor
        </SelectItem>
        <SelectItem value="2" className="flex items-center py-2">
          <span className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: "#FF8080" }}></span>
          2 - Poor
        </SelectItem>
        <SelectItem value="3" className="flex items-center py-2">
          <span className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: "#FFD580" }}></span>
          3 - Average
        </SelectItem>
        <SelectItem value="4" className="flex items-center py-2">
          <span className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: "#A0D995" }}></span>
          4 - Good
        </SelectItem>
        <SelectItem value="5" className="flex items-center py-2">
          <span className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: "#4CAF50" }}></span>
          5 - Excellent
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default function FeasibilityAssessmentPage() {
  const params = useParams<{ id: string }>();
  const isNewAssessment = params.id === "new";
  const assessmentId = isNewAssessment ? undefined : Number(params.id);
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewComments, setReviewComments] = useState("");
  const [hasFeasibilityAssessment, setHasFeasibilityAssessment] = useState(false);
  
  // Extract businessId from URL query parameters if present
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const businessIdParam = searchParams.get('businessId');
  
  console.log("Initial setup - businessIdParam:", businessIdParam, "isNewAssessment:", isNewAssessment);

  // Extended schema with validation
  const formSchema = z.object({
    businessName: z.string().min(2, "Business name is required"),
    district: z.string().min(1, "District is required"),
    businessId: z.number().optional(),
    youthId: z.number().optional(),
    businessDescription: z.string().optional(),
    
    // Market Assessment
    marketDemand: z.string().optional(),
    competitionLevel: z.string().optional(),
    customerAccessibility: z.string().optional(),
    pricingPower: z.string().optional(),
    marketingEffectiveness: z.string().optional(),
    
    // Financial Assessment
    startupCosts: z.string().optional(),
    operatingCosts: z.string().optional(),
    profitMargins: z.string().optional(),
    cashFlow: z.string().optional(),
    fundingAccessibility: z.string().optional(),
    
    // Operational Assessment
    locationSuitability: z.string().optional(),
    resourceAvailability: z.string().optional(),
    supplyChainReliability: z.string().optional(),
    operationalEfficiency: z.string().optional(),
    scalabilityPotential: z.string().optional(),
    
    // Team Assessment
    skillsetRelevance: z.string().optional(),
    experienceLevel: z.string().optional(),
    teamCommitment: z.string().optional(),
    teamCohesion: z.string().optional(),
    leadershipCapacity: z.string().optional(),
    
    // Digital Readiness Assessment
    digitalSkillLevel: z.string().optional(),
    techInfrastructure: z.string().optional(),
    digitalMarketingCapacity: z.string().optional(),
    dataManagement: z.string().optional(),
    techAdaptability: z.string().optional(),
    
    status: z.string().optional(),
    assessmentDate: z.string().optional(),
    riskFactors: z.string().optional(),
    growthOpportunities: z.string().optional(),
    recommendedActions: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  // Setup form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      district: "",
      businessId: businessIdParam ? Number(businessIdParam) : undefined,
      businessDescription: "",
      status: "Draft",
      riskFactors: "",
      growthOpportunities: "",
      recommendedActions: "",
    },
  });

  // Fetch assessment data if editing
  const { data: assessment, isLoading: isLoadingAssessment } = useQuery<FeasibilityAssessment>({
    queryKey: [`/api/feasibility/assessments/${assessmentId}`],
    queryFn: async () => {
      if (!assessmentId) return null;
      const response = await fetch(`/api/feasibility/assessments/${assessmentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch assessment");
      }
      return response.json();
    },
    enabled: !!assessmentId,
  });
  
  // Fetch business data if businessId is provided
  const { data: business, isLoading: isLoadingBusiness } = useQuery({
    queryKey: [`/api/business-profiles/${businessIdParam}`],
    queryFn: async () => {
      if (!businessIdParam) return null;
      console.log("Fetching business data for ID:", businessIdParam);
      const response = await fetch(`/api/business-profiles/${businessIdParam}`);
      if (!response.ok) {
        throw new Error("Failed to fetch business details");
      }
      const data = await response.json();
      console.log("Business data fetched:", data);
      return data;
    },
    enabled: !!businessIdParam && isNewAssessment,
    onSuccess: (data) => {
      console.log("Business data loaded in onSuccess:", data);
    }
  });
  
  // Check if business already has a feasibility assessment
  const { data: existingAssessments, isLoading: isLoadingExistingAssessments } = useQuery({
    queryKey: [`/api/feasibility/assessments/business/${businessIdParam}`],
    queryFn: async () => {
      if (!businessIdParam) return [];
      try {
        const response = await fetch(`/api/feasibility/assessments/business/${businessIdParam}`);
        if (!response.ok) {
          console.error("Failed to fetch existing assessments");
          return [];
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching existing assessments:", error);
        return [];
      }
    },
    enabled: !!businessIdParam && isNewAssessment,
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setHasFeasibilityAssessment(true);
        // If there's an existing assessment, redirect to it
        if (isNewAssessment) {
          toast({
            title: "Assessment Already Exists",
            description: "This business already has a feasibility assessment.",
          });
          // Navigate to the existing assessment
          navigate(`/feasibility-assessments/${data[0].id}`);
        }
      }
    }
  });
  
  // Combine loading states
  const isLoading = isLoadingAssessment || isLoadingBusiness || isLoadingExistingAssessments;

  // Update form with business data when creating new assessment
  useEffect(() => {
    console.log("useEffect 1: business", business, "isNewAssessment", isNewAssessment);
    
    if (business && isNewAssessment) {
      console.log("Setting business data in form - useEffect 1:", business);
      
      // Prefill form with business data
      form.setValue("businessName", business.businessName || "");
      form.setValue("district", business.district || "");
      form.setValue("businessId", business.id);
      
      // Include other business details if available
      if (business.businessDescription) {
        form.setValue("businessDescription", business.businessDescription);
      }
      
      console.log("After setting business data, form values:", form.getValues());
    }
  }, [business, form, isNewAssessment]);

  // Update form values when assessment data is loaded
  useEffect(() => {
    if (assessment) {
      // Reset form with assessment data
      form.reset({
        businessName: assessment.businessName || "",
        district: assessment.district || "",
        businessId: assessment.businessId || undefined,
        youthId: assessment.youthId || undefined,
        businessDescription: assessment.businessDescription || "",
        
        // Market Assessment
        marketDemand: assessment.marketDemand || undefined,
        competitionLevel: assessment.competitionLevel || undefined,
        customerAccessibility: assessment.customerAccessibility || undefined,
        pricingPower: assessment.pricingPower || undefined,
        marketingEffectiveness: assessment.marketingEffectiveness || undefined,
        
        // Financial Assessment
        startupCosts: assessment.startupCosts || undefined,
        operatingCosts: assessment.operatingCosts || undefined,
        profitMargins: assessment.profitMargins || undefined,
        cashFlow: assessment.cashFlow || undefined,
        fundingAccessibility: assessment.fundingAccessibility || undefined,
        
        // Operational Assessment
        locationSuitability: assessment.locationSuitability || undefined,
        resourceAvailability: assessment.resourceAvailability || undefined,
        supplyChainReliability: assessment.supplyChainReliability || undefined,
        operationalEfficiency: assessment.operationalEfficiency || undefined,
        scalabilityPotential: assessment.scalabilityPotential || undefined,
        
        // Team Assessment
        skillsetRelevance: assessment.skillsetRelevance || undefined,
        experienceLevel: assessment.experienceLevel || undefined,
        teamCommitment: assessment.teamCommitment || undefined,
        teamCohesion: assessment.teamCohesion || undefined,
        leadershipCapacity: assessment.leadershipCapacity || undefined,
        
        // Digital Readiness Assessment
        digitalSkillLevel: assessment.digitalSkillLevel || undefined,
        techInfrastructure: assessment.techInfrastructure || undefined,
        digitalMarketingCapacity: assessment.digitalMarketingCapacity || undefined,
        dataManagement: assessment.dataManagement || undefined,
        techAdaptability: assessment.techAdaptability || undefined,
        
        status: assessment.status || "Draft",
        assessmentDate: assessment.assessmentDate ? new Date(assessment.assessmentDate).toISOString().split('T')[0] : undefined,
        riskFactors: assessment.riskFactors || "",
        growthOpportunities: assessment.growthOpportunities || "",
        recommendedActions: assessment.recommendedActions || "",
      });
    }
  }, [assessment, form]);
  
  // Pre-fill the form with business data when creating a new assessment
  useEffect(() => {
    console.log("useEffect 2: isNewAssessment", isNewAssessment, "business", business, "assessment", assessment);
    
    if (isNewAssessment && business && !assessment) {
      console.log("Setting business data in form - useEffect 2:", business);
      
      const formValues = form.getValues();
      console.log("Current form values before reset:", formValues);
      
      // Instead of using reset, which replaces all values, let's directly set the values
      form.setValue("businessName", business.businessName);
      form.setValue("district", business.district);
      form.setValue("businessId", business.id);
      form.setValue("businessDescription", business.businessDescription || "");
      form.setValue("assessmentDate", new Date().toISOString().split('T')[0]);
      
      console.log("After setting business data, form values:", form.getValues());
      
      toast({
        title: "Business Details Loaded",
        description: `Creating feasibility assessment for ${business.businessName}`,
      });
    }
  }, [business, form, isNewAssessment, assessment, toast]);

  // Create a new assessment
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/feasibility/assessments", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create assessment");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment Created",
        description: "The feasibility assessment has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/feasibility/assessments"] });
      // Navigate back to feasibility assessments list for this business if we have a businessId
      if (businessIdParam) {
        navigate(`/feasibility-assessments?businessId=${businessIdParam}`);
      } else {
        navigate("/feasibility-assessments");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update an existing assessment
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("PATCH", `/api/feasibility/assessments/${assessmentId}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update assessment");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment Updated",
        description: "The feasibility assessment has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/feasibility/assessments/${assessmentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/feasibility/assessments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit assessment for review
  const submitForReviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/feasibility/assessments/${assessmentId}/submit`, {});
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit assessment for review");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment Submitted",
        description: "The feasibility assessment has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/feasibility/assessments/${assessmentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/feasibility/assessments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Review assessment
  const reviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/feasibility/assessments/${assessmentId}/review`, {
        reviewComments,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to review assessment");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment Reviewed",
        description: "The feasibility assessment has been reviewed successfully.",
      });
      setIsReviewing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/feasibility/assessments/${assessmentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/feasibility/assessments"] });
      navigate("/feasibility-assessments");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    if (isNewAssessment) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  // Handle submitting for review
  const handleSubmitForReview = () => {
    submitForReviewMutation.mutate();
  };

  // Handle review submission
  const handleSubmitReview = () => {
    reviewMutation.mutate();
  };

  // Check if the form is in a loading state
  const isFormLoading =
    isLoading ||
    createMutation.isPending ||
    updateMutation.isPending ||
    submitForReviewMutation.isPending ||
    reviewMutation.isPending;

  // Determine if form is editable based on status
  const isFormEditable = isNewAssessment || 
    (assessment?.status !== "Completed" && assessment?.status !== "Reviewed");

  // Mastercard color theme
  const THEME = {
    primary: "#FF5F00", // Mastercard Orange
    secondary: "#EB001B", // Mastercard Red
    accent: "#F79E1B", // Mastercard Yellow
    dark: "#1A1F71", // Mastercard Dark Blue
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: THEME.dark }}>
              {isNewAssessment
                ? "Create Feasibility Assessment"
                : "Feasibility Assessment Details"}
            </h1>
            <Button 
              variant="outline" 
              onClick={() => {
                if (businessIdParam) {
                  // If we have a businessId, go back to assessments for this business
                  navigate(`/feasibility-assessments?businessId=${businessIdParam}`);
                } else {
                  // Otherwise go to all assessments
                  navigate("/feasibility-assessments");
                }
              }}
              className="border-gray-300 hover:bg-gray-50 transition-all duration-300"
            >
              <ChevronLeft className="mr-2 h-4 w-4" style={{ color: THEME.dark }} /> 
              <span style={{ color: THEME.dark }}>Back to List</span>
            </Button>
          </div>
        
        {/* Informational banner for new assessments */}
        {isNewAssessment && business && (
          <div className="rounded-lg p-4 border border-l-4 mb-6 animate-fadeIn" style={{ 
            borderLeftColor: THEME.primary,
            backgroundColor: `${THEME.primary}10`,
            borderColor: `${THEME.primary}30`
          }}>
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${THEME.primary}20` }}>
                  <ClipboardCheck className="h-4 w-4" style={{ color: THEME.primary }} />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium" style={{ color: THEME.dark }}>Creating Assessment for {business.businessName}</h3>
                <div className="mt-1 text-sm" style={{ color: `${THEME.dark}90` }}>
                  Complete the assessment form to evaluate the business feasibility. All fields with scores are required.
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {!isNewAssessment && assessment && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Assessment Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Status:</span>
                        <div className={`inline-block ml-2 px-2 py-1 rounded-full text-xs font-medium
                          ${assessment.status === "Draft" ? "bg-gray-100 text-gray-800" : ""}
                          ${assessment.status === "In Progress" ? "bg-blue-100 text-blue-800" : ""}
                          ${assessment.status === "Completed" ? "bg-green-100 text-green-800" : ""}
                          ${assessment.status === "Reviewed" ? "bg-purple-100 text-purple-800" : ""}
                        `}>
                          {assessment.status}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Date:</span>
                        <span className="ml-2">
                          {assessment.assessmentDate ? formatDate(new Date(assessment.assessmentDate)) : "Not set"}
                        </span>
                      </div>
                      {assessment.reviewDate && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Review Date:</span>
                          <span className="ml-2">
                            {formatDate(new Date(assessment.reviewDate))}
                          </span>
                        </div>
                      )}
                      {assessment.overallFeasibilityScore && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Overall Score:</span>
                          <span className="ml-2 font-bold">
                            {assessment.overallFeasibilityScore}/5
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Assessed By:</span>
                        <span className="ml-2">
                          {assessment.assessmentBy || "Unknown"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  {(assessment.status === "Completed" && !isReviewing) && (
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={() => setIsReviewing(true)}
                        disabled={isFormLoading}
                      >
                        Review Assessment
                      </Button>
                    </CardFooter>
                  )}
                </Card>

                {assessment.reviewComments && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Review Comments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-line">{assessment.reviewComments}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {isReviewing ? (
              <Card>
                <CardHeader>
                  <CardTitle>Review Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reviewComments">Review Comments</Label>
                      <Textarea
                        id="reviewComments"
                        placeholder="Enter your feedback and recommendations..."
                        className="h-32"
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsReviewing(false)}
                    disabled={reviewMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitReview}
                    disabled={!reviewComments || reviewMutation.isPending}
                  >
                    {reviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Review
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Card className="border border-gray-100 shadow-sm overflow-hidden">
                    <div className="h-1 w-full" style={{ 
                      background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary})` 
                    }}></div>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center" style={{ color: THEME.dark }}>
                        <div className="h-8 w-8 rounded-full flex items-center justify-center mr-3" style={{ 
                          background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}10 100%)` 
                        }}>
                          <Briefcase className="h-4 w-4" style={{ color: THEME.primary }} />
                        </div>
                        Business Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel style={{ color: THEME.dark }}>Business Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter business name" 
                                  {...field} 
                                  disabled={!isFormEditable || isFormLoading}
                                  className="border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-offset-1"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="district"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel style={{ color: THEME.dark }}>District</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={!isFormEditable || isFormLoading}
                              >
                                <FormControl>
                                  <SelectTrigger className="border-gray-200 focus:border-gray-300">
                                    <SelectValue placeholder="Select district" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {/* Using proper value prop that isn't an empty string */}
                                  <SelectItem key="bekwai" value="Bekwai">Bekwai</SelectItem>
                                  <SelectItem key="gushegu" value="Gushegu">Gushegu</SelectItem>
                                  <SelectItem key="lmk" value="Lower Manya Krobo">Lower Manya Krobo</SelectItem>
                                  <SelectItem key="yk" value="Yilo Krobo">Yilo Krobo</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="businessDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel style={{ color: THEME.dark }}>Business Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the business..." 
                                className="h-24 border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-offset-1" 
                                {...field} 
                                disabled={!isFormEditable || isFormLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-100 shadow-sm overflow-hidden">
                    <div className="h-1 w-full" style={{ 
                      background: `linear-gradient(to right, ${THEME.primary}, ${THEME.accent})` 
                    }}></div>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center" style={{ color: THEME.dark }}>
                        <div className="h-8 w-8 rounded-full flex items-center justify-center mr-3" style={{ 
                          background: `linear-gradient(135deg, ${THEME.primary}20 0%, ${THEME.accent}10 100%)` 
                        }}>
                          <BarChart2 className="h-4 w-4" style={{ color: THEME.primary }} />
                        </div>
                        Market Assessment
                      </CardTitle>
                      <FormDescription>
                        Rate these key factors on a scale of 1 (very poor) to 5 (excellent)
                      </FormDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="marketDemand"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Market Demand</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange} 
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Level of demand for the business's products/services
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="competitionLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Competition Level</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Position relative to competitors (5=very advantageous)
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="customerAccessibility"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Customer Accessibility</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Ease of reaching target customers
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="pricingPower"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pricing Power</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Ability to set prices profitably
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="marketingEffectiveness"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marketing Effectiveness</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Capacity to promote and market products/services
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-100 shadow-sm overflow-hidden">
                    <div className="h-1 w-full" style={{ 
                      background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary})` 
                    }}></div>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center" style={{ color: THEME.dark }}>
                        <div className="h-8 w-8 rounded-full flex items-center justify-center mr-3" style={{ 
                          background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}10 100%)` 
                        }}>
                          <DollarSign className="h-4 w-4" style={{ color: THEME.primary }} />
                        </div>
                        Financial Assessment
                      </CardTitle>
                      <FormDescription>
                        Rate these key factors on a scale of 1 (very poor) to 5 (excellent)
                      </FormDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="startupCosts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Startup Costs</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Affordability of initial investment (5=very affordable)
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="operatingCosts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Operating Costs</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Sustainability of ongoing expenses (5=very sustainable)
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="profitMargins"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Profit Margin</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Expected profitability
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cashFlow"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cash Flow</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Reliability of cash flow and timing
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fundingAccessibility"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Funding Accessibility</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Access to loans, grants, or investor funding
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Operational Assessment</CardTitle>
                      <FormDescription>
                        Rate these key factors on a scale of 1 (very poor) to 5 (excellent)
                      </FormDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="locationSuitability"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location Suitability</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Appropriateness of business location
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="resourceAvailability"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Resource Availability</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Access to necessary materials and resources
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="supplyChainReliability"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Supply Chain Reliability</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Stability of supply chain and logistics
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="operationalEfficiency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Operational Efficiency</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Effectiveness of business processes
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="scalabilityPotential"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Scalability Potential</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Ability to grow and expand operations
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Team Assessment</CardTitle>
                      <FormDescription>
                        Rate these key factors on a scale of 1 (very poor) to 5 (excellent)
                      </FormDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="skillsetRelevance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Skillset Relevance</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Team skills match business requirements
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="experienceLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Experience Level</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Relevant experience of team members
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="teamCommitment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Team Commitment</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Dedication level of team members
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="teamCohesion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Team Cohesion</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                How well the team works together
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="leadershipCapacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Leadership Capacity</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Quality of leadership and management skills
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Digital Readiness Assessment</CardTitle>
                      <FormDescription>
                        Rate these key factors on a scale of 1 (very poor) to 5 (excellent)
                      </FormDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="digitalSkillLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Digital Skill Level</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Digital literacy of team members
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="techInfrastructure"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tech Infrastructure</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Access to necessary technology and infrastructure
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="digitalMarketingCapacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Digital Marketing Capacity</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Ability to market and sell online
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dataManagement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data Management</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Capacity to collect and use business data
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="techAdaptability"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tech Adaptability</FormLabel>
                              <FormControl>
                                <ScoreSelect 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  disabled={!isFormEditable || isFormLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                Willingness to adopt new technologies
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Analysis and Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="riskFactors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Risk Factors</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Identify key business risks..." 
                                className="h-24" 
                                {...field} 
                                disabled={!isFormEditable || isFormLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="growthOpportunities"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Growth Opportunities</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Identify growth opportunities..." 
                                className="h-24" 
                                {...field} 
                                disabled={!isFormEditable || isFormLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="recommendedActions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recommended Actions</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List recommended actions..." 
                                className="h-24" 
                                {...field} 
                                disabled={!isFormEditable || isFormLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/feasibility-assessments")}
                      disabled={isFormLoading}
                    >
                      Cancel
                    </Button>
                    <div className="space-x-2">
                      {!isNewAssessment && assessment?.status === "In Progress" && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleSubmitForReview}
                          disabled={isFormLoading}
                        >
                          {submitForReviewMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Submit for Review
                        </Button>
                      )}
                      {isFormEditable && (
                        <Button 
                          type="submit" 
                          disabled={isFormLoading}
                        >
                          {(createMutation.isPending || updateMutation.isPending) && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          <Save className="mr-2 h-4 w-4" />
                          {isNewAssessment ? "Create Assessment" : "Save Changes"}
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </Form>
            )}
          </>
        )}
      </div>
    </div>
  </div>
  );
}