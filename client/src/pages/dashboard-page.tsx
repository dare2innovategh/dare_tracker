import { useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { motion } from "framer-motion";
import {
  Loader2,
  Home,
  UserPlus,
  Filter,
  Layout,
  TrendingUp,
  Users,
  Clock,
  Briefcase,
  Plus,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import StatsGrid from "@/components/dashboard/stats-grid";
import ProgramOverview from "@/components/dashboard/program-overview";
import ProgramHighlights from "@/components/dashboard/program-highlights";

import MentorsOverview from "@/components/dashboard/mentors-overview";
import RecentActivities from "@/components/dashboard/recent-activities";
import RecentProfiles from "@/components/dashboard/recent-profiles";
import { BusinessGrowthChart } from "@/components/business/business-growth-chart";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";

// Application theme - updated to match the new design system
const THEME = {
  primary: "#0072CE",
  secondary: "#6C17C9",
  accent: "#00B8A9",
  dark: "#172449",
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

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { can } = usePermissions();
  const [, navigate] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  const handleAddYouth = () => {
    navigate("/profile/add");
  };

  const handleAddBusiness = () => {
    navigate("/businesses/new");
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h3 className="text-xl font-medium mb-2" style={{ color: THEME.dark }}>
          Loading Dashboard
        </h3>
        <p className="text-gray-500">
          Please wait while we prepare your overview
        </p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <DashboardLayout>
      <div className="md:py-8 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Header with animation */}
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={fadeIn}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <div className="flex items-center">
              <Home className="mr-2 h-6 w-6" style={{ color: THEME.primary }} />
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: THEME.dark }}>
                Dashboard
              </h1>
            </div>
            <p className="text-gray-500 mt-1">
              Welcome back, {user?.fullName || user?.username}. Here's an overview of the program.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Only show buttons to users with create permissions */}
            {can('youth_profiles', 'create') && (
              <Button 
                variant="outline"
                size="sm"
                className="border-gray-200 flex items-center gap-1 shadow-sm transition-colors"
                onClick={handleAddYouth}
              >
                <UserPlus className="h-4 w-4" style={{ color: THEME.secondary }} />
                New Youth Profile
              </Button>
            )}
            {can('businesses', 'create') && (
              <Button 
                size="sm"
                className="shadow-sm transition-colors"
                style={{ 
                  background: `linear-gradient(135deg, ${THEME.secondary}, ${THEME.primary})`,
                  border: "none" 
                }}
                onClick={handleAddBusiness}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                New Business Profile
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats Grid with animation */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mt-8"
        >
          <StatsGrid />
        </motion.div>

        {/* Program Overview - Always visible to all users */}
        <ProgramOverview />

        {/* Conditional section - shown only to users with dashboard permission */}
        {can('dashboard', 'view') ? (
          <>
            {/* Business Growth Chart with staggered animation - requires business view permission */}
            {can('businesses', 'view') && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="mt-8"
              >
                <div className="flex items-center mb-4">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center mr-3"
                    style={{
                      background: `linear-gradient(135deg, #FF5F0020 0%, #EB001B20 50%, #F79E1B20 100%)`,
                    }}
                  >
                    <TrendingUp
                      className="h-4 w-4"
                      style={{ color: "#FF5F00" }}
                    />
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: THEME.dark }}>
                    Business Performance
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Business Growth Chart */}
                  <motion.div variants={cardVariant}>
                    <div className="relative">
                      <div
                        className="absolute -top-1 left-4 right-4 h-1 rounded-t-full"
                        style={{
                          background: `linear-gradient(to right, #FF5F00, #EB001B, #F79E1B)`,
                        }}
                      ></div>
                      <BusinessGrowthChart title="Business Revenue Tracking" description="Monthly revenue performance across all businesses" />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Mentorship Overview Section with staggered animation - requires mentors view permission */}
            {can('mentors', 'view') && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="mt-8"
              >
                <div className="flex items-center mb-4">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center mr-3"
                    style={{
                      background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}20 50%, ${THEME.accent}20 100%)`,
                    }}
                  >
                    <Users
                      className="h-4 w-4"
                      style={{ color: THEME.primary }}
                    />
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: THEME.dark }}>
                    Mentorship Overview
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Mentors Overview */}
                  <motion.div variants={cardVariant}>
                    <div className="relative">
                      <div
                        className="absolute -top-1 left-4 right-4 h-1 rounded-t-full"
                        style={{
                          background: `linear-gradient(to right, ${THEME.primary}, ${THEME.accent})`,
                        }}
                      ></div>
                      <MentorsOverview />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Recent Activities & Youth Profiles with staggered animation - requires activities view permission */}
            {can('activities', 'view') && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="mt-8"
              >
                <div className="flex items-center mb-4">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center mr-3"
                    style={{
                      background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}20 50%, ${THEME.accent}20 100%)`,
                    }}
                  >
                    <Clock className="h-4 w-4" style={{ color: THEME.accent }} />
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: THEME.dark }}>
                    Recent Updates
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Activities */}
                  <motion.div variants={cardVariant} className="lg:col-span-2">
                    <div className="relative">
                      <div
                        className="absolute -top-1 left-4 right-4 h-1 rounded-t-full"
                        style={{
                          background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})`,
                        }}
                      ></div>
                      <RecentActivities />
                    </div>
                  </motion.div>

                  {/* Recent Profiles - only shows if user can view youth profiles */}
                  {can('youth_profiles', 'view') && (
                    <motion.div variants={cardVariant}>
                      <div className="relative">
                        <div
                          className="absolute -top-1 left-4 right-4 h-1 rounded-t-full"
                          style={{
                            background: `linear-gradient(to right, ${THEME.accent}, ${THEME.dark})`,
                          }}
                        ></div>
                        <RecentProfiles />
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}