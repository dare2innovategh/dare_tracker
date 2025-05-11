import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { YouthProfile } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  User,
  Users,
  Trash2,
  AlertTriangle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mastercard color theme - matching the other pages
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

export default function YouthProfilesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isClearDataDialogOpen, setClearDataDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const itemsPerPage = 10;

  // Check if user is an admin
  const isAdmin = user?.role === "admin";

  // Fetch all youth profiles
  const { data: profiles, isLoading, error } = useQuery<YouthProfile[]>({
    queryKey: ['/api/youth-profiles'],
  });

  // Delete profile mutation
  const deleteProfileMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/youth-profiles/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete profile");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile deleted",
        description: "Youth profile has been successfully removed",
      });
      
      setDeletingId(null);
      
      // Invalidate queries to refresh the profiles list
      queryClient.invalidateQueries({
        queryKey: ['/api/youth-profiles'],
      });
    },
    onError: (error: Error) => {
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
        title: "Youth data cleared",
        description: "All youth profiles have been successfully removed",
      });
      
      // Close the dialog
      setClearDataDialogOpen(false);
      
      // Invalidate queries to refresh the profiles list
      queryClient.invalidateQueries({
        queryKey: ['/api/youth-profiles'],
      });
    },
    onError: (error: Error) => {
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

  // Handle new profile creation
  const handleAddNew = () => {
    navigate("/youth-profiles/new");
  };

  // Handle profile deletion
  const handleDeleteProfile = (id: number) => {
    setDeletingId(id);
    deleteProfileMutation.mutate(id);
  };

  // Handle clear all data action
  const handleClearAllData = () => {
    clearDataMutation.mutate();
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
        profile.district.toLowerCase().includes(query)
      );
    }

    return true;
  })
  // Sort profiles with newest created first based on createdAt timestamp
  ?.sort((a, b) => {
    // If either profile doesn't have a createdAt date, use their ID as fallback
    // Higher ID means more recently created
    if (!a.createdAt && !b.createdAt) {
      return b.id - a.id;
    }
    
    // If only one has createdAt, prioritize the one with a date
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    
    // Otherwise sort by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Pagination
  const totalPages = filteredProfiles ? Math.ceil(filteredProfiles.length / itemsPerPage) : 0;
  const paginatedProfiles = filteredProfiles?.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // Handle pagination changes
  const goToPage = (page: number) => {
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

  // Get district color
  const getDistrictColor = (district: string) => {
    switch(district) {
      case "Bekwai, Ghana": return THEME.secondary;
      case "Gushegu, Ghana": return THEME.primary;
      case "Lower Manya Krobo, Ghana": return THEME.accent;
      case "Yilo Krobo, Ghana": return THEME.dark;
      default: return "#6c757d";
    }
  };

  return (
    <DashboardLayout>
      <div className="md:py-8 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <Header 
            title="Youth Profiles" 
            description="Manage participant profiles and their business information" 
            showActions={false}
          />
        </motion.div>

        {/* Filters - Enhanced with Mastercard styling */}
        <motion.div 
          className="mb-8 flex flex-col md:flex-row gap-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div className="relative flex-1" variants={fadeIn}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search by name or location..." 
              className="pl-9 border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1 transition-all duration-300"
              style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>

          <motion.div className="w-full md:w-64" variants={fadeIn}>
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger 
                className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1 transition-all duration-300"
                style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
              >
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Filter by district" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                <SelectItem value="Bekwai, Ghana">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.secondary }}></div>
                    Bekwai, Ghana
                  </div>
                </SelectItem>
                <SelectItem value="Gushegu, Ghana">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.primary }}></div>
                    Gushegu, Ghana
                  </div>
                </SelectItem>
                <SelectItem value="Lower Manya Krobo, Ghana">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.accent }}></div>
                    Lower Manya Krobo, Ghana
                  </div>
                </SelectItem>
                <SelectItem value="Yilo Krobo, Ghana">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.dark }}></div>
                    Yilo Krobo, Ghana
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div variants={fadeIn} className="flex gap-2">
            <Button 
              onClick={handleAddNew}
              className="shadow-md hover:shadow-lg transition-all duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                border: "none" 
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Profile
            </Button>
            
            {/* Admin Clear Youth Data Button - only visible for admin users */}
            {isAdmin && profiles && profiles.length > 0 && (
              <AlertDialog open={isClearDataDialogOpen} onOpenChange={setClearDataDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="shadow-md hover:shadow-lg transition-all duration-300 border-red-300"
                    style={{ 
                      color: "#d32f2f"
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Youth Data</AlertDialogTitle>
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
            )}
          </motion.div>
        </motion.div>

        {/* Profiles Table - Redesigned with Mastercard theme */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <Card 
            className="border rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
            style={{ borderColor: "#F3F4F6" }}
          >
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-32">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full" style={{ backgroundColor: `${THEME.secondary}30` }}></div>
                      <div className="w-12 h-12 rounded-full absolute top-0 left-0" style={{ borderTopColor: THEME.secondary, borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: THEME.secondary, borderWidth: '2px', animation: 'spin 1s linear infinite' }}></div>
                    </div>
                    <p className="mt-4 text-gray-500">Loading profiles...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-16 px-4">
                  <div className="inline-block p-4 rounded-full bg-red-50 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
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
                  <div className="inline-block p-4 rounded-full" style={{ backgroundColor: `${THEME.primary}10` }}>
                    <Users className="h-10 w-10" style={{ color: THEME.primary }} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">No profiles found</h3>
                  <p className="text-gray-500 mb-4">No profiles match your search criteria</p>
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
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableCaption className="px-4 py-3 text-sm text-gray-500">
                        {filteredProfiles ? 
                          `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredProfiles.length)} to ${Math.min(currentPage * itemsPerPage, filteredProfiles.length)} of ${filteredProfiles.length} youth profiles` :
                          'Youth profiles'
                        }
                      </TableCaption>
                      <TableHeader>
                        <TableRow className="bg-gray-50 border-b border-gray-100">
                          <TableHead className="font-semibold text-gray-700 py-4">Name</TableHead>
                          <TableHead className="font-semibold text-gray-700">Participant Code</TableHead>
                          <TableHead className="font-semibold text-gray-700">District & Location</TableHead>
                          <TableHead className="font-semibold text-gray-700">Associated Businesses</TableHead>
                          <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedProfiles?.map((profile) => (
                          <TableRow 
                            key={profile.id} 
                            className={`border-b border-gray-100 transition-colors duration-150 ${
                              hoveredRow === profile.id.toString() ? 'bg-gray-50' : 'bg-white'
                            }`}
                            onMouseEnter={() => setHoveredRow(profile.id.toString())}
                            onMouseLeave={() => setHoveredRow(null)}
                          >
                            <TableCell className="py-4">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10 border-2 transition-all duration-300" style={{ borderColor: hoveredRow === profile.id.toString() ? getDistrictColor(profile.district) : 'transparent' }}>
                                  {profile.profilePicture ? (
                                    <AvatarImage src={profile.profilePicture} />
                                  ) : (
                                    <AvatarFallback style={{ 
                                      background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}20 50%, ${THEME.accent}20 100%)` 
                                    }}>
                                      <User className="h-5 w-5 text-gray-700" />
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <div className="font-medium text-gray-900">{profile.fullName}</div>
                                  <div className="text-sm text-gray-500">{profile.phoneNumber || profile.email || 'No contact info'}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium" style={{ color: THEME.primary }}>
                                {profile.participantCode || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <Badge 
                                  className="font-medium text-white shadow-sm transition-all duration-300"
                                  style={{ 
                                    backgroundColor: getDistrictColor(profile.district),
                                    transform: hoveredRow === profile.id.toString() ? 'scale(1.05)' : 'scale(1)'
                                  }}
                                >
                                  {profile.district}
                                </Badge>
                                {profile.town && (
                                  <div className="text-sm mt-2 flex items-center text-gray-500">
                                    <MapPin className="h-3 w-3 mr-1" /> 
                                    {profile.town}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <motion.button
                                className="flex items-center text-sm font-medium rounded-md px-3 py-1 transition-all duration-300"
                                style={{ 
                                  color: getDistrictColor(profile.district),
                                  backgroundColor: hoveredRow === profile.id.toString() ? `${getDistrictColor(profile.district)}10` : 'transparent'
                                }}
                                whileHover={{ x: 3 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/youth-profiles/${profile.id}/businesses`);
                                }}
                              >
                                View Businesses
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </motion.button>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 border-gray-200"
                                  onClick={() => navigate(`/youth-profiles/${profile.id}`)}
                                >
                                  <Eye className="h-4 w-4 text-gray-500" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 border-gray-200"
                                  onClick={() => navigate(`/youth-profiles/${profile.id}/edit`)}
                                >
                                  <Edit className="h-4 w-4 text-gray-500" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 border-gray-200"
                                  onClick={() => navigate(`/youth-profiles/${profile.id}/businesses`)}
                                >
                                  <BarChart2 className="h-4 w-4 text-gray-500" />
                                </Button>
                                
                                {/* Delete button - only shown if user is admin */}
                                {isAdmin && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 border-red-200 hover:bg-red-50"
                                    onClick={() => handleDeleteProfile(profile.id)}
                                    disabled={deletingId === profile.id}
                                  >
                                    {deletingId === profile.id ? (
                                      <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className={`h-8 px-2 border-gray-200 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          
                          if (totalPages <= 5) {
                            // Show all pages if 5 or fewer
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            // Show first 5 pages
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            // Show last 5 pages
                            pageNum = totalPages - 4 + i;
                          } else {
                            // Show current page and 2 on each side
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              className={`h-8 w-8 p-0 border-gray-200 ${
                                currentPage === pageNum 
                                  ? `text-white shadow-md`
                                  : 'hover:bg-gray-50'
                              }`}
                              style={
                                currentPage === pageNum 
                                  ? { 
                                      backgroundColor: THEME.primary,
                                      borderColor: THEME.primary
                                    } 
                                  : {}
                              }
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className={`h-8 px-2 border-gray-200 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
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