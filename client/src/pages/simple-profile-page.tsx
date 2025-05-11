import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { motion } from "framer-motion";
import { UserPlus, ArrowLeft } from "lucide-react";
import SimpleProfileForm from "@/components/youth-profile/simple-profile-form";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function SimpleProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if not authenticated
  if (!authLoading && !user) {
    return <Redirect to="/auth" />;
  }
  
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6 max-w-4xl">
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={fadeIn}
          className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <div className="flex items-center">
              <UserPlus className="mr-2 h-6 w-6 text-[#0072CE]" />
              <h1 className="text-2xl font-bold tracking-tight text-[#172449]">
                Create Youth Profile
              </h1>
            </div>
            <p className="text-gray-500 mt-1">
              Add a new youth participant to the DARE program
            </p>
          </div>
          
          <Button 
            variant="outline"
            size="sm"
            className="border-gray-200 flex items-center gap-2 shadow-sm"
            onClick={() => navigate("/youth/profiles")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profiles
          </Button>
        </motion.div>
        
        <SimpleProfileForm userId={user!.id} />
      </div>
    </DashboardLayout>
  );
}