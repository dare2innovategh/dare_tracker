import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BusinessProfile } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Loader2, 
  BarChart2,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { BusinessTrackingFormFixed } from "@/components/business/business-tracking-form-fixed";
import { useHasPermission } from "@/lib/permissions";
import { Redirect } from "wouter";

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

// Animation variants for smooth page transitions
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function AddTrackingPage() {
  const { id, trackingId } = useParams<{ id: string; trackingId: string }>();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditMode = !!trackingId;
  
  // Check if user has permission to create/edit business tracking records
  const canCreateTracking = useHasPermission("business_tracking", "create");
  const canEditTracking = useHasPermission("business_tracking", "edit");
  const isAdmin = user?.role === "admin";
  
  // If user doesn't have permissions (and is not admin), redirect to businesses page
  if (!isAdmin && ((isEditMode && !canEditTracking) || (!isEditMode && !canCreateTracking))) {
    return <Redirect to={id ? `/businesses/${id}` : "/businesses"} />;
  }
  
  // Fetch the business data
  const { data: business, error, isLoading } = useQuery<BusinessProfile>({
    queryKey: [`/api/business-profiles/${id}`],
    enabled: !!id,
  });
  
  // Fetch the tracking record data if in edit mode
  const { data: trackingRecord, isLoading: isLoadingTracking } = useQuery({
    queryKey: [`/api/business-tracking/${trackingId}`],
    enabled: !!trackingId && isEditMode,
  });

  const handleBack = () => {
    if (id) {
      navigate(`/businesses/${id}`); // Go back to business details
    } else {
      navigate("/businesses"); // Go back to business list if no ID
    }
  };

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: isEditMode 
        ? "Business tracking record updated successfully" 
        : "Business tracking record added successfully",
    });
    
    // Navigate back to performance tracking page
    if (id) {
      navigate(`/businesses/${id}/tracking`);
    }
  };

  // Loading state
  if (isLoading || (isEditMode && isLoadingTracking)) {
    return (
      <DashboardLayout>
        <div className="container mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg text-muted-foreground">
              {isEditMode ? "Loading tracking record data..." : "Loading business data..."}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !business) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error ? `Error loading business: ${(error as Error).message}` : "Business not found"}
            </AlertDescription>
          </Alert>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto pb-10">
        {/* Header with Back Button */}
        <motion.div 
          initial={fadeIn.hidden}
          animate={fadeIn.visible}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
        >
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mr-4 hover:bg-transparent hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {business.businessName} - {isEditMode ? "Edit" : "Add"} Business Data
              </h1>
              <p className="text-muted-foreground">
                {isEditMode 
                  ? "Update performance metrics for this business" 
                  : "Record new performance metrics for this business"
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Business Data Form Card */}
        <motion.div 
          initial={slideUp.hidden}
          animate={slideUp.visible}
          className="grid grid-cols-1 gap-6"
        >
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="h-5 w-5 mr-2 text-orange-500" />
                <span>{isEditMode ? "Edit" : "Add New"} Business Data</span>
              </CardTitle>
              <CardDescription>
                {isEditMode 
                  ? "Update the metrics and performance data for this business."
                  : "Enter the latest metrics and performance data for this business."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Import the standalone form component here */}
              {user && business && (
                <div className="max-w-3xl mx-auto">
                  <BusinessTrackingFormFixed 
                    business={business}
                    currentUser={user}
                    onSuccess={handleSuccess}
                    showFormDirectly={true}
                    existingData={isEditMode ? trackingRecord : undefined}
                    isEditMode={isEditMode}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default AddTrackingPage;