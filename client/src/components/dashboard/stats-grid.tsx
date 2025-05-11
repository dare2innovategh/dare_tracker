import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Store, 
  Users, 
  MapPin,
  TrendingUp,
  ArrowUp,
  AlertTriangle,
  RefreshCcw,
  Building,
  LockKeyhole,
  Eye,
  ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

// Animation variants
const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

interface StatsResponse {
  activeParticipants: number;
  activeBusinesses: number;
  mentorshipSessions: number;
  districts: string[];
  mentorsCount: number;
  participantsGrowth?: number | null;
  businessesGrowth?: number | null;
  mentorsGrowth?: number | null;
}

export default function StatsGrid() {
  const { data, isLoading, error, refetch } = useQuery<StatsResponse>({
    queryKey: ["/api/stats"],
  });

  // Add permission checks for dashboard stats
  const { can } = usePermissions();
  // Now dashboard is a valid resource
  const canViewDetailedStats = can('dashboard', 'view');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="ml-4 flex-1">
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-7 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl mb-8 shadow-sm"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">Error loading statistics</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error?.message || "Unknown error. Please try again."}</p>
            </div>
            <div className="mt-4">
              <Button 
                onClick={() => refetch()}
                className="bg-white text-red-700 border border-red-300 hover:bg-red-50 shadow-sm"
                size="sm"
              >
                <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* This first stats row with 4 columns */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        {/* First card - Active Participants - always visible to all users */}
        <motion.div variants={cardVariant}>
          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="h-1 w-full" style={{ background: THEME.primary }}></div>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-full" style={{ 
                  background: `linear-gradient(135deg, ${THEME.primary}20 0%, ${THEME.primary}10 100%)` 
                }}>
                  <User className="h-6 w-6" style={{ color: THEME.primary }} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Participants</p>
                  <p className="text-2xl font-bold" style={{ color: THEME.dark }}>{data.activeParticipants}</p>
                </div>
              </div>
              {/* Removed participant growth indicator for cleaner layout */}
            </div>
          </Card>
        </motion.div>
        
        {/* Only show these 3 additional cards if user has dashboard view permission */}
        {canViewDetailedStats && (
          <>
            {/* Active Businesses Card */}
            <motion.div variants={cardVariant}>
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="h-1 w-full" style={{ background: THEME.secondary }}></div>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 p-3 rounded-full" style={{ 
                      background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.secondary}10 100%)` 
                    }}>
                      <Store className="h-6 w-6" style={{ color: THEME.secondary }} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Active Businesses</p>
                      <p className="text-2xl font-bold" style={{ color: THEME.dark }}>{data.activeBusinesses}</p>
                    </div>
                  </div>
                  {/* Removed business growth indicator for cleaner layout */}
                </div>
              </Card>
            </motion.div>

            {/* Active Mentors Card */}
            <motion.div variants={cardVariant}>
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="h-1 w-full" style={{ background: THEME.dark }}></div>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 p-3 rounded-full" style={{ 
                      background: `linear-gradient(135deg, ${THEME.dark}20 0%, ${THEME.dark}10 100%)` 
                    }}>
                      <Users className="h-6 w-6" style={{ color: THEME.dark }} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Active Mentors</p>
                      <p className="text-2xl font-bold" style={{ color: THEME.dark }}>{data.mentorsCount}</p>
                    </div>
                  </div>
                  {/* Removed mentors growth indicator for cleaner layout */}
                </div>
              </Card>
            </motion.div>

            {/* Districts Card */}
            <motion.div variants={cardVariant}>
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="h-1 w-full" style={{ background: THEME.accent }}></div>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 p-3 rounded-full" style={{ 
                      background: `linear-gradient(135deg, ${THEME.accent}20 0%, ${THEME.accent}10 100%)` 
                    }}>
                      <MapPin className="h-6 w-6" style={{ color: THEME.accent }} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Districts Covered</p>
                      <p className="text-2xl font-bold" style={{ color: THEME.dark }}>{data.districts.length}</p>
                    </div>
                  </div>
                  {/* Removed districts text for cleaner layout */}
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* For non-admin users, show message about additional analytics */}
      {!canViewDetailedStats && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border border-gray-200 shadow-sm bg-gray-50">
            <div className="p-6">
              <div className="flex items-start">
                <div className="p-2 rounded-full bg-gray-100">
                  <LockKeyhole className="h-5 w-5 text-gray-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-base font-medium text-gray-700">Additional Analytics Available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    More detailed statistics are available to users with dashboard analytics permissions.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}