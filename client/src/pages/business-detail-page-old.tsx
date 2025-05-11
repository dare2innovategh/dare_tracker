import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus, Edit as Pencil, Trash2, Wrench, Package, Layers, Square, Loader2 } from "lucide-react";

// Import each UI component individually instead of from a barrel file
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Define schemas based on backend expectations
const formSchema = z.object({
  makerspaceId: z.number(),
  name: z.string().min(1, "Name is required"),
  category: z.enum(["Tool", "Equipment", "Material", "Space"]),
  description: z.string().optional().nullable(),
  status: z.enum(["Available", "In Use", "Maintenance", "Out of Stock"]),
  quantity: z.number().int().min(1),
  supplier: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  acquisitionDate: z.string().optional().nullable(),
  unitCost: z.string().optional().nullable()
});

// Type definition for Resources
interface MakerspaceResource {
  id: number;
  name: string;
  category: "Tool" | "Equipment" | "Material" | "Space";
  description: string | null;
  status: "Available" | "In Use" | "Maintenance" | "Out of Stock";
  quantity: number;
  unitCost: string | null;
  totalCost: string | null;
  supplier: string | null;
  notes: string | null;
  acquisitionDate: string | null;
  makerspaceId: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: number;
  updatedBy?: number;
}

interface Makerspace {
  id: number;
  name: string;
  location: string;
  resourceCount?: number;
}

interface ResourcesManagementProps {
  makerspace: Makerspace;
}

