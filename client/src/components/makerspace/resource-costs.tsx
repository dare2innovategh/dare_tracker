import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MakerspaceResource, MakerspaceResourceCost, insertMakerspaceResourceCostSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus, Trash2, Receipt, Calendar } from "lucide-react";

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

const formSchema = insertMakerspaceResourceCostSchema.extend({
  date: z
    .string()
    .transform((val) => (val ? new Date(val) : new Date()))
    .default(() => new Date().toISOString().split('T')[0]),
  amount: z
    .string()
    .transform((val) => (val ? parseFloat(val) : 0))
    .refine((val) => val > 0, { message: "Amount must be greater than 0" }),
});

type FormValues = z.infer<typeof formSchema>;

interface ResourceCostsProps {
  resource: MakerspaceResource;
}

export default function ResourceCosts({ resource }: ResourceCostsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch costs for this resource
  const { data: costs = [], isLoading } = useQuery({
    queryKey: ["/api/makerspace-resources/resources", resource.id, "costs"],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/makerspace-resources/resources/${resource.id}/costs`
      );
      return await response.json();
    },
  });

  // Form for adding a new cost entry
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resourceId: resource.id,
      costType: "Purchase",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      description: "",
    },
  });

  // Mutation for adding a new cost entry
  const addCostMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest(
        "POST",
        `/api/makerspace-resources/resources/${resource.id}/costs`,
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/makerspace-resources/resources", resource.id, "costs"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/makerspace-resources/makerspaces", resource.makerspaceId, "resource-stats"],
      });
      toast({
        title: "Cost entry added",
        description: "The cost entry has been added successfully.",
      });
      setIsAddDialogOpen(false);
      form.reset({
        resourceId: resource.id,
        costType: "Purchase",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        description: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add cost entry: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a cost entry
  const deleteCostMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/makerspace-resources/costs/${id}`
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/makerspace-resources/resources", resource.id, "costs"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/makerspace-resources/makerspaces", resource.makerspaceId, "resource-stats"],
      });
      toast({
        title: "Cost entry deleted",
        description: "The cost entry has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete cost entry: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission for adding a new cost entry
  const onSubmit = (data: FormValues) => {
    addCostMutation.mutate(data);
  };

  // Format currency values
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(value);
  };

  // Format date values
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Function to get the appropriate color for each cost type
  const getCostTypeColor = (costType: string) => {
    switch (costType) {
      case "Purchase":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "Repair":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "Upgrade":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "Other":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  // Calculate total costs
  const totalCosts = costs.reduce(
    (total: number, cost: MakerspaceResourceCost) => total + parseFloat(String(cost.amount || 0)),
    0
  );

  return (
    <Card className="mt-5">
      <CardHeader className="pb-1">
        <div className="flex justify-between items-center">
          <CardTitle>Cost Management</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Cost Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Cost Entry</DialogTitle>
                <DialogDescription>
                  Record a new cost entry for this resource.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="costType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Type*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select cost type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Purchase">Purchase</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="Repair">Repair</SelectItem>
                            <SelectItem value="Upgrade">Upgrade</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (GHS)*</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder="0.00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              value={field.value || ""}
                            />
                          </FormControl>
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
                            placeholder="Describe the cost"
                            rows={3}
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
                      disabled={addCostMutation.isPending}
                    >
                      {addCostMutation.isPending ? "Adding..." : "Add Cost Entry"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Manage costs associated with {resource.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm font-medium">Initial Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {formatCurrency(resource.totalCost || 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm font-medium">Additional Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(totalCosts)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {formatCurrency((resource.totalCost || 0) + totalCosts)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Cost History</h3>
          <Table>
            <TableCaption>
              {isLoading
                ? "Loading cost entries..."
                : costs.length === 0
                ? "No cost entries found"
                : `Total of ${costs.length} cost entries`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading cost entries...
                  </TableCell>
                </TableRow>
              ) : costs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No cost entries found. Add your first cost entry.
                  </TableCell>
                </TableRow>
              ) : (
                costs.map((cost: MakerspaceResourceCost) => (
                  <TableRow key={cost.id}>
                    <TableCell>
                      <Badge className={getCostTypeColor(cost.costType)}>
                        {cost.costType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        {formatDate(cost.date)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(cost.amount)}
                    </TableCell>
                    <TableCell>
                      {cost.description || <span className="text-muted-foreground">No description</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Cost Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this cost entry? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCostMutation.mutate(cost.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {deleteCostMutation.isPending ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}