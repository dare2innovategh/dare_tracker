import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BusinessProfile } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ArrowLeft, 
  Store, 
  FileEdit, 
  FilePlus, 
  AlertTriangle,
  FileQuestion,
  ArrowUpRight
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import BusinessForm from "@/components/business/business-form";

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

export default function BusinessEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const isNewBusiness = id === "new";

  // Fetch business details if editing existing
  const {
    data: business,
    isLoading,
    error,
  } = useQuery<BusinessProfile>({
    queryKey: [`/api/business-profiles/${id}`],
    enabled: !!id && !isNewBusiness,
  });

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10 px-4">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full" style={{ backgroundColor: `${THEME.secondary}20` }}></div>
              <div className="w-24 h-24 rounded-full absolute top-0 left-0" style={{ 
                borderTopColor: THEME.secondary, 
                borderRightColor: 'transparent', 
                borderBottomColor: 'transparent', 
                borderLeftColor: THEME.primary, 
                borderWidth: '4px', 
                animation: 'spin 1s linear infinite' 
              }}></div>
            </div>
            <h3 className="text-xl font-medium mb-2" style={{ color: THEME.dark }}>
              Loading Business Data
            </h3>
            <p className="text-gray-500">Please wait while we fetch the business information</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state if fetch failed
  if (error && !isNewBusiness) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10 px-4">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-10 text-center shadow-sm"
          >
            <div className="inline-block p-4 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-red-700 mb-3">Error Loading Business</h3>
            <p className="text-red-600 mb-6">
              There was an error loading the business details. Please try again or contact support if the problem persists.
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => window.location.reload()}
              >
                <Loader2 className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button 
                className="shadow-sm hover:shadow-md transition-all duration-300"
                style={{ 
                  background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                  border: "none" 
                }}
                onClick={() => navigate("/businesses")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Businesses
              </Button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Show 404 state if business not found
  if (!business && !isNewBusiness) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10 px-4">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-xl p-10 text-center shadow-sm"
          >
            <div className="inline-block p-4 rounded-full bg-blue-100 mb-4">
              <FileQuestion className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-blue-700 mb-3">Business Not Found</h3>
            <p className="text-blue-600 mb-6">
              The requested business could not be found. It may have been deleted or you may not have permission to view it.
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                className="shadow-sm hover:shadow-md transition-all duration-300"
                style={{ 
                  background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                  border: "none" 
                }}
                onClick={() => navigate("/businesses")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Businesses
              </Button>
              <Button 
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => navigate("/businesses/new")}
              >
                <FilePlus className="mr-2 h-4 w-4" />
                Create New Business
              </Button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10 px-4">
        {/* Header with back button */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
        >
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(isNewBusiness ? "/businesses" : `/businesses/${id}`)}
              className="mr-4 rounded-full hover:bg-gray-100 transition-colors duration-300"
              style={{ color: THEME.primary }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center">
                {isNewBusiness ? (
                  <FilePlus className="h-6 w-6 mr-3" style={{ color: THEME.primary }} />
                ) : (
                  <FileEdit className="h-6 w-6 mr-3" style={{ color: THEME.primary }} />
                )}
                <h1 className="text-2xl font-bold" style={{ color: THEME.dark }}>
                  {isNewBusiness ? "Create New Business" : `Edit ${business?.businessName}`}
                </h1>
              </div>
              <p className="text-gray-500 mt-1 ml-9">
                {isNewBusiness 
                  ? "Fill in the details to create a new business profile" 
                  : "Update the details for this business profile"}
              </p>
            </div>
          </div>

          {!isNewBusiness && business && (
            <Button
              variant="outline"
              className="border-gray-200 hover:border-gray-300 transition-all duration-300 group"
              onClick={() => navigate(`/businesses/${id}`)}
            >
              <Store className="mr-2 h-4 w-4" style={{ color: THEME.primary }} />
              View Business
              <ArrowUpRight className="ml-1 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
          )}
        </motion.div>

        {/* Business Form - we already beautified this component */}
        <BusinessForm 
          businessData={business}
          isEdit={!isNewBusiness}
        />
      </div>
    </DashboardLayout>
  );
}