export default function ResourcesManagement({ makerspace }: ResourcesManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<MakerspaceResource | null>(null);

  // Fetch resources for this makerspace
  const resourcesQuery = useQuery({
    queryKey: ["resources", makerspace.id],
    queryFn: async () => {
      try {
        const response = await apiRequest(
          "GET",
          `/api/makerspace-resources/makerspaces/${makerspace.id}/resources`
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch resources: ${response.status} ${response.statusText}. ${errorText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error fetching resources:", error);
        throw error; // Let React Query handle the error
      }
    },
    retry: 1, // Retry once if the request fails
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
  
  const { data: resources = [], isLoading: isResourcesLoading, error: resourcesError } = resourcesQuery;

  // Fetch resource statistics
  const statsQuery = useQuery({
    queryKey: ["resource-stats", makerspace.id],
    queryFn: async () => {
      try {
        const response = await apiRequest(
          "GET",
          `/api/makerspace-resources/makerspaces/${makerspace.id}/resource-stats`
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch resource stats: ${response.status} ${response.statusText}. ${errorText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error fetching resource stats:", error);
        throw error;
      }
    },
    enabled: !resourcesError, // Only run if resources query succeeded
    retry: 1,
  });

  const { data: resourceStats, isLoading: isStatsLoading, error: statsError } = statsQuery;

  // Form for adding a new resource
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      makerspaceId: makerspace.id,
      name: "",
      category: "Equipment" as const,
      description: "",
      status: "Available" as const,
      quantity: 1,
      supplier: "",
      notes: "",
      acquisitionDate: null,
      unitCost: null,
    },
  });

  // Form for editing a resource
  const editForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      makerspaceId: makerspace.id,
      name: "",
      category: "Equipment" as const, 
      description: "",
      status: "Available" as const,
      quantity: 1,
      supplier: "",
      notes: "",
      acquisitionDate: null,
      unitCost: null,
    },
  });

  // Mutation for adding a new resource
  const addResourceMutation = useMutation({
    mutationFn: async (data) => {
      const formattedData = {
        ...data,
        quantity: Number(data.quantity),
      };
      
      const response = await apiRequest(
        "POST",
        `/api/makerspace-resources/makerspaces/${makerspace.id}/resources`,
        formattedData
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add resource: ${response.status} ${response.statusText}. ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["resources", makerspace.id] });
      queryClient.invalidateQueries({ queryKey: ["resource-stats", makerspace.id] });
      
      toast({
        title: "Resource added",
        description: "The resource has been added successfully.",
      });
      
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Error adding resource:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a resource
  const updateResourceMutation = useMutation({
    mutationFn: async (data) => {
      const { id, ...updateData } = data;
      
      const formattedData = {
        ...updateData,
        quantity: Number(updateData.quantity),
      };
      
      const response = await apiRequest(
        "PATCH",
        `/api/makerspace-resources/resources/${id}`,
        formattedData
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update resource: ${response.status} ${response.statusText}. ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", makerspace.id] });
      queryClient.invalidateQueries({ queryKey: ["resource-stats", makerspace.id] });
      
      toast({
        title: "Resource updated",
        description: "The resource has been updated successfully.",
      });
      
      setIsEditDialogOpen(false);
      setCurrentResource(null);
      editForm.reset();
    },
    onError: (error) => {
      console.error("Error updating resource:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a resource
  const deleteResourceMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiRequest(
        "DELETE",
        `/api/makerspace-resources/resources/${id}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete resource: ${response.status} ${response.statusText}. ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", makerspace.id] });
      queryClient.invalidateQueries({ queryKey: ["resource-stats", makerspace.id] });
      
      toast({
        title: "Resource deleted",
        description: "The resource has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting resource:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission for adding a new resource
  const onSubmit = (data) => {
    addResourceMutation.mutate(data);
  };

  // Handle form submission for editing a resource
  const onEditSubmit = (data) => {
    if (!currentResource) {
      toast({
        title: "Error",
        description: "No resource selected for editing",
        variant: "destructive",
      });
      return;
    }
    
    const updateData = {
      id: currentResource.id,
      ...data
    };
    
    updateResourceMutation.mutate(updateData);
  };

  // Set up the edit form when a resource is selected for editing
  const handleEditResource = (resource) => {
    setCurrentResource(resource);
    
    // Format date for input field (YYYY-MM-DD)
    let acquisitionDateValue = null;
    if (resource.acquisitionDate) {
      try {
        const date = new Date(resource.acquisitionDate);
        if (!isNaN(date.getTime())) {
          acquisitionDateValue = date.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error("Error parsing acquisition date:", error);
      }
    }
    
    editForm.reset({
      makerspaceId: resource.makerspaceId,
      name: resource.name,
      category: resource.category,
      description: resource.description || "",
      status: resource.status || "Available",
      quantity: resource.quantity || 1,
      supplier: resource.supplier || "",
      notes: resource.notes || "",
      acquisitionDate: acquisitionDateValue,
      unitCost: resource.unitCost || "",
    });
    
    setIsEditDialogOpen(true);
  };

  // Function to get the appropriate icon for each category
  const getCategoryIcon = (category) => {
    switch (category) {
      case "Tool":
        return <Wrench className="h-4 w-4 mr-1" />;
      case "Equipment":
        return <Package className="h-4 w-4 mr-1" />;
      case "Material":
        return <Layers className="h-4 w-4 mr-1" />;
      case "Space":
        return <Square className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  // Function to get the appropriate color for each status
  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "In Use":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "Out of Stock":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  // Format currency values
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "GH₵0.00";
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue)) return "GH₵0.00";
    
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(numericValue);
  };

  // Format date values
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-GH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  // Handle any errors in loading resources
  const handleRetryLoading = () => {
    queryClient.invalidateQueries({ queryKey: ["resources", makerspace.id] });
    queryClient.invalidateQueries({ queryKey: ["resource-stats", makerspace.id] });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Resource Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Resources</CardTitle>
            <CardDescription>All resources in makerspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isResourcesLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : resourcesError ? (
                "N/A"
              ) : (
                resources.length
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Total items: {isStatsLoading || !resourceStats?.categoryStats 
                ? "0" 
                : resourceStats.categoryStats.reduce((acc, curr) => acc + (curr.totalItems || 0), 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Inventory Value</CardTitle>
            <CardDescription>Total value of resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isStatsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : statsError ? (
                "GH₵0.00"
              ) : (
                formatCurrency(resourceStats?.totalInventoryValue || 0)
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Maintenance costs: {isStatsLoading ? "Loading..." : statsError ? "GH₵0.00" : formatCurrency(resourceStats?.totalMaintenanceCost || 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Resource Status</CardTitle>
            <CardDescription>Availability status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["Available", "In Use", "Maintenance", "Out of Stock"].map((status) => (
                <Badge key={status} className={getStatusColor(status)}>
                  {status}: {isResourcesLoading || resourcesError 
                    ? "0" 
                    : resources.filter(r => r.status === status).length}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Management */}
      <Card>
        <CardHeader className="pb-1">
          <div className="flex justify-between items-center">
            <CardTitle>Resources Management</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Resource</DialogTitle>
                  <DialogDescription>
                    Add a new resource to the makerspace inventory.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name*</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Resource name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category*</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Tool">Tool</SelectItem>
                                <SelectItem value="Equipment">Equipment</SelectItem>
                                <SelectItem value="Material">Material</SelectItem>
                                <SelectItem value="Space">Space</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe the resource"
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Available">Available</SelectItem>
                                <SelectItem value="In Use">In Use</SelectItem>
                                <SelectItem value="Maintenance">Maintenance</SelectItem>
                                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min={1}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="acquisitionDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Acquisition Date</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="date"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="unitCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Cost (GHS)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Supplier name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Additional notes"
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        type="submit"
                        disabled={addResourceMutation.isPending}
                      >
                        {addResourceMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Resource"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Resources</TabsTrigger>
              <TabsTrigger value="tool">Tools</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
              <TabsTrigger value="material">Materials</TabsTrigger>
              <TabsTrigger value="space">Spaces</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {resourcesError ? (
                <div className="bg-red-50 p-4 rounded-md mb-4">
                  <h3 className="text-red-800 font-medium">Failed to load resources</h3>
                  <p className="text-red-700 text-sm mt-1">
                    {resourcesError.message || "An error occurred while fetching resources."}
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleRetryLoading}>
                    <Loader2 className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableCaption>
                    {isResourcesLoading
                      ? "Loading resources..."
                      : resources.length === 0
                      ? "No resources found"
                      : `Total of ${resources.length} resources`}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isResourcesLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : resources.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No resources found. Add your first resource.
                        </TableCell>
                      </TableRow>
                    ) : (
                      resources.map((resource) => (
                        <TableRow key={resource.id}>
                          <TableCell className="font-medium">{resource.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {getCategoryIcon(resource.category)}
                              {resource.category}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(resource.status || "Available")}>
                              {resource.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{resource.quantity}</TableCell>
                          <TableCell>
                            {formatCurrency(resource.totalCost || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditResource(resource)}
                                title="Edit Resource"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="icon" className="text-red-500" title="Delete Resource">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Resource
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this resource? This
                                      action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteResourceMutation.mutate(resource.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      {deleteResourceMutation.isPending && deleteResourceMutation.variables === resource.id ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : null}
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {["tool", "equipment", "material", "space"].map((category) => (
              <TabsContent key={category} value={category} className="mt-0">
                {resourcesError ? (
                  <div className="bg-red-50 p-4 rounded-md mb-4">
                    <h3 className="text-red-800 font-medium">Failed to load resources</h3>
                    <p className="text-red-700 text-sm mt-1">
                      {resourcesError.message || "An error occurred while fetching resources."}
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={handleRetryLoading}>
                      <Loader2 className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableCaption>
                      {isResourcesLoading
                        ? "Loading resources..."
                        : resources.filter(r => r.category.toLowerCase() === category).length === 0
                        ? `No ${category} resources found`
                        : `Total of ${
                          resources.filter(r => r.category.toLowerCase() === category).length
                        } ${category} resources`}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isResourcesLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : resources.filter(r => r.category.toLowerCase() === category).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            No {category} resources found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        resources
                          .filter(r => r.category.toLowerCase() === category)
                          .map((resource) => (
                            <TableRow key={resource.id}>
                              <TableCell className="font-medium">
                                {resource.name}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={getStatusColor(
                                    resource.status || "Available"
                                  )}
                                >
                                  {resource.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{resource.quantity}</TableCell>
                              <TableCell>
                                {formatCurrency(resource.totalCost || 0)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleEditResource(resource)}
                                    title="Edit Resource"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="text-red-500"
                                        title="Delete Resource"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete Resource
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this
                                          resource? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            deleteResourceMutation.mutate(resource.id)
                                          }
                                          className="bg-red-500 hover:bg-red-600"
                                        >
                                          {deleteResourceMutation.isPending && deleteResourceMutation.variables === resource.id ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          ) : null}
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Resource Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update the details of this resource.
            </DialogDescription>
          </DialogHeader>
          
          {currentResource && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Resource name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Tool">Tool</SelectItem>
                            <SelectItem value="Equipment">Equipment</SelectItem>
                            <SelectItem value="Material">Material</SelectItem>
                            <SelectItem value="Space">Space</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the resource"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Available">Available</SelectItem>
                            <SelectItem value="In Use">In Use</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={1}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="acquisitionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acquisition Date</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="unitCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Cost (GHS)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Supplier name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Additional notes"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateResourceMutation.isPending}
                  >
                    {updateResourceMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Resource"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}