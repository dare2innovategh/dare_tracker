import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Education } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Award, BookOpen, Calendar, Check, Clock, Pencil, School, Trash } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Define qualification types
const qualificationTypes = [
  "High School",
  "Certificate",
  "Diploma",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate",
  "Vocational Training",
  "Professional Certification",
  "Other"
];

// Define education levels
const educationLevels = [
  "Primary",
  "Junior High School",
  "Senior High School",
  "Technical/Vocational",
  "University/College",
  "Graduate School",
  "Professional Training",
  "Other"
];

// Form schema and types for education
const educationSchema = z.object({
  qualificationType: z.string().min(1, "Qualification type is required"),
  qualificationName: z.string().min(1, "Qualification name is required"),
  specialization: z.string().optional(),
  levelCompleted: z.string().optional(),
  institution: z.string().optional(),
  graduationYear: z.string().optional(),
  isHighestQualification: z.boolean().default(false),
  certificateUrl: z.string().optional(),
  qualificationStatus: z.enum(["Completed", "In Progress", "Incomplete"]).default("Completed"),
  additionalDetails: z.string().optional(),
});

type EducationFormValues = z.infer<typeof educationSchema>;

interface EducationFormProps {
  youthId: number;
  initialData?: Education;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EducationForm({ youthId, initialData, onSuccess, onCancel }: EducationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialize form values with defaults
  const getInitialGraduationYear = () => {
    if (initialData?.graduationYear) {
      return String(initialData.graduationYear);
    }
    return 'none';
  };
  
  const defaultValues = {
    qualificationType: initialData?.qualificationType || '',
    qualificationName: initialData?.qualificationName || '',
    specialization: initialData?.specialization || '',
    levelCompleted: initialData?.levelCompleted || '',
    institution: initialData?.institution || '',
    graduationYear: getInitialGraduationYear(),
    isHighestQualification: initialData?.isHighestQualification || false,
    certificateUrl: initialData?.certificateUrl || '',
    qualificationStatus: initialData?.qualificationStatus || 'Completed',
    additionalDetails: initialData?.additionalDetails || '',
  };
  
  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues
  });

  const mutation = useMutation({
    mutationFn: async (values: EducationFormValues) => {
      // Process graduation year before sending
      let gradYear = null;
      if (values.graduationYear && values.graduationYear !== 'none') {
        gradYear = parseInt(values.graduationYear);
      }
      
      const payload = {
        ...values,
        youthId: youthId,
        graduationYear: gradYear
      };

      if (initialData?.id) {
        // Update existing record
        const res = await apiRequest("PATCH", `/api/education/${initialData.id}`, payload);
        return await res.json();
      } else {
        // Create new record
        const res = await apiRequest("POST", "/api/education", payload);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/education/${youthId}`] });
      toast({
        title: initialData ? "Education updated" : "Education added",
        description: initialData 
          ? "The education record has been updated successfully." 
          : "The education information has been added successfully.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save education record. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: EducationFormValues) => {
    console.log("Submitting education form with values:", values);
    mutation.mutate(values);
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="pr-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="qualificationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qualification Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select qualification type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {qualificationTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="qualificationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qualification Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Bachelor of Arts, CISCO Certification" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="levelCompleted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level Completed</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {educationLevels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization/Field of Study</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Area of specialization or concentration" 
                      {...field} 
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution/Organization</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Name of school or institution" 
                      {...field} 
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="graduationYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Graduation Year</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        {yearOptions.map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="qualificationStatus"
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
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Incomplete">Incomplete</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isHighestQualification"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>This is my highest qualification</FormLabel>
                    <FormDescription className="text-xs">
                      Mark this as your primary or highest educational qualification
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="certificateUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Link to certificate (if available)" 
                      {...field} 
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information about this qualification" 
                      {...field} 
                      value={field.value || ''} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <LoadingSpinner className="mr-2" />}
            {initialData ? 'Update' : 'Add'} Education
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

interface DeleteEducationDialogProps {
  educationId: number;
  educationName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteEducationDialog({ educationId, educationName, onConfirm, onCancel }: DeleteEducationDialogProps) {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-medium">Confirm Deletion</h3>
      <p>Are you sure you want to delete the education record: <span className="font-semibold">{educationName}</span>?</p>
      <p className="text-sm text-gray-500">This action cannot be undone.</p>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </div>
  );
}

interface EducationItemProps {
  education: Education;
  onEdit: (education: Education) => void;
  onDelete: (education: Education) => void;
}

export function EducationItem({ education, onEdit, onDelete }: EducationItemProps) {
  const statusColors = {
    "Completed": "bg-green-100 text-green-800 border-green-200",
    "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
    "Incomplete": "bg-gray-100 text-gray-800 border-gray-200"
  };
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case "Completed": 
        return <Check className="h-3 w-3 mr-1" />;
      case "In Progress":
      case "Incomplete":
      default:
        return <Clock className="h-3 w-3 mr-1" />;
    }
  };
  
  const status = education.qualificationStatus || "Incomplete";
  const statusClass = statusColors[status];

  return (
    <div className="bg-white rounded-lg border p-4 mb-4 relative">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-semibold">{education.qualificationName}</h3>
            {education.isHighestQualification && (
              <Badge className="ml-2 bg-amber-100 text-amber-800 border border-amber-200">
                <Award className="h-3 w-3 mr-1" />
                Highest
              </Badge>
            )}
          </div>
          
          <div className="text-sm text-gray-600 mb-1">
            <div className="flex items-center">
              <School className="h-4 w-4 mr-1 text-gray-500" />
              <span>{education.qualificationType}</span>
            </div>
          </div>
          
          {education.institution && (
            <div className="text-sm text-gray-600 mb-1">
              <BookOpen className="h-4 w-4 inline mr-1 text-gray-500" />
              {education.institution}
            </div>
          )}
          
          <div className="mt-3 flex flex-wrap gap-2">
            {education.specialization && (
              <span className="inline-flex text-xs bg-gray-100 text-gray-800 border border-gray-200 px-2 py-1 rounded">
                {education.specialization}
              </span>
            )}
            
            {education.levelCompleted && (
              <span className="inline-flex text-xs bg-purple-100 text-purple-800 border border-purple-200 px-2 py-1 rounded">
                {education.levelCompleted}
              </span>
            )}
            
            {education.graduationYear && (
              <span className="inline-flex items-center text-xs bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-1 rounded">
                <Calendar className="h-3 w-3 mr-1" />
                {education.graduationYear}
              </span>
            )}
            
            <span className={`inline-flex items-center text-xs px-2 py-1 rounded border ${statusClass}`}>
              {getStatusIcon(status)}
              {status}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-gray-900"
            onClick={() => onEdit(education)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-700"
            onClick={() => onDelete(education)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface EducationSectionProps {
  youthId: number;
  isEditable?: boolean;
}

export function EducationSection({ youthId, isEditable = false }: EducationSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEducation, setDeletingEducation] = useState<Education | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch education records for this youth
  const { data: educationRecords = [], isLoading, isError } = useQuery<Education[]>({
    queryKey: [`/api/education/${youthId}`],
    enabled: !!youthId,
    // Force refetch on component mount to ensure freshness
    refetchOnMount: true
  });
  
  // Mutation for deleting education
  const deleteEducationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/education/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/education/${youthId}`] });
      toast({
        title: "Education deleted",
        description: "The education record has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete education record. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle edit button click
  const handleEdit = (education: Education) => {
    setEditingEducation(education);
    setAddDialogOpen(true);
  };
  
  // Handle delete button click
  const handleDelete = (education: Education) => {
    setDeletingEducation(education);
    setDeleteDialogOpen(true);
  };
  
  // Handle delete confirmation
  const confirmDelete = () => {
    if (deletingEducation) {
      deleteEducationMutation.mutate(deletingEducation.id);
    }
  };
  
  return (
    <div className="mt-4">
      {isLoading ? (
        <div className="flex justify-center p-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : isError ? (
        <div className="text-center p-4 text-red-500">
          Failed to load education records. Please try again.
        </div>
      ) : (
        <div>
          {educationRecords.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              No education records found.
            </div>
          ) : (
            <div>
              {educationRecords.map(education => (
                <EducationItem 
                  key={education.id} 
                  education={education} 
                  onEdit={isEditable ? handleEdit : () => {}}
                  onDelete={isEditable ? handleDelete : () => {}}
                />
              ))}
            </div>
          )}
          
          {isEditable && (
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => {
                setEditingEducation(null);
                setAddDialogOpen(true);
              }}
            >
              + Add Education
            </Button>
          )}
        </div>
      )}
      
      {/* Add/Edit Education Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editingEducation ? 'Edit Education' : 'Add Education'}
            </DialogTitle>
          </DialogHeader>
          
          {addDialogOpen && (
            <EducationForm
              youthId={youthId}
              initialData={editingEducation || undefined}
              onSuccess={() => setAddDialogOpen(false)}
              onCancel={() => setAddDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          {deletingEducation && (
            <DeleteEducationDialog
              educationId={deletingEducation.id}
              educationName={deletingEducation.qualificationName}
              onConfirm={confirmDelete}
              onCancel={() => setDeleteDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}