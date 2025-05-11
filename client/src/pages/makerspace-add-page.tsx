import React from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import MakerspaceForm from "@/components/makerspace/makerspace-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { InsertMakerspace, Makerspace } from "@shared/schema";

export default function MakerspaceAddPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Create mutation for adding a new makerspace
  const mutation = useMutation({
    mutationFn: async (makerspace: InsertMakerspace) => {
      const response = await apiRequest("POST", "/api/makerspaces", makerspace);
      return response.json();
    },
    onSuccess: (makerspace: Makerspace) => {
      // Invalidate makerspaces query to refresh list
      queryClient.invalidateQueries({queryKey: ["/api/makerspaces"]});
      
      // Show success message
      toast({
        title: "Success",
        description: `Makerspace "${makerspace.name}" has been created.`,
        variant: "default",
      });
      
      // Navigate back to makerspace list
      navigate("/makerspaces");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create makerspace. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertMakerspace) => {
    mutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-7xl">
        <Header
          title="Add New Makerspace"
          description="Create a new collaborative workspace location"
          backButton={{
            label: "Back to Makerspaces",
            href: "/makerspaces",
          }}
        />

        {mutation.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {mutation.error instanceof Error
                ? mutation.error.message
                : "An error occurred while creating the makerspace."}
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6">
          <MakerspaceForm
            onSubmit={handleSubmit}
            isSubmitting={mutation.isPending}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}