import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, 
  Store, 
  Users, 
  FileBarChart, 
  ChevronRight, 
  Clock,
  RefreshCcw,
  AlertCircle,
  Plus,
  Briefcase,
  Building,
  BarChart2,
  ArrowRight
} from "lucide-react";

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.4 }
  }
};

const activityVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { 
      delay: i * 0.08,
      duration: 0.3,
      ease: "easeOut"
    }
  })
};

interface Activity {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  icon: string;
}

// Function to format date relative to now
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 172800) {
    return 'Yesterday';
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

// Get activity icon and badge styling
function getActivityStyle(type: string) {
  switch (type) {
    case 'profile':
      return { 
        icon: <UserPlus className="h-4 w-4" />, 
        color: THEME.primary,
        bgColor: `${THEME.primary}20`,
        label: "Profile"
      };
    case 'business':
      return { 
        icon: <Store className="h-4 w-4" />, 
        color: THEME.secondary,
        bgColor: `${THEME.secondary}20`,
        label: "Business"
      };
    case 'mentorship':
      return { 
        icon: <Users className="h-4 w-4" />, 
        color: THEME.accent,
        bgColor: `${THEME.accent}20`,
        label: "Mentorship"
      };
    case 'mentor':
      return { 
        icon: <Users className="h-4 w-4" />, 
        color: THEME.accent,
        bgColor: `${THEME.accent}20`,
        label: "Mentor"
      };
    case 'report':
      return { 
        icon: <FileBarChart className="h-4 w-4" />, 
        color: THEME.dark,
        bgColor: `${THEME.dark}20`,
        label: "Report"
      };
    default:
      return { 
        icon: <Building className="h-4 w-4" />, 
        color: THEME.primary,
        bgColor: `${THEME.primary}20`,
        label: "Activity"
      };
  }
}

export default function RecentActivities() {
  const [, navigate] = useLocation();
  const { data: activities, isLoading, error, refetch } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Function to highlight names and values in activity content
  const highlightContent = (content: string) => {
    // Pattern to match names and values (words in quotes or numbers with currency symbols)
    const nameParts = content.split(/(["'].*?["']|\d+[\.,]?\d*\s*[A-Z]{3})/g);

    return nameParts.map((part, index) => {
      // Check if this part is likely a name or value (in quotes or a number)
      if (/^["'].*["']$/.test(part)) {
        // Remove the quotes and highlight as a name
        const name = part.substring(1, part.length - 1);
        return <span key={index} className="font-semibold" style={{ color: THEME.dark }}>{name}</span>;
      } else if (/\d+[\.,]?\d*\s*[A-Z]{3}/.test(part)) {
        // Highlight as a value
        return <span key={index} className="font-semibold" style={{ color: THEME.secondary }}>{part}</span>;
      } else {
        // Regular text
        return <span key={index}>{part}</span>;
      }
    });
  };

  // No mock activities - we'll only use real data
  // Activity data to display (only real data, no fallback)
  const displayActivities = activities || [];

  return (
    <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden h-full">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white px-5 py-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-3 bg-white p-2 rounded-lg shadow-sm">
              <Clock className="h-5 w-5" style={{ color: THEME.primary }} />
            </div>
            <CardTitle className="text-xl font-semibold" style={{ color: THEME.dark }}>Recent Activities</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-200 hover:border-gray-300 transition-all group"
            onClick={(e) => {
              e.preventDefault();
              navigate('/activities');
            }}
          >
            <span className="flex items-center">
              <span>View All</span>
              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading && (
          <div className="p-5 space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start p-3 border-b border-gray-100">
                <Skeleton className="w-10 h-10 rounded-lg mr-4" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-5">
            <div className="flex items-center p-4 rounded-lg bg-red-50 border border-red-100">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error loading activities</p>
                <p className="text-xs text-red-700 mt-1">{error.message}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => refetch()}
              >
                <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="divide-y divide-gray-100"
          >
            {displayActivities.map((activity, index) => {
              const { icon, color, bgColor, label } = getActivityStyle(activity.type);

              return (
                <motion.div 
                  key={activity.id}
                  custom={index}
                  variants={activityVariant}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex">
                    <div className="mr-4 flex-shrink-0">
                      <div 
                        className="w-10 h-10 rounded-lg shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: bgColor }}
                      >
                        <div style={{ color: color }}>{icon}</div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="text-sm text-gray-600">
                          {highlightContent(activity.content)}
                        </div>
                        <Badge 
                          className="ml-2 text-xs"
                          style={{ 
                            backgroundColor: bgColor, 
                            color: color
                          }}
                        >
                          {label}
                        </Badge>
                      </div>
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{formatRelativeTime(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && !error && (!activities || activities.length === 0) && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 bg-gray-50">
              <Clock className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-700 font-medium">No recent activities</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">Activities will appear here as they happen</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-gray-50 px-5 py-3 border-t border-gray-100">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs w-full justify-center group hover:text-gray-700"
          onClick={(e) => {
            e.preventDefault();
            navigate('/activities');
          }}
        >
          <span className="flex items-center">
            <span>See all activity history</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
}