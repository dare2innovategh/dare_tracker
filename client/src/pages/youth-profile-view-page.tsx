import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ProfileDetailView from "@/components/youth-profile/profile-detail-view-redesign";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Edit, User, Building2 } from "lucide-react";

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

export default function YouthProfileViewPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [scrollY, setScrollY] = useState(0);
  const profileId = parseInt(id);
  
  // Handle scroll for nav transparency effect
  React.useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Fetch the youth profile
  const { data: profile, isLoading: profileLoading, error } = useQuery<any>({
    queryKey: [`/api/youth/profiles/${profileId}`],
    enabled: !isNaN(profileId),
  });
  
  // Fetch education records
  const { data: education = [], isLoading: educationLoading } = useQuery({
    queryKey: [`/api/youth/education/${profileId}`],
    enabled: !isNaN(profileId),
  });
  
  // Fetch training records with programs
  const { data: trainings = [], isLoading: trainingsLoading } = useQuery({
    queryKey: [`/api/youth/training/${profileId}`],
    enabled: !isNaN(profileId),
  });
  
  // Fetch all training programs for reference
  const { data: trainingPrograms = [] } = useQuery({
    queryKey: ['/api/training-programs'],
  });
  
  // Process data to enhance training with program details
  const enhancedTrainings = React.useMemo(() => {
    if (!Array.isArray(trainings)) return [];
    return trainings.map((training: any) => {
      const program = Array.isArray(trainingPrograms) 
        ? trainingPrograms.find((p: any) => p.id === training.programId)
        : null;
      return {
        ...training,
        program: program || { programName: "Unknown Program" }
      };
    });
  }, [trainings, trainingPrograms]);
  
  const isLoading = profileLoading || educationLoading || trainingsLoading;
  
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
              <p className="mt-4 text-gray-500">Loading profile...</p>
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
              <User className="h-12 w-12" style={{ color: THEME.primary }} />
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: THEME.dark }}>Profile Not Found</h1>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {error ? `Error: ${error.message}` : "The requested profile could not be found. It may have been deleted or you may not have permission to view it."}
            </p>
            <Button 
              onClick={() => navigate("/youth/profiles")}
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
  
  return (
    <DashboardLayout>
      <div className="py-4 sm:py-6 md:py-8 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/youth/profiles")}
              className="mr-2 sm:mr-4 rounded-full hover:bg-gray-100 transition-colors duration-300"
            >
              <ArrowLeft className="h-5 w-5" style={{ color: THEME.primary }} />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: THEME.dark }}>
              {profile?.fullName || "Youth Profile"}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 ml-8 sm:ml-0">
            <Button
              onClick={() => navigate(`/businesses/youth/${profileId}`)}
              className="shadow-sm hover:shadow-md transition-all duration-300 text-xs sm:text-sm"
              variant="outline"
              size="sm"
              title="View Businesses"
            >
              <Building2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" style={{ color: THEME.primary }} />
              <span className="hidden sm:inline">View Businesses</span>
              <span className="sm:hidden">Businesses</span>
            </Button>
            
            <Button
              onClick={() => navigate(`/profile/edit/${profileId}`)}
              className="shadow-sm hover:shadow-md transition-all duration-300 text-xs sm:text-sm"
              size="sm"
              style={{ 
                background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                border: "none" 
              }}
              title="Edit Profile"
            >
              <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ProfileDetailView
            profile={profile as any}
            education={education as any}
            trainings={enhancedTrainings as any}
          />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}