import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Plus, Check, Award, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useState } from "react";

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

// Define types for certifications
interface Certification {
  id: number;
  youthId: number;
  certificationName: string;
  issuingOrganization: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// Define validation schema for adding/editing certification
const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuingOrganization: z.string().nullable().optional(),
  issueDate: z.date().nullable().optional(),
  expiryDate: z.date().nullable().optional(),
  credentialID: z.string().nullable().optional(),
  verificationUrl: z.string().nullable().optional(), // Removed URL validation to allow text input
  description: z.string().nullable().optional(),
});

type CertificationFormValues = z.infer<typeof certificationSchema>;

interface CertificationFormProps {
  youthId: number;
  onSuccess: () => void;
  initialData?: Certification;
  onCancel: () => void;
}

function CertificationForm({ youthId, onSuccess, initialData, onCancel }: CertificationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationSchema),
    defaultValues: initialData ? {
      name: initialData.certificationName,
      issuingOrganization: initialData.issuingOrganization || "",
      issueDate: initialData.issueDate ? parseISO(initialData.issueDate) : undefined,
      expiryDate: initialData.expiryDate ? parseISO(initialData.expiryDate) : undefined,
      credentialID: initialData.credentialId || "",
      verificationUrl: initialData.credentialUrl || "",
      description: initialData.description || "",
    } : {
      name: "",
      issuingOrganization: "",
      issueDate: new Date(),
      expiryDate: undefined,
      credentialID: "",
      verificationUrl: "",
      description: "",
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: CertificationFormValues) => {
      const payload = {
        certificationName: values.name,
        issuingOrganization: values.issuingOrganization,
        issueDate: values.issueDate,
        expiryDate: values.expiryDate,
        credentialId: values.credentialID,
        credentialUrl: values.verificationUrl,
        description: values.description,
        youthId,
      };

      if (initialData) {
        // Update existing record
        const res = await apiRequest("PATCH", `/api/youth/certifications/${initialData.id}`, payload);
        return res.json();
      } else {
        // Create new record
        const res = await apiRequest("POST", `/api/youth/certifications/${youthId}`, payload);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/youth/certifications/${youthId}`] });
      toast({
        title: initialData ? "Certification updated" : "Certification added",
        description: initialData 
          ? "The certification has been updated successfully." 
          : "The certification has been added successfully.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save certification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CertificationFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Certification Name*</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Project Management Professional (PMP)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="issuingOrganization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Issuing Organization</FormLabel>
              <FormControl>
                <Input placeholder="e.g. PMI, Microsoft, Google" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expiry Date (if applicable)</FormLabel>
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
                          <span>No expiry date</span>
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
          name="credentialID"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credential ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g. ABC-123456" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="verificationUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Reference/URL</FormLabel>
              <FormControl>
                <Input placeholder="Enter reference number or URL..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of the certification"
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
            {initialData ? "Update" : "Add"} Certification
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

interface CertificationsSectionProps {
  youthId: number;
  isEditable?: boolean;
}

export function CertificationsSection({ youthId, isEditable = false }: CertificationsSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch certifications
  const { data: certifications = [], isLoading } = useQuery({
    queryKey: [`/api/youth/certifications/${youthId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/youth/certifications/${youthId}`);
      return await res.json();
    },
  });

  // Delete certification mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/youth/certifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/youth/certifications/${youthId}`] });
      toast({
        title: "Certification deleted",
        description: "The certification has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete certification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this certification?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-xl">Certifications</CardTitle>
        {isEditable && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Certification</DialogTitle>
              </DialogHeader>
              <CertificationForm
                youthId={youthId}
                onSuccess={() => setIsAddDialogOpen(false)}
                onCancel={() => setIsAddDialogOpen(false)}
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
        ) : certifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No certifications found.
          </div>
        ) : (
          <div className="space-y-4">
            {certifications.map((cert: Certification) => (
              <div key={cert.id} className="border rounded-md p-4">
                <div className="flex items-start">
                  <Award className="h-5 w-5 mr-3 mt-1 text-primary" />
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="font-medium text-lg">{cert.certificationName}</h3>
                      <div className="flex flex-wrap gap-2">
                        {cert.issueDate && (
                          <Badge variant="outline">
                            Issued: {format(new Date(cert.issueDate), "MMM yyyy")}
                          </Badge>
                        )}
                        {cert.expiryDate && (
                          <Badge 
                            variant="outline" 
                            className={
                              new Date(cert.expiryDate) < new Date() 
                                ? "bg-red-100 text-red-800 border-red-300" 
                                : ""
                            }
                          >
                            Expires: {format(new Date(cert.expiryDate), "MMM yyyy")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {cert.issuingOrganization && (
                      <p className="text-sm text-muted-foreground">
                        Issued by: {cert.issuingOrganization}
                      </p>
                    )}

                    {cert.credentialId && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">Credential ID:</span> {cert.credentialId}
                      </p>
                    )}

                    {cert.description && (
                      <p className="text-sm mt-2">{cert.description}</p>
                    )}

                    {cert.credentialUrl && (
                      <div className="mt-2">
                        {cert.credentialUrl.startsWith('http') ? (
                          <a 
                            href={cert.credentialUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Verify Credential
                          </a>
                        ) : (
                          <p className="text-sm">
                            <span className="font-medium">Verification Reference:</span> {cert.credentialUrl}
                          </p>
                        )}
                      </div>
                    )}

                    {isEditable && (
                      <div className="flex justify-end mt-4 pt-2 border-t">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setEditingCertification(cert)}
                            >
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit Certification</DialogTitle>
                            </DialogHeader>
                            {editingCertification && (
                              <CertificationForm
                                youthId={youthId}
                                initialData={editingCertification}
                                onSuccess={() => setEditingCertification(null)}
                                onCancel={() => setEditingCertification(null)}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="ml-2"
                          onClick={() => handleDelete(cert.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}