import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessProfile, BusinessResource, insertBusinessResourceSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus, Edit as Pencil, Trash2, Wrench, Package, Layers, Square, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

const formSchema = insertBusinessResourceSchema.extend({
  acquisitionDate: z
    .string()
    .transform((val) => (val ? new Date(val) : null))
    .optional()
    .nullable(),
  unitCost: z
    .string()
    .transform((val) => (val ? parseFloat(val) : null))
    .optional()
    .nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface BusinessResourcesManagementProps {
  business: BusinessProfile;
}

export default function BusinessResourcesManagement({ business }: BusinessResourcesManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<BusinessResource | null>(null);

  // Fetch resources for this business
  const resourcesQuery = useQuery({
    queryKey: ["/api/business-resources/businesses", business.id, "resources"],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/business-resources/businesses/${business.id}/resources`
      );
      return await response.json();
    },
  });
  
  const { data: resources = [], isLoading } = resourcesQuery;

  // Fetch resource statistics
  const { data: resourceStats } = useQuery({
    queryKey: ["/api/business-resources/businesses", business.id, "resource-stats"],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/business-resources/businesses/${business.id}/resource-stats`
      );
      return await response.json();
    },
  });

  // Form for adding a new resource
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessId: business.id,
      name: "",
      category: "Equipment",
      description: "",
      status: "Available",
      quantity: 1,
      supplier: "",
      notes: "",
      acquisitionDate: null,
      unitCost: null,
    },
  });

  // Mutation for adding a new resource
  const addResourceMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Ensure proper data types for the backend validation
      const formattedData = {
        ...data,
        // Ensure acquisitionDate is a proper Date object
        acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : null,
        // Ensure unitCost is a number
        unitCost: data.unitCost ? parseFloat(String(data.unitCost)) : null,
        // Convert quantity to number
        quantity: data.quantity ? Number(data.quantity) : 1
      };
      
      console.log("Sending resource data:", formattedData);
      
      const response = await apiRequest(
        "POST",
        `/api/business-resources/businesses/${business.id}/resources`,
        formattedData
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/business-resources/businesses", business.id, "resources"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/business-resources/businesses", business.id, "resource-stats"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/business-profiles"] });
      toast({
        title: "Resource added",
        description: "The resource has been added successfully.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add resource: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a resource
  const deleteResourceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/business-resources/resources/${id}`
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/business-resources/businesses", business.id, "resources"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/business-resources/businesses", business.id, "resource-stats"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/business-profiles"] });
      toast({
        title: "Resource deleted",
        description: "The resource has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete resource: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission for adding a new resource
  const onSubmit = (data: FormValues) => {
    addResourceMutation.mutate(data);
  };

  // Handle edit resource
  const handleEditResource = (resource: BusinessResource) => {
    setCurrentResource(resource);
    setIsEditDialogOpen(true);
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Tool":
        return <Wrench className="h-4 w-4" />;
      case "Equipment":
        return <Package className="h-4 w-4" />;
      case "Material":
        return <Layers className="h-4 w-4" />;
      case "Space":
        return <Square className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Available":
        return "success";
      case "In Use":
        return "warning";
      case "Maintenance":
        return "destructive";
      case "Out of Stock":
        return "outline";
      default:
        return "default";
    }
  };

  // Format currency
  const formatCurrency = (amount: any) => {
    if (!amount) return "N/A";
    return `GHS ${parseFloat(String(amount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Business Resources</CardTitle>
          <CardDescription>
            Manage all resources for {business.businessName}.
          </CardDescription>
          <div className="flex justify-end">
            <Button 
              size="sm" 
              onClick={() => setIsAddDialogOpen(true)}
              className="mt-2"
            >
              <Plus className="mr-1 h-4 w-4" /> Add Resource
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No resources yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-1">
                Add tools, equipment, materials, or spaces that this business has access to.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" /> Add First Resource
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Resources</TabsTrigger>
                <TabsTrigger value="available">Available</TabsTrigger>
                <TabsTrigger value="inUse">In Use</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <Table>
                  <TableCaption>All resources for {business.businessName}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources.map((resource: BusinessResource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="font-medium">{resource.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(resource.category)}
                            <span>{resource.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(resource.status) as any}>
                            {resource.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{resource.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(resource.unitCost)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditResource(resource)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the resource "{resource.name}".
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteResourceMutation.mutate(resource.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="available">
                <Table>
                  <TableCaption>Available resources for {business.businessName}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources
                      .filter((r: BusinessResource) => r.status === "Available")
                      .map((resource: BusinessResource) => (
                        <TableRow key={resource.id}>
                          <TableCell className="font-medium">{resource.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getCategoryIcon(resource.category)}
                              <span>{resource.category}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{resource.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(resource.unitCost)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditResource(resource)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the resource "{resource.name}".
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteResourceMutation.mutate(resource.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="inUse">
                <Table>
                  <TableCaption>Resources in use for {business.businessName}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources
                      .filter((r: BusinessResource) => r.status === "In Use")
                      .map((resource: BusinessResource) => (
                        <TableRow key={resource.id}>
                          <TableCell className="font-medium">{resource.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getCategoryIcon(resource.category)}
                              <span>{resource.category}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{resource.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(resource.unitCost)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditResource(resource)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the resource "{resource.name}".
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteResourceMutation.mutate(resource.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="maintenance">
                <Table>
                  <TableCaption>Resources in maintenance for {business.businessName}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources
                      .filter((r: BusinessResource) => r.status === "Maintenance")
                      .map((resource: BusinessResource) => (
                        <TableRow key={resource.id}>
                          <TableCell className="font-medium">{resource.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getCategoryIcon(resource.category)}
                              <span>{resource.category}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{resource.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(resource.unitCost)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditResource(resource)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the resource "{resource.name}".
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteResourceMutation.mutate(resource.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Add Resource Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
            <DialogDescription>
              Add a new resource to the business.
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
                        <Input placeholder="Resource name" {...field} />
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
                        defaultValue={field.value as string}
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
                        placeholder="Enter a description of the resource" 
                        {...field} 
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
                        defaultValue={field.value as string}
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
                          type="number" 
                          min={1} 
                          {...field}
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
                          type="date" 
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
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
                          placeholder="0.00" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            // Allow only numbers and decimal point
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            field.onChange(value);
                          }}
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
                      <Input placeholder="Supplier name" {...field} />
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
                        placeholder="Additional notes" 
                        {...field} 
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
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addResourceMutation.isPending}
                >
                  {addResourceMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Resource
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Simple Edit Resource Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update the details of this resource.
            </DialogDescription>
          </DialogHeader>
          
          {currentResource && (
            <form 
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                
                // Get form data from form elements
                const formData = new FormData(e.currentTarget);
                
                // Create update object with correct types
                const updateData = {
                  id: currentResource.id,
                  businessId: currentResource.businessId,
                  name: formData.get('name') as string,
                  category: formData.get('category') as "Tool" | "Equipment" | "Material" | "Space",
                  description: formData.get('description') as string || null,
                  status: formData.get('status') as "Available" | "In Use" | "Maintenance" | "Out of Stock",
                  quantity: parseInt(formData.get('quantity') as string) || 1,
                  acquisitionDate: formData.get('acquisitionDate') as string || null,
                  unitCost: formData.get('unitCost') ? 
                    parseFloat(formData.get('unitCost') as string) : null,
                  supplier: formData.get('supplier') as string || null,
                  notes: formData.get('notes') as string || null
                };
                
                // Call mutation to update the resource using the API route
                apiRequest(
                  "PATCH",
                  `/api/business-resources/resources/${currentResource.id}`,
                  updateData
                ).then(async (response) => {
                  if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server error: ${response.status}. ${errorText}`);
                  }
                  return response.json();
                }).then(() => {
                  // On success
                  queryClient.invalidateQueries({
                    queryKey: ["/api/business-resources/businesses", business.id, "resources"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["/api/business-resources/businesses", business.id, "resource-stats"],
                  });
                  
                  toast({
                    title: "Resource updated",
                    description: "The resource has been updated successfully.",
                  });
                  
                  setIsEditDialogOpen(false);
                  setCurrentResource(null);
                }).catch((error) => {
                  // On error
                  toast({
                    title: "Error",
                    description: `Failed to update resource: ${error.message}`,
                    variant: "destructive",
                  });
                });
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name*</Label>
                  <Input 
                    id="edit-name"
                    name="name"
                    defaultValue={currentResource.name}
                    placeholder="Resource name" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category*</Label>
                  <Select name="category" defaultValue={currentResource.category}>
                    <SelectTrigger id="edit-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tool">Tool</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Material">Material</SelectItem>
                      <SelectItem value="Space">Space</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description" 
                  defaultValue={currentResource.description || ""}
                  placeholder="Describe the resource"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={currentResource.status || "Available"}>
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="In Use">In Use</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity</Label>
                  <Input
                    id="edit-quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    defaultValue={currentResource.quantity || 1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-acquisition-date">Acquisition Date</Label>
                  <Input
                    id="edit-acquisition-date"
                    name="acquisitionDate"
                    type="date"
                    defaultValue={currentResource.acquisitionDate || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unit-cost">Unit Cost (GHS)</Label>
                  <Input
                    id="edit-unit-cost"
                    name="unitCost"
                    placeholder="0.00"
                    defaultValue={currentResource.unitCost?.toString() || ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-supplier">Supplier</Label>
                <Input 
                  id="edit-supplier"
                  name="supplier" 
                  defaultValue={currentResource.supplier || ""}
                  placeholder="Supplier name" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={currentResource.notes || ""}
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Update Resource
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}