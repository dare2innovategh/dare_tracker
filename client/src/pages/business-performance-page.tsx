import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, ArrowLeftCircle, Plus, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

// Components
import DashboardLayout from "@/components/layout/dashboard-layout";
import { BusinessTrackingTable } from "@/components/business/business-tracking-table";
import { BusinessGrowthChart } from "@/components/business/business-growth-chart";
import { RecentTrackingDetails } from "@/components/business/recent-tracking-details";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types & Utils
import { BusinessProfile } from "@shared/schema";

// Mastercard theme colors
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function BusinessPerformancePage() {
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<string>("analytics");

  // Fetch business details to display the business name
  const {
    data: business,
    isLoading: isLoadingBusiness,
    error: businessError,
  } = useQuery<BusinessProfile>({
    queryKey: [`/api/business-profiles/${id}`],
    enabled: !!id,
  });

  if (isLoadingBusiness) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (businessError || !business) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="text-sm text-red-700">
                {businessError ? `Error: ${(businessError as Error).message}` : "Business not found"}
              </div>
            </div>
          </div>
          <Button
            onClick={() => navigate("/businesses")}
            variant="outline"
            className="mt-4"
          >
            <ArrowLeftCircle className="mr-2 h-4 w-4" />
            Back to Businesses
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-8"
        >
          <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
            <div>
              <Button
                variant="outline"
                className="mb-4"
                onClick={() => navigate(`/businesses/${id}`)}
              >
                <ArrowLeftCircle className="mr-2 h-4 w-4" />
                Back to Business
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Performance Tracking: {business.businessName}
              </h1>
              <p className="text-gray-500 mt-1">
                Monitor, track, and analyze the performance metrics for this business
              </p>
            </div>
            
            <div>
              <Button
                variant="default"
                className="bg-gradient-to-r from-[#FF5F00] via-[#EB001B] to-[#F79E1B] border-none text-white"
                onClick={() => navigate(`/businesses/${id}/add-tracking`)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tracking Record
              </Button>
            </div>
          </div>

          <Tabs 
            value={tab} 
            onValueChange={setTab}
            className="w-full"
          >
            <TabsList 
              className="inline-flex h-auto justify-start overflow-x-auto mb-8 rounded-md p-1 bg-muted/30"
            >
              <TabsTrigger 
                value="analytics" 
                className="px-4 py-2 rounded-md data-[state=active]:bg-[#FF5F00] data-[state=active]:text-white"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="px-4 py-2 rounded-md data-[state=active]:bg-[#FF5F00] data-[state=active]:text-white"
              >
                <BarChart2 className="mr-2 h-4 w-4" />
                Tracking History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-6">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {/* Business Growth Chart Card - Moved to top */}
                <motion.div variants={cardVariant}>
                  <Card className="border-gray-100 shadow-md overflow-hidden mb-6">
                    <div className="h-1 w-full" style={{ 
                      background: `linear-gradient(to right, #FF5F00, #F79E1B)` 
                    }}></div>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-base sm:text-lg" style={{ color: THEME.dark }}>
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center mr-2 sm:mr-3" style={{ 
                          background: `linear-gradient(135deg, #FF5F0020 0%, #F79E1B10 100%)` 
                        }}>
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#FF5F00" }} />
                        </div>
                        Business Growth Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BusinessGrowthChart businessId={Number(id)} />
                    </CardContent>
                  </Card>
                </motion.div>
                
                {/* Recent Tracking Details Card - Moved below chart */}
                <motion.div
                  variants={cardVariant}
                  className="mb-6"
                >
                  <RecentTrackingDetails businessId={Number(id)} />
                </motion.div>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-6">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {business && (
                  <BusinessTrackingTable 
                    businessId={business.id}
                    businessName={business.businessName}
                  />
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}