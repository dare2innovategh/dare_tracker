import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mentor, BusinessProfile, districtEnum } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Loader2, 
  Search, 
  UserCog, 
  Plus, 
  MapPin, 
  Phone, 
  Mail,
  AlertTriangle,
  RefreshCcw,
  RefreshCw,
  Edit,
  Eye,
  Briefcase,
  GraduationCap,
  Trash,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCanDelete } from "@/hooks/use-permissions";

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

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

interface MentorManagementProps {
  hideHeader?: boolean;
  initialDistrict?: string;
  showAssignButton?: boolean;
  onAssign?: (mentor: Mentor) => void;
}

export default function MentorManagement({
  hideHeader = false,
  initialDistrict,
  showAssignButton = false,
  onAssign
}: MentorManagementProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState<string>(initialDistrict || "all");
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [mentorToDelete, setMentorToDelete] = useState<Mentor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 6; // Number of items per page
  
  // Check if the user has permission to delete mentors
  const { hasPermission: canDelete, isLoading: isPermissionLoading } = useCanDelete("mentors");

  // Fetch all mentors
  const { data: mentors, isLoading, error, refetch } = useQuery<Mentor[]>({
    queryKey: ['/api/mentors'],
  });

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetch(), refetchAssignments()]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Handle new mentor creation
  const handleAddNew = () => {
    navigate("/mentors/new");
  };

  // Filter mentors based on search query and district filter
  const filteredMentors = mentors?.filter(mentor => {
    // District filter
    if (districtFilter && districtFilter !== "all") {
      // Check primary district
      let matchFound = false;
      
      if (mentor.assignedDistrict === districtFilter) {
        matchFound = true;
      }
      
      // Check in assignedDistricts array - with safer type checking
      try {
        if (!matchFound && 
            mentor.assignedDistricts && 
            Array.isArray(mentor.assignedDistricts) && 
            mentor.assignedDistricts.length > 0) {
          
          // Try to safely cast to string array
          const districts = Array.isArray(mentor.assignedDistricts) 
            ? mentor.assignedDistricts.filter(d => typeof d === 'string')
            : [];
            
          if (districts.includes(districtFilter)) {
            matchFound = true;
          }
        }
      } catch (e) {
        console.error("Error processing assignedDistricts:", e);
      }
      
      if (!matchFound) {
        return false;
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      
      // Check if district matches (either in assignedDistrict or assignedDistricts)
      let districtMatch = false;
      if (mentor.assignedDistrict) {
        districtMatch = mentor.assignedDistrict.toLowerCase().includes(query);
      }
      
      // Check in assignedDistricts array if it exists, with safer type checking
      try {
        if (!districtMatch && 
            mentor.assignedDistricts && 
            Array.isArray(mentor.assignedDistricts) && 
            mentor.assignedDistricts.length > 0) {
          
          // Try to safely cast to string array
          const districts = Array.isArray(mentor.assignedDistricts) 
            ? mentor.assignedDistricts.filter(d => typeof d === 'string')
            : [];
          
          districtMatch = districts.some(district => 
            district.toLowerCase().includes(query)
          );
        }
      } catch (e) {
        console.error("Error processing assignedDistricts for search:", e);
      }
      
      return (
        mentor.name.toLowerCase().includes(query) ||
        (mentor.email && mentor.email.toLowerCase().includes(query)) ||
        (mentor.phone && mentor.phone.toLowerCase().includes(query)) ||
        districtMatch ||
        (mentor.specialization && mentor.specialization.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Pagination
  const totalPages = filteredMentors ? Math.ceil(filteredMentors.length / itemsPerPage) : 0;
  const paginatedMentors = filteredMentors?.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // Handle pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
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

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setDistrictFilter("all");
    setCurrentPage(1);
  };

  // Handle delete mentor confirmation
  const deleteMutation = useMutation({
    mutationFn: async (mentorId: number) => {
      const res = await apiRequest("DELETE", `/api/mentors/${mentorId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Mentor deleted successfully",
      });
      setDeleteDialogOpen(false);
      setMentorToDelete(null);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete mentor",
        variant: "destructive",
      });
    }
  });

  const handleDeleteClick = (mentor: Mentor, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setMentorToDelete(mentor);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (mentorToDelete) {
      deleteMutation.mutate(mentorToDelete.id);
    }
  };

  // Data for mentor assignments
  const { data: mentorAssignments = [], refetch: refetchAssignments } = useQuery<
    { mentorId: number; businessId: number }[]
  >({
    queryKey: ['/api/mentor-businesses'],
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Count assigned businesses per mentor using the mentorAssignments data
  const getAssignedBusinessesCount = (mentorId: number) => {
    if (!Array.isArray(mentorAssignments)) return 0;
    
    return mentorAssignments.filter(assignment => 
      assignment && assignment.mentorId === mentorId
    ).length;
  };

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex justify-between items-center"
        >
          <div>
            <h2 className="text-2xl font-bold" style={{ color: THEME.dark }}>Mentor Management</h2>
            <p className="text-gray-500">View, edit and manage mentors for the DARE program</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline" 
              className="shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 bg-white text-gray-700 font-medium"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => navigate("/mentor-assignment")}
              variant="outline"
              className="shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 bg-white font-medium"
              style={{ color: THEME.primary }}
            >
              <UserCog className="mr-2 h-4 w-4" />
              Mentor Assignment
            </Button>
            <Button
              onClick={handleAddNew}
              style={{ 
                background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                border: "none"
              }}
              className="shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Mentor
            </Button>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div 
        className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-1"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div className="relative flex-1" variants={fadeIn}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Search mentors..." 
            className="pl-9 h-10 sm:h-auto border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1 transition-all duration-300"
            style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </motion.div>

        <motion.div className="w-full sm:w-40 md:w-52 flex-shrink-0" variants={fadeIn}>
          <Select value={districtFilter} onValueChange={(val) => {
            setDistrictFilter(val);
            setCurrentPage(1); // Reset to first page on filter change
          }}>
            <SelectTrigger className="h-10 sm:h-auto border-gray-200 focus:ring-offset-1 transition-all duration-300" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                <SelectValue placeholder="District" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {/* Fixed district dropdown to use the actual district values without Ghana suffix */}
              {["Bekwai", "Gushegu", "Lower Manya Krobo", "Yilo Krobo"].map((district) => (
                <SelectItem key={district} value={district}>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: getDistrictColor(district) }}></div>
                    {district}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      </motion.div>

      {/* Active Filters Display */}
      {(searchQuery || districtFilter !== "all") && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <span className="text-sm text-gray-500 mr-1">Active filters:</span>

          {searchQuery && (
            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer transition-colors" onClick={() => setSearchQuery("")}>
              Search: {searchQuery}
              <span className="ml-1 text-xs">×</span>
            </Badge>
          )}

          {districtFilter !== "all" && (
            <Badge 
              className="text-white hover:opacity-90 cursor-pointer transition-colors" 
              style={{ backgroundColor: getDistrictColor(districtFilter) }}
              onClick={() => setDistrictFilter("all")}
            >
              District: {districtFilter.replace(", Ghana", "")}
              <span className="ml-1 text-xs">×</span>
            </Badge>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto text-xs"
            onClick={clearFilters}
          >
            <RefreshCcw className="mr-1 h-3 w-3" />
            Clear All Filters
          </Button>
        </motion.div>
      )}

      {/* Mentors Card Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
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
              <p className="mt-4 text-gray-500">Loading mentors...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16 px-4">
            <div className="inline-block p-4 rounded-full bg-red-50 mb-4">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load mentors</h3>
            <p className="text-gray-500 mb-4">{(error as Error).message}</p>
            <Button 
              onClick={() => refetch()}
              style={{ 
                background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                border: "none" 
              }}
              className="shadow-md hover:shadow-lg transition-all duration-300"
            >
              Retry
            </Button>
          </div>
        ) : filteredMentors?.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="inline-block p-4 rounded-full" style={{ backgroundColor: `${THEME.primary}10` }}>
              <UserCog className="h-10 w-10" style={{ color: THEME.primary }} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">No mentors found</h3>
            <p className="text-gray-500 mb-4">No mentors match your search criteria</p>
            <Button 
              onClick={clearFilters}
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
            {/* Card Grid Layout */}
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8"
            >
              {paginatedMentors?.map((mentor) => (
                <motion.div 
                  key={mentor.id} 
                  variants={cardVariant}
                  className="h-full"
                >
                  <Card 
                    className="border-gray-100 shadow-md overflow-hidden h-full cursor-pointer transition-all duration-300"
                    style={{ 
                      transform: hoveredCard === mentor.id ? 'translateY(-5px)' : 'translateY(0)',
                      boxShadow: hoveredCard === mentor.id ? '0 10px 25px rgba(0,0,0,0.1)' : '0 2px 10px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={() => setHoveredCard(mentor.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => showAssignButton ? (onAssign && onAssign(mentor)) : navigate(`/mentors/${Number(mentor.id)}`)}
                  >
                    {/* Multi-colored district bar for multi-district mentors */}
                    <div className="h-2 w-full flex">
                      {mentor.assignedDistricts && Array.isArray(mentor.assignedDistricts) && (mentor.assignedDistricts as string[]).length > 0 ? (
                        // If assigned to multiple districts, show a gradient bar
                        (mentor.assignedDistricts as string[]).map((district, index) => (
                          <div 
                            key={index} 
                            className="h-full" 
                            style={{ 
                              backgroundColor: getDistrictColor(district),
                              flex: 1
                            }}
                          ></div>
                        ))
                      ) : (
                        // Fallback to single district
                        <div className="h-full w-full" style={{ 
                          backgroundColor: mentor.assignedDistrict ? getDistrictColor(mentor.assignedDistrict) : "#6c757d",
                        }}></div>
                      )}
                    </div>
                    <CardHeader className="pb-2 p-3 sm:p-6">
                      <div className="flex items-center mb-2">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 mr-3 sm:mr-4 shadow-sm flex-shrink-0">
                          <AvatarImage src={mentor.profilePicture || undefined} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700">
                            {mentor.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <CardTitle className="text-sm sm:text-base font-bold truncate mr-2">
                              {mentor.name}
                            </CardTitle>
                            <div className={`text-xs font-medium rounded-full px-2 py-0.5 
                              ${getAssignedBusinessesCount(mentor.id) > 0 
                                ? "bg-green-100 text-green-800" 
                                : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                <span>{getAssignedBusinessesCount(mentor.id)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-gray-500">
                            <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 flex-shrink-0" />
                            <span className="truncate">{mentor.specialization || "No specialization listed"}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Contact Details */}
                      <div className="space-y-1.5 text-sm text-gray-600">
                        {mentor.email && (
                          <div className="flex items-center">
                            <Mail className="h-3.5 w-3.5 mr-2" />
                            <span className="truncate">{mentor.email}</span>
                          </div>
                        )}
                        {mentor.phone && (
                          <div className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-2" />
                            <span>{mentor.phone}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4 p-3 sm:p-6 pt-0 sm:pt-0">
                      {/* Districts */}
                      <div className="mb-3">
                        <h5 className="text-xs font-medium mb-1.5 text-gray-500">Assigned Districts</h5>
                        <div className="flex flex-wrap gap-1.5">
                          {/* Handle both single district and district array */}
                          {mentor.assignedDistricts && Array.isArray(mentor.assignedDistricts) && mentor.assignedDistricts.length > 0 ? (
                            // If has assigned districts array, show badges for each district
                            (mentor.assignedDistricts as string[]).map((district, index) => (
                              <Badge 
                                key={index} 
                                className="text-white text-xs py-0.5" 
                                style={{ backgroundColor: getDistrictColor(district) }}
                              >
                                <MapPin className="h-3 w-3 mr-1" />
                                <span className="truncate max-w-[100px]">{district.replace(", Ghana", "")}</span>
                              </Badge>
                            ))
                          ) : mentor.assignedDistrict ? (
                            // If only has single district
                            <Badge 
                              className="text-white text-xs py-0.5" 
                              style={{ backgroundColor: getDistrictColor(mentor.assignedDistrict) }}
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-[100px]">{mentor.assignedDistrict.replace(", Ghana", "")}</span>
                            </Badge>
                          ) : (
                            // Fallback if no district assigned
                            <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs py-0.5">
                              No district assigned
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Bio Summary */}
                      {mentor.bio && (
                        <div>
                          <h5 className="text-xs font-medium mb-1.5 text-gray-500">Bio</h5>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{mentor.bio}</p>
                        </div>
                      )}
                      
                      {/* Businesses Count */}
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`gap-1 text-xs ${
                              getAssignedBusinessesCount(mentor.id) > 0 
                                ? "bg-green-50 border-green-100 text-green-700" 
                                : "bg-blue-50 border-blue-100 text-blue-700"
                            }`}
                          >
                            <Briefcase className="h-3 w-3" />
                            <span>
                              {getAssignedBusinessesCount(mentor.id)} 
                              {getAssignedBusinessesCount(mentor.id) === 1 ? " business" : " businesses"}
                            </span>
                          </Badge>
                          {getAssignedBusinessesCount(mentor.id) === 0 && (
                            <span className="text-xs text-gray-500 italic">Not assigned</span>
                          )}
                        </div>

                        <div className="flex space-x-1">
                          {/* Action buttons */}
                          {showAssignButton ? (
                            <Button 
                              variant="outline" 
                              className="h-8 w-full sm:h-9 flex items-center justify-center text-xs sm:text-sm"
                              style={{ borderColor: THEME.primary, color: THEME.primary }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssign && onAssign(mentor);
                              }}
                            >
                              <UserCog className="h-3.5 w-3.5 mr-1" />
                              Assign Mentor
                            </Button>
                          ) : (
                            <>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 sm:h-9 sm:w-9" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/mentors/${mentor.id}/edit`);
                                }}
                              >
                                <Edit className="h-3.5 w-3.5 text-blue-600" />
                              </Button>
                              
                              {/* Only show delete button if user has permission */}
                              {canDelete && (
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8 sm:h-9 sm:w-9" 
                                  onClick={(e) => handleDeleteClick(mentor, e)}
                                >
                                  <Trash className="h-3.5 w-3.5 text-red-600" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6 sm:mt-8">
                <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                  Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredMentors?.length || 0)}</span> of{" "}
                  <span className="font-medium">{filteredMentors?.length}</span> mentors
                </div>
                <div className="flex w-full sm:w-auto justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial h-9 sm:h-8"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial h-9 sm:h-8"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Mentor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this mentor? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center p-4 rounded-lg bg-gray-50 mt-2">
            {mentorToDelete && (
              <>
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={mentorToDelete.profilePicture || undefined} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700">
                    {mentorToDelete.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium text-gray-900">{mentorToDelete.name}</h4>
                  <p className="text-sm text-gray-500">
                    {mentorToDelete.specialization || "No specialization listed"}
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}