import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Building2, User, Plus } from "lucide-react";

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
    transition: { duration: 0.5 }
  }
};

export default function YouthBusinessesPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const youthId = parseInt(id);
  
  // Fetch the youth profile
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<any>({
    queryKey: [`/api/youth-profiles/${youthId}`],
    enabled: !isNaN(youthId),
  });
  
  // Fetch associated businesses
  const { data: businesses = [], isLoading: businessesLoading, error: businessesError } = useQuery<any[]>({
    queryKey: [`/api/youth-profiles/${youthId}/businesses`],
    enabled: !isNaN(youthId),
  });
  
  const isLoading = profileLoading || businessesLoading;
  const error = profileError || businessesError;
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="md:py-8 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full" style={{ backgroundColor: `${THEME.secondary}20` }}></div>
                <div className="w-16 h-16 rounded-full absolute top-0 left-0" style={{ 
                  borderTopColor: THEME.secondary, 
                  borderRightColor: 'transparent', 
                  borderBottomColor: 'transparent', 
                  borderLeftColor: THEME.primary, 
                  borderWidth: '3px', 
                  animation: 'spin 1s linear infinite' 
                }}></div>
              </div>
              <p className="mt-4 text-gray-500">Loading associated businesses...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error || !profile) {
    return (
      <DashboardLayout>
        <div className="md:py-8 px-4 md:px-8 max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="text-center py-16 px-4"
          >
            <div className="inline-block p-5 rounded-full mb-4" style={{ backgroundColor: `${THEME.primary}10` }}>
              <Building2 className="h-12 w-12" style={{ color: THEME.primary }} />
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: THEME.dark }}>Error Loading Businesses</h1>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {error ? `Error: ${error.message}` : "The requested profile could not be found."}
            </p>
            <Button 
              onClick={() => navigate("/youth-profiles")}
              className="shadow-md hover:shadow-lg transition-all duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                border: "none" 
              }}
            >
              Back to Profiles
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }
  
  const businessArray = Array.isArray(businesses) ? businesses : [];
  
  return (
    <DashboardLayout>
      <div className="md:py-8 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/youth/profiles/${youthId}`)}
              className="mr-4 rounded-full hover:bg-gray-100 transition-colors duration-300"
            >
              <ArrowLeft className="h-5 w-5" style={{ color: THEME.primary }} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: THEME.dark }}>
                Businesses Associated with {profile?.fullName || "Youth Profile"}
              </h1>
              <p className="text-gray-500">
                {profile?.district || "Unknown District"} • {profile?.town || "Unknown Town"}
              </p>
            </div>
          </div>

          <Button
            onClick={() => navigate(`/businesses/new?youthId=${youthId}`)}
            className="shadow-sm hover:shadow-md transition-all duration-300"
            style={{ 
              background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
              border: "none" 
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Business
          </Button>
        </motion.div>

        {businessArray.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16 px-4 border-2 border-dashed border-gray-200 rounded-lg"
          >
            <div className="inline-block p-5 rounded-full mb-4 bg-gray-50">
              <Building2 className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-700">No Businesses Found</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              This youth participant doesn't have any associated businesses yet. 
              Click the button below to add a new business.
            </p>
            <Button 
              onClick={() => navigate(`/businesses/new?youthId=${youthId}`)}
              className="shadow-md hover:shadow-lg transition-all duration-300"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Business
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {businessArray.map((business: any) => (
              <Card 
                key={business.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => navigate(`/businesses/${business.id}`)}
              >
                <div className="h-1.5 w-full" style={{ 
                  background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})`
                }}></div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold" style={{ color: THEME.dark }}>
                    {business.businessName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 mb-2">{business.businessType}</p>
                  <p className="text-gray-700 mb-4">{business.description}</p>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{business.businessOwners || "Business Owner"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}