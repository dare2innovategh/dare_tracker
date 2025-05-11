import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { 
  BarChart3,
  Trash2, 
  Edit, 
  ClipboardCheck, 
  Plus, 
  ChevronLeft,
  Search,
  Filter,
  SlidersHorizontal,
  Info,
  Calendar,
  User
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Mastercard color theme
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
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
    transition: { type: "spring", stiffness: 100 } 
  }
};

export default function FeasibilityAssessmentsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/feasibility-assessments/:businessId?");
  const businessId = params?.businessId || null;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState("all"); // all, recent, business
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newAssessmentDialogOpen, setNewAssessmentDialogOpen] = useState(false);
  
  // Fetch all assessments
  const { 
    data: assessments,
    isLoading: isLoadingAssessments,
    isError: isErrorAssessments,
    refetch: refetchAssessments
  } = useQuery({
    queryKey: ['/api/feasibility/assessments/all'],
    enabled: viewTab !== "business",
  });
  
  // Fetch business-specific assessments if a business ID is provided
  const {
    data: businessAssessments,
    isLoading: isLoadingBusinessAssessments,
    isError: isErrorBusinessAssessments,
    refetch: refetchBusinessAssessments
  } = useQuery({
    queryKey: [`/api/feasibility/assessments/business/${businessId}`],
    enabled: !!businessId && viewTab === "business",
  });
  
  // Fetch all businesses for dropdown selection
  const {
    data: businesses,
    isLoading: isLoadingBusinesses
  } = useQuery({
    queryKey: ['/api/business-profiles'],
  });
  
  // Delete assessment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/feasibility/assessments/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete assessment");
      }
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Assessment Deleted",
        description: "The assessment has been successfully deleted.",
      });
      
      // Close the dialog and clear the selected assessment
      setDeleteDialogOpen(false);
      setSelectedAssessment(null);
      
      // Refresh the assessments list
      refetchAssessments();
      if (businessId) {
        refetchBusinessAssessments();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete assessment",
        variant: "destructive",
      });
    }
  });
  
  // Filter assessments based on search query and district filter
  const filteredAssessments = React.useMemo(() => {
    const assessmentsToFilter = viewTab === "business" ? businessAssessments || [] : assessments || [];
    
    return assessmentsToFilter.filter((assessment: any) => {
      const matchesSearch = 
        !searchQuery ||
        assessment.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.businessDescription?.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesDistrict = 
        !districtFilter || 
        assessment.district === districtFilter;
        
      return matchesSearch && matchesDistrict;
    });
  }, [assessments, businessAssessments, searchQuery, districtFilter, viewTab]);
  
  // Sorted assessments: most recent first
  const sortedAssessments = React.useMemo(() => {
    return [...filteredAssessments].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [filteredAssessments]);
  
  // Show only the most recent assessments for the "recent" tab
  const recentAssessments = React.useMemo(() => {
    return sortedAssessments.slice(0, 10);
  }, [sortedAssessments]);
  
  // Handle assessment deletion
  const handleDelete = () => {
    if (selectedAssessment) {
      deleteMutation.mutate(selectedAssessment.id);
    }
  };
  
  // Calculate overall score
  const calculateOverallScore = (assessment: any) => {
    const scores = [
      parseInt(assessment.marketDemand || "0"),
      parseInt(assessment.competitionLevel || "0"),
      parseInt(assessment.customerAccessibility || "0"),
      parseInt(assessment.pricingPower || "0"),
      parseInt(assessment.marketingEffectiveness || "0"),
      parseInt(assessment.locationAdvantage || "0"),
      parseInt(assessment.resourceAvailability || "0"),
      parseInt(assessment.productionEfficiency || "0"),
      parseInt(assessment.supplyChain || "0"),
      parseInt(assessment.profitMargins || "0"),
      parseInt(assessment.cashFlow || "0"),
      parseInt(assessment.accessToCapital || "0"),
      parseInt(assessment.financialRecords || "0"),
      parseInt(assessment.leadershipCapability || "0"),
      parseInt(assessment.teamCompetence || "0"),
      parseInt(assessment.processDocumentation || "0"),
      parseInt(assessment.innovationCapacity || "0"),
    ];
    
    const validScores = scores.filter(s => s > 0);
    if (validScores.length === 0) return 0;
    
    const sum = validScores.reduce((a, b) => a + b, 0);
    return (sum / validScores.length).toFixed(1);
  };
  
  // Get district color
  const getDistrictColor = (district: string) => {
    if (district?.includes("Bekwai")) return THEME.secondary;
    if (district?.includes("Gushegu")) return THEME.primary;
    if (district?.includes("Lower Manya")) return THEME.accent;
    if (district?.includes("Yilo Krobo")) return THEME.dark;
    return "#6c757d";
  };
  
  // Navigate to create a new assessment
  const handleCreateNew = (businessId?: string) => {
    if (businessId) {
      navigate(`/feasibility-assessments/new/${businessId}`);
    } else {
      setNewAssessmentDialogOpen(true);
    }
  };
  
  // Navigate from the business selection dialog
  const handleBusinessSelect = (businessId: string) => {
    setNewAssessmentDialogOpen(false);
    navigate(`/feasibility-assessments/new/${businessId}`);
  };
  
  return (
    <DashboardLayout>
      {/* Business selection dialog */}
      <Dialog open={newAssessmentDialogOpen} onOpenChange={setNewAssessmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center" style={{ color: THEME.dark }}>
              <div className="h-8 w-8 rounded-full flex items-center justify-center mr-3" style={{ 
                background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}10 100%)` 
              }}>
                <ClipboardCheck className="h-5 w-5" style={{ color: THEME.primary }} />
              </div>
              Select Business for Assessment
            </DialogTitle>
            <DialogDescription>
              Choose a business to create a new feasibility assessment
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingBusinesses ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="py-4">
              <p className="mb-4 text-sm text-gray-500">Select from the list of businesses:</p>
              <Select onValueChange={handleBusinessSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses?.map((business: any) => (
                    <SelectItem key={business.id} value={business.id.toString()}>
                      {business.businessName} ({business.district})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewAssessmentDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl" style={{ color: THEME.dark }}>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assessment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAssessment && (
            <div className="py-4">
              <p className="font-medium">{selectedAssessment.businessName}</p>
              <p className="text-sm text-gray-500">
                Assessment created on {formatDate(selectedAssessment.createdAt)}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>Deleting...</>
              ) : (
                <>Delete Assessment</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="container mx-auto py-10 px-4">
        {/* Header with title and actions */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold" style={{ color: THEME.dark }}>
              Feasibility Assessments
            </h1>
            <p className="text-gray-500 mt-1">
              Manage business feasibility assessments and evaluate performance
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              variant="default"
              className="bg-gradient-to-r from-[#1A1F71] via-[#2A3F9D] to-[#4263EB] border-none text-white"
              onClick={() => handleCreateNew(businessId ? businessId.toString() : undefined)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Assessment
            </Button>
            
            {businessId && (
              <Button
                variant="outline"
                className="border-gray-200 hover:border-gray-300 transition-all duration-300"
                onClick={() => navigate("/businesses")}
              >
                <ChevronLeft className="mr-2 h-4 w-4" style={{ color: THEME.primary }} />
                Back to Businesses
              </Button>
            )}
          </div>
        </motion.div>
        
        {/* Search and filters */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search assessments..."
                className="pl-10 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={districtFilter || ""} onValueChange={(value) => setDistrictFilter(value || null)}>
              <SelectTrigger className="w-full sm:w-[180px] border-gray-200">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{districtFilter || "All Districts"}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Districts</SelectItem>
                <SelectItem value="Bekwai">Bekwai</SelectItem>
                <SelectItem value="Gushegu">Gushegu</SelectItem>
                <SelectItem value="Lower Manya Krobo">Lower Manya Krobo</SelectItem>
                <SelectItem value="Yilo Krobo">Yilo Krobo</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              className="border-gray-200"
              onClick={() => {
                setSearchQuery("");
                setDistrictFilter(null);
              }}
            >
              <SlidersHorizontal className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </motion.div>
        
        {/* Tabs for different views */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <Tabs 
            value={viewTab} 
            onValueChange={(tab) => {
              setViewTab(tab);
              // Refetch data when switching tabs
              if (tab === "all" || tab === "recent") {
                refetchAssessments();
              } else if (tab === "business" && businessId) {
                refetchBusinessAssessments();
              }
            }}
            className="mb-6"
          >
            <TabsList 
              className="grid w-full max-w-md grid-cols-3 p-1 rounded-full"
              style={{ 
                backgroundColor: "#f3f4f6",
                border: "1px solid #e5e7eb"
              }}
            >
              <TabsTrigger 
                value="all" 
                className="rounded-full data-[state=active]:shadow-md transition-all duration-300"
                style={{ 
                  color: viewTab === "all" ? "white" : THEME.dark,
                  background: viewTab === "all" 
                    ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                    : "transparent"
                }}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                All Assessments
              </TabsTrigger>
              
              <TabsTrigger 
                value="recent" 
                className="rounded-full data-[state=active]:shadow-md transition-all duration-300"
                style={{ 
                  color: viewTab === "recent" ? "white" : THEME.dark,
                  background: viewTab === "recent" 
                    ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                    : "transparent"
                }}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Recent
              </TabsTrigger>
              
              <TabsTrigger 
                value="business" 
                className="rounded-full data-[state=active]:shadow-md transition-all duration-300"
                disabled={!businessId}
                style={{ 
                  color: viewTab === "business" ? "white" : THEME.dark,
                  background: viewTab === "business" 
                    ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                    : "transparent",
                  opacity: !businessId ? 0.5 : 1
                }}
              >
                <User className="mr-2 h-4 w-4" />
                Business
              </TabsTrigger>
            </TabsList>
            
            {/* All Assessments Tab */}
            <TabsContent value="all">
              {isLoadingAssessments ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <AssessmentTable 
                  assessments={sortedAssessments}
                  emptyMessage="No assessments found"
                  onView={(id) => navigate(`/feasibility-assessments/view/${id}`)}
                  onEdit={(id) => navigate(`/feasibility-assessments/edit/${id}`)}
                  onDelete={(assessment) => {
                    setSelectedAssessment(assessment);
                    setDeleteDialogOpen(true);
                  }}
                  calculateOverallScore={calculateOverallScore}
                  getDistrictColor={getDistrictColor}
                />
              )}
            </TabsContent>
            
            {/* Recent Assessments Tab */}
            <TabsContent value="recent">
              {isLoadingAssessments ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <AssessmentTable 
                  assessments={recentAssessments}
                  emptyMessage="No recent assessments found"
                  onView={(id) => navigate(`/feasibility-assessments/view/${id}`)}
                  onEdit={(id) => navigate(`/feasibility-assessments/edit/${id}`)}
                  onDelete={(assessment) => {
                    setSelectedAssessment(assessment);
                    setDeleteDialogOpen(true);
                  }}
                  calculateOverallScore={calculateOverallScore}
                  getDistrictColor={getDistrictColor}
                />
              )}
            </TabsContent>
            
            {/* Business-specific Assessments Tab */}
            <TabsContent value="business">
              {isLoadingBusinessAssessments || !businessId ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <AssessmentTable 
                  assessments={sortedAssessments}
                  emptyMessage={`No assessments found for this business`}
                  onView={(id) => navigate(`/feasibility-assessments/view/${id}`)}
                  onEdit={(id) => navigate(`/feasibility-assessments/edit/${id}`)}
                  onDelete={(assessment) => {
                    setSelectedAssessment(assessment);
                    setDeleteDialogOpen(true);
                  }}
                  calculateOverallScore={calculateOverallScore}
                  getDistrictColor={getDistrictColor}
                />
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

// Assessment Table Component
interface AssessmentTableProps {
  assessments: any[];
  emptyMessage: string;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (assessment: any) => void;
  calculateOverallScore: (assessment: any) => string;
  getDistrictColor: (district: string) => string;
}

function AssessmentTable({
  assessments,
  emptyMessage,
  onView,
  onEdit,
  onDelete,
  calculateOverallScore,
  getDistrictColor
}: AssessmentTableProps) {
  // Define the score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 4) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 3) return "bg-blue-100 text-blue-800 border-blue-200";
    if (score >= 2) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };
  
  if (assessments.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <Info className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyMessage}</h3>
        <p className="text-gray-500 mb-6">
          No assessments match your current filter criteria
        </p>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Create New Assessment
        </Button>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business</TableHead>
            <TableHead>District</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-center">Overall Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assessments.map((assessment) => {
            const score = parseFloat(calculateOverallScore(assessment));
            
            return (
              <TableRow key={assessment.id}>
                <TableCell className="font-medium">
                  {assessment.businessName}
                </TableCell>
                <TableCell>
                  <Badge 
                    className="text-white shadow-sm"
                    style={{ backgroundColor: getDistrictColor(assessment.district) }}
                  >
                    {assessment.district}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-500">
                  {formatDate(assessment.updatedAt || assessment.createdAt)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={`${getScoreColor(score)} shadow-sm`}>
                    {score}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {assessment.status || "Draft"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onView(assessment.id)}>
                        <Info className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(assessment.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => onDelete(assessment)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}