import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from 'date-fns';
import { Trash, PenSquare, Plus, Check, AlertCircle, Loader } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

// Define types
interface Program {
  id: number;
  name: string;
  description: string;
  category: string;
  totalModules: number;
}

interface Training {
  id: number;
  youthId: number;
  programId: number;
  startDate: string | null;
  completionDate: string | null;
  status: "In Progress" | "Completed" | "Dropped";
  certificationReceived: boolean;
  notes: string | null;
  program: Program;
}

// Form schema for training
const trainingFormSchema = z.object({
  programId: z.string().min(1, { message: "Please select a program" }),
  startDate: z.string().optional().nullable(),
  completionDate: z.string().optional().nullable(),
  status: z.enum(["In Progress", "Completed", "Dropped"]),
  certificationReceived: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

type TrainingFormValues = z.infer<typeof trainingFormSchema>;

interface NewTrainingSectionProps {
  youthId: number;
  readOnly?: boolean;
}

export function NewTrainingSection({ youthId, readOnly = false }: NewTrainingSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch training programs
  const {
    data: programs,
    isLoading: isProgramsLoading,
    error: programsError
  } = useQuery<Program[]>({
    queryKey: ['/api/training/programs'],
  });

  // Fetch youth's training records
  const {
    data: trainings,
    isLoading: isTrainingsLoading,
    error: trainingsError
  } = useQuery<Training[]>({
    queryKey: ['/api/youth/training-v2/youth', youthId],
    enabled: !!youthId,
  });

  // Add training mutation
  const addTrainingMutation = useMutation({
    mutationFn: async (data: TrainingFormValues) => {
      const payload = {
        ...data,
        programId: parseInt(data.programId),
        youthId
      };
      
      const res = await apiRequest('POST', '/api/youth/training-v2', payload);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add training');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/youth/training-v2/youth', youthId] });
      toast({
        title: "Training Added",
        description: "Training program has been added successfully.",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update training mutation
  const updateTrainingMutation = useMutation({
    mutationFn: async (data: TrainingFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      
      // Convert programId to number if it's a string
      const payload = {
        ...updateData,
        programId: typeof updateData.programId === 'string' ? parseInt(updateData.programId) : updateData.programId,
      };
      
      const res = await apiRequest('PATCH', `/api/youth/training-v2/${id}`, payload);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update training');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/youth/training-v2/youth', youthId] });
      toast({
        title: "Training Updated",
        description: "Training program has been updated successfully.",
      });
      setSelectedTraining(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete training mutation
  const deleteTrainingMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/youth/training-v2/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete training');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/youth/training-v2/youth', youthId] });
      toast({
        title: "Training Deleted",
        description: "Training program has been removed.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedTraining(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Add Training Form
  const addForm = useForm<TrainingFormValues>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      programId: '',
      startDate: null,
      completionDate: null,
      status: 'In Progress',
      certificationReceived: false,
      notes: '',
    }
  });

  // Edit Training Form
  const editForm = useForm<TrainingFormValues>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      programId: '',
      startDate: null,
      completionDate: null,
      status: 'In Progress',
      certificationReceived: false,
      notes: '',
    }
  });

  // Reset the add form when dialog opens
  useEffect(() => {
    if (isAddDialogOpen) {
      addForm.reset({
        programId: '',
        startDate: null,
        completionDate: null,
        status: 'In Progress',
        certificationReceived: false,
        notes: '',
      });
    }
  }, [isAddDialogOpen, addForm]);

  // Set form values when a training is selected for editing
  useEffect(() => {
    if (selectedTraining) {
      editForm.reset({
        programId: selectedTraining.programId.toString(),
        startDate: selectedTraining.startDate || null,
        completionDate: selectedTraining.completionDate || null,
        status: selectedTraining.status,
        certificationReceived: selectedTraining.certificationReceived,
        notes: selectedTraining.notes || '',
      });
    }
  }, [selectedTraining, editForm]);

  // Handle form submissions
  const onAddSubmit = (data: TrainingFormValues) => {
    addTrainingMutation.mutate(data);
  };

  const onEditSubmit = (data: TrainingFormValues) => {
    if (selectedTraining) {
      updateTrainingMutation.mutate({ ...data, id: selectedTraining.id });
    }
  };

  const confirmDelete = () => {
    if (selectedTraining) {
      deleteTrainingMutation.mutate(selectedTraining.id);
    }
  };

  // Render loading state
  if (isTrainingsLoading || isProgramsLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Training Programs</CardTitle>
          <CardDescription>Training programs that the youth has participated in</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (trainingsError || programsError) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Training Programs</CardTitle>
          <CardDescription>Training programs that the youth has participated in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
            <div>
              <p className="font-medium">Error loading training data</p>
              <p className="text-sm">{(trainingsError as Error)?.message || (programsError as Error)?.message || 'An unknown error occurred'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Training Programs</CardTitle>
          <CardDescription>Training programs that the youth has participated in</CardDescription>
        </div>
        {!readOnly && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAddDialogOpen(true)}
            className="ml-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Training
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {trainings && trainings.length > 0 ? (
          <div className="space-y-4">
            {trainings.map((training) => (
              <div key={training.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{training.program?.name || 'Unknown Program'}</h4>
                    <p className="text-sm text-muted-foreground">
                      {training.program?.category || 'No category'}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <Badge variant={training.status === 'Completed' ? 'outline' : training.status === 'In Progress' ? 'default' : 'destructive'}>
                        {training.status}
                      </Badge>
                      {training.certificationReceived && (
                        <Badge variant="outline" className="flex items-center">
                          <Check className="h-3 w-3 mr-1" />
                          Certified
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedTraining(training)}
                      >
                        <PenSquare className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedTraining(training);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Start Date:</span>{" "}
                    {training.startDate ? format(new Date(training.startDate), 'PPP') : 'Not set'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Completion Date:</span>{" "}
                    {training.completionDate ? format(new Date(training.completionDate), 'PPP') : 'Not set'}
                  </div>
                  {training.notes && (
                    <div className="col-span-2 mt-2">
                      <span className="text-muted-foreground">Notes:</span>{" "}
                      {training.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No training programs recorded</p>
            {!readOnly && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Training
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Add Training Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Training Program</DialogTitle>
            <DialogDescription>
              Add a new training program for this youth profile.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="programId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Program</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a program" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {programs && programs.map((program) => (
                          <SelectItem key={program.id} value={program.id.toString()}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="completionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Completion Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={addForm.control}
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
              <FormField
                control={addForm.control}
                name="certificationReceived"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Certification Received</FormLabel>
                      <FormDescription>
                        Has the youth received a certification for this program?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ''} 
                        placeholder="Any additional notes or comments"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addTrainingMutation.isPending}>
                  {addTrainingMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                  Add Training
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Training Dialog */}
      <Dialog open={!!selectedTraining && !isDeleteDialogOpen} onOpenChange={(open) => !open && setSelectedTraining(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Training Program</DialogTitle>
            <DialogDescription>
              Update the training program information.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="programId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Program</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a program" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {programs && programs.map((program) => (
                          <SelectItem key={program.id} value={program.id.toString()}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="completionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Completion Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
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
              <FormField
                control={editForm.control}
                name="certificationReceived"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Certification Received</FormLabel>
                      <FormDescription>
                        Has the youth received a certification for this program?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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
                        value={field.value || ''} 
                        placeholder="Any additional notes or comments"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedTraining(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateTrainingMutation.isPending}>
                  {updateTrainingMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this training record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteTrainingMutation.isPending}
            >
              {deleteTrainingMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}