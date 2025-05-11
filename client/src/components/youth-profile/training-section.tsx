import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Plus, Check, GraduationCap, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Define LoadingSpinner component 
function LoadingSpinner({ className, ...props }: React.ComponentProps<typeof Loader2>) {
  return (
    <Loader2 
      className={cn("h-4 w-4 animate-spin", className)} 
      aria-hidden="true"
      {...props}
    />
  );
}

// Define types for training programs and records
interface TrainingProgram {
  id: number;
  programName: string;
  description: string | null;
  programType: string | null;
  duration: string | null;
  createdAt: string | null;
}

interface YouthTraining {
  id: number;
  youthId: number;
  programId: number;
  status: "In Progress" | "Completed" | "Dropped";
  startDate: string | null;
  completionDate: string | null;
  certificationReceived: boolean;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  program?: TrainingProgram;
}

// Define validation schema for adding/editing training
const trainingSchema = z.object({
  programId: z.coerce.number().min(1, "Please select a training program"),
  status: z.enum(["In Progress", "Completed", "Dropped"]),
  startDate: z.date().nullable().optional(),
  completionDate: z.date().nullable().optional(),
  certificationReceived: z.boolean().default(false),
  notes: z.string().nullable().optional(),
});

type TrainingFormValues = z.infer<typeof trainingSchema>;

interface TrainingFormProps {
  youthId: number;
  onSuccess: () => void;
  initialData?: YouthTraining;
  onCancel: () => void;
  programs: TrainingProgram[];
}

