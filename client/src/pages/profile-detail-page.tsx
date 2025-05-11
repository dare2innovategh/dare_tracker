import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { YouthProfile } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ProfileView from "@/components/youth-profile/profile-view";
import ProfileForm from "@/components/youth-profile/profile-form";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, UserPlus, Edit, User } from "lucide-react";

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

export default function ProfileDetailPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  // Handle scroll for nav transparency effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const profileId = params.id ? parseInt(params.id) : null;
  const isNewProfile = params.id === "new";
  const isEditMode = !isNewProfile && window.location.pathname.includes('/edit');

  // If creating a new profile
  if (isNewProfile) {
    return (
      <DashboardLayout>
        <div className="md:py-8 px-4 md:px-8 max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="mb-8 flex items-center"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/youth-profiles")}
              className="mr-4 rounded-full hover:bg-gray-100 transition-colors duration-300"
            >
              <ArrowLeft className="h-5 w-5" style={{ color: THEME.primary }} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: THEME.dark }}>Create New Youth Profile</h1>
              <p className="text-gray-500 text-sm mt-1">Add information about a new participant to the DARE program</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-1 w-full" style={{ 
                background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})`
              }}></div>
              <div className="p-6">
                <ProfileForm userId={user?.id || 0} />
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // For viewing or editing existing profile
  const { data: profile, isLoading, error } = useQuery<YouthProfile>({
    queryKey: [`/api/youth-profiles/${profileId}`],
  });

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

  return (
    <DashboardLayout>
      <div className="md:py-8 px-4 md:px-8 max-w-7xl mx-auto">
        {isEditMode ? (
          <>
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="mb-8 flex items-center"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/youth-profiles/${profileId}`)}
                className="mr-4 rounded-full hover:bg-gray-100 transition-colors duration-300"
              >
                <ArrowLeft className="h-5 w-5" style={{ color: THEME.primary }} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: THEME.dark }}>Edit Youth Profile</h1>
                <p className="text-gray-500 text-sm mt-1">Update information for {profile.fullName}</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="p-1 w-full" style={{ 
                  background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})`
                }}></div>
                <div className="p-6">
                  <ProfileForm 
                    profileData={profile} 
                    userId={profile.userId} 
                    isEdit={true} 
                  />
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <>
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
                  onClick={() => navigate("/youth-profiles")}
                  className="mr-4 rounded-full hover:bg-gray-100 transition-colors duration-300"
                >
                  <ArrowLeft className="h-5 w-5" style={{ color: THEME.primary }} />
                </Button>
                <h1 className="text-2xl font-bold" style={{ color: THEME.dark }}>{profile.fullName}</h1>
              </div>

              <Button
                onClick={() => navigate(`/youth-profiles/${profileId}/edit`)}
                className="shadow-sm hover:shadow-md transition-all duration-300"
                style={{ 
                  background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                  border: "none" 
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ProfileView profileId={profile.id} />
            </motion.div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}