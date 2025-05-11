import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import MakerspaceForm from "@/components/makerspace/makerspace-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Makerspace, InsertMakerspace } from "@shared/schema";

export default function MakerspaceEditPage() {
  const { id } = useParams<{ id: string }>();
  const makerspaceId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch makerspace data
  const { 
    data: makerspace, 
    isLoading: isLoadingMakerspace, 
    error: fetchError 
  } = useQuery<Makerspace>({
    queryKey: [`/api/makerspaces/${makerspaceId}`],
    enabled: !isNaN(makerspaceId)
  });
  
  // Update mutation
  const mutation = useMutation({
    mutationFn: async (data: InsertMakerspace) => {
      const response = await apiRequest("PATCH", `/api/makerspaces/${makerspaceId}`, data);
      return response.json();
    },
    onSuccess: (updatedMakerspace: Makerspace) => {
      // Invalidate makerspace queries to refresh data
      queryClient.invalidateQueries({queryKey: ["/api/makerspaces"]});
      queryClient.invalidateQueries({queryKey: [`/api/makerspaces/${makerspaceId}`]});
      
      toast({
        title: "Success",
        description: `Makerspace "${updatedMakerspace.name}" has been updated.`,
        variant: "default",
      });
      
      // Navigate to the makerspace view page
      navigate(`/makerspaces/${makerspaceId}/view`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update makerspace. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (data: InsertMakerspace) => {
    mutation.mutate(data);
  };
  
  const handleBack = () => {
    navigate("/makerspaces");
  };
  
  // Loading state
  if (isLoadingMakerspace) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 max-w-7xl">
          <div className="flex items-center mb-6">
            <Skeleton className="h-4 w-4 mr-2" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-10 w-1/3 mb-2" />
          <Skeleton className="h-5 w-1/2 mb-8" />
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <div className="flex justify-end space-x-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  // Error state
  if (fetchError || !makerspace) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 max-w-7xl">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Makerspaces
          </Button>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center flex flex-col items-center py-8">
                <div className="rounded-full bg-destructive/10 p-3 mb-3">
                  <Building2 className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-medium">Makerspace Not Found</h3>
                <p className="text-muted-foreground max-w-md mt-2 mb-6">
                  We couldn't find the makerspace you're trying to edit. It may have been removed or you
                  may have followed an invalid link.
                </p>
                <Button onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Makerspaces
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-7xl">
        <Header
          title={`Edit Makerspace: ${makerspace.name}`}
          description="Update makerspace information"
          backButton={{
            label: "Back to Makerspace",
            href: `/makerspaces/${makerspaceId}/view`,
          }}
        />
        
        {mutation.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {mutation.error instanceof Error
                ? mutation.error.message
                : "An error occurred while updating the makerspace."}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mt-6">
          <MakerspaceForm
            onSubmit={handleSubmit}
            isSubmitting={mutation.isPending}
            defaultValues={makerspace}
            isEdit={true}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}