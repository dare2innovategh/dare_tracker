import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Loader2, 
  Building2,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

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

export function AddBusinessTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  
  // Fetch the business data
  const { data: business, error, isLoading } = useQuery({
    queryKey: [`/api/business-profiles/${id}`],
    enabled: !!id,
  });

  const handleBack = () => {
    if (id) {
      navigate(`/businesses/${id}`); // Go back to business details
    } else {
      navigate("/businesses"); // Go back to business list if no ID
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg text-muted-foreground">Loading business data...</p>
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
                {business.businessName} - Add Business Data
              </h1>
              <p className="text-muted-foreground">
                Record new performance metrics for this business
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
                <Building2 className="h-5 w-5 mr-2 text-primary" />
                <span>Add New Business Data</span>
              </CardTitle>
              <CardDescription>
                Enter the latest metrics and performance data for this business.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Import the standalone form component here */}
              {user && (
                <div className="max-w-3xl mx-auto">
                  {/* This is where the form will be rendered */}
                  <div className="text-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-lg text-muted-foreground">Loading form...</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please wait while we prepare the business tracking form...
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default AddBusinessTrackingPage;