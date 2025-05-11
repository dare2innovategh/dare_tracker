import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { InsertMakerspace, Makerspace } from "@shared/schema";

// Create a schema for makerspace form validation
const makerspaceFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  description: z.string().optional(),
  coordinates: z.string().optional(),
  district: z.enum(["Bekwai", "Gushegu", "Lower Manya Krobo", "Yilo Krobo"], {
    required_error: "Please select a district",
  }),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  operatingHours: z.string().optional(),
  openDate: z.date().optional(),
});

type MakerspaceFormValues = z.infer<typeof makerspaceFormSchema>;

interface MakerspaceFormProps {
  onSubmit: (data: MakerspaceFormValues) => void;
  defaultValues?: Makerspace;
  isSubmitting?: boolean;
  isEdit?: boolean;
}

export default function MakerspaceForm({
  onSubmit,
  defaultValues,
  isSubmitting = false,
  isEdit = false,
}: MakerspaceFormProps) {
  const { toast } = useToast();
  
  // Parse the date string to Date object if it exists
  const parseOpenDate = (dateStr?: string | null) => {
    if (!dateStr) return undefined;
    const parsedDate = new Date(dateStr);
    return !isNaN(parsedDate.getTime()) ? parsedDate : undefined;
  };
  
  const form = useForm<MakerspaceFormValues>({
    resolver: zodResolver(makerspaceFormSchema),
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          address: defaultValues.address,
          description: defaultValues.description || "",
          coordinates: defaultValues.coordinates || "",
          district: defaultValues.district as "Bekwai" | "Gushegu" | "Lower Manya Krobo" | "Yilo Krobo",
          contactPhone: defaultValues.contactPhone || "",
          contactEmail: defaultValues.contactEmail || "",
          operatingHours: defaultValues.operatingHours || "",
          openDate: parseOpenDate(defaultValues.openDate),
        }
      : {
          name: "",
          address: "",
          description: "",
          coordinates: "",
          district: "Bekwai", // Default district
          contactPhone: "",
          contactEmail: "",
          operatingHours: "",
          openDate: undefined,
        },
  });

  // Define a submit handler
  function handleSubmit(values: MakerspaceFormValues) {
    onSubmit(values);
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Makerspace Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter makerspace name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The official name of the makerspace
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Bekwai">Bekwai</SelectItem>
                        <SelectItem value="Gushegu">Gushegu</SelectItem>
                        <SelectItem value="Lower Manya Krobo">
                          Lower Manya Krobo
                        </SelectItem>
                        <SelectItem value="Yilo Krobo">Yilo Krobo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The district where this makerspace is located
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter complete address" {...field} />
                  </FormControl>
                  <FormDescription>
                    The full address of the makerspace
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +233 50 123 4567" {...field} />
                    </FormControl>
                    <FormDescription>Phone number for inquiries</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. info@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Email address for inquiries</FormDescription>
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
                      placeholder="Describe the makerspace, its facilities, and purpose"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A detailed description of the makerspace
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="operatingHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operating Hours</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Mon-Fri: 8AM-6PM, Sat: 10AM-4PM"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      When the makerspace is open for business
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="openDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Opening Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Select opening date</span>
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
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When the makerspace started operations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="coordinates"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GPS Coordinates</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 5.6037° N, 0.1870° W"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    GPS coordinates for mapping (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Reset
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEdit ? "Update Makerspace" : "Create Makerspace"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}