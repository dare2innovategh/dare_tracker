import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  MoreVertical, 
  Eye, 
  FileText, 
  Calendar, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  CheckCircle,
  ExternalLink
} from "lucide-react";
import { 
  BusinessTracking, 
  BusinessTrackingPeriod, 
  BusinessTrackingType, 
  BusinessTrackingStatus 
} from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

interface BusinessTrackingTableProps {
  businessId: number;
  businessName?: string;
}

export function BusinessTrackingTable({ businessId, businessName }: BusinessTrackingTableProps) {
  const [filter, setFilter] = useState<string>("all");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  // For dialogs and record management
  const [selectedRecord, setSelectedRecord] = useState<BusinessTracking | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmVerifyOpen, setConfirmVerifyOpen] = useState(false);
  
  // Get current user and toast notification
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/business-tracking/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete tracking record");
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/business-tracking/businesses/${businessId}/tracking`]
      });
      toast({
        title: "Tracking record deleted",
        description: "The tracking record has been successfully deleted.",
      });
      setConfirmDeleteOpen(false);
      setSelectedRecord(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete tracking record",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/business-tracking/${id}/verify`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to verify tracking record");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/business-tracking/businesses/${businessId}/tracking`]
      });
      toast({
        title: "Tracking record verified",
        description: "The tracking record has been successfully verified.",
      });
      setConfirmVerifyOpen(false);
      setSelectedRecord(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to verify tracking record",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle actions
  const handleViewDetails = (record: BusinessTracking) => {
    setSelectedRecord(record);
    setViewDetailsOpen(true);
  };

  const handleEditRecord = (record: BusinessTracking) => {
    // Navigate to edit page
    navigate(`/businesses/${businessId}/edit-tracking/${record.id}`);
  };

  const handleDeleteRecord = (record: BusinessTracking) => {
    setSelectedRecord(record);
    setConfirmDeleteOpen(true);
  };
  
  const handleVerifyRecord = (record: BusinessTracking) => {
    setSelectedRecord(record);
    setConfirmVerifyOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedRecord) {
      deleteMutation.mutate(selectedRecord.id);
    }
  };
  
  const confirmVerify = () => {
    if (selectedRecord) {
      verifyMutation.mutate(selectedRecord.id);
    }
  };
  
  // Fetch business tracking records
  const { data: trackingRecords, isLoading, error } = useQuery<BusinessTracking[]>({
    queryKey: [`/api/business-tracking/businesses/${businessId}/tracking`],
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  // Handle year filter change
  const handleYearChange = (value: string) => {
    setYear(parseInt(value));
  };

  // Filter records based on selected period and year
  const filteredRecords = trackingRecords?.filter((record) => {
    // Year filter
    const recordYear = new Date(record.trackingDate).getFullYear();
    if (recordYear !== year) return false;
    
    // Filter by month if a specific month is selected
    if (filter === "all") return true;
    
    // Get the month abbreviation from the tracking month
    const recordMonth = format(new Date(record.trackingMonth), "MMM");
    return recordMonth.toLowerCase() === filter.toLowerCase();
  });

  // Generate available years from tracking records
  const availableYears = trackingRecords
    ? Array.from(new Set(trackingRecords.map(record => new Date(record.trackingDate).getFullYear())))
    : [new Date().getFullYear()];

  // Format currency for display
  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Get status color based on financial performance
  const getStatusColor = (projected: number | null, actual: number | null) => {
    if (projected === null || actual === null) return "bg-gray-200 text-gray-700";
    if (actual >= projected) return "bg-green-100 text-green-800";
    if (actual >= projected * 0.75) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Error loading tracking data</h3>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          {error instanceof Error ? error.message : "Failed to load business tracking records"}
        </p>
        <Button 
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Reload
        </Button>
      </div>
    );
  }

  // Show empty state if no records found
  if (!trackingRecords || trackingRecords.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg bg-muted/30">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-medium mb-2">No tracking records</h3>
        <p className="text-muted-foreground mb-4">
          No business tracking records have been added yet.
        </p>
      </div>
    );
  }

  // Return data table
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              <SelectItem value="Jan">January</SelectItem>
              <SelectItem value="Feb">February</SelectItem>
              <SelectItem value="Mar">March</SelectItem>
              <SelectItem value="Apr">April</SelectItem>
              <SelectItem value="May">May</SelectItem>
              <SelectItem value="Jun">June</SelectItem>
              <SelectItem value="Jul">July</SelectItem>
              <SelectItem value="Aug">August</SelectItem>
              <SelectItem value="Sep">September</SelectItem>
              <SelectItem value="Oct">October</SelectItem>
              <SelectItem value="Nov">November</SelectItem>
              <SelectItem value="Dec">December</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={year.toString()} 
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.sort((a, b) => b - a).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredRecords?.length || 0} of {trackingRecords?.length || 0} records
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableCaption>
            Business tracking records for {year}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="hidden md:table-cell">Projected Revenue</TableHead>
              <TableHead>Actual Revenue</TableHead>
              <TableHead className="hidden md:table-cell">Employees</TableHead>
              <TableHead className="hidden lg:table-cell">Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords?.map((record) => (
              <TableRow key={record.id} className={record.isVerified ? "bg-green-50/50" : undefined}>
                <TableCell className="font-medium">
                  {format(new Date(record.trackingDate), "MMM d, yyyy")}
                  {record.isVerified && (
                    <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {format(new Date(record.trackingMonth), "MMMM")}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatCurrency(record.projectedRevenue)}
                </TableCell>
                <TableCell>
                  {formatCurrency(record.actualRevenue)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {record.actualEmployees ?? "—"}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge 
                    className={getStatusColor(record.projectedRevenue, record.actualRevenue)}
                    variant="outline"
                  >
                    {record.projectedRevenue && record.actualRevenue
                      ? record.actualRevenue >= record.projectedRevenue
                        ? "On Target" 
                        : record.actualRevenue >= record.projectedRevenue * 0.75
                          ? "Below Target"
                          : "Needs Attention"
                      : "No Data"
                    }
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleViewDetails(record)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditRecord(record)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Record
                      </DropdownMenuItem>
                      {(user?.role === "admin" || user?.role === "reviewer") && !record.isVerified && (
                        <DropdownMenuItem onClick={() => handleVerifyRecord(record)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify Record
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDeleteRecord(record)} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Record
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View details dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tracking Details</DialogTitle>
            <DialogDescription>
              Business tracking record for {selectedRecord ? format(new Date(selectedRecord.trackingDate), "MMMM yyyy") : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Basic Information</h4>
                  <div className="border rounded-md p-4 space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Date Recorded:</span>
                      <p>{format(new Date(selectedRecord.trackingDate), "PPP")}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Month:</span>
                      <p>{format(new Date(selectedRecord.trackingMonth), "MMMM yyyy")}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Recorded By:</span>
                      <p>{selectedRecord.recordedBy}</p>
                    </div>
                    {selectedRecord.isVerified && (
                      <div>
                        <span className="text-sm text-muted-foreground">Verified By:</span>
                        <p>{selectedRecord.verifiedBy}</p>
                      </div>
                    )}
                    {selectedRecord.verificationDate && (
                      <div>
                        <span className="text-sm text-muted-foreground">Verification Date:</span>
                        <p>{format(new Date(selectedRecord.verificationDate), "PPP")}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Financial Data</h4>
                  <div className="border rounded-md p-4 space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Projected Revenue:</span>
                      <p className="font-semibold">{formatCurrency(selectedRecord.projectedRevenue)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Actual Revenue:</span>
                      <p className="font-semibold">{formatCurrency(selectedRecord.actualRevenue)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Performance:</span>
                      <Badge 
                        className={getStatusColor(selectedRecord.projectedRevenue, selectedRecord.actualRevenue)}
                        variant="outline"
                      >
                        {selectedRecord.projectedRevenue && selectedRecord.actualRevenue
                          ? selectedRecord.actualRevenue >= selectedRecord.projectedRevenue
                            ? "On Target" 
                            : selectedRecord.actualRevenue >= selectedRecord.projectedRevenue * 0.75
                              ? "Below Target"
                              : "Needs Attention"
                          : "No Data"
                        }
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Business Details</h4>
                <div className="border rounded-md p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Current Employees:</span>
                      <p>{selectedRecord.actualEmployees || "—"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">New Employees:</span>
                      <p>{selectedRecord.newEmployees || "No changes"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-muted-foreground">New Resources & Equipment:</span>
                    {Array.isArray(selectedRecord.newResources) && selectedRecord.newResources.length > 0 ? (
                      <ul className="list-disc ml-5 mt-1">
                        {selectedRecord.newResources.map((resource: string, index: number) => (
                          <li key={index}>{resource}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No new resources reported</p>
                    )}
                  </div>
                  
                  <div>
                    <span className="text-sm text-muted-foreground">All Equipment:</span>
                    {Array.isArray(selectedRecord.allEquipment) && selectedRecord.allEquipment.length > 0 ? (
                      <ul className="list-disc ml-5 mt-1">
                        {selectedRecord.allEquipment.map((equipment: string, index: number) => (
                          <li key={index}>{equipment}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No equipment reported</p>
                    )}
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">Key Decisions:</span>
                    {Array.isArray(selectedRecord.keyDecisions) && selectedRecord.keyDecisions.length > 0 ? (
                      <ul className="list-disc ml-5 mt-1">
                        {selectedRecord.keyDecisions.map((decision: string, index: number) => (
                          <li key={index}>{decision}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No key decisions reported</p>
                    )}
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">Lessons Gained:</span>
                    {Array.isArray(selectedRecord.lessonsGained) && selectedRecord.lessonsGained.length > 0 ? (
                      <ul className="list-disc ml-5 mt-1">
                        {selectedRecord.lessonsGained.map((lesson: string, index: number) => (
                          <li key={index}>{lesson}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No lessons reported</p>
                    )}
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">Challenges:</span>
                    {Array.isArray(selectedRecord.challenges) && selectedRecord.challenges.length > 0 ? (
                      <ul className="list-disc ml-5 mt-1">
                        {selectedRecord.challenges.map((challenge: string, index: number) => (
                          <li key={index}>{challenge}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No challenges reported</p>
                    )}
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">Business Insights:</span>
                    <p>{selectedRecord.businessInsights || "No insights recorded"}</p>
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">Mentor Feedback:</span>
                    <p className="p-2 bg-blue-50 rounded-md mt-1">{selectedRecord.mentorFeedback || "No mentor feedback provided"}</p>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRecord(selectedRecord)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Record
                  </Button>
                  
                  {(user?.role === "admin" || user?.role === "reviewer") && !selectedRecord.isVerified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setViewDetailsOpen(false);
                        setTimeout(() => handleVerifyRecord(selectedRecord), 100);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Record
                    </Button>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  onClick={() => setViewDetailsOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Tracking Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tracking record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Record
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm verify dialog */}
      <Dialog open={confirmVerifyOpen} onOpenChange={setConfirmVerifyOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Verify Tracking Record</DialogTitle>
            <DialogDescription>
              This will mark the record as verified. Verified records cannot be modified further.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setConfirmVerifyOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={confirmVerify}
              disabled={verifyMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Record
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}