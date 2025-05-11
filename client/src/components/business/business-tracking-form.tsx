import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BarChart2, Plus, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertBusinessTrackingSchema, BusinessProfile, User } from "@shared/schema";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Mastercard color theme
const THEME = {
  primary: "#FF5F00",
  secondary: "#EB001B",
  accent: "#F79E1B",
  dark: "#1A1F71",
};

// Custom JSON array input component
interface ArrayInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

function ArrayInput({ value, onChange, placeholder }: ArrayInputProps) {
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...value, newItem.trim()]);
      setNewItem("");
    }
  };

  const handleRemove = (index: number) => {
    onChange([...value.slice(0, index), ...value.slice(index + 1)]);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder || "Add item..."}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button type="button" onClick={handleAdd} size="sm" variant="secondary">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={index} className="flex items-center justify-between bg-muted/50 rounded-md p-2">
              <span className="text-sm">{item}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                className="h-7 w-7 p-0"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Extend the schema with validation rules
const addTrackingFormSchema = insertBusinessTrackingSchema.extend({
  mentorFeedback: z.string().optional().nullable(),
  tracking_period: z.string().default("monthly"),
  projectedRevenue: z.coerce.number().optional(),
  actualEmployees: z.coerce.number().optional(),
  newEmployees: z.coerce.number().optional(),
  actualRevenue: z.coerce.number().optional(),
  internalRevenue: z.coerce.number().optional(),
  externalRevenue: z.coerce.number().optional(),
  actualExpenditure: z.coerce.number().optional(),
  actualProfit: z.coerce.number().optional(),
});

type AddTrackingFormValues = z.infer<typeof addTrackingFormSchema>;

interface BusinessTrackingFormProps {
  business: BusinessProfile;
  currentUser: User;
  onSuccess?: () => void;
  buttonStyle?: "primary" | "secondary" | "outline";
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  showFormDirectly?: boolean;
}

export function BusinessTrackingForm({
  business,
  currentUser,
  onSuccess,
  buttonStyle = "primary",
  buttonText = "Add Business Data",
  buttonIcon = <BarChart2 className="mr-2 h-4 w-4" />,
  showFormDirectly = false,
}: BusinessTrackingFormProps) {
  const [open, setOpen] = useState(showFormDirectly);
  const { toast } = useToast();

  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const form = useForm<AddTrackingFormValues>({
    resolver: zodResolver(addTrackingFormSchema),
    defaultValues: {
      businessId: business.id,
      recordedBy: currentUser.id,
      tracking_period: "monthly",
      trackingDate: today,
      trackingMonth: currentMonth,
      trackingYear: today.getFullYear(),
      projectedRevenue: undefined,
      actualEmployees: undefined,
      newEmployees: undefined,
      actualRevenue: undefined,
      internalRevenue: undefined,
      externalRevenue: undefined,
      actualExpenditure: undefined,
      actualProfit: undefined,
      prominentMarket: "",
      newResources: [],
      allEquipment: [],
      keyDecisions: [],
      lessonsGained: [],
      businessInsights: "",
      challenges: [],
      nextStepsPlanned: [],
      mentorFeedback: "",
    },
  });

  const addTrackingMutation = useMutation({
    mutationFn: async (values: AddTrackingFormValues) => {
      const payload = {
        ...values,
        trackingDate: format(values.trackingDate, "yyyy-MM-dd"),
        trackingMonth: format(values.trackingMonth, "yyyy-MM-dd"),
        tracking_period: values.tracking_period || "monthly",
      };
      console.log("Submitting payload:", JSON.stringify(payload, null, 2));
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
        title: "Business Data Added",
        description: "Business data record has been added successfully.",
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
        description: error.message || "Failed to add business data",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: AddTrackingFormValues) {
    addTrackingMutation.mutate({
      ...values,
      tracking_period: values.tracking_period || "monthly",
    });
  }

  const getButtonStyle = () => {
    switch (buttonStyle) {
      case "primary":
        return `shadow-sm hover:shadow-md transition-all duration-300 border-none text-white` +
               ` bg-gradient-to-r from-[${THEME.primary}] via-[${THEME.secondary}] to-[${THEME.accent}]`;
      case "secondary":
        return `bg-[${THEME.dark}] text-white shadow-sm hover:bg-opacity-90`;
      case "outline":
        return `border-gray-200 hover:border-gray-300 transition-all duration-300 group hover:text-[${THEME.primary}]`;
      default:
        return "";
    }
  };

  const formElement = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="tracking_period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tracking Period</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tracking period" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The time period this data represents
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="trackingDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Record Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="projectedRevenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projected Monthly Revenue (GHS)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>Expected monthly revenue</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="actualRevenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Monthly Revenue (GHS)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>Total revenue for the reporting month</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="internalRevenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Internal Revenue (GHS)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>Revenue from internal sources (Digital Access for Rural Advancement network)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="externalRevenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>External Revenue (GHS)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>Revenue from external customers</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="actualExpenditure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Expenditure (GHS)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>Total expenses for the month</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="actualProfit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Profit (GHS)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>Net profit for the month</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="prominentMarket"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prominent Market</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. local consumers, businesses, etc." />
                </FormControl>
                <FormDescription>Main target market in this period</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="actualEmployees"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Employees</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="newEmployees"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Employees</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="submit" 
            disabled={addTrackingMutation.isPending}
            className="bg-gradient-to-r from-[#FF5F00] via-[#EB001B] to-[#F79E1B] border-none text-white"
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
        </div>
      </form>
    </Form>
  );

  if (showFormDirectly) {
    return formElement;
  }

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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Business Data</DialogTitle>
          <DialogDescription>
            Track key metrics for {business.businessName}.
            All data will be available for analysis and reporting.
          </DialogDescription>
        </DialogHeader>
        {formElement}
      </DialogContent>
    </Dialog>
  );
}