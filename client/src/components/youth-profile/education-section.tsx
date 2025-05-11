import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { GraduationCap, Plus, Trash2, Loader2, Calendar, Award, BookOpen, School, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Define LoadingSpinner component 
function LoadingSpinner({ className, ...props }: { className?: string, [key: string]: any }) {
  return (
    <Loader2 
      className={cn("h-4 w-4 animate-spin", className)} 
      aria-hidden="true"
      {...props}
    />
  );
}

// Interface aligned with our database schema
interface Education {
  id: number;
  youthId: number;
  qualificationType: string;
  qualificationName: string;
  specialization: string | null;
  levelCompleted: string | null;
  institution: string | null;
  graduationYear: number | null;
  isHighestQualification: boolean;
  certificateUrl: string | null;
  qualificationStatus: 'Completed' | 'In Progress' | 'Incomplete';
  additionalDetails: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// Define qualification types
const qualificationTypes = [
  "Highest Academic",
  "Professional Certification",
  "Technical Training",
  "Vocational Training",
  "Short Course",
  "Workshop",
  "Online Course",
  "Other"
];

// Define education levels
const educationLevels = [
  "Primary School",
  "Junior High School",
  "Senior High School",
  "Certificate",
  "Diploma",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Other"
];

// Create a fresh education schema based on our database structure
const educationSchema = z.object({
  qualificationType: z.string().min(1, "Qualification type is required"),
  qualificationName: z.string().min(1, "Qualification name is required"),
  specialization: z.string().nullable().optional(),
  levelCompleted: z.string().nullable().optional(), 
  institution: z.string().nullable().optional(),
  // Handle graduation year as string in the form, but transform to number for DB
  graduationYear: z.string()
    .transform(val => {
      if (!val || val === 'none' || val.trim() === '') return null;
      const year = parseInt(val, 10);
      return isNaN(year) ? null : year;
    }),
  isHighestQualification: z.boolean().default(false),
  certificateUrl: z.string().nullable().optional(),
  qualificationStatus: z.enum(['Completed', 'In Progress', 'Incomplete']).default('Completed'),
  additionalDetails: z.string().nullable().optional(),
});

type EducationFormValues = z.infer<typeof educationSchema>;

interface EducationFormProps {
  youthId: number;
  onSuccess: () => void;
  initialData?: Education;
  onCancel: () => void;
}

function EducationForm({ youthId, onSuccess, initialData, onCancel }: EducationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create default values
  // Initialize form values
  const getInitialGraduationYear = () => {
    // If we have graduation year data, convert to string
    if (initialData?.graduationYear) {
      return initialData.graduationYear.toString();
    }
    // Otherwise use 'none' as default
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
      const payload = {
        ...values,
        youthId: youthId,
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
      queryClient.invalidateQueries({ queryKey: ['/api/education', youthId] });
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
    // Process form data properly before submission
    const formattedValues = {
      ...values,
      // Convert graduation year from string to number if it's not 'none'
      graduationYear: values.graduationYear === 'none' 
        ? null 
        : parseInt(values.graduationYear)
    };
    
    console.log("Submitting education form with values:", formattedValues);
    mutation.mutate(formattedValues);
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
                  defaultValue={field.value?.toString() || ""}
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
                  checked={field.value}
                  onCheckedChange={field.onChange}
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

function DeleteEducationDialog({ educationId, educationName, onConfirm, onCancel }: DeleteEducationDialogProps) {
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

function EducationItem({ education, onEdit, onDelete }: EducationItemProps) {
  const statusColors = {
    "Completed": "bg-green-100 text-green-800 border-green-200",
    "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
    "Incomplete": "bg-gray-100 text-gray-800 border-gray-200"
  };
  
  const statusIcons = {
    "Completed": <Check className="h-3 w-3 mr-1" />,
    "In Progress": <Clock className="h-3 w-3 mr-1" />,
    "Incomplete": <Clock className="h-3 w-3 mr-1" />
  };
  
  const statusClass = statusColors[education.qualificationStatus] || statusColors["Incomplete"];

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
              {statusIcons[education.qualificationStatus]}
              {education.qualificationStatus}
            </span>
          </div>
          
          {education.additionalDetails && (
            <div className="mt-2 text-sm text-gray-600">
              <p>{education.additionalDetails}</p>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(education)}
            className="h-8 w-8"
          >
            <span className="sr-only">Edit</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(education)}
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <span className="sr-only">Delete</span>
            <Trash2 className="h-4 w-4" />
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
  const [deletingEducation, setDeletingEducation] = useState<Education | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: educationRecords, isLoading, isError } = useQuery<Education[]>({
    queryKey: ['/api/education', youthId],
    queryFn: async () => {
      const response = await fetch(`/api/education/${youthId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch education records');
      }
      return response.json();
    },
    enabled: !!youthId,
  });

  const deleteEducationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/education/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/education', youthId] });
      toast({
        title: 'Education deleted',
        description: 'The education record has been deleted successfully.',
      });
      setDeleteDialogOpen(false);
      setDeletingEducation(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete education record. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (education: Education) => {
    setEditingEducation(education);
    setAddDialogOpen(true);
  };

  const handleDelete = (education: Education) => {
    setDeletingEducation(education);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingEducation) {
      deleteEducationMutation.mutate(deletingEducation.id);
    }
  };

  const resetDialogs = () => {
    setAddDialogOpen(false);
    setEditingEducation(null);
    setDeleteDialogOpen(false);
    setDeletingEducation(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center">
          <GraduationCap className="mr-2 h-5 w-5" />
          Education & Qualifications
        </CardTitle>
        {isEditable && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-1" />
                Add Education
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingEducation ? 'Edit Education' : 'Add Education'}
                </DialogTitle>
              </DialogHeader>
              <EducationForm
                youthId={youthId}
                initialData={editingEducation || undefined}
                onSuccess={() => setAddDialogOpen(false)}
                onCancel={() => setAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        ) : isError ? (
          <div className="text-center p-4 text-red-500">
            Failed to load education records. Please try again.
          </div>
        ) : educationRecords && educationRecords.length > 0 ? (
          <div className="space-y-2">
            {educationRecords.map((education) => (
              <EducationItem
                key={education.id}
                education={education}
                onEdit={isEditable ? handleEdit : () => {}}
                onDelete={isEditable ? handleDelete : () => {}}
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-4 text-gray-500">
            No education records added yet.
            {isEditable && (
              <p className="mt-1 text-sm">
                Click "Add Education" to add your educational qualifications.
              </p>
            )}
          </div>
        )}
      </CardContent>

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
    </Card>
  );
}