function TrainingForm({ youthId, onSuccess, initialData, onCancel, programs }: TrainingFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TrainingFormValues>({
    resolver: zodResolver(trainingSchema),
    defaultValues: initialData ? {
      programId: initialData.programId,
      status: initialData.status,
      startDate: initialData.startDate ? parseISO(initialData.startDate) : undefined,
      completionDate: initialData.completionDate ? parseISO(initialData.completionDate) : undefined,
      certificationReceived: initialData.certificationReceived,
      notes: initialData.notes || "",
    } : {
      programId: 0,
      status: "In Progress",
      startDate: new Date(),
      completionDate: undefined,
      certificationReceived: false,
      notes: "",
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: TrainingFormValues) => {
      const payload = {
        ...values,
        youthId,
      };

      if (initialData) {
        // Update existing record
        const res = await apiRequest("PATCH", `/api/youth-training/${initialData.id}`, payload);
        return res.json();
      } else {
        // Create new record
        const res = await apiRequest("POST", "/api/youth-training", payload);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/youth-training/youth/${youthId}`] });
      toast({
        title: initialData ? "Training updated" : "Training added",
        description: initialData 
          ? "The training record has been updated successfully." 
          : "The training program has been added successfully.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save training record. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: TrainingFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="programId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Training Program</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value ? field.value.toString() : undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a training program" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.programName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
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
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="completionDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Completion Date</FormLabel>
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
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="certificationReceived"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Certification Received</FormLabel>
              </div>
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
                  placeholder="Add any additional notes about this training"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <LoadingSpinner className="mr-2 h-4 w-4" />}
            {initialData ? "Update" : "Add"} Training
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

interface TrainingSectionProps {
  youthId: number;
  isEditable?: boolean;
}

export function TrainingSection({ youthId, isEditable = false }: TrainingSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<YouthTraining | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch training programs
  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ["/api/training-programs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/training-programs");
      return await res.json();
    },
  });

  // Fetch youth training records
  const { data: training = [], isLoading: trainingLoading } = useQuery({
    queryKey: [`/api/youth-training/youth/${youthId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/youth-training/youth/${youthId}`);
      return await res.json();
    },
  });

  // Delete training mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/youth-training/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/youth-training/youth/${youthId}`] });
      toast({
        title: "Training deleted",
        description: "The training record has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete training record. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this training record?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-500">{status}</Badge>;
      case "In Progress":
        return <Badge className="bg-blue-500">{status}</Badge>;
      case "Dropped":
        return <Badge className="bg-red-500">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const isLoading = programsLoading || trainingLoading;

  // Get the most recent or primary training record
  const mainTraining = training.length > 0 ? training[0] : null;

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-xl">Training Programs</CardTitle>
        {isEditable && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {training.length === 0 ? (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Training
                  </>
                ) : (
                  <>Edit Training</>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{training.length === 0 ? "Add Training Program" : "Edit Training Program"}</DialogTitle>
              </DialogHeader>
              <TrainingForm
                youthId={youthId}
                initialData={editingTraining || mainTraining}
                onSuccess={() => {
                  setIsAddDialogOpen(false);
                  setEditingTraining(null);
                }}
                onCancel={() => {
                  setIsAddDialogOpen(false);
                  setEditingTraining(null);
                }}
                programs={programs}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        ) : training.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No training records found.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Main training program display */}
            <div className="border rounded-md p-4">
              <div className="flex items-start">
                <GraduationCap className="h-5 w-5 mr-3 mt-1 text-primary" />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="font-medium text-lg">Training Information</h3>
                    <div className="flex items-center space-x-2">
                      {mainTraining && getStatusBadge(mainTraining.status)}
                    </div>
                  </div>

                  {/* Main training details */}
                  {mainTraining && (
                    <>
                      {/* Prominent section for the primary program */}
                      <div className="mt-2 mb-4 p-3 bg-secondary/20 rounded-md border border-secondary/30">
                        <div className="grid gap-2">
                          <div className="flex gap-2">
                            <span className="font-semibold text-foreground min-w-[140px]">Primary Program:</span>
                            <span className="font-medium">{mainTraining.program?.programName}</span>
                          </div>
                          
                          {mainTraining.program?.programType && (
                            <div className="flex gap-2">
                              <span className="font-semibold text-foreground min-w-[140px]">Program Type:</span>
                              <span className="font-medium">{mainTraining.program.programType}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-2 mt-2">
                        {mainTraining.startDate && (
                          <div className="flex gap-2">
                            <span className="font-medium min-w-[120px]">Started:</span>
                            <span>{format(new Date(mainTraining.startDate), "PPP")}</span>
                          </div>
                        )}

                        {mainTraining.completionDate && (
                          <div className="flex gap-2">
                            <span className="font-medium min-w-[120px]">Completed:</span>
                            <span>{format(new Date(mainTraining.completionDate), "PPP")}</span>
                          </div>
                        )}

                        {mainTraining.certificationReceived && (
                          <div className="flex gap-2">
                            <span className="font-medium min-w-[120px]">Certification:</span>
                            <Badge variant="outline" className="flex items-center">
                              <Check className="h-3 w-3 mr-1" /> Received
                            </Badge>
                          </div>
                        )}

                        {mainTraining.notes && (
                          <div className="flex gap-2">
                            <span className="font-medium min-w-[120px]">Notes:</span>
                            <span>{mainTraining.notes}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Additional training programs */}
                  {training.length > 1 && (
                    <>
                      <div className="mt-4 pt-3 border-t">
                        <h4 className="font-medium mb-2">Additional Training Programs</h4>
                        <div className="space-y-3">
                          {training.slice(1).map((record: YouthTraining) => (
                            <div key={record.id} className="rounded-md p-2 border">
                              <div className="flex justify-between">
                                <p className="font-medium">{record.program?.programName}</p>
                                {getStatusBadge(record.status)}
                              </div>
                              {record.completionDate && (
                                <p className="text-sm text-muted-foreground">
                                  Completed: {format(new Date(record.completionDate), "PPP")}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {isEditable && (
                    <div className="flex justify-end mt-4 pt-2 border-t">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          if (mainTraining && confirm("Are you sure you want to remove this training record?")) {
                            deleteMutation.mutate(mainTraining.id);
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}