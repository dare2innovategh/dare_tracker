import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { YouthProfile } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Resource, Action, useHasPermission } from "@/lib/permissions";
import { PermissionGuard } from "@/components/permission-guard";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  TooltipProvider, 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Loader2, 
  Search, 
  Eye, 
  Edit, 
  BarChart2, 
  Filter, 
  UserPlus, 
  MapPin,
  ChevronRight,
  ChevronLeft,
  Users,
  Trash2,
  PlusCircle,
  MoreHorizontal,
  ArrowUpDown,
  CircleSlash,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mastercard color theme - enhanced version
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
  primaryLight: "#FF8F40", // Lighter orange for hover
  secondaryLight: "#FF4D5E", // Lighter red for hover
  accentLight: "#FFBF60", // Lighter yellow for hover
  darkLight: "#3A4095", // Lighter dark blue for hover
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  }
};

// Animation variants - enhanced
const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    }
  }
};

const itemFadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

export default function YouthProfilesPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isClearDataDialogOpen, setClearDataDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;
  
  // Permission checks
  const canViewYouth = useHasPermission(Resource.YOUTH, Action.VIEW);
  const canCreateYouth = useHasPermission(Resource.YOUTH, Action.CREATE);
  const canEditYouth = useHasPermission(Resource.YOUTH, Action.EDIT);
  const canDeleteYouth = useHasPermission(Resource.YOUTH, Action.DELETE);
  const canViewBusinesses = useHasPermission(Resource.BUSINESSES, Action.VIEW);
  const isAdmin = useHasPermission(Resource.ADMIN_PANEL, Action.VIEW);
  
  // Check for old URL pattern and redirect to new pattern
  if (location === "/youth-profiles") {
    navigate("/youth/profiles", { replace: true });
  }

  // Fetch all youth profiles using the new API structure
  const { data: profiles, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/youth/profiles'],
    enabled: canViewYouth, // Only fetch if user has view permission
  });

  // Delete profile mutation with new API structure
  const deleteProfileMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiRequest("DELETE", `/api/youth/profiles/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete profile");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Youth profile has been successfully removed",
        variant: "default",
      });

      setDeletingId(null);

      // Invalidate queries to refresh the profiles list
      queryClient.invalidateQueries({
        queryKey: ['/api/youth/profiles'],
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting profile",
        description: error.message,
        variant: "destructive",
      });
      setDeletingId(null);
    }
  });

  // Clear Youth Data Mutation
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      setIsClearing(true);
      const response = await apiRequest("POST", "/api/admin/clear-youth-data");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to clear youth data");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Data cleared",
        description: "All youth profiles have been successfully removed",
        variant: "default",
      });

      // Close the dialog
      setClearDataDialogOpen(false);

      // Invalidate queries to refresh the profiles list
      queryClient.invalidateQueries({
        queryKey: ['/api/youth/profiles'],
      });
    },
    onError: (error) => {
      toast({
        title: "Error clearing data",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsClearing(false);
    }
  });

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Handle new profile creation
  const handleAddNew = () => {
    navigate("/youth/profiles/add");
  };

  // Handle profile deletion
  const handleDeleteProfile = (id) => {
    setDeletingId(id);
    deleteProfileMutation.mutate(id);
  };

  // Handle clear all data
  const handleClearAllData = () => {
    clearDataMutation.mutate();
  };

  // Handle sort change
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter profiles based on search query and district filter
  const filteredProfiles = profiles?.filter(profile => {
    // District filter
    if (districtFilter && districtFilter !== "all" && profile.district !== districtFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        profile.fullName.toLowerCase().includes(query) ||
        (profile.town && profile.town.toLowerCase().includes(query)) ||
        profile.district.toLowerCase().includes(query) ||
        (profile.participantCode && profile.participantCode.toLowerCase().includes(query))
      );
    }

    return true;
  })
  // Sort profiles based on selected sort field and direction
  ?.sort((a, b) => {
    let compareA, compareB;

    // Handle various sort fields
    switch(sortField) {
      case "name":
        compareA = a.fullName?.toLowerCase() || "";
        compareB = b.fullName?.toLowerCase() || "";
        break;
      case "district":
        compareA = a.district?.toLowerCase() || "";
        compareB = b.district?.toLowerCase() || "";
        break;
      case "businessCount":
        compareA = (a.businessesCount || 0);
        compareB = (b.businessesCount || 0);
        break;
      case "createdAt":
      default:
        // If createdAt exists, use that, otherwise fall back to ID
        if (a.createdAt && b.createdAt) {
          compareA = new Date(a.createdAt).getTime();
          compareB = new Date(b.createdAt).getTime();
        } else {
          compareA = a.id;
          compareB = b.id;
        }
    }

    // Apply sort direction
    if (sortDirection === "asc") {
      return compareA > compareB ? 1 : -1;
    } else {
      return compareA < compareB ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = filteredProfiles ? Math.ceil(filteredProfiles.length / itemsPerPage) : 0;
  const paginatedProfiles = filteredProfiles?.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // Handle pagination changes
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Get district color with opacity
  const getDistrictColor = (district, opacity = 1) => {
    const color = (() => {
      switch(district) {
        case "Bekwai": return THEME.secondary;
        case "Gushegu": return THEME.primary;
        case "Lower Manya Krobo": return THEME.accent;
        case "Yilo Krobo": return THEME.dark;
        default: return THEME.gray[500];
      }
    })();

    if (opacity === 1) return color;

    // Convert hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Generate pagination items
  const getPaginationItems = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  // If user doesn't have view permission, show access denied
  if (!canViewYouth) {
    return (
      <DashboardLayout>
        <div className="py-6 md:py-10 px-4 md:px-8 max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="mb-8"
          >
            <Header 
              title="Youth Profiles" 
              description="Manage participant profiles and their business information" 
              showActions={false}
            />
          </motion.div>
          
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <CircleSlash className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              You don't have permission to view youth profiles. Please contact your administrator if you need access.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6 md:py-10 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-8"
        >
          <Header 
            title="Youth Profiles" 
            description="Manage participant profiles and their business information" 
            showActions={false}
          />
        </motion.div>

        {/* Top Controls */}
        <motion.div 
          className="mb-8"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Cards with stats summary */}
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" variants={itemFadeIn}>
            <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Profiles</p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-900">{profiles?.length || 0}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${THEME.primary}15` }}>
                    <Users className="h-5 w-5" style={{ color: THEME.primary }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Districts</p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-900">
                      {profiles && profiles.length > 0 
                        ? [...new Set(profiles.map(p => p.district).filter(Boolean))].length 
                        : 0}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${THEME.secondary}15` }}>
                    <MapPin className="h-5 w-5" style={{ color: THEME.secondary }} />
                  </div>
                </div>

                <div className="flex items-center mt-4 gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: THEME.secondary }}></div>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: THEME.primary }}></div>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: THEME.accent }}></div>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: THEME.dark }}></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Businesses</p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-900">
                      {profiles?.reduce((acc, profile) => acc + ((profile.businessesCount || 0)), 0) || 0}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${THEME.accent}15` }}>
                    <BarChart2 className="h-5 w-5" style={{ color: THEME.accent }} />
                  </div>
                </div>

                <div className="flex items-center mt-4 text-xs text-gray-500">
                  <Badge 
                    variant="outline" 
                    className="px-2 py-0.5 text-xs gap-1 items-center"
                    style={{ 
                      borderColor: THEME.accent + '30',
                      color: THEME.accent
                    }}
                  >
                    {(profiles?.reduce((acc, profile) => acc + ((profile.businessesCount || 0)), 0) / (profiles?.length || 1)).toFixed(1)} avg per youth
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search & Filters */}
          <motion.div className="flex flex-col md:flex-row gap-4" variants={itemFadeIn}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search by name, location, or code..." 
                className="pl-9 border-gray-200 bg-white focus:border-gray-300 focus:ring-2 focus:ring-offset-0 focus:ring-primary/20 transition-all duration-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="w-full md:w-64">
              <Select value={districtFilter} onValueChange={setDistrictFilter}>
                <SelectTrigger 
                  className="border-gray-200 bg-white focus:border-gray-300 focus:ring-2 focus:ring-offset-0 focus:ring-primary/20 transition-all duration-300"
                >
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Filter by district" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  <SelectItem value="Bekwai">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.secondary }}></div>
                      Bekwai
                    </div>
                  </SelectItem>
                  <SelectItem value="Gushegu">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.primary }}></div>
                      Gushegu
                    </div>
                  </SelectItem>
                  <SelectItem value="Lower Manya Krobo">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.accent }}></div>
                      Lower Manya Krobo
                    </div>
                  </SelectItem>
                  <SelectItem value="Yilo Krobo">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.dark }}></div>
                      Yilo Krobo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              {/* Add Profile Button with Permission Guard */}
              <PermissionGuard
                resource={Resource.YOUTH}
                action={Action.CREATE}
                fallback={
                  <Button
                    variant="outline"
                    className="opacity-50 cursor-not-allowed shadow-sm"
                    disabled
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Profile
                  </Button>
                }
              >
                <Button 
                  onClick={handleAddNew}
                  className="shadow-sm hover:shadow-md transition-all duration-300 font-medium"
                  style={{ 
                    background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                    border: "none" 
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Profile
                </Button>
              </PermissionGuard>

              <Button
                variant="outline"
                className="shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 bg-white text-gray-700 font-medium"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {/* Admin actions dropdown with Permission Guard */}
              <PermissionGuard
                resource={Resource.ADMIN_PANEL}
                action={Action.VIEW}
              >
                {profiles && profiles.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 bg-white"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setClearDataDialogOpen(true)}
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All Data
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </PermissionGuard>

              {/* Clear Data Dialog */}
              <AlertDialog open={isClearDataDialogOpen} onOpenChange={setClearDataDialogOpen}>
                <AlertDialogContent className="border-red-100">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      Clear All Youth Data
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete all youth profile data from the database.
                      This is intended for testing purposes only and cannot be undone.
                      Are you sure you want to proceed?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleClearAllData();
                      }}
                      disabled={isClearing}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isClearing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        "Yes, Clear All Data"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        </motion.div>

        {/* Profiles Table */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <Card 
            className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
          >
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-32">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full" style={{ backgroundColor: `${THEME.primary}15` }}></div>
                      <Loader2 
                        className="absolute top-0 left-0 h-12 w-12 animate-spin" 
                        style={{ color: THEME.primary }}
                      />
                    </div>
                    <p className="mt-4 text-gray-500">Loading profiles...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-16 px-4">
                  <div className="inline-block p-4 rounded-full bg-red-50 mb-4">
                    <CircleSlash className="h-10 w-10 text-red-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load profiles</h3>
                  <p className="text-gray-500 mb-4">{error.message}</p>
                  <Button 
                    onClick={() => window.location.reload()}
                    style={{ 
                      background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                      border: "none" 
                    }}
                    className="shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Retry
                  </Button>
                </div>
              ) : filteredProfiles?.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="inline-block p-4 rounded-full" style={{ backgroundColor: `${THEME.primary}15` }}>
                    <Users className="h-10 w-10" style={{ color: THEME.primary }} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">No profiles found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || districtFilter !== "all" ? 
                      "No profiles match your search criteria" : 
                      "Get started by adding your first youth profile"}
                  </p>
                  {searchQuery || districtFilter !== "all" ? (
                    <Button 
                      onClick={() => {
                        setSearchQuery("");
                        setDistrictFilter("all");
                      }}
                      style={{ 
                        background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                        border: "none" 
                      }}
                      className="shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      Clear Filters
                    </Button>
                  ) : (
                    <PermissionGuard
                      resource={Resource.YOUTH}
                      action={Action.CREATE}
                      fallback={
                        <Button
                          variant="outline"
                          className="opacity-50 cursor-not-allowed"
                          disabled
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add First Profile
                        </Button>
                      }
                    >
                      <Button 
                        onClick={handleAddNew}
                        style={{background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                        border: "none" 
                      }}
                      className="shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add First Profile
                    </Button>
                    </PermissionGuard>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 border-b border-gray-100">
                          <TableHead 
                            className="font-medium text-gray-700 py-4 cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleSort("name")}
                          >
                            <div className="flex items-center">
                              Name
                              <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === "name" ? "opacity-100" : "opacity-40"}`} />
                            </div>
                          </TableHead>
                          <TableHead className="font-medium text-gray-700">Participant Code</TableHead>
                          <TableHead 
                            className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleSort("district")}
                          >
                            <div className="flex items-center">
                              District & Location
                              <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === "district" ? "opacity-100" : "opacity-40"}`} />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleSort("businessCount")}
                          >
                            <div className="flex items-center">
                              Businesses
                              <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === "businessCount" ? "opacity-100" : "opacity-40"}`} />
                            </div>
                          </TableHead>
                          <TableHead className="text-right font-medium text-gray-700">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedProfiles?.map((profile) => (
                          <TableRow 
                            key={profile.id} 
                            className={`border-b border-gray-100 transition-colors duration-150 ${
                              hoveredRow === profile.id ? 'bg-gray-50' : 'bg-white'
                            }`}
                            onMouseEnter={() => setHoveredRow(profile.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            onClick={() => navigate(`/youth/profiles/${profile.id}`)}
                            style={{ cursor: "pointer" }}
                          >
                            <TableCell className="py-4">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10 border-2 transition-all duration-300" 
                                  style={{ 
                                    borderColor: hoveredRow === profile.id ? getDistrictColor(profile.district) : 'transparent',
                                    backgroundColor: getDistrictColor(profile.district, 0.1)
                                  }}
                                >
                                  {profile.profilePicture ? (
                                    <AvatarImage src={profile.profilePicture} />
                                  ) : (
                                    <AvatarFallback style={{ 
                                      background: `linear-gradient(135deg, ${getDistrictColor(profile.district, 0.8)} 0%, ${getDistrictColor(profile.district)} 100%)`,
                                      color: 'white'
                                    }}>
                                      {profile.fullName.charAt(0)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <div className="font-medium text-gray-900 hover:text-primary transition-colors duration-150">
                                    {profile.fullName}
                                  </div>
                                  <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                    {profile.gender}
                                    {profile.age && (
                                      <>
                                        <span className="inline-block w-1 h-1 rounded-full bg-gray-300"></span>
                                        <span>{profile.age} years</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {profile.participantCode ? (
                                <Badge 
                                  variant="outline" 
                                  className="font-mono text-xs"
                                  style={{ 
                                    borderColor: getDistrictColor(profile.district, 0.3),
                                    color: getDistrictColor(profile.district),
                                    backgroundColor: getDistrictColor(profile.district, 0.05)
                                  }}
                                >
                                  {profile.participantCode}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-sm italic">Not assigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-start">
                                <MapPin className="h-4 w-4 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {profile.district}
                                  </div>
                                  <div className="text-sm text-gray-500 mt-0.5">
                                    {profile.town || 'Unknown location'}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div 
                                  className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium shadow-sm"
                                  style={{ 
                                    backgroundColor: getDistrictColor(profile.district, 0.15),
                                    color: getDistrictColor(profile.district)
                                  }}
                                >
                                  {(profile.businessesCount || 0)}
                                </div>
                                <span className="ml-2 text-sm text-gray-500">
                                  {(profile.businessesCount === 1 ? 'Business' : 'Businesses')}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {/* View Profile Button - Always allowed with VIEW permission */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/youth/profiles/${profile.id}`);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>View Profile</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                {/* Edit Profile Button - Protected with EDIT permission */}
                                <PermissionGuard
                                  resource={Resource.YOUTH}
                                  action={Action.EDIT}
                                >
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/youth/profiles/edit/${profile.id}`);
                                          }}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p>Edit Profile</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </PermissionGuard>

                                {/* View Businesses Button - Protected with BUSINESSES VIEW permission */}
                                <PermissionGuard
                                  resource={Resource.BUSINESSES}
                                  action={Action.VIEW}
                                >
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/youth/profiles/${profile.id}/businesses`);
                                          }}
                                        >
                                          <BarChart2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p>View Businesses</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </PermissionGuard>

                                {/* Delete Button - Protected with DELETE permission */}
                                <PermissionGuard
                                  resource={Resource.YOUTH}
                                  action={Action.DELETE}
                                >
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteProfile(profile.id);
                                          }}
                                          disabled={deletingId === profile.id}
                                        >
                                          {deletingId === profile.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p>Delete Profile</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </PermissionGuard>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Enhanced Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500 mb-4 sm:mb-0">
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProfiles.length)} to {Math.min(currentPage * itemsPerPage, filteredProfiles.length)} of {filteredProfiles.length} profiles
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className={`h-8 w-8 p-0 rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {getPaginationItems().map((page, index) => 
                          page === '...' ? (
                            <div key={`ellipsis-${index}`} className="px-2">...</div>
                          ) : (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "ghost"}
                              size="sm"
                              onClick={() => goToPage(page)}
                              className={`h-8 w-8 p-0 font-medium ${
                                currentPage === page 
                                  ? `text-white shadow-sm`
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                              style={
                                currentPage === page 
                                  ? { 
                                      background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.primaryLight} 100%)`
                                    } 
                                  : {}
                              }
                            >
                              {page}
                            </Button>
                          )
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className={`h-8 w-8 p-0 rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}