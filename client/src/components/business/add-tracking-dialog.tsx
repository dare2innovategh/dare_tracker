import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BarChart2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertBusinessTrackingSchema, BusinessProfile } from "@shared/schema";

// Extend the schema with validation rules
const addTrackingFormSchema = insertBusinessTrackingSchema.extend({
  notes: z
    .string()
    .min(10, "Notes must be at least 10 characters")
    .max(1000, "Notes cannot be more than 1000 characters"),
  metricValue: z
    .string()
    .min(1, "Metric value is required"),
});

type AddTrackingFormValues = z.infer<typeof addTrackingFormSchema>;

interface AddTrackingDialogProps {
  business: BusinessProfile;
  onSuccess?: () => void;
  buttonStyle?: "primary" | "secondary" | "outline";
  buttonText?: string;
  buttonIcon?: React.ReactNode;
}

export function AddTrackingDialog({
  business,
  onSuccess,
  buttonStyle = "primary",
  buttonText = "Add Tracking Record",
  buttonIcon = <BarChart2 className="mr-2 h-4 w-4" />,
}: AddTrackingDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddTrackingFormValues>({
    resolver: zodResolver(addTrackingFormSchema),
    defaultValues: {
      businessId: business.id,
      trackingType: "Monthly Revenue",
      trackingPeriod: "Monthly",
      trackingStatus: "Verified",
      metricValue: "",
      targetValue: "",
      previousValue: "",
      trackingDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const addTrackingMutation = useMutation({
    mutationFn: async (values: AddTrackingFormValues) => {
      // Format any values if needed before sending
      const payload = {
        ...values,
        // Convert string values to numbers where appropriate
        metricValue: values.metricValue,
        targetValue: values.targetValue || null,
        previousValue: values.previousValue || null,
      };

      const response = await apiRequest(
        "POST",
        "/api/business-tracking",
        payload
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add tracking record");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tracking Record Added",
        description: "Business tracking record has been added successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/business-tracking/businesses/${business.id}/tracking`] });
      form.reset();
      setOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add tracking record",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: AddTrackingFormValues) {
    addTrackingMutation.mutate(values);
  }

  // Dynamically set button styles based on prop
  const getButtonStyle = () => {
    switch (buttonStyle) {
      case "primary":
        return "shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 border-none text-white";
      case "secondary":
        return "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90";
      case "outline":
        return "border-gray-200 hover:border-gray-300 transition-all duration-300 group";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={getButtonStyle()}
          variant={buttonStyle === "outline" ? "outline" : "default"}
        >
          {buttonIcon}
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Business Tracking Record</DialogTitle>
          <DialogDescription>
            Track key performance indicators for {business.businessName}.
            All tracking data will be available for analysis and reporting.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tracking Type Field */}
            <FormField
              control={form.control}
              name="trackingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={addTrackingMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tracking type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Monthly Revenue">Monthly Revenue</SelectItem>
                      <SelectItem value="Customer Count">Customer Count</SelectItem>
                      <SelectItem value="Production Volume">Production Volume</SelectItem>
                      <SelectItem value="Employee Count">Employee Count</SelectItem>
                      <SelectItem value="Product Lines">Product Lines</SelectItem>
                      <SelectItem value="Market Reach">Market Reach</SelectItem>
                      <SelectItem value="Profit Margin">Profit Margin</SelectItem>
                      <SelectItem value="Investment Amount">Investment Amount</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tracking Period Field */}
            <FormField
              control={form.control}
              name="trackingPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking Period</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={addTrackingMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Metric Value Field */}
            <FormField
              control={form.control}
              name="metricValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Value</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter current value"
                      {...field}
                      disabled={addTrackingMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    The current measured value for this tracking record.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Value Field */}
            <FormField
              control={form.control}
              name="targetValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Value (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter target value"
                      {...field}
                      disabled={addTrackingMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    The target value for this metric.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Previous Value Field */}
            <FormField
              control={form.control}
              name="previousValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Value (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter previous value"
                      {...field}
                      disabled={addTrackingMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    The previous measured value for comparison.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tracking Date Field */}
            <FormField
              control={form.control}
              name="trackingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      disabled={addTrackingMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tracking Status Field */}
            <FormField
              control={form.control}
              name="trackingStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={addTrackingMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Verified">Verified</SelectItem>
                      <SelectItem value="Needs Review">Needs Review</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any relevant notes or observations"
                      className="min-h-[100px]"
                      {...field}
                      disabled={addTrackingMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Add any additional information or explanation for this tracking record.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={addTrackingMutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={addTrackingMutation.isPending}
                className="bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 border-none text-white"
              >
                {addTrackingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Record
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AddTrackingDialog;