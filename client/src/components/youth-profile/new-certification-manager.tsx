import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, Edit2, Plus, Award, FileText, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Loader2 } from "lucide-react";

// Define the form schema for adding/editing certificates
const certificateFormSchema = z.object({
  certificationName: z.string().min(1, "Certification name is required"),
  issuingOrganization: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  trainingProgram: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

type CertificateFormValues = z.infer<typeof certificateFormSchema>;

// Define props for the CertificationManager component
interface CertificationManagerProps {
  youthId: number;
}

export default function NewCertificationManager({ youthId }: CertificationManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);

  // Fetch certificates
  const {
    data: certificates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/youth/certifications", youthId],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/youth/certifications/${youthId}`);
        if (!res.ok) throw new Error("Failed to load certificates");
        return await res.json();
      } catch (error) {
        console.error("Error loading certificates:", error);
        return [];
      }
    },
  });

  // Fetch training programs for dropdown options
  const { data: trainingPrograms = [] } = useQuery({
    queryKey: ["/api/training-programs"],
    queryFn: async () => {
      try {
        // First try the authenticated endpoint
        const res = await apiRequest("GET", "/api/training/programs");
        if (res.ok) {
          console.log("Loaded training programs from authenticated endpoint");
          return await res.json();
        }
        
        // Fall back to the non-authenticated endpoint
        console.log("Falling back to non-authenticated training programs endpoint");
        const fallbackRes = await fetch("/api/training-programs");
        if (!fallbackRes.ok) throw new Error("Failed to load training programs");
        return await fallbackRes.json();
      } catch (error) {
        console.error("Error loading training programs:", error);
        return [];
      }
    },
  });

  // Form for adding new certificates
  const addForm = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateFormSchema),
    defaultValues: {
      certificationName: "",
      issuingOrganization: "",
      issueDate: "",
      expiryDate: "",
      credentialId: "",
      trainingProgram: "",
      skills: [],
    },
  });

  // Form for editing certificates
  const editForm = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateFormSchema),
    defaultValues: {
      certificationName: "",
      issuingOrganization: "",
      issueDate: "",
      expiryDate: "",
      credentialId: "",
      trainingProgram: "",
      skills: [],
    },
  });

  // Add certificate mutation
  const addCertificateMutation = useMutation({
    mutationFn: async (data: CertificateFormValues) => {
      const formData = new FormData();
      
      // Add all form fields to the FormData
      formData.append("certificationName", data.certificationName);
      
      if (data.issuingOrganization) {
        formData.append("issuingOrganization", data.issuingOrganization);
      }
      
      if (data.issueDate) {
        formData.append("issueDate", data.issueDate);
      }
      
      if (data.expiryDate) {
        formData.append("expiryDate", data.expiryDate);
      }
      
      if (data.credentialId) {
        formData.append("credentialId", data.credentialId);
      }
      
      if (data.trainingProgram && data.trainingProgram !== "") {
        formData.append("trainingProgram", data.trainingProgram);
      }
      
      if (data.skills && data.skills.length > 0) {
        formData.append("skills", JSON.stringify(data.skills));
      }

      // Append file if selected
      if (certificateFile) {
        formData.append("certificateFile", certificateFile);
      }

      const response = await fetch(`/api/youth/certifications/${youthId}`, {
        method: "POST",
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        console.error("Failed to add certificate, status:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || "Failed to add certificate");
        } catch (e) {
          throw new Error("Failed to add certificate: " + errorText);
        }
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certificate Added",
        description: "The certificate has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/youth/certifications", youthId] });
      setIsAddDialogOpen(false);
      addForm.reset({
        certificationName: "",
        issuingOrganization: "",
        issueDate: "",
        expiryDate: "",
        credentialId: "",
        trainingProgram: "",
        skills: [],
      });
      setCertificateFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Adding Certificate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit certificate mutation
  const editCertificateMutation = useMutation({
    mutationFn: async (data: CertificateFormValues) => {
      if (!selectedCertificate) throw new Error("No certificate selected for editing");

      const formData = new FormData();
      
      // Add all form fields to the FormData
      formData.append("certificationName", data.certificationName);
      
      if (data.issuingOrganization) {
        formData.append("issuingOrganization", data.issuingOrganization);
      }
      
      if (data.issueDate) {
        formData.append("issueDate", data.issueDate);
      }
      
      if (data.expiryDate) {
        formData.append("expiryDate", data.expiryDate);
      }
      
      if (data.credentialId) {
        formData.append("credentialId", data.credentialId);
      }
      
      if (data.trainingProgram && data.trainingProgram !== "") {
        formData.append("trainingProgram", data.trainingProgram);
      }
      
      if (data.skills && data.skills.length > 0) {
        formData.append("skills", JSON.stringify(data.skills));
      }

      // Append file if selected
      if (certificateFile) {
        formData.append("certificateFile", certificateFile);
      }

      // If removeFile is true, add it to form data
      if (removeFile) {
        formData.append("removeFile", "true");
      }

      const response = await fetch(`/api/youth/certifications/${selectedCertificate.id}`, {
        method: "PATCH",
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        console.error("Failed to update certificate, status:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || "Failed to update certificate");
        } catch (e) {
          throw new Error("Failed to update certificate: " + errorText);
        }
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certificate Updated",
        description: "The certificate has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/youth/certifications", youthId] });
      setIsEditDialogOpen(false);
      editForm.reset({
        certificationName: "",
        issuingOrganization: "",
        issueDate: "",
        expiryDate: "",
        credentialId: "",
        trainingProgram: "",
        skills: [],
      });
      setCertificateFile(null);
      setRemoveFile(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Certificate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete certificate mutation
  const deleteCertificateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCertificate) throw new Error("No certificate selected for deletion");

      const response = await apiRequest("DELETE", `/api/youth/certifications/${selectedCertificate.id}`);

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || "Failed to delete certificate");
        } catch (e) {
          throw new Error("Failed to delete certificate: " + errorText);
        }
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certificate Deleted",
        description: "The certificate has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/youth/certifications", youthId] });
      setIsDeleteDialogOpen(false);
      setSelectedCertificate(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Certificate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle file selection for adding/editing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCertificateFile(e.target.files[0]);
      setRemoveFile(false); // Reset removeFile when new file is selected
    }
  };

  // Open edit dialog and populate form with certificate data
  const handleEditClick = (certificate: any) => {
    setSelectedCertificate(certificate);

    // Prepare form values for edit
    const formValues = {
      certificationName: certificate.certificationName || "",
      issuingOrganization: certificate.issuingOrganization || "",
      issueDate: certificate.issueDate ? new Date(certificate.issueDate).toISOString().split('T')[0] : "",
      expiryDate: certificate.expiryDate ? new Date(certificate.expiryDate).toISOString().split('T')[0] : "",
      credentialId: certificate.credentialId || "",
      trainingProgram: certificate.trainingProgram?.toString() || "",
      skills: Array.isArray(certificate.skills) ? certificate.skills : [],
    };

    // Reset the form and set values
    editForm.reset(formValues);
    setRemoveFile(false);
    setCertificateFile(null);
    setIsEditDialogOpen(true);
  };

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return "Invalid Date";
    }
  };

  // Find training program name from id
  const getTrainingProgramName = (programId: string | number | null | undefined) => {
    if (!programId || !trainingPrograms || programId === "") return "N/A";
    
    // Convert programId to string for comparison
    const programIdStr = programId.toString();
    
    const program = trainingPrograms.find((p: any) => 
      p.id?.toString() === programIdStr || 
      p.name === programIdStr ||
      p.id === parseInt(programIdStr, 10)
    );
    
    return program ? program.name : "Unknown Program";
  };

  // Handle form submission for adding a certificate
  const onAddCertificate = (data: CertificateFormValues) => {
    addCertificateMutation.mutate(data);
  };

  // Handle form submission for editing a certificate
  const onEditCertificate = (data: CertificateFormValues) => {
    editCertificateMutation.mutate(data);
  };

  // Handle clicking the delete button
  const handleDeleteClick = (certificate: any) => {
    setSelectedCertificate(certificate);
    setIsDeleteDialogOpen(true);
  };

  // Confirm deletion
  const confirmDelete = () => {
    deleteCertificateMutation.mutate();
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center">
            <Award className="mr-2 h-5 w-5 text-primary" />
            Certifications
          </CardTitle>
          <CardDescription>
            Manage professional certifications and credentials
          </CardDescription>
        </div>
        
        <div className="flex items-center space-x-2">
          <RefreshButton 
            queryKeys={["/api/youth/certifications", `/api/youth/certifications/${youthId}`, "/api/training-programs", "/api/training/programs"]}
            label="Refresh"
            size="sm"
          />
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load certificates. Please try refreshing.
            </AlertDescription>
          </Alert>
        ) : certificates.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-md">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-1">No Certifications</h3>
            <p className="text-muted-foreground mb-4">
              This youth profile doesn't have any certifications yet.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add a certification
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {certificates.map((certificate: any) => (
              <div
                key={certificate.id}
                className="border rounded-lg p-4 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{certificate.certificationName}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 mt-2">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Issuing Organization</span>
                        <span>{certificate.issuingOrganization || "N/A"}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Training Program</span>
                        <span>{getTrainingProgramName(certificate.trainingProgram)}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Issue Date</span>
                        <span>{formatDate(certificate.issueDate)}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Expiry Date</span>
                        <span>{formatDate(certificate.expiryDate)}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Credential ID</span>
                        <span>{certificate.credentialId || "N/A"}</span>
                      </div>
                    </div>
                    
                    {certificate.skills && certificate.skills.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm text-muted-foreground block mb-1">Skills</span>
                        <div className="flex flex-wrap gap-1">
                          {certificate.skills.map((skill: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {certificate.certificateUrl && (
                      <div className="mt-3">
                        <a
                          href={certificate.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Certificate
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex ml-4 space-x-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditClick(certificate)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteClick(certificate)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Certificate Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Certification</DialogTitle>
          </DialogHeader>

          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddCertificate)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="certificationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Project Management Professional (PMP)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="issuingOrganization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuing Organization</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Project Management Institute" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (if applicable)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addForm.control}
                name="credentialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential ID (if applicable)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. ABC123456" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="trainingProgram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Training Program</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a training program" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {trainingPrograms.map((program: any) => (
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

              <div className="space-y-2">
                <FormLabel>Certificate File (if available)</FormLabel>
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                />
                {certificateFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected file: {certificateFile.name}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addCertificateMutation.isPending}
                >
                  {addCertificateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Certificate"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Certificate Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Certification</DialogTitle>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditCertificate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="certificationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Project Management Professional (PMP)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="issuingOrganization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuing Organization</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Project Management Institute" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (if applicable)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="credentialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential ID (if applicable)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. ABC123456" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="trainingProgram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Training Program</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a training program" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {trainingPrograms.map((program: any) => (
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

              <div className="space-y-2">
                <FormLabel>Certificate File</FormLabel>
                {selectedCertificate?.certificateUrl ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={selectedCertificate.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View current file
                    </a>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRemoveFile(!removeFile)}
                    >
                      {removeFile ? "Keep file" : "Remove file"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No file currently uploaded</p>
                )}
                
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                />
                {certificateFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected new file: {certificateFile.name}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editCertificateMutation.isPending}
                >
                  {editCertificateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Certificate"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Certification</DialogTitle>
          </DialogHeader>
          
          <div className="py-3">
            <p>
              Are you sure you want to delete the certification "{selectedCertificate?.certificationName}"?
              This action cannot be undone.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteCertificateMutation.isPending}
            >
              {deleteCertificateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}