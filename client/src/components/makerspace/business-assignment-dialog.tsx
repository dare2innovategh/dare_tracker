import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Business {
  id: number;
  businessName: string;
  district: string;
  ownerName?: string | null;
}

interface MakerspaceBusinessAssignment {
  id: number;
  businessId: number;
  makerspaceId: number;
  assignedDate: string;
  isActive: boolean;
  business?: {
    id: number;
    businessName: string;
    ownerName: string | null;
  };
}

interface BusinessAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  makerspaceId: number;
}

export function BusinessAssignmentDialog({
  open,
  onOpenChange,
  makerspaceId,
}: BusinessAssignmentDialogProps) {
  const { toast } = useToast();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [existingAssignment, setExistingAssignment] = useState<MakerspaceBusinessAssignment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset the state when the dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedBusinessId("");
      setExistingAssignment(null);
    }
  }, [open]);

  // Fetch all businesses
  const {
    data: businesses = [],
    isLoading: isLoadingBusinesses,
    error: businessesError
  } = useQuery<Business[]>({
    queryKey: ["/api/business-profiles"],
    enabled: open,
    retry: 1
  });

  // Handle business loading error
  useEffect(() => {
    if (businessesError) {
      console.error("Business loading error:", businessesError);
      toast({
        title: "Error",
        description: "Failed to load businesses",
        variant: "destructive",
      });
    }
  }, [businessesError, toast]);

  // Fetch existing business assignments for this makerspace
  const {
    data: assignments = [],
    isLoading: isLoadingAssignments,
    error: assignmentsError
  } = useQuery<MakerspaceBusinessAssignment[]>({
    queryKey: ["/api/business-management/makerspaces", makerspaceId, "businesses"],
    enabled: open && !!makerspaceId,
    retry: 1
  });
  
  // Handle assignments loading error
  useEffect(() => {
    if (assignmentsError) {
      console.error("Assignment loading error:", assignmentsError);
      toast({
        title: "Error",
        description: "Failed to load existing assignments",
        variant: "destructive",
      });
    }
  }, [assignmentsError, toast]);

  // Find the existing assignment for the selected business
  useEffect(() => {
    if (selectedBusinessId && assignments?.length > 0) {
      const businessId = parseInt(selectedBusinessId, 10);
      const assignment = assignments.find(a => a.businessId === businessId && a.isActive);
      setExistingAssignment(assignment || null);
    } else {
      setExistingAssignment(null);
    }
  }, [selectedBusinessId, assignments]);

  // Handler for select change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log("Select changed to:", e.target.value);
    setSelectedBusinessId(e.target.value);
  };

  // Handler for assignment
  const handleAssign = async () => {
    if (!selectedBusinessId) {
      toast({
        title: "Error",
        description: "Please select a business",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      console.log("Starting business assignment process...");
      
      // Convert to number
      const businessId = parseInt(selectedBusinessId, 10);
      if (isNaN(businessId)) {
        throw new Error(`Invalid business ID: ${selectedBusinessId}`);
      }
      
      console.log(`Assigning business ${businessId} to makerspace ${makerspaceId}`);
      
      // Use a simple payload
      const payload = { makerspaceId: makerspaceId };
      console.log("Sending payload:", payload);
      
      const response = await apiRequest(
        "POST", 
        `/api/business-management/businesses/${businessId}/makerspace-assignment`, 
        payload,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", errorData);
        throw new Error(errorData.message || "Failed to assign business");
      }
      
      const result = await response.json();
      console.log("Assignment successful:", result);
      
      toast({
        title: "Success",
        description: "Business assigned to makerspace successfully",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["/api/business-management/makerspaces", makerspaceId, "businesses"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/business-management/makerspaces"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/business-profiles"],
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Assignment error:", error);
      toast({
        title: "Assignment Error",
        description: error instanceof Error ? error.message : "Failed to assign business",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler for removal
  const handleRemove = async () => {
    if (!selectedBusinessId || !existingAssignment) {
      toast({
        title: "Error",
        description: "No assignment to remove",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      console.log("Starting removal process...");
      
      const businessId = parseInt(selectedBusinessId, 10);
      console.log(`Removing assignment ${existingAssignment.id} for business ${businessId}`);
      
      const response = await apiRequest(
        "DELETE", 
        `/api/business-management/businesses/${businessId}/makerspace-assignment/${existingAssignment.id}`,
        undefined,
        {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", errorData);
        throw new Error(errorData.message || "Failed to remove business assignment");
      }
      
      console.log("Removal successful");
      toast({
        title: "Success",
        description: "Business unassigned from makerspace",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["/api/business-management/makerspaces", makerspaceId, "businesses"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/business-management/makerspaces"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/business-profiles"],
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Removal error:", error);
      toast({
        title: "Unassign Error",
        description: error instanceof Error ? error.message : "Failed to unassign business",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isLoadingBusinesses || isLoadingAssignments;

  // Filter available businesses
  const availableBusinesses = businesses.filter(business => {
    // Include the selected business if it has an existing assignment
    if (existingAssignment && business.id === parseInt(selectedBusinessId, 10)) {
      return true;
    }

    // Otherwise only include businesses that aren't already assigned
    return !assignments.some(a => a.businessId === business.id && a.isActive);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5 text-orange-500" />
            Assign Business
          </DialogTitle>
          <DialogDescription>
            Assign a business to operate in this makerspace location.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="business-select">Select Business</Label>
              
              {/* Plain HTML select instead of the UI component */}
              <select
                id="business-select"
                value={selectedBusinessId}
                onChange={handleSelectChange}
                disabled={isProcessing || !!existingAssignment}
                className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a business</option>
                {availableBusinesses.map((business) => (
                  <option key={business.id} value={String(business.id)}>
                    {business.businessName} {business.ownerName ? `(${business.ownerName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {existingAssignment && existingAssignment.business && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-md">
                <p className="text-sm font-medium text-orange-800">Current Assignment:</p>
                <p className="text-sm text-orange-700">
                  {existingAssignment.business.businessName} 
                  {existingAssignment.business.ownerName && ` (${existingAssignment.business.ownerName})`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Assigned: {new Date(existingAssignment.assignedDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
          {existingAssignment && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemove}
              disabled={isProcessing || isLoading}
              className="mt-3 sm:mt-0"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Assignment
            </Button>
          )}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssign}
              disabled={!selectedBusinessId || isProcessing || isLoading || !!existingAssignment}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Business
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}