import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
// Custom hooks for search params and navigation
import { useParams } from "wouter";
import { PlusCircle, AlertCircle, Eye, Check, Building2, Trash2, MapPin, Store, UserCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
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

interface MakerspaceAssignmentPageProps {
  businessId?: string;
  makerspaceId?: string;
}

// Define types for our assignments and related entities
interface Business {
  id: number;
  businessName: string;
  district: string;
}

interface Makerspace {
  id: number;
  name: string;
  district: string;
  address: string;
  description?: string;
}

interface Assignment {
  id: number;
  businessId: number;
  makerspaceId: number;
  assignedDate: string;
  isActive: boolean;
  assignedBy?: number | null;
  business?: Business;
  makerspace?: Makerspace;
  assignedByUser?: {
    id: number;
    username: string;
  };
  ownerNames?: string[];
}

export default function MakerspaceAssignmentPage({ businessId, makerspaceId }: MakerspaceAssignmentPageProps) {
  const queryClient = useQueryClient();
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Parse business or makerspace ID from URL params if not provided as props
  const urlBusinessId = businessId || params?.businessId;
  const urlMakerspaceId = makerspaceId || params?.makerspaceId;
  
  // Set selected entities
  const [selectedMakerspace, setSelectedMakerspace] = useState<number | null>(
    urlMakerspaceId ? parseInt(urlMakerspaceId) : null
  );
  const [selectedBusiness, setSelectedBusiness] = useState<number | null>(
    urlBusinessId ? parseInt(urlBusinessId) : null
  );
  
  // Filter state
  const [filterDistrict, setFilterDistrict] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState<boolean>(false);

  // Get all makerspaces
  const { 
    data: makerspaces, 
    isLoading: makerspacesLoading 
  } = useQuery<Makerspace[]>({
    queryKey: ['/api/business-management/makerspaces'],
    queryFn: async () => {
      const res = await fetch('/api/business-management/makerspaces');
      if (!res.ok) throw new Error('Failed to fetch makerspaces');
      return res.json();
    }
  });

  // Get all businesses
  const { 
    data: businesses, 
    isLoading: businessesLoading 
  } = useQuery<Business[]>({
    queryKey: ['/api/business-management/businesses'],
    queryFn: async () => {
      const res = await fetch('/api/business-management/businesses');
      if (!res.ok) throw new Error('Failed to fetch businesses');
      return res.json();
    }
  });

  // Get all makerspace-business assignments
  const { 
    data: allAssignments, 
    isLoading: assignmentsLoading,
    refetch: refetchAssignments
  } = useQuery<Assignment[]>({
    queryKey: ['/api/business-management/assignments'],
    queryFn: async () => {
      const res = await fetch('/api/business-management/assignments');
      if (!res.ok) throw new Error('Failed to fetch makerspace assignments');
      return res.json();
    }
  });

  // Get assignments for a specific makerspace if one is selected
  const { 
    data: makerspaceAssignments,
    isLoading: makerspaceAssignmentsLoading
  } = useQuery<Assignment[]>({
    queryKey: ['/api/business-management/makerspaces', selectedMakerspace, 'businesses'],
    queryFn: async () => {
      const res = await fetch(`/api/business-management/makerspaces/${selectedMakerspace}/businesses`);
      if (!res.ok) throw new Error('Failed to fetch makerspace assignments');
      return res.json();
    },
    enabled: !!selectedMakerspace
  });

  // Get assignments for a specific business if one is selected
  const { 
    data: businessAssignments,
    isLoading: businessAssignmentsLoading
  } = useQuery<Assignment[]>({
    queryKey: ['/api/business-management/businesses', selectedBusiness, 'makerspace-assignments'],
    queryFn: async () => {
      const res = await fetch(`/api/business-management/businesses/${selectedBusiness}/makerspace-assignments`);
      if (!res.ok) throw new Error('Failed to fetch business assignments');
      return res.json();
    },
    enabled: !!selectedBusiness
  });

  // Mutation to assign business to makerspace
  const assignMutation = useMutation({
    mutationFn: async (data: { makerspaceId: number; businessId: number }) => {
      const res = await apiRequest('POST', `/api/business-management/businesses/${data.businessId}/makerspace-assignment`, {
        makerspaceId: data.makerspaceId
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Assignment successful",
        description: "The business has been assigned to the makerspace",
      });

      // Invalidate all relevant queries
      queryClient.invalidateQueries({
        queryKey: ['/api/business-management/assignments'],
      });

      if (selectedMakerspace) {
        queryClient.invalidateQueries({
          queryKey: ['/api/business-management/makerspaces', selectedMakerspace, 'businesses'],
        });
      }

      if (selectedBusiness) {
        queryClient.invalidateQueries({
          queryKey: ['/api/business-management/businesses', selectedBusiness, 'makerspace-assignments'],
        });
      }

      // Close the assignment dialog
      setIsAssignDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to assign business: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete an assignment
  const deleteMutation = useMutation({
    mutationFn: async ({ businessId, assignmentId }: { businessId: number; assignmentId: number }) => {
      const res = await apiRequest('DELETE', `/api/business-management/businesses/${businessId}/makerspace-assignment/${assignmentId}`);
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "Assignment removed",
        description: "The makerspace assignment has been removed",
      });

      // Invalidate all relevant queries
      queryClient.invalidateQueries({
        queryKey: ['/api/business-management/assignments'],
      });

      if (selectedMakerspace) {
        queryClient.invalidateQueries({
          queryKey: ['/api/business-management/makerspaces', selectedMakerspace, 'businesses'],
        });
      }

      if (selectedBusiness) {
        queryClient.invalidateQueries({
          queryKey: ['/api/business-management/businesses', selectedBusiness, 'makerspace-assignments'],
        });
      }

      // Close the deletion confirmation
      setShowDeleteConfirm(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to remove assignment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Helper function to get business name
  const getBusinessName = (businessId: number | null) => {
    if (!businessId || !businesses) return "Unknown Business";
    const business = businesses.find(b => b.id === businessId);
    return business ? business.businessName : "Unknown Business";
  };

  // Helper function to get makerspace name
  const getMakerspaceName = (makerspaceId: number | null) => {
    if (!makerspaceId || !makerspaces) return "Unknown Makerspace";
    const makerspace = makerspaces.find(m => m.id === makerspaceId);
    return makerspace ? makerspace.name : "Unknown Makerspace";
  };

  // Helper function to check if business is already assigned to makerspace
  const isAlreadyAssigned = (makerspaceId: number | null, businessId: number | null) => {
    if (!makerspaceId || !businessId || !allAssignments) return false;
    return allAssignments.some(a => 
      a.makerspaceId === makerspaceId && 
      a.businessId === businessId &&
      a.isActive
    );
  };

  // Group relationships by district for better organization
  const assignmentsByDistrict: {[key: string]: Assignment[]} = {};

  if (allAssignments && Array.isArray(allAssignments) && businesses && makerspaces) {
    allAssignments.forEach((assignment: Assignment) => {
      // Attempt to get the makerspace info first
      const makerspace = makerspaces.find(m => m.id === assignment.makerspaceId);
      if (makerspace) {
        const district = makerspace.district;
        if (!assignmentsByDistrict[district]) {
          assignmentsByDistrict[district] = [];
        }
        assignmentsByDistrict[district].push(assignment);
      }
    });
  }

  // Handle the view business button
  const handleViewBusiness = (businessId: number | undefined) => {
    if (businessId) {
      setLocation(`/businesses/${businessId}`);
    }
  };

  // Handle the view makerspace button
  const handleViewMakerspace = (makerspaceId: number | undefined) => {
    if (makerspaceId) {
      setLocation(`/makerspaces/${makerspaceId}/view`);
    }
  };

  // Handle assignment form submission
  const handleAssignSubmit = () => {
    if (!selectedBusiness || !selectedMakerspace) {
      toast({
        title: "Error",
        description: "Please select both a business and a makerspace",
        variant: "destructive",
      });
      return;
    }

    assignMutation.mutate({
      businessId: selectedBusiness,
      makerspaceId: selectedMakerspace
    });
  };

  // Handle deletion of an assignment
  const handleDeleteAssignment = (assignmentId: number) => {
    const assignment = allAssignments?.find(a => a.id === assignmentId);
    if (!assignment) {
      toast({
        title: "Error",
        description: "Assignment not found",
        variant: "destructive",
      });
      return;
    }

    setShowDeleteConfirm(assignmentId);
  };

  // Confirm deletion
  const confirmDelete = () => {
    if (!showDeleteConfirm) return;
    
    const assignment = allAssignments?.find(a => a.id === showDeleteConfirm);
    if (!assignment) {
      toast({
        title: "Error",
        description: "Assignment not found",
        variant: "destructive",
      });
      return;
    }

    deleteMutation.mutate({
      businessId: assignment.businessId,
      assignmentId: showDeleteConfirm
    });
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

  // Loading state
  const isLoading = makerspacesLoading || businessesLoading || assignmentsLoading;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Makerspace Assignments
            </h1>
            <Button 
              onClick={() => setIsAssignDialogOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Assignment
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="mr-2 h-5 w-5 text-orange-500" />
                  Filter by District
                </CardTitle>
                <CardDescription>
                  Select a district to filter assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select
                    value={filterDistrict || "all"}
                    onValueChange={(value) => setFilterDistrict(value === "all" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a district" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Districts</SelectItem>
                      {makerspaces && Array.from(new Set(makerspaces.map(m => m.district))).map(district => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="mr-2 h-5 w-5 text-orange-500" />
                  Assignment Statistics
                </CardTitle>
                <CardDescription>
                  Overview of makerspace utilization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <p className="text-amber-800 text-sm font-medium">Total Assignments</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {allAssignments?.length || 0}
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <p className="text-green-800 text-sm font-medium">Active Makerspaces</p>
                    <p className="text-2xl font-bold text-green-900">
                      {makerspaces ? new Set(allAssignments?.map(a => a.makerspaceId)).size : 0}
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-blue-800 text-sm font-medium">Assigned Businesses</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {businesses ? new Set(allAssignments?.map(a => a.businessId)).size : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Tabs for different views */}
          <Tabs defaultValue="by-district" className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-2">
              <TabsTrigger value="by-district">By District</TabsTrigger>
              <TabsTrigger value="all-assignments">All Assignments</TabsTrigger>
            </TabsList>
            
            {/* By District View */}
            <TabsContent value="by-district" className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
              ) : Object.keys(assignmentsByDistrict).length === 0 ? (
                <div className="text-center p-12 border border-dashed rounded-md">
                  <Store className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Assignments Found</h3>
                  <p className="mt-2 text-sm text-gray-500">No businesses have been assigned to makerspaces yet.</p>
                  <Button
                    onClick={() => setIsAssignDialogOpen(true)}
                    className="mt-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Assignment
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(assignmentsByDistrict)
                    .filter(([district]) => !filterDistrict || district === filterDistrict)
                    .map(([district, assignments]) => (
                      <motion.div
                        key={district}
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.3}}
                      >
                        <div className="flex items-center mb-4">
                          <h2 className="text-xl font-semibold text-gray-900">{district}</h2>
                          <Badge className="ml-2 bg-orange-100 text-orange-800 hover:bg-orange-200">
                            {assignments.length} Assignment{assignments.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {assignments.map(assignment => {
                            const business = businesses?.find(b => b.id === assignment.businessId);
                            const makerspace = makerspaces?.find(m => m.id === assignment.makerspaceId);
                            
                            return (
                              <Card key={assignment.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <div className="bg-gradient-to-r from-orange-500 to-pink-500 h-2"></div>
                                <CardContent className="pt-4">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <h3 className="font-medium text-gray-900">
                                        {business?.businessName || "Unknown Business"}
                                      </h3>
                                      <p className="text-sm text-gray-500 flex items-center">
                                        <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                        {business?.district || "Unknown District"}
                                      </p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800">
                                      {makerspace?.name || "Unknown Makerspace"}
                                    </Badge>
                                  </div>
                                  
                                  <Separator className="my-3" />
                                  
                                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                    <div>
                                      <p className="text-gray-500">Assigned Date</p>
                                      <p className="font-medium">
                                        {assignment.assignedDate 
                                          ? format(new Date(assignment.assignedDate), 'PP')
                                          : "Unknown date"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Assigned By</p>
                                      <p className="font-medium">
                                        {assignment.assignedByUser?.username || "Unknown"}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between mt-4">
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewBusiness(assignment.businessId)}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Business
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewMakerspace(assignment.makerspaceId)}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Makerspace
                                      </Button>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteAssignment(assignment.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </TabsContent>
            
            {/* All Assignments View */}
            <TabsContent value="all-assignments">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
              ) : !allAssignments || allAssignments.length === 0 ? (
                <div className="text-center p-12 border border-dashed rounded-md">
                  <Store className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Assignments Found</h3>
                  <p className="mt-2 text-sm text-gray-500">No businesses have been assigned to makerspaces yet.</p>
                  <Button
                    onClick={() => setIsAssignDialogOpen(true)}
                    className="mt-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Assignment
                  </Button>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="py-3 px-4 text-left font-medium text-sm">Business</th>
                        <th className="py-3 px-4 text-left font-medium text-sm">Owner(s)</th>
                        <th className="py-3 px-4 text-left font-medium text-sm">Makerspace</th>
                        <th className="py-3 px-4 text-left font-medium text-sm">District</th>
                        <th className="py-3 px-4 text-left font-medium text-sm">Assigned Date</th>
                        <th className="py-3 px-4 text-left font-medium text-sm">Assigned By</th>
                        <th className="py-3 px-4 text-left font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allAssignments
                        .filter(assignment => {
                          if (!filterDistrict) return true;
                          const makerspace = makerspaces?.find(m => m.id === assignment.makerspaceId);
                          return makerspace?.district === filterDistrict;
                        })
                        .map(assignment => {
                          const business = businesses?.find(b => b.id === assignment.businessId);
                          const makerspace = makerspaces?.find(m => m.id === assignment.makerspaceId);
                          
                          return (
                            <tr key={assignment.id} className="border-b hover:bg-muted/20">
                              <td className="py-3 px-4 font-medium">
                                {business?.businessName || "Unknown Business"}
                              </td>
                              <td className="py-3 px-4">
                                {assignment.ownerNames && assignment.ownerNames.length > 0 ? (
                                  <div className="flex items-center">
                                    <UserCircle className="h-4 w-4 mr-2 text-primary" />
                                    {assignment.ownerNames.length === 1 ? (
                                      assignment.ownerNames[0]
                                    ) : (
                                      `${assignment.ownerNames[0]} +${assignment.ownerNames.length - 1} more`
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm italic">No owners assigned</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {makerspace?.name || "Unknown Makerspace"}
                              </td>
                              <td className="py-3 px-4">
                                {makerspace?.district || "Unknown District"}
                              </td>
                              <td className="py-3 px-4">
                                {assignment.assignedDate
                                  ? format(new Date(assignment.assignedDate), 'PP')
                                  : "Unknown date"}
                              </td>
                              <td className="py-3 px-4">
                                {assignment.assignedByUser?.username || "Unknown"}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewBusiness(assignment.businessId)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Business
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteAssignment(assignment.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Store className="mr-2 h-5 w-5 text-orange-500" />
              Create Business-Makerspace Assignment
            </DialogTitle>
            <DialogDescription>
              Assign a business to operate in a makerspace location.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-2">
            <div>
              <Label htmlFor="businessSelect">Select Business</Label>
              <Select
                value={selectedBusiness?.toString() || ""}
                onValueChange={(value) => setSelectedBusiness(value ? parseInt(value, 10) : null)}
              >
                <SelectTrigger id="businessSelect">
                  <SelectValue placeholder="Select a business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses?.map(business => (
                    <SelectItem key={business.id} value={business.id.toString()}>
                      {business.businessName} ({business.district})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="makerspaceSelect">Select Makerspace</Label>
              <Select
                value={selectedMakerspace?.toString() || ""}
                onValueChange={(value) => setSelectedMakerspace(value ? parseInt(value, 10) : null)}
              >
                <SelectTrigger id="makerspaceSelect">
                  <SelectValue placeholder="Select a makerspace" />
                </SelectTrigger>
                <SelectContent>
                  {makerspaces?.map(makerspace => (
                    <SelectItem key={makerspace.id} value={makerspace.id.toString()}>
                      {makerspace.name} ({makerspace.district})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedBusiness && selectedMakerspace && (
              <div className="mt-4 flex justify-center">
                {isAlreadyAssigned(selectedMakerspace, selectedBusiness) ? (
                  <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                    <AlertCircle className="h-4 w-4 mr-1.5" />
                    This business is already assigned to this makerspace
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                    <Check className="h-4 w-4 mr-1.5" />
                    Valid assignment - ready to connect
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignSubmit}
              disabled={!selectedBusiness || !selectedMakerspace || assignMutation.isPending || isAlreadyAssigned(selectedMakerspace, selectedBusiness)}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
            >
              {assignMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Creating...
                </>
              ) : (
                <>Create Assignment</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!showDeleteConfirm}
        onOpenChange={(open) => !open && setShowDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Makerspace Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the business's assignment to this makerspace. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteMutation.isPending ? "Removing..." : "Remove Assignment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}