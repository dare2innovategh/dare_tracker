import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Award, 
  Calendar, 
  Building2, 
  FileText, 
  Clock, 
  GraduationCap, 
  Download,
  Edit, 
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { format, isAfter } from "date-fns";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface Certification {
  id: number;
  youthId: number;
  certificationName: string;
  issuingOrganization: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  certificationUrl: string | null;
  description: string | null;
  trainingProgram: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface CertificationCardProps {
  certification: Certification;
  onEdit: (certification: Certification) => void;
}

export default function CertificationCard({ certification, onEdit }: CertificationCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Check if certification is expired
  const isExpired = certification.expiryDate 
    ? isAfter(new Date(), new Date(certification.expiryDate)) 
    : false;
  
  // Delete certification mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/youth/certifications/${certification.id}`);
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch certifications
      queryClient.invalidateQueries({ queryKey: [`/api/youth/certifications/${certification.youthId}`] });
      
      toast({
        title: "Certification Deleted",
        description: "The certification has been deleted successfully.",
        variant: "default",
      });
      
      // Close the confirmation dialog
      setConfirmDelete(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete certification: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle delete
  const handleDelete = () => {
    deleteMutation.mutate();
  };
  
  return (
    <Card className="mb-4 overflow-hidden border-l-4 border-l-blue-500">
      <CardHeader className="bg-blue-50 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-lg text-blue-900">
              {certification.certificationName}
            </h3>
          </div>
          
          {isExpired && (
            <Badge variant="destructive" className="ml-2">
              Expired
            </Badge>
          )}
        </div>
        
        {certification.issuingOrganization && (
          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
            <Building2 className="h-4 w-4 text-gray-500" />
            <span>{certification.issuingOrganization}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {certification.issueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <span className="text-xs text-gray-500">Issue Date:</span>
                  <span className="ml-1 text-sm">
                    {format(new Date(certification.issueDate), 'PPP')}
                  </span>
                </div>
              </div>
            )}
            
            {certification.expiryDate && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <span className="text-xs text-gray-500">Expiry Date:</span>
                  <span className="ml-1 text-sm">
                    {format(new Date(certification.expiryDate), 'PPP')}
                  </span>
                </div>
              </div>
            )}
            
            {certification.trainingProgram && (
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                <div>
                  <span className="text-xs text-gray-500">Training Program:</span>
                  <span className="ml-1 text-sm">{certification.trainingProgram}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {certification.description && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-blue-600 mt-1" />
                <div>
                  <span className="text-xs text-gray-500">Description:</span>
                  <p className="text-sm">{certification.description}</p>
                </div>
              </div>
            )}
            
            {certification.certificationUrl && (
              <div className="flex items-center gap-2">
                <div className="flex mt-2 gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 h-8"
                          asChild
                        >
                          <a 
                            href={certification.certificationUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View certificate</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 h-8"
                          asChild
                        >
                          <a 
                            href={certification.certificationUrl} 
                            download
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Download certificate</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="p-2 bg-gray-50 flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600"
          onClick={() => onEdit(certification)}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        
        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-red-600"
            >
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Certification</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this certification? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will permanently remove '{certification.certificationName}' from this youth profile.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}