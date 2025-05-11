import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Store } from "lucide-react";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Define types
interface MakerspaceAssignment {
  id: number;
  businessId: number;
  makerspaceId: number;
  assignedDate: string;
  isActive: boolean;
  makerspace?: {
    id: number;
    name: string;
    district: string;
  };
}

interface Makerspace {
  id: number;
  name: string;
  district: string;
  description?: string;
  address: string;
}

interface MakerspaceAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: any;
}

export function MakerspaceAssignmentDialog({
  open,
  onOpenChange,
  business,
}: MakerspaceAssignmentDialogProps) {
  const { toast } = useToast();
  const [selectedMakerspaceId, setSelectedMakerspaceId] = useState<string>("");
  const [existingAssignment, setExistingAssignment] = useState<MakerspaceAssignment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch all makerspaces with the correct API endpoint
  const {
    data: makerspaces = [],
    isLoading: isLoadingMakerspaces,
    error: makerspacesError
  } = useQuery<Makerspace[]>({
    queryKey: ["/api/business-management/makerspaces"],
    enabled: open,
    retry: 1
  });

  // Log loading errors
  useEffect(() => {
    if (makerspacesError) {
      console.error("Makerspace loading error:", makerspacesError);
      toast({
        title: "Error",
        description: "Failed to load available makerspaces",
        variant: "destructive",
      });
    }
  }, [makerspacesError, toast]);

  // Fetch existing assignments for this business
  const {
    data: assignments = [],
    isLoading: isLoadingAssignments,
    error: assignmentsError
  } = useQuery<MakerspaceAssignment[]>({
    queryKey: ["/api/business-management/businesses", business?.id, "makerspace-assignments"],
    enabled: open && !!business?.id,
    retry: 1
  });
  
  // Log assignment loading errors
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

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedMakerspaceId("");
      setExistingAssignment(null);
    }
  }, [open]);

  // Update selection when assignments change
  useEffect(() => {
    if (assignments && assignments.length > 0) {
      const activeAssignment = assignments.find(a => a.isActive);
      if (activeAssignment) {
        console.log("Found active assignment:", activeAssignment);
        setExistingAssignment(activeAssignment);
        setSelectedMakerspaceId(String(activeAssignment.makerspaceId));
      } else {
        setExistingAssignment(null);
        setSelectedMakerspaceId("");
      }
    } else {
      setExistingAssignment(null);
      setSelectedMakerspaceId("");
    }
  }, [assignments]);

  // Filter to show only available makerspaces (not already assigned to this business)
  const availableMakerspaces = makerspaces.filter(makerspace => {
    // Always include the currently assigned makerspace
    if (existingAssignment && makerspace.id === parseInt(selectedMakerspaceId, 10)) {
      return true;
    }
    
    // Otherwise only include makerspaces that aren't already assigned
    return !assignments.some(a => a.makerspaceId === makerspace.id && a.isActive);
  });

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log("Native select changed to:", e.target.value);
    setSelectedMakerspaceId(e.target.value);
  };

  const handleAssign = async () => {
    if (!selectedMakerspaceId) {
      toast({
        title: "Error",
        description: "Please select a makerspace",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const makerspaceId = parseInt(selectedMakerspaceId, 10);
      
      console.log(`Assigning makerspace ${makerspaceId} to business ${business.id}`);
      const payload = { makerspaceId };
      
      const response = await apiRequest(
        "POST", 
        `/api/business-management/businesses/${business.id}/makerspace-assignment`, 
        payload,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to assign makerspace");
      }
      
      toast({
        title: "Success",
        description: "Business assigned to makerspace successfully",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ["/api/business-management/businesses", business.id, "makerspace-assignments"],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/business-profiles/${business.id}`],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/business-management/makerspaces"],
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Assignment error:", error);
      toast({
        title: "Assignment Error",
        description: error instanceof Error ? error.message : "Failed to assign makerspace",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async () => {
    if (!existingAssignment) {
      toast({
        title: "Error",
        description: "No assignment to remove",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      console.log(`Removing assignment ${existingAssignment.id} for business ${business.id}`);
      
      const response = await apiRequest(
        "DELETE", 
        `/api/business-management/businesses/${business.id}/makerspace-assignment/${existingAssignment.id}`,
        undefined,
        {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to remove assignment");
      }
      
      toast({
        title: "Success",
        description: "Business unassigned from makerspace",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ["/api/business-management/businesses", business.id, "makerspace-assignments"],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/business-profiles/${business.id}`],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/business-management/makerspaces"],
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Removal error:", error);
      toast({
        title: "Unassign Error",
        description: error instanceof Error ? error.message : "Failed to unassign makerspace",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isLoadingMakerspaces || isLoadingAssignments;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Store className="mr-2 h-5 w-5 text-orange-500" />
            Assign Makerspace
          </DialogTitle>
          <DialogDescription>
            Assign this business to operate in a makerspace location.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="makerspace-select">Select Makerspace</Label>
              
              {/* Using basic HTML select instead of the UI component */}
              <select
                id="makerspace-select"
                value={selectedMakerspaceId}
                onChange={handleSelectChange}
                disabled={isProcessing || !!existingAssignment}
                className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a makerspace</option>
                {availableMakerspaces.map((makerspace) => (
                  <option key={makerspace.id} value={String(makerspace.id)}>
                    {makerspace.name} ({makerspace.district})
                  </option>
                ))}
              </select>
            </div>
            
            {existingAssignment && existingAssignment.makerspace && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-md">
                <p className="text-sm font-medium text-orange-800">Current Assignment:</p>
                <p className="text-sm text-orange-700">
                  {existingAssignment.makerspace.name} ({existingAssignment.makerspace.district})
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
              disabled={!selectedMakerspaceId || isProcessing || isLoading || !!existingAssignment}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Makerspace
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}