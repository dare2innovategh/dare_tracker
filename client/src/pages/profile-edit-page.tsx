import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { YouthProfile } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import { Loader2 } from "lucide-react";
import EnhancedProfileForm from "@/components/youth-profile/enhanced-profile-form-fixed";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function ProfileEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  // Convert id to number
  const profileId = parseInt(id, 10);

  // Fetch profile data
  const { data: profile, isLoading, error: queryError } = useQuery<YouthProfile>({
    queryKey: [`/api/youth-profiles/${profileId}`],
    enabled: !isNaN(profileId)
  });
  
  // Set error message if query fails
  useEffect(() => {
    if (queryError) {
      setError(`Failed to load profile: ${queryError.message}`);
    }
  }, [queryError]);

  // Redirect to profiles page if ID is invalid
  useEffect(() => {
    if (isNaN(profileId)) {
      navigate("/youth-profiles");
    }
  }, [profileId, navigate]);

  return (
    <DashboardLayout>
      <div className="md:py-8 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <Header
            title="Edit Youth Profile"
            description="Update profile information, skills, and education records"
            showActions={false}
          />

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/youth-profiles")}
                >
                  Go Back to Profiles
                </Button>
              </div>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-32">
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-gray-500">Loading profile data...</p>
              </div>
            </div>
          ) : profile ? (
            <EnhancedProfileForm 
              profileData={profile} 
              isEdit={true}
              userId={profile.userId} 
            />
          ) : (
            !error && (
              <div className="flex justify-center items-center py-32">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
                  <p className="text-gray-500 mb-4">The requested profile could not be found</p>
                  <Button 
                    onClick={() => navigate("/youth-profiles")}
                    variant="outline"
                  >
                    Back to Profiles
                  </Button>
                </div>
              </div>
            )
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}