import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
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
import { Trash2, Edit2, Plus, Award, FileText, File, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

export default function CertificationManager({ youthId }: CertificationManagerProps) {
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
    data: certificates,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/youth/certifications", youthId],
    queryFn: async () => {
      const res = await fetch(`/api/youth/certifications/${youthId}`);
      if (!res.ok) throw new Error("Failed to load certificates");
      return res.json();
    },
  });

  // Fetch training programs for dropdown options
  const { data: trainingPrograms } = useQuery({
    queryKey: ["/api/training-programs"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/training-programs");
        if (!res.ok) throw new Error("Failed to load training programs");
        return res.json();
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
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'skills' && Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Append file if selected
      if (certificateFile) {
        formData.append("certificateFile", certificateFile);
      }

      // Use the apiRequest utility to ensure credentials are included
      const response = await fetch(`/api/youth/certifications/${youthId}`, {
        method: "POST",
        body: formData,
        credentials: 'include' // Add credentials to include cookies
      });

      if (!response.ok) {
        console.error("Failed to add certificate:", await response.text());
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || "Failed to add certificate");
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
      addForm.reset();
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
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'skills' && Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

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
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update certificate");
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
      editForm.reset();
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

      const response = await fetch(`/api/youth/certifications/${selectedCertificate.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete certificate");
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
      trainingProgram: certificate.trainingProgram || "",
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
  const getTrainingProgramName = (programId: string | null | undefined) => {
    if (!programId || !trainingPrograms) return "N/A";
    const program = trainingPrograms.find((p: any) => p.id.toString() === programId || p.name === programId);
    return program ? program.name : programId;
  };

  if (isLoading) {
    return <div className="p-4">Loading certifications...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          Error loading certifications: {error instanceof Error ? error.message : "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Certifications &amp; Credentials</h3>
        <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Certificate
        </Button>
      </div>

      {certificates && certificates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {certificates.map((certificate: any) => (
            <Card key={certificate.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-md flex items-center">
                      <Award className="h-4 w-4 mr-2 text-blue-500" />
                      {certificate.certificationName}
                    </CardTitle>
                    <CardDescription>{certificate.issuingOrganization || "No organization specified"}</CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(certificate)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedCertificate(certificate);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Training Program</p>
                    <p>{getTrainingProgramName(certificate.trainingProgram)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Credential ID</p>
                    <p>{certificate.credentialId || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Issue Date</p>
                    <p>{formatDate(certificate.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Expiry Date</p>
                    <p>{formatDate(certificate.expiryDate)}</p>
                  </div>
                </div>

                {certificate.skills && certificate.skills.length > 0 && (
                  <div className="mt-3">
                    <p className="text-gray-500 font-medium mb-1">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {certificate.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="outline" className="bg-gray-100">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              {certificate.credentialUrl && (
                <CardFooter className="pt-0 pb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.open(certificate.credentialUrl, '_blank')}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View Certificate
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-4 border rounded-md bg-gray-50">
          <p className="text-gray-500">No certifications added yet.</p>
        </div>
      )}

      {/* Add Certificate Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Certificate</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit((data) => addCertificateMutation.mutate(data))} className="space-y-4">
              <FormField
                control={addForm.control}
                name="certificationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate Name*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Digital Marketing Certification" />
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
                      <Input {...field} placeholder="e.g., Google" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <FormLabel>Expiry Date</FormLabel>
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
                    <FormLabel>Credential ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., ABC123XYZ" />
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
                        <SelectItem value="">None</SelectItem>
                        {trainingPrograms && trainingPrograms.map((program: any) => (
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
                <FormLabel>Certificate File (PDF or Image)</FormLabel>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileChange}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addCertificateMutation.isPending}>
                  {addCertificateMutation.isPending ? "Adding..." : "Add Certificate"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Certificate Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Certificate</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => editCertificateMutation.mutate(data))} className="space-y-4">
              <FormField
                control={editForm.control}
                name="certificationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate Name*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Digital Marketing Certification" />
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
                      <Input {...field} placeholder="e.g., Google" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <FormLabel>Expiry Date</FormLabel>
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
                    <FormLabel>Credential ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., ABC123XYZ" />
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
                        <SelectItem value="">None</SelectItem>
                        {trainingPrograms && trainingPrograms.map((program: any) => (
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
                <div className="space-y-2">
                  {selectedCertificate && selectedCertificate.credentialUrl && !removeFile ? (
                    <div className="flex items-center space-x-2">
                      <File className="h-5 w-5 text-blue-500" />
                      <span className="text-sm">Current file: Certificate Document</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-red-500"
                        onClick={() => setRemoveFile(true)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileChange}
                    />
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editCertificateMutation.isPending}>
                  {editCertificateMutation.isPending ? "Updating..." : "Update Certificate"}
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
            <DialogTitle>Delete Certificate</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete the certificate "
              {selectedCertificate?.certificationName}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteCertificateMutation.mutate()}
              disabled={deleteCertificateMutation.isPending}
            >
              {deleteCertificateMutation.isPending ? "Deleting..." : "Delete Certificate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}