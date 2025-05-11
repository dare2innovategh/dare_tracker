import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, BarChart2, Plus, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertBusinessTrackingSchema, BusinessProfile, User } from "@shared/schema";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
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
                &times;
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
  
  // Using z.coerce.number() for numeric fields to handle conversions from string inputs
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

interface BusinessTrackingFormNewProps {
  business: BusinessProfile;
  currentUser: User;
  onSuccess?: () => void;
  showFormDirectly?: boolean;
}

export function BusinessTrackingFormNew({
  business,
  currentUser,
  onSuccess,
  showFormDirectly = true,
}: BusinessTrackingFormNewProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("financials");

  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const form = useForm<AddTrackingFormValues>({
    resolver: zodResolver(addTrackingFormSchema),
    defaultValues: {
      // Required fields
      businessId: business.id,
      recordedBy: currentUser.id,
      
      // Tracking dates
      trackingDate: today,
      trackingMonth: currentMonth,
      trackingYear: today.getFullYear(),
      
      // Empty fields for form
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
      // Create proper Date objects for fields that need to be dates
      // Note: we're keeping the original Date objects, not converting to strings
      const payload = {
        ...values,
        // API expects Date objects, not strings
        trackingDate: values.trackingDate,
        trackingMonth: values.trackingMonth,
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
        title: "Business Data Added",
        description: "Business data record has been added successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/business-tracking/businesses/${business.id}/tracking`] });
      form.reset();
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
    addTrackingMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Date fields - always visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Tracking Date Field */}
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

          {/* Tracking Month Field */}
          <FormField
            control={form.control}
            name="trackingMonth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Reporting Month</FormLabel>
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
                          format(field.value, "MMMM yyyy")
                        ) : (
                          <span>Select month</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        // Set to the first day of the month
                        if (date) {
                          const firstDay = new Date(
                            date.getFullYear(),
                            date.getMonth(),
                            1
                          );
                          field.onChange(firstDay);
                          // Also update the year field
                          form.setValue("trackingYear", firstDay.getFullYear());
                        }
                      }}
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

          {/* Tracking Year Field - auto-populated from month selection */}
          <FormField
            control={form.control}
            name="trackingYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tracking Year</FormLabel>
                <FormControl>
                  <Input readOnly type="number" {...field} />
                </FormControl>
                <FormDescription>
                  Auto-set from reporting month
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tabs for form sections - with responsive design */}
        <Tabs defaultValue="financials" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex h-auto justify-start overflow-x-auto mb-8 rounded-md p-1 bg-muted/30">
            <TabsTrigger value="financials" className="px-4 py-2 rounded-md data-[state=active]:bg-[#FF5F00] data-[state=active]:text-white">
              <span className="mr-2">💰</span>
              <span>Financial Data</span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="px-4 py-2 rounded-md data-[state=active]:bg-[#FF5F00] data-[state=active]:text-white">
              <span className="mr-2">🛠️</span>
              <span>Operations & Resources</span>  
            </TabsTrigger>
            <TabsTrigger value="planning" className="px-4 py-2 rounded-md data-[state=active]:bg-[#FF5F00] data-[state=active]:text-white">
              <span className="mr-2">📝</span>
              <span>Insights & Planning</span>
            </TabsTrigger>
          </TabsList>

          {/* FINANCIAL DATA TAB */}
          <TabsContent value="financials" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Financial figures */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Business Finances</h3>
                    
                    {/* Projected Revenue */}
                    <FormField
                      control={form.control}
                      name="projectedRevenue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Projected Monthly Revenue (GHS)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? null : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                              className="font-mono"
                            />
                          </FormControl>
                          <FormDescription>
                            Expected monthly revenue
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Actual Revenue */}
                    <FormField
                      control={form.control}
                      name="actualRevenue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual Monthly Revenue (GHS)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? null : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                              className="font-mono"
                            />
                          </FormControl>
                          <FormDescription>
                            Total revenue for the reporting month
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Internal Revenue */}
                    <FormField
                      control={form.control}
                      name="internalRevenue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Internal Revenue (GHS)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? null : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                              className="font-mono"
                            />
                          </FormControl>
                          <FormDescription>
                            Revenue from internal sources (Digital Access for Rural Empowerment network)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Additional Financial Data</h3>
                    
                    {/* External Revenue */}
                    <FormField
                      control={form.control}
                      name="externalRevenue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>External Revenue (GHS)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? null : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                              className="font-mono"
                            />
                          </FormControl>
                          <FormDescription>
                            Revenue from external customers
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Actual Expenditure */}
                    <FormField
                      control={form.control}
                      name="actualExpenditure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual Expenditure (GHS)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? null : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                              className="font-mono"
                            />
                          </FormControl>
                          <FormDescription>
                            Total expenses for the month
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Actual Profit */}
                    <FormField
                      control={form.control}
                      name="actualProfit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual Profit (GHS)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? null : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                              className="font-mono"
                            />
                          </FormControl>
                          <FormDescription>
                            Net profit for the month
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Market & Employment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Prominent Market */}
                    <FormField
                      control={form.control}
                      name="prominentMarket"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prominent Market</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Local consumers, businesses, etc." {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Main target market in this period
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
                    {/* Employment Section */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Actual Employees */}
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
                                    const value = e.target.value === "" ? null : parseInt(e.target.value);
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* New Employees */}
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
                                    const value = e.target.value === "" ? null : parseInt(e.target.value);
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OPERATIONS & RESOURCES TAB */}
          <TabsContent value="operations" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Resources & Equipment</h3>
                  
                  {/* New Resources */}
                  <FormField
                    control={form.control}
                    name="newResources"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Resources Acquired</FormLabel>
                        <FormControl>
                          <ArrayInput 
                            value={field.value || []} 
                            onChange={field.onChange}
                            placeholder="Add new resource item..."
                          />
                        </FormControl>
                        <FormDescription>
                          New resources, tools, or materials acquired in this period
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* All Equipment */}
                  <FormField
                    control={form.control}
                    name="allEquipment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Equipment</FormLabel>
                        <FormControl>
                          <ArrayInput 
                            value={field.value || []} 
                            onChange={field.onChange}
                            placeholder="Add equipment item..."
                          />
                        </FormControl>
                        <FormDescription>
                          Comprehensive list of current equipment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Business Insights</h3>
                  
                  {/* Business Insights */}
                  <FormField
                    control={form.control}
                    name="businessInsights"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Insights</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter observations and insights about the business operations..."
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          General observations and operational insights
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Key Decisions */}
                  <FormField
                    control={form.control}
                    name="keyDecisions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Decisions Made</FormLabel>
                        <FormControl>
                          <ArrayInput 
                            value={field.value || []} 
                            onChange={field.onChange}
                            placeholder="Add key decision..."
                          />
                        </FormControl>
                        <FormDescription>
                          Important business decisions made in this period
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Lessons Gained */}
                  <FormField
                    control={form.control}
                    name="lessonsGained"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lessons Learned</FormLabel>
                        <FormControl>
                          <ArrayInput 
                            value={field.value || []} 
                            onChange={field.onChange}
                            placeholder="Add lesson learned..."
                          />
                        </FormControl>
                        <FormDescription>
                          Business lessons learned during this period
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INSIGHTS & PLANNING TAB */}
          <TabsContent value="planning" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Challenges & Planning</h3>
                  
                  {/* Challenges */}
                  <FormField
                    control={form.control}
                    name="challenges"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Challenges</FormLabel>
                        <FormControl>
                          <ArrayInput 
                            value={field.value || []} 
                            onChange={field.onChange}
                            placeholder="Add business challenge..."
                          />
                        </FormControl>
                        <FormDescription>
                          Challenges the business is currently facing
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Next Steps Planned */}
                  <FormField
                    control={form.control}
                    name="nextStepsPlanned"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Next Steps Planned</FormLabel>
                        <FormControl>
                          <ArrayInput 
                            value={field.value || []} 
                            onChange={field.onChange}
                            placeholder="Add planned next step..."
                          />
                        </FormControl>
                        <FormDescription>
                          Future steps planned for business growth
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Mentor Feedback */}
                  <FormField
                    control={form.control}
                    name="mentorFeedback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mentor Feedback</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter mentor observations, suggestions, and feedback..."
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Mentor's observations and recommendations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Controls */}
        <div className="flex justify-between pt-6 border-t">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Navigation between tabs
                if (activeTab === "financials") setActiveTab("operations");
                else if (activeTab === "operations") setActiveTab("planning");
                else setActiveTab("financials");
              }}
            >
              {activeTab === "planning" ? "Go to Financial Data" : "Next Section"}
            </Button>
          </div>
          
          <Button 
            type="submit" 
            disabled={addTrackingMutation.isPending}
            className="bg-gradient-to-r from-[#FF5F00] via-[#EB001B] to-[#F79E1B] border-none text-white px-6"
          >
            {addTrackingMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Record...
              </>
            ) : (
              <>
                <BarChart2 className="mr-2 h-4 w-4" />
                Add Business Data
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}