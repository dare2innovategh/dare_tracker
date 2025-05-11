import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Mentor, BusinessProfile } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MentorManagement from "@/components/mentors/mentor-management";

// Define the relationship interface
interface MentorBusinessRelationship {
  id: number;
  mentorId: number;
  businessId: number;
  assignedDate: string;
  isActive: boolean;
  mentorshipFocus: string | null;
  meetingFrequency: string | null;
  lastMeetingDate: string | null;
  nextMeetingDate: string | null;
  mentorshipGoals: string[];
  mentorshipProgress: string | null;
  progressRating: number | null;
  notes?: string;
  mentor?: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    profilePicture: string | null;
  };
}
import {
  Search,
  UserCog,
  UserMinus,
  Loader2,
  X,
  MapPin,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  CheckIcon
} from "lucide-react";

// Mastercard color theme
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

interface MentorAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: BusinessProfile;
  currentMentorId?: number;
}

export default function MentorAssignmentDialog({
  open,
  onOpenChange,
  business,
  currentMentorId
}: MentorAssignmentDialogProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"select" | "confirm">("select");
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [notes, setNotes] = useState<string>("");
  
  // Get district color
  const getDistrictColor = (district: string) => {
    if (district.includes("Bekwai")) return THEME.secondary;
    if (district.includes("Gushegu")) return THEME.primary;
    if (district.includes("Lower Manya")) return THEME.accent;
    if (district.includes("Yilo Krobo")) return THEME.dark;
    return "#6c757d";
  };

  // Fetch current mentor relationship if any
  const { data: currentRelationship, isLoading: loadingRelationship } = useQuery<MentorBusinessRelationship>({
    queryKey: ['/api/mentor-businesses/business', business.id],
    enabled: open && !!business?.id,
  });

  // Handle mentor selection
  const handleMentorSelect = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    
    // Set notes if available from current relationship
    if (currentRelationship && currentRelationship.notes) {
      setNotes(currentRelationship.notes);
    }
    
    setViewMode("confirm");
  };

  // Handle cancel 
  const handleCancel = () => {
    setSelectedMentor(null);
    setViewMode("select");
    setNotes("");
  };

  // Handle close dialog
  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSelectedMentor(null);
      setViewMode("select");
      setNotes("");
    }, 300);
  };

  // Handle mentor assignment 
  const assignMutation = useMutation({
    mutationFn: async (data: { 
      mentorId: number; 
      businessId: number; 
      mentorshipFocus?: string; 
      notes?: string 
    }) => {
      // Define valid mentorship focus areas according to enum
      const validFocusAreas = ["Business Growth", "Operations Improvement", "Market Expansion", "Financial Management", "Team Development"];
      
      // If no mentorship focus or invalid value, fetch mentor data or use default
      if (!data.mentorshipFocus || !validFocusAreas.includes(data.mentorshipFocus)) {
        try {
          const mentorRes = await fetch(`/api/mentors/${data.mentorId}`);
          if (mentorRes.ok) {
            const mentorData = await mentorRes.json();
            // Only use specialization if it's a valid focus area
            if (mentorData.specialization && validFocusAreas.includes(mentorData.specialization)) {
              data.mentorshipFocus = mentorData.specialization;
            } else {
              // Default to Business Growth if no valid specialization
              data.mentorshipFocus = "Business Growth";
            }
          } else {
            // Default if mentor data couldn't be fetched
            data.mentorshipFocus = "Business Growth";
          }
        } catch (err) {
          console.error("Error fetching mentor data for specialization:", err);
          // Default if there was an error
          data.mentorshipFocus = "Business Growth";
        }
      }

      const res = await apiRequest("POST", "/api/mentor-businesses", data);
      if (!res.ok) {
        // Handle specific error codes
        if (res.status === 409) {
          throw new Error("This mentor is already assigned to this business");
        }
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to assign mentor");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Mentor assigned to business successfully",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['/api/mentor-businesses'],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/mentor-businesses/business', business.id],
      });
      // Invalidate the mentor-assignments query used in business detail page
      queryClient.invalidateQueries({
        queryKey: [`/api/business-profiles/${business.id}/mentor-assignments`],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/businesses', business.id],
      });
      
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Error",
        description: error.message || "Failed to assign mentor",
        variant: "destructive",
      });
    },
  });
  
  // Handle mentor change (if already assigned)
  const changeMutation = useMutation({
    mutationFn: async (data: { 
      relationshipId: number; 
      mentorId: number; 
      mentorshipFocus?: string;
      notes?: string 
    }) => {
      // Define valid mentorship focus areas according to enum
      const validFocusAreas = ["Business Growth", "Operations Improvement", "Market Expansion", "Financial Management", "Team Development"];
      
      // If no mentorship focus or invalid value, fetch mentor data or use default
      if (!data.mentorshipFocus || !validFocusAreas.includes(data.mentorshipFocus)) {
        try {
          const mentorRes = await fetch(`/api/mentors/${data.mentorId}`);
          if (mentorRes.ok) {
            const mentorData = await mentorRes.json();
            // Only use specialization if it's a valid focus area
            if (mentorData.specialization && validFocusAreas.includes(mentorData.specialization)) {
              data.mentorshipFocus = mentorData.specialization;
            } else {
              // Default to Business Growth if no valid specialization
              data.mentorshipFocus = "Business Growth";
            }
          } else {
            // Default if mentor data couldn't be fetched
            data.mentorshipFocus = "Business Growth";
          }
        } catch (err) {
          console.error("Error fetching mentor data for specialization:", err);
          // Default if there was an error
          data.mentorshipFocus = "Business Growth";
        }
      }
      
      const res = await apiRequest("PATCH", `/api/mentor-businesses/${data.relationshipId}`, {
        mentorId: data.mentorId,
        mentorshipFocus: data.mentorshipFocus,
        notes: data.notes
      });
      if (!res.ok) {
        // Handle specific error codes
        if (res.status === 409) {
          throw new Error("This mentor is already assigned to this business");
        }
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update mentor assignment");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Business mentor updated successfully",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['/api/mentor-businesses'],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/mentor-businesses/business', business.id],
      });
      // Invalidate the mentor-assignments query used in business detail page
      queryClient.invalidateQueries({
        queryKey: [`/api/business-profiles/${business.id}/mentor-assignments`],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/businesses', business.id],
      });
      
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Error",
        description: error.message || "Failed to update mentor",
        variant: "destructive",
      });
    },
  });
  
  // Handle unassign mentor
  const unassignMutation = useMutation({
    mutationFn: async (relationshipId: number) => {
      const res = await apiRequest("DELETE", `/api/mentor-businesses/${relationshipId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to unassign mentor");
      }
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Mentor unassigned from business",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['/api/mentor-businesses'],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/mentor-businesses/business', business.id],
      });
      // Invalidate the mentor-assignments query used in business detail page
      queryClient.invalidateQueries({
        queryKey: [`/api/business-profiles/${business.id}/mentor-assignments`],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/businesses', business.id],
      });
      
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Unassign Error",
        description: error.message || "Failed to unassign mentor",
        variant: "destructive",
      });
    },
  });

  // Handle confirmation of assignment
  const handleAssignConfirm = () => {
    if (!selectedMentor) return;
    
    // Always use the mentor's specialization directly
    const specialization = selectedMentor.specialization || "Business Growth";
    
    if (currentRelationship) {
      // Updating existing relationship
      changeMutation.mutate({
        relationshipId: currentRelationship.id,
        mentorId: selectedMentor.id,
        mentorshipFocus: specialization,
        notes: notes.trim() || undefined
      });
    } else {
      // Creating new relationship
      assignMutation.mutate({
        mentorId: selectedMentor.id,
        businessId: business.id,
        mentorshipFocus: specialization,
        notes: notes.trim() || undefined
      });
    }
  };
  
  // Handle unassign confirmation
  const handleUnassign = () => {
    if (currentRelationship) {
      unassignMutation.mutate(currentRelationship.id);
    }
  };

  // Is this an update or new assignment?
  const isUpdate = !!currentRelationship;
  const isPending = assignMutation.isPending || changeMutation.isPending || unassignMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg">
            {viewMode === "select" ? "Assign Mentor to Business" : "Confirm Mentor Assignment"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {viewMode === "select" 
              ? `Select a mentor to assign to ${business.businessName}`
              : `Review and confirm mentor assignment for ${business.businessName}`
            }
          </DialogDescription>
        </DialogHeader>
        
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto py-1 sm:py-2">
          <AnimatePresence mode="wait">
            {viewMode === "select" ? (
              /* Mentor selection view */
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {/* Current mentor info if already assigned */}
                {loadingRelationship ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : currentRelationship ? (
                  <div className="p-3 sm:p-4 border rounded-lg bg-gray-50 mb-4 sm:mb-6">
                    <h3 className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-1 sm:gap-2">
                      <UserCog className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Current Assigned Mentor
                    </h3>
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                      <div className="flex items-center flex-1 min-w-0">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 mr-3 sm:mr-4 flex-shrink-0">
                          <AvatarImage src={currentRelationship.mentor?.profilePicture || undefined} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700">
                            {currentRelationship.mentor?.name?.charAt(0) || "M"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{currentRelationship.mentor?.name}</p>
                          {currentRelationship.mentor?.email && (
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{currentRelationship.mentor.email}</p>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full sm:w-auto"
                        onClick={handleUnassign}
                        disabled={unassignMutation.isPending}
                      >
                        {unassignMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <UserMinus className="h-4 w-4 mr-1" />
                        )}
                        Unassign
                      </Button>
                    </div>
                    {currentRelationship.notes && (
                      <div className="mt-2 p-2 sm:p-3 rounded bg-gray-100 text-xs sm:text-sm">
                        <p className="text-xs font-medium text-gray-600 mb-0.5 sm:mb-1">Notes:</p>
                        <p className="text-gray-700">{currentRelationship.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 sm:p-4 border rounded-lg bg-gray-50 border-dashed mb-4 sm:mb-6 text-center">
                    <p className="text-xs sm:text-sm text-gray-500">No mentor currently assigned to this business</p>
                  </div>
                )}

                {/* Mentor selection grid */}
                <div className="border-t pt-3 sm:pt-4">
                  <h3 className="text-sm sm:text-base font-medium mb-3 sm:mb-4">{isUpdate ? "Change Mentor" : "Select Mentor"}</h3>
                  <MentorManagement 
                    hideHeader 
                    initialDistrict={business.district} 
                    showAssignButton
                    onAssign={handleMentorSelect}
                  />
                </div>
              </motion.div>
            ) : (
              /* Confirmation view */
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {selectedMentor && (
                  <>
                    <div className="mb-6">
                      <h3 className="text-sm sm:text-base font-medium mb-2 sm:mb-4">Selected Mentor</h3>
                      <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                        <div className="flex items-start">
                          <Avatar className="h-12 w-12 sm:h-16 sm:w-16 mr-3 sm:mr-4 flex-shrink-0">
                            <AvatarImage src={selectedMentor.profilePicture || undefined} />
                            <AvatarFallback className="text-lg sm:text-xl bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700">
                              {selectedMentor.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base sm:text-lg font-semibold truncate">{selectedMentor.name}</h4>
                            {selectedMentor.specialization && (
                              <p className="text-gray-600 flex items-center mb-1 text-sm">
                                <GraduationCap className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{selectedMentor.specialization}</span>
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                              {/* Display assigned districts */}
                              {selectedMentor.assignedDistricts && Array.isArray(selectedMentor.assignedDistricts) && (selectedMentor.assignedDistricts as string[]).length > 0 ? (
                                (selectedMentor.assignedDistricts as string[]).map((district, index) => (
                                  <Badge 
                                    key={index} 
                                    className="text-white text-xs py-0.5" 
                                    style={{ backgroundColor: getDistrictColor(district) }}
                                  >
                                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate max-w-[100px]">{district.replace(", Ghana", "")}</span>
                                  </Badge>
                                ))
                              ) : selectedMentor.assignedDistrict ? (
                                <Badge 
                                  className="text-white text-xs py-0.5" 
                                  style={{ backgroundColor: getDistrictColor(selectedMentor.assignedDistrict) }}
                                >
                                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate max-w-[100px]">{selectedMentor.assignedDistrict.replace(", Ghana", "")}</span>
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                          {selectedMentor.email && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-700 text-sm truncate">{selectedMentor.email}</span>
                            </div>
                          )}
                          {selectedMentor.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-700 text-sm">{selectedMentor.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Business info (reminder) */}
                    <div className="mb-6">
                      <h3 className="text-sm sm:text-base font-medium mb-2 sm:mb-4">Business Information</h3>
                      <div className="border rounded-lg p-3 sm:p-4 bg-blue-50">
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{business.businessName}</h4>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{business.district}, {business.businessLocation || "No location"}</p>
                          </div>
                          <Badge className="ml-2 text-xs" variant="outline">
                            {business.dareModel || "Standard Model"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mentor's Specialization - Display only */}
                    <div className="mb-3 sm:mb-4">
                      <Label htmlFor="specialization" className="text-xs sm:text-sm">Mentor's Specialization</Label>
                      <div className="w-full mt-1 sm:mt-1.5 p-2 border rounded-md bg-gray-50 text-sm">
                        {selectedMentor?.specialization || "General Support"}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-1.5">
                        This mentor will use their specialization expertise to support the business
                      </p>
                    </div>
                    
                    {/* Assignment notes */}
                    <div className="mb-3 sm:mb-4">
                      <Label htmlFor="notes" className="text-xs sm:text-sm">Assignment Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any notes about this mentor assignment..."
                        className="mt-1 sm:mt-1.5 text-sm"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-1.5">
                        These notes will be visible to admins and the assigned mentor
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <DialogFooter className="pt-2 border-t flex flex-col sm:flex-row gap-2 sm:gap-0">
          {viewMode === "select" ? (
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="w-full sm:w-auto h-10 sm:h-9"
            >
              Cancel
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleCancel} 
                disabled={isPending}
                className="w-full sm:w-auto h-10 sm:h-9 order-2 sm:order-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleAssignConfirm} 
                disabled={!selectedMentor || isPending}
                style={{ 
                  background: isPending 
                    ? "#ccc" 
                    : `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                  border: "none" 
                }}
                className="w-full sm:w-auto h-10 sm:h-9 shadow-sm hover:shadow-md transition-all duration-300 order-1 sm:order-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUpdate ? "Updating..." : "Assigning..."}
                  </>
                ) : (
                  <>
                    <CheckIcon className="mr-2 h-4 w-4" />
                    {isUpdate ? "Update Assignment" : "Confirm Assignment"}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}