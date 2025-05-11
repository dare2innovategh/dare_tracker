import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Loader2, 
  Building2, 
  BarChart2, 
  AlertTriangle,
  Users,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { BusinessTrackingForm } from "@/components/business/business-tracking-form";
import { BusinessTrackingTable } from "@/components/business/business-tracking-table";
import { BusinessProfile } from "@shared/schema";

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function BusinessTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const businessId = parseInt(id);
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("revenue");
  const queryClient = useQueryClient();

  // Fetch business details
  const { data: business, isLoading: isLoadingBusiness, error: businessError } = useQuery<BusinessProfile>({
    queryKey: [`/api/business-profiles/${businessId}`],
    retry: 1,
    enabled: !!businessId && !isNaN(businessId)
  });
  
  // Fetch business statistics
  const { data: stats, isLoading: isLoadingStats, error: statsError } = useQuery<any>({
    queryKey: [`/api/business-tracking/businesses/${businessId}/stats`],
    retry: 1,
    enabled: !!businessId && !isNaN(businessId)
  });

  // Callback to refresh table data after a new record is added
  const handleRecordAdded = () => {
    console.log("Invalidating tracking records query...");
    queryClient.invalidateQueries({ queryKey: [`/api/business-tracking/businesses/${businessId}/tracking`] });
    toast({
      title: "Record Added",
      description: "The new tracking record has been successfully added.",
    });
  };

  // Custom card style with Mastercard-themed top border
  const cardStyle = (color1: string, color2: string) => ({
    position: "relative",
    overflow: "hidden",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "4px",
      background: `linear-gradient(to right, ${color1}, ${color2})`,
    },
  });

  // Handle back navigation
  const handleBack = () => {
    navigate(`/businesses/${businessId}`);
  };

  if (isLoadingBusiness) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading business details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (businessError || !business) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-lg font-semibold">Failed to load business details</h2>
          <p className="mt-2 text-muted-foreground">
            {businessError instanceof Error ? businessError.message : "Unknown error"}
          </p>
          <Button onClick={() => navigate("/businesses")} className="mt-6">
            Go Back to Business Profiles
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
                {business.businessName} - Tracking
              </h1>
              <p className="text-muted-foreground">
                Monitor performance and growth metrics
              </p>
            </div>
          </div>

          {user && (
            <BusinessTrackingForm 
              business={business} 
              currentUser={user}
              buttonText="Add New Data" 
              buttonIcon={<BarChart2 className="mr-2 h-4 w-4" />}
              onSuccess={handleRecordAdded} // Pass callback to refresh table
            />
          )}
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex items-center h-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-2xl font-bold">GHS {stats?.latestRevenue || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Latest Period</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex items-center h-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-2xl font-bold">{stats?.currentEmployees || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Current Count</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Growth Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex items-center h-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center">
                    <TrendingUp className={`h-5 w-5 mr-2 ${stats?.growthRate > 0 ? 'text-green-500' : stats?.growthRate < 0 ? 'text-red-500' : 'text-orange-500'}`} />
                    <span className={`text-2xl font-bold ${stats?.growthRate > 0 ? 'text-green-600' : stats?.growthRate < 0 ? 'text-red-600' : ''}`}>
                      {stats?.growthRate > 0 ? '+' : ''}{stats?.growthRate || 0}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Monthly Average</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Business Performance Tracking</CardTitle>
              <CardDescription>
                View and manage all tracking records for {business.businessName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessTrackingTable businessId={business.id} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}