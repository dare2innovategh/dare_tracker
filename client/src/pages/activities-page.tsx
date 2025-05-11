import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, parseISO } from "date-fns";
import { 
  ArrowRightCircle, 
  Calendar, 
  ChevronRight, 
  Clock, 
  Eye, 
  ListFilter, 
  Loader2, 
  RefreshCcw, 
  Activity as ActivityIcon
} from "lucide-react";
import { motion } from "framer-motion";

// Components
// ActivityItem component for activity cards
interface ActivityItemProps {
  activity: Activity;
  formatActivityTime: (timestamp: string) => string;
}

function ActivityItem({ activity, formatActivityTime }: ActivityItemProps) {
  const [, navigate] = useLocation();
  
  // Function to highlight names and values in activity content
  const highlightContent = (content: string) => {
    // Pattern to match names and values (words in quotes or numbers with currency symbols)
    const nameParts = content.split(/(["'].*?["']|\d+[\.,]?\d*\s*[A-Z]{3})/g);
    
    return nameParts.map((part, index) => {
      // Check if this part matches a name or value pattern 
      if (part.match(/^["'].*["']$/)) {
        // It's a name in quotes
        return `<span class="font-medium text-gray-900">${part}</span>`;
      } else if (part.match(/^\d+[\.,]?\d*\s*[A-Z]{3}$/)) {
        // It's a currency amount
        return `<span class="font-medium text-gray-900">${part}</span>`;
      }
      return part;
    }).join('');
  };
  
  // Get activity badge color based on type
  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case "business":
        return { bg: "#FF5F0010", text: "#FF5F00" }; // Orange
      case "profile":
        return { bg: "#EB001B10", text: "#EB001B" }; // Red
      case "mentor":
      case "mentorship":
        return { bg: "#F79E1B10", text: "#F79E1B" }; // Yellow
      default:
        return { bg: "#1A1F7110", text: "#1A1F71" }; // Dark blue
    }
  };
  
  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "business":
        return <ActivityIcon className="h-6 w-6" style={{ color: "#FF5F00" }} />;
      case "profile":
        return <ActivityIcon className="h-6 w-6" style={{ color: "#EB001B" }} />;
      case "mentor":
      case "mentorship":
        return <ActivityIcon className="h-6 w-6" style={{ color: "#F79E1B" }} />;
      default:
        return <ActivityIcon className="h-6 w-6" style={{ color: "#1A1F71" }} />;
    }
  };
  
  return (
    <div 
      className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex gap-4"
      onClick={() => {
        // Navigate to the appropriate page based on activity type
        const idParts = activity.id.split('-');
        if (idParts.length >= 2) {
          const type = idParts[0];
          const id = idParts[1];
          
          if (type === 'business' && id) {
            navigate(`/businesses/${id}`);
          } else if (type === 'profile' && id) {
            navigate(`/youth-profiles/${id}`);
          } else if (type === 'mentor' && id) {
            navigate(`/mentors/${id}`);
          }
        }
      }}
    >
      {/* Activity Icon */}
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: getActivityBadgeColor(activity.type).bg }}
      >
        {getActivityIcon(activity.type)}
      </div>
      
      {/* Activity Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-medium text-gray-900 truncate">{activity.title}</h3>
          <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
            {formatActivityTime(activity.timestamp)}
          </span>
        </div>
        <p className="text-gray-600 text-sm" dangerouslySetInnerHTML={{ __html: highlightContent(activity.content) }}></p>
        
        <div className="flex items-center mt-2">
          <Badge
            className="px-2 py-0.5 text-xs font-normal"
            style={{ 
              background: getActivityBadgeColor(activity.type).bg,
              color: getActivityBadgeColor(activity.type).text,
              border: 'none'
            }}
          >
            {activity.type === 'profile' ? 'Youth' : 
             activity.type === 'business' ? 'Business' : 
             activity.type === 'mentor' ? 'Mentor' : 
             activity.type === 'mentorship' ? 'Mentorship' :
             activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
          </Badge>
          <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs">
            <Eye className="h-3 w-3 mr-1" />
            View
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Other components
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

// Types 
import type { Activity } from "@shared/schema";

// Mastercard theme colors
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
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
  visible: { opacity: 1, y: 0 },
};

export default function ActivitiesPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<string>("all");
  const [daysFilter, setDaysFilter] = useState<string>("30");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch activities
  const {
    data: activities,
    isLoading,
    error,
    refetch,
  } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Filter activities based on the selected tab and search query
  const filteredActivities = activities
    ? activities.filter((activity) => {
        // Apply tab filter - map the UI tab values to the actual activity types
        if (tab !== "all") {
          // Convert UI tab names to actual activity types
          const tabToTypeMap: Record<string, string[]> = {
            "business": ["business"],
            "youth": ["profile"],
            "mentor": ["mentor", "mentorship"]
          };
          
          const typesForTab = tabToTypeMap[tab];
          if (typesForTab && !typesForTab.includes(activity.type)) {
            return false;
          }
        }
        
        // Apply days filter (if implemented on the backend)
        
        // Apply search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const contentMatches = activity.content?.toLowerCase().includes(query);
          const typeMatches = activity.type.toLowerCase().includes(query);
          const titleMatches = activity.title?.toLowerCase().includes(query);
          
          return contentMatches || typeMatches || titleMatches;
        }
        
        return true;
      })
    : [];
  
  // Sort activities by date (newest first)
  const sortedActivities = [...(filteredActivities || [])].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Format timestamp for display
  const formatActivityDate = (timestamp: string) => {
    try {
      return format(parseISO(timestamp), "MMM d, yyyy");
    } catch (e) {
      return "Unknown date";
    }
  };

  // Format timestamp for time display
  const formatActivityTime = (timestamp: string) => {
    try {
      return format(parseISO(timestamp), "h:mm a");
    } catch (e) {
      return "";
    }
  };

  // Get the icon for the activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "business":
        return <ActivityIcon className="h-6 w-6" style={{ color: THEME.primary }} />;
      case "youth":
      case "profile": // Handle youth profiles
        return <ActivityIcon className="h-6 w-6" style={{ color: THEME.secondary }} />;
      case "mentor":
      case "mentorship": // Handle mentorship activities
        return <ActivityIcon className="h-6 w-6" style={{ color: THEME.accent }} />;
      default:
        return <ActivityIcon className="h-6 w-6" style={{ color: THEME.dark }} />;
    }
  };

  // Get the badge color for the activity type
  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case "business":
        return { bg: "#FF5F0010", text: THEME.primary };
      case "youth":
      case "profile": // Handle youth profiles
        return { bg: "#EB001B10", text: THEME.secondary };
      case "mentor":
      case "mentorship": // Handle mentorship activities
        return { bg: "#F79E1B10", text: THEME.accent };
      default:
        return { bg: "#1A1F7110", text: THEME.dark };
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <Skeleton className="h-12 w-full max-w-md mb-8 rounded-full" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Activities</h3>
            <p className="text-red-700">
              {error instanceof Error ? error.message : "An unknown error occurred"}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => refetch()}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
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
        >
          <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Recent System Activities
              </h1>
              <p className="text-gray-500 mt-1">
                View and track all recent activities across the platform
              </p>
            </div>
          </div>

          <Tabs 
            value={tab} 
            onValueChange={setTab}
            className="w-full"
          >
            {/* Tab controls and filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col xs:flex-row gap-3 w-full">
                <TabsList className="grid grid-cols-4 p-1 rounded-full w-full max-w-md" style={{ 
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #e5e7eb"
                }}>
                  <TabsTrigger 
                    value="all" 
                    className="rounded-full data-[state=active]:shadow-md transition-all duration-300 text-xs sm:text-sm"
                    style={{ 
                      color: tab === "all" ? "white" : THEME.dark,
                      background: tab === "all" 
                        ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                        : "transparent"
                    }}
                  >
                    All
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="business" 
                    className="rounded-full data-[state=active]:shadow-md transition-all duration-300 text-xs sm:text-sm"
                    style={{ 
                      color: tab === "business" ? "white" : THEME.dark,
                      background: tab === "business" 
                        ? `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.accent} 100%)`
                        : "transparent"
                    }}
                  >
                    Business
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="youth" 
                    className="rounded-full data-[state=active]:shadow-md transition-all duration-300 text-xs sm:text-sm"
                    style={{ 
                      color: tab === "youth" ? "white" : THEME.dark,
                      background: tab === "youth" 
                        ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 100%)`
                        : "transparent"
                    }}
                  >
                    Youth
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="mentor" 
                    className="rounded-full data-[state=active]:shadow-md transition-all duration-300 text-xs sm:text-sm"
                    style={{ 
                      color: tab === "mentor" ? "white" : THEME.dark,
                      background: tab === "mentor" 
                        ? `linear-gradient(135deg, ${THEME.accent} 0%, ${THEME.primary} 100%)`
                        : "transparent"
                    }}
                  >
                    Mentor
                  </TabsTrigger>
                </TabsList>

                <div className="flex gap-3 w-full sm:w-auto">
                  <Select value={daysFilter} onValueChange={setDaysFilter}>
                    <SelectTrigger 
                      className="w-full sm:w-[140px] h-10 bg-white border-gray-200"
                    >
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                        <SelectValue placeholder="Last 30 days" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative flex-1 max-w-sm">
                    <ListFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      placeholder="Search activities..." 
                      className="pl-9 h-10 border-gray-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* All Tab Content */}
            <TabsContent value="all" className="mt-0">
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Activity Timeline</CardTitle>
                  <CardDescription>
                    Recent activities from across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sortedActivities.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-4">
                        <Clock className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Activities Found</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        {searchQuery 
                          ? "No activities match your search criteria. Try a different search term."
                          : "There are no recent activities to display."}
                      </p>
                    </div>
                  ) : (
                    <motion.div 
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="space-y-4"
                    >
                      {sortedActivities.map((activity, index) => (
                        <motion.div 
                          key={activity.id} 
                          variants={cardVariant}
                          className="relative"
                        >
                          {/* Date separator if it's a new day */}
                          {index === 0 || formatActivityDate(activity.timestamp) !== formatActivityDate(sortedActivities[index - 1].timestamp) ? (
                            <div className="relative flex py-3">
                              <div className="flex items-center flex-grow">
                                <Separator className="flex-grow" />
                              </div>
                              <span className="flex-shrink-0 mx-4 text-xs text-gray-500">
                                {formatActivityDate(activity.timestamp)}
                              </span>
                              <div className="flex items-center flex-grow">
                                <Separator className="flex-grow" />
                              </div>
                            </div>
                          ) : null}

                          {/* Activity item */}
                          <div 
                            className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex gap-4"
                            onClick={() => {
                              // Navigate to the appropriate page based on activity type
                              const idParts = activity.id.split('-');
                              if (idParts.length >= 2) {
                                const type = idParts[0];
                                const id = idParts[1];
                                
                                if (type === 'business' && id) {
                                  navigate(`/businesses/${id}`);
                                } else if (type === 'profile' && id) {
                                  navigate(`/youth-profiles/${id}`);
                                } else if (type === 'mentor' && id) {
                                  navigate(`/mentors/${id}`);
                                }
                              }
                            }}
                          >
                            {/* Activity Icon */}
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: getActivityBadgeColor(activity.type).bg }}
                            >
                              {getActivityIcon(activity.type)}
                            </div>
                            
                            {/* Activity Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-medium text-gray-900 truncate">{activity.title}</h3>
                                <Badge 
                                  variant="outline" 
                                  className="ml-3 flex-shrink-0 text-xs"
                                  style={{ 
                                    color: getActivityBadgeColor(activity.type).text,
                                    borderColor: `${getActivityBadgeColor(activity.type).text}30`
                                  }}
                                >
                                  {activity.type === 'profile' ? 'Youth' : 
                                   activity.type === 'business' ? 'Business' : 
                                   activity.type === 'mentor' ? 'Mentor' : 
                                   activity.type === 'mentorship' ? 'Mentorship' :
                                   activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                                </Badge>
                              </div>
                              
                              <p className="text-gray-600 text-sm line-clamp-2">{activity.content}</p>
                              
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{formatActivityTime(activity.timestamp)}</span>
                                
                                {activity.user && (
                                  <div className="flex items-center ml-4">
                                    <Avatar className="h-4 w-4 mr-1">
                                      <AvatarFallback className="text-[8px]">
                                        {activity.user.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{activity.user}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* View Action */}
                            <div className="flex items-center self-center">
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Business Tab Content */}
            <TabsContent value="business" className="mt-0">
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Business Activities</CardTitle>
                  <CardDescription>
                    Recent activities related to businesses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sortedActivities.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-4">
                        <Clock className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Business Activities Found</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        {searchQuery 
                          ? "No business activities match your search criteria."
                          : "There are no recent business activities to display."}
                      </p>
                    </div>
                  ) : (
                    <motion.div 
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="space-y-4"
                    >
                      {sortedActivities.map((activity, index) => (
                        <motion.div 
                          key={activity.id} 
                          variants={cardVariant}
                          className="relative"
                        >
                          {/* Date separator if it's a new day */}
                          {index === 0 || formatActivityDate(activity.timestamp) !== formatActivityDate(sortedActivities[index - 1].timestamp) ? (
                            <div className="relative flex py-3">
                              <div className="flex items-center flex-grow">
                                <Separator className="flex-grow" />
                              </div>
                              <span className="flex-shrink-0 mx-4 text-xs text-gray-500">
                                {formatActivityDate(activity.timestamp)}
                              </span>
                              <div className="flex items-center flex-grow">
                                <Separator className="flex-grow" />
                              </div>
                            </div>
                          ) : null}
                          
                          <ActivityItem activity={activity} formatActivityTime={formatActivityTime} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Youth Tab Content */}
            <TabsContent value="youth" className="mt-0">
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Youth Profile Activities</CardTitle>
                  <CardDescription>
                    Recent activities related to youth profiles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sortedActivities.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-4">
                        <Clock className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Youth Activities Found</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        {searchQuery 
                          ? "No youth profile activities match your search criteria."
                          : "There are no recent youth profile activities to display."}
                      </p>
                    </div>
                  ) : (
                    <motion.div 
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="space-y-4"
                    >
                      {sortedActivities.map((activity, index) => (
                        <motion.div 
                          key={activity.id} 
                          variants={cardVariant}
                          className="relative"
                        >
                          {/* Date separator if it's a new day */}
                          {index === 0 || formatActivityDate(activity.timestamp) !== formatActivityDate(sortedActivities[index - 1].timestamp) ? (
                            <div className="relative flex py-3">
                              <div className="flex items-center flex-grow">
                                <Separator className="flex-grow" />
                              </div>
                              <span className="flex-shrink-0 mx-4 text-xs text-gray-500">
                                {formatActivityDate(activity.timestamp)}
                              </span>
                              <div className="flex items-center flex-grow">
                                <Separator className="flex-grow" />
                              </div>
                            </div>
                          ) : null}
                          
                          <ActivityItem activity={activity} formatActivityTime={formatActivityTime} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mentor Tab Content */}
            <TabsContent value="mentor" className="mt-0">
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Mentor Activities</CardTitle>
                  <CardDescription>
                    Recent activities related to mentors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sortedActivities.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-4">
                        <Clock className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Mentor Activities Found</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        {searchQuery 
                          ? "No mentor activities match your search criteria."
                          : "There are no recent mentor activities to display."}
                      </p>
                    </div>
                  ) : (
                    <motion.div 
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="space-y-4"
                    >
                      {sortedActivities.map((activity, index) => (
                        <motion.div 
                          key={activity.id} 
                          variants={cardVariant}
                          className="relative"
                        >
                          {/* Date separator if it's a new day */}
                          {index === 0 || formatActivityDate(activity.timestamp) !== formatActivityDate(sortedActivities[index - 1].timestamp) ? (
                            <div className="relative flex py-3">
                              <div className="flex items-center flex-grow">
                                <Separator className="flex-grow" />
                              </div>
                              <span className="flex-shrink-0 mx-4 text-xs text-gray-500">
                                {formatActivityDate(activity.timestamp)}
                              </span>
                              <div className="flex items-center flex-grow">
                                <Separator className="flex-grow" />
                              </div>
                            </div>
                          ) : null}
                          
                          <ActivityItem activity={activity} formatActivityTime={formatActivityTime} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}