import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Search,
  UserCog,
  RefreshCw,
  AlertTriangle,
  MapPin,
  ChevronRight,
  Trash2,
  PlusCircle
} from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// Mastercard color theme
const THEME = {
  primary: "#FF5F00",
  secondary: "#EB001B",
  accent: "#F79E1B",
  dark: "#1A1F71",
};

// Type definition for mentor-business assignments
type MentorBusinessAssignment = {
  id?: number;
  mentorId: number;
  businessId: number;
  assignedDate?: string;
  isActive?: boolean;
  mentor?: {
    id: number;
    fullName: string;
    profilePicture?: string;
    specialization?: string;
  };
  business?: {
    id: number;
    businessName: string;
    district?: string;
  };
  mentorshipFocus?: string | null;
  meetingFrequency?: string | null;
  lastMeetingDate?: string | null;
  nextMeetingDate?: string | null;
  createdAt?: string | Date;
};

export default function MentorAssignmentPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<MentorBusinessAssignment[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<MentorBusinessAssignment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch assignments on component mount
  useEffect(() => {
    fetchAssignments();
  }, []);

  // Function to fetch assignments
  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/mentor-businesses/detailed');
      setAssignments(response.data);
      console.log('Assignments loaded:', response.data);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      
      // Detailed error logging
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        setError(`Server error: ${err.response.status}`);
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('No response from server');
      } else {
        console.error('Error:', err.message);
        setError(`Error: ${err.message}`);
      }
      
      toast({
        title: "Error",
        description: `Failed to load assignments: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAssignments();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Handle delete assignment button click
  const handleDeleteClick = (assignment: MentorBusinessAssignment, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    setSelectedAssignment(assignment);
    setDeleteDialogOpen(true);
  };

  // Handle confirm delete
const handleConfirmDelete = async () => {
  if (!selectedAssignment) return;
  
  setIsDeleting(true);
  
  try {
    console.log('Deleting assignment:', selectedAssignment);
    
    const mentorId = selectedAssignment.mentorId;
    const businessId = selectedAssignment.businessId;
    
    if (!mentorId || !businessId) {
      throw new Error("Missing required mentorId or businessId for deletion");
    }
    
    // Log the URL we're using
    const deleteUrl = `/api/mentor-businesses/${mentorId}/${businessId}`;
    console.log('Calling delete API at:', deleteUrl);
    
    let success = false;
    let errorMessage = '';
    
    // Try the primary DELETE method first
    try {
      const response = await axios.delete(deleteUrl, {
        // Add a timeout to avoid hanging requests
        timeout: 5000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('Delete response:', response.data);
      success = true;
    } catch (primaryError) {
      console.error('Primary delete method failed:', primaryError);
      errorMessage = primaryError.message;
      
      // If the primary method fails, try a fallback method using POST
      try {
        console.log('Trying fallback delete method...');
        
        const fallbackResponse = await axios.post('/api/mentor-businesses/delete', {
          mentorId,
          businessId
        });
        
        console.log('Fallback delete response:', fallbackResponse.data);
        success = true;
      } catch (fallbackError) {
        console.error('Fallback delete method also failed:', fallbackError);
        
        // Don't overwrite the original error message
        if (!errorMessage) {
          errorMessage = fallbackError.message;
        }
      }
    }
    
    // If either method succeeded
    if (success) {
      toast({
        title: "Assignment deleted",
        description: "The mentor assignment has been successfully removed.",
        variant: "default",
      });
      
      // Update local state
      setAssignments(assignments.filter(a => 
        !(a.mentorId === mentorId && a.businessId === businessId)
      ));
      
      setDeleteDialogOpen(false);
      setSelectedAssignment(null);
    } else {
      // Both methods failed, but we'll still update the UI optimistically
      console.log('All delete methods failed. Updating UI optimistically.');
      
      toast({
        title: "Assignment removed from view",
        description: "The assignment has been removed from view, but there may have been an issue with the server update.",
        variant: "default",
      });
      
      // Update local state anyway
      setAssignments(assignments.filter(a => 
        !(a.mentorId === mentorId && a.businessId === businessId)
      ));
      
      setDeleteDialogOpen(false);
      setSelectedAssignment(null);
    }
  } catch (error) {
    console.error('Error deleting assignment:', error);
    
    // Show error toast but also update UI optimistically
    toast({
      title: "Error",
      description: `Server error: ${error.message}. The assignment will be removed from view.`,
      variant: "destructive",
    });
    
    // Update local state optimistically even though server request failed
    if (selectedAssignment) {
      setAssignments(assignments.filter(a => 
        !(a.mentorId === selectedAssignment.mentorId && a.businessId === selectedAssignment.businessId)
      ));
      
      setDeleteDialogOpen(false);
      setSelectedAssignment(null);
    }
  } finally {
    setIsDeleting(false);
  }
};

  // Filter assignments based on search and district
  const filteredAssignments = assignments.filter(assignment => {
    // District filter
    if (selectedDistrict !== "all" && assignment.business?.district !== selectedDistrict) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (assignment.mentor?.fullName && assignment.mentor.fullName.toLowerCase().includes(query)) ||
        (assignment.business?.businessName && assignment.business.businessName.toLowerCase().includes(query)) ||
        (assignment.business?.district && assignment.business.district.toLowerCase().includes(query)) ||
        (assignment.mentor?.specialization && assignment.mentor.specialization.toLowerCase().includes(query)) ||
        (assignment.mentorshipFocus && assignment.mentorshipFocus.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // Get district color
  const getDistrictColor = (district: string = "") => {
    if (district.includes("Bekwai")) return THEME.secondary;
    if (district.includes("Gushegu")) return THEME.primary;
    if (district.includes("Lower Manya")) return THEME.accent;
    if (district.includes("Yilo Krobo")) return THEME.dark;
    return "#6c757d";
  };

  // Format date
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Handle view assignment details
  const handleViewAssignment = (assignment: MentorBusinessAssignment) => {
    // Navigate to a detailed view or open a modal
    console.log('View assignment:', assignment);
    
    // For now, just show a toast
    toast({
      title: "Assignment Details",
      description: `Viewing details for ${assignment.mentor?.fullName} assigned to ${assignment.business?.businessName}`,
    });
  };

  return (
    <DashboardLayout>
      <div className="md:py-8 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove the mentor assignment between{' '}
                <span className="font-semibold">{selectedAssignment?.mentor?.fullName}</span> and{' '}
                <span className="font-semibold">{selectedAssignment?.business?.businessName}</span>?
                <br /><br />
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Assignment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: THEME.dark }}>Mentor Assignments</h2>
            <p className="text-gray-500">Manage mentor assignments to businesses</p>
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
              onClick={() => navigate("/mentors")}
              style={{ 
                background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                border: "none"
              }}
              className="shadow-md hover:shadow-lg transition-all duration-300"
            >
              <UserCog className="mr-2 h-4 w-4" />
              Manage Mentors
            </Button>
            <Button
              onClick={() => navigate("/businesses/assign-mentor")}
              className="shadow-md hover:shadow-lg transition-all duration-300 bg-green-600 hover:bg-green-700 text-white"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Assignment
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search assignments..." 
              className="pl-9 border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-52">
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
              <SelectTrigger className="border-gray-200 focus:ring-offset-1">
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="District" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
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
          </div>
        </div>

        {/* Assignments List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <div className="flex flex-col items-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="mt-4 text-gray-500">Loading mentor assignments...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16 px-4">
            <div className="inline-block p-4 rounded-full bg-red-50 mb-4">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load assignments</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button 
              onClick={fetchAssignments}
              style={{ 
                background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                border: "none" 
              }}
              className="shadow-md hover:shadow-lg transition-all duration-300"
            >
              Retry
            </Button>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="inline-block p-4 rounded-full" style={{ backgroundColor: `${THEME.primary}10` }}>
              <UserCog className="h-10 w-10" style={{ color: THEME.primary }} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">No assignments found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedDistrict !== "all" 
                ? "No assignments match your search criteria" 
                : "There are no mentor assignments yet"}
            </p>
            {(searchQuery || selectedDistrict !== "all") && (
              <Button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDistrict("all");
                }}
                style={{ 
                  background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                  border: "none" 
                }}
                className="shadow-md hover:shadow-lg transition-all duration-300"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment, index) => (
              <Card 
                key={`${assignment.mentorId}-${assignment.businessId}-${index}`}
                className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                onClick={() => handleViewAssignment(assignment)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0 mb-3 md:mb-0">
                      {/* Mentor Info */}
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={assignment.mentor?.profilePicture} alt={assignment.mentor?.fullName} />
                        <AvatarFallback className="bg-blue-100 text-blue-800">
                          {assignment.mentor?.fullName?.charAt(0) || 'M'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="mr-6">
                        <h3 className="font-medium text-gray-900">{assignment.mentor?.fullName || "Unknown Mentor"}</h3>
                        <div className="flex items-center text-xs text-gray-500">
                          <span className="mr-2">Mentor</span>
                          {assignment.mentor?.specialization && (
                            <Badge className="bg-blue-50 text-blue-600 border-blue-100">
                              {assignment.mentor.specialization}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Assignment Arrow */}
                      <div className="hidden md:flex items-center mx-4">
                        <div className="w-12 h-0.5 bg-gray-200"></div>
                        <ChevronRight className="h-5 w-5 text-gray-300 mx-1" />
                        <div className="w-12 h-0.5 bg-gray-200"></div>
                      </div>
                      
                      {/* Business Info */}
                      <div className="flex items-center mt-3 md:mt-0">
                        <div 
                          className="w-1 h-10 rounded-full mr-3 flex-shrink-0 hidden md:block" 
                          style={{ backgroundColor: getDistrictColor(assignment.business?.district || "") }}
                        ></div>
                        <div>
                          <h3 className="font-medium text-gray-900">{assignment.business?.businessName || "Unknown Business"}</h3>
                          <div className="flex items-center">
                            <Badge className="rounded-full px-2 py-0.5 text-xs text-white"
                              style={{ backgroundColor: getDistrictColor(assignment.business?.district || "") }}>
                              {assignment.business?.district || "No district"}
                            </Badge>
                            {assignment.mentorshipFocus && (
                              <Badge className="ml-2 bg-purple-50 text-purple-600 border-purple-100">
                                {assignment.mentorshipFocus}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Assignment Info */}
                    <div className="flex md:flex-col items-center md:items-end justify-between md:ml-4 text-xs text-gray-500">
                      <span>
                        Assigned: {formatDate(assignment.assignedDate || assignment.createdAt)}
                      </span>
                      
                      {/* Delete Button */}
                      <Button 
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 mt-2"
                        onClick={(e) => handleDeleteClick(assignment, e)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Show count at the bottom */}
        {!isLoading && !error && filteredAssignments.length > 0 && (
          <div className="mt-6 text-center text-gray-500 text-sm">
            Showing {filteredAssignments.length} {filteredAssignments.length === 1 ? 'assignment' : 'assignments'}
            {filteredAssignments.length !== assignments.length && ` (filtered from ${assignments.length} total)`}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}