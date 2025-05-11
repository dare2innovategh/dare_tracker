import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { PlusCircle, Award, AlertCircle, Loader2 } from "lucide-react";
import CertificationCard, { Certification } from "./certification-card";
import CertificationForm from "./certification-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";

interface CertificationsTabProps {
  profileId: number;
}

export default function CertificationsTab({ profileId }: CertificationsTabProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<Certification | undefined>(undefined);
  
  // Fetch certifications for this youth profile
  const { 
    data: certifications, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: [`/api/youth/certifications/${profileId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/youth/certifications/${profileId}`);
      return await response.json() as Certification[];
    }
  });
  
  // Handle editing a certification
  const handleEditCertification = (certification: Certification) => {
    setSelectedCertification(certification);
    setShowForm(true);
  };
  
  // Handle adding a new certification
  const handleAddCertification = () => {
    setSelectedCertification(undefined);
    setShowForm(true);
  };
  
  // Handle form success
  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedCertification(undefined);
  };
  
  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedCertification(undefined);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
        <span className="ml-2 text-muted-foreground">Loading certifications...</span>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load certifications: {error instanceof Error ? error.message : "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold flex items-center text-primary">
          <Award className="h-5 w-5 mr-2" />
          Certifications
        </h3>
        {!showForm && (
          <Button 
            onClick={handleAddCertification} 
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add Certification
          </Button>
        )}
      </div>
      
      {showForm ? (
        <CertificationForm 
          youthId={profileId} 
          certification={selectedCertification}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      ) : (
        <div>
          {certifications && certifications.length > 0 ? (
            <ScrollArea className="h-[450px] pr-4">
              {certifications.map((certification) => (
                <CertificationCard 
                  key={certification.id}
                  certification={certification}
                  onEdit={handleEditCertification}
                />
              ))}
            </ScrollArea>
          ) : (
            <Alert className="bg-blue-50 text-blue-800 border-blue-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Certifications</AlertTitle>
              <AlertDescription>
                This youth profile doesn't have any certifications yet. 
                Add a certification by clicking the button above.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}