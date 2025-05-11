import React, { useState, useRef } from "react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, FileText, X, Upload, GraduationCap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Certification } from "./certification-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const certificationFormSchema = z.object({
  certificationName: z.string().min(1, { message: "Certification name is required" }),
  issuingOrganization: z.string().optional(),
  issueDate: z.date().optional().nullable(),
  expiryDate: z.date().optional().nullable(),
  description: z.string().optional(),
  trainingProgram: z.string().optional(),
});

type CertificationFormData = z.infer<typeof certificationFormSchema>;

interface CertificationFormProps {
  youthId: number;
  certification?: Certification;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CertificationForm({ youthId, certification, onSuccess, onCancel }: CertificationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!certification;
  
  // Fetch training programs
  const { data: trainingPrograms = [], isLoading: isLoadingPrograms } = useQuery({
    queryKey: ["/api/training-programs"],
    queryFn: async () => {
      const res = await fetch("/api/training-programs", {
        credentials: 'include'
      });
      if (!res.ok) throw new Error("Failed to fetch training programs");
      return res.json();
    },
    placeholderData: [],
  });
  
  // Initialize the form with default values or existing certification data
  const form = useForm<CertificationFormData>({
    resolver: zodResolver(certificationFormSchema),
    defaultValues: {
      certificationName: certification?.certificationName || "",
      issuingOrganization: certification?.issuingOrganization || "",
      issueDate: certification?.issueDate ? new Date(certification.issueDate) : null,
      expiryDate: certification?.expiryDate ? new Date(certification.expiryDate) : null,
      description: certification?.description || "",
      trainingProgram: certification?.trainingProgram || "none",
    },
  });
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size should be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type (image or PDF)
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Only images or PDF files are allowed",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setRemoveFile(false);
    }
  };
  
  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (isEditMode && certification?.certificationUrl) {
      setRemoveFile(true);
    }
  };
  
  // Form submission handler for both create and update
  const submitMutation = useMutation({
    mutationFn: async (data: CertificationFormData) => {
      console.log("Submitting certification data:", data);
      
      // Create FormData to handle file uploads
      const formData = new FormData();
      
      // Add youthId directly to the formData
      formData.append('youthId', String(youthId));
      
      // Add form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'issueDate' || key === 'expiryDate') {
            // Format dates as ISO strings for the server
            formData.append(key, value instanceof Date ? value.toISOString() : '');
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      // Add file if selected
      if (selectedFile) {
        formData.append('certificateFile', selectedFile);
      }
      
      // If editing and removing file, add flag
      if (isEditMode && removeFile) {
        formData.append('removeFile', 'true');
      }
      
      // Determine endpoint and method
      let endpoint = `/api/youth/certifications/`;
      let method = 'POST';
      
      if (isEditMode && certification) {
        endpoint = `/api/youth/certifications/${certification.id}`;
        method = 'PATCH';
      }
      
      console.log("Sending request to:", endpoint, "with method:", method);
      
      // Log formData for debugging
      try {
        // Convert FormData entries to array first for better compatibility
        const entries = Array.from(formData.entries());
        entries.forEach(pair => {
          console.log(`${pair[0]}: ${pair[1]}`);
        });
      } catch (error) {
        console.error("Error logging form data:", error);
      }
      
      // Send request
      const response = await fetch(endpoint, {
        method,
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        throw new Error(`Request failed: ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Certification saved successfully:", data);
      
      // Invalidate and refetch certifications
      queryClient.invalidateQueries({ queryKey: [`/api/youth/certifications/${youthId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/youth/profiles/${youthId}`] });
      
      toast({
        title: isEditMode ? "Certification Updated" : "Certification Added",
        description: isEditMode 
          ? "The certification has been updated successfully." 
          : "A new certification has been added successfully.",
        variant: "default",
      });
      
      onSuccess();
    },
    onError: (error: Error) => {
      console.error("Certification save error:", error);
      
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'add'} certification: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Submit handler
  const onSubmit = (data: CertificationFormData) => {
    submitMutation.mutate(data);
  };
  
  return (
    <div className="space-y-4 p-4 border rounded-md bg-card">
      <h3 className="text-lg font-semibold">
        {isEditMode ? "Edit Certification" : "Add New Certification"}
      </h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Certification Name */}
          <FormField
            control={form.control}
            name="certificationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Certificate Name*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., DARE Core Skills Certificate" {...field} />
                </FormControl>
                <FormDescription>
                  Enter the title of the certification
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Issuing Organization */}
          <FormField
            control={form.control}
            name="issuingOrganization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issuing Organization</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., DARE Program" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>
                  Enter the name of the organization that issued the certificate
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Training Program - Select */}
          <FormField
            control={form.control}
            name="trainingProgram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Training Program</FormLabel>
                <Select
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={isLoadingPrograms}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a training program" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">
                      None
                    </SelectItem>
                    {trainingPrograms && trainingPrograms.map((program: any) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Specify which training program this certificate is for
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Issue Date */}
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Issue Date</FormLabel>
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
                <FormDescription>
                  When was the certificate issued
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Expiry Date */}
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expiry Date</FormLabel>
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
                <FormDescription>
                  When does the certificate expire (if applicable)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional details about the certification..." 
                    {...field} 
                    value={field.value || ''} 
                    className="h-24"
                  />
                </FormControl>
                <FormDescription>
                  Enter any additional details about the certification
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Certificate File Upload */}
          <div className="space-y-2">
            <FormLabel>Certificate File</FormLabel>
            <div className="flex flex-col gap-2">
              {isEditMode && certification?.certificationUrl && !removeFile && !selectedFile ? (
                <div className="flex items-center justify-between p-2 border rounded-md bg-blue-50">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="text-sm">Existing certificate file</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSelectedFile}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : selectedFile ? (
                <div className="flex items-center justify-between p-2 border rounded-md bg-blue-50">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSelectedFile}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex items-center">
                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/gif,application/pdf"
                    className="hidden"
                    id="certificateFile"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {isEditMode ? 'Upload New File' : 'Upload Certificate'}
                  </Button>
                  <span className="text-xs text-muted-foreground ml-2">
                    Images or PDF, max 10MB
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  {isEditMode ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>{isEditMode ? 'Update' : 'Save'}</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}