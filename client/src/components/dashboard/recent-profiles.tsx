import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { YouthProfile } from "@shared/schema";
import { 
  Search, 
  Eye, 
  Edit, 
  BarChart2, 
  UserCheck, 
  ChevronRight, 
  UserPlus,
  AlertCircle 
} from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

// Animation variants
const containerVariant = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05
    }
  }
};

const rowVariant = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export default function RecentProfiles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const { data: profiles, isLoading, error } = useQuery<YouthProfile[]>({
    queryKey: ["/api/youth-profiles"],
  });

  // Filter profiles by search query
  const filteredProfiles = profiles?.filter(profile => 
    profile.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (profile.businessName && profile.businessName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get district color
  const getDistrictColor = (district: string) => {
    if (district.includes("Bekwai")) return THEME.secondary;
    if (district.includes("Gushegu")) return THEME.primary;
    if (district.includes("Lower Manya")) return THEME.accent;
    if (district.includes("Yilo Krobo")) return THEME.dark;
    return "#6c757d";
  };

  return (
    <Card className="border-gray-100 shadow-md overflow-hidden h-full">
      <CardHeader className="px-6 py-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full flex items-center justify-center mr-3" style={{ 
              background: `linear-gradient(135deg, ${THEME.dark}20 0%, ${THEME.dark}10 100%)` 
            }}>
              <UserCheck className="h-5 w-5" style={{ color: THEME.dark }} />
            </div>
            <CardTitle className="text-lg font-bold" style={{ color: THEME.dark }}>Recent Profiles</CardTitle>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search profiles..."
                className="pl-9 pr-3 py-2 text-sm border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Link href="/youth-profiles">
              <Button 
                variant="ghost" 
                size="sm" 
                className="whitespace-nowrap group"
                style={{ color: THEME.dark }}
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center p-3 rounded-lg border border-gray-100">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="ml-4 flex-1">
                <Skeleton className="h-4 w-36 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="ml-4">
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6">
          <div className="flex items-center p-4 rounded-lg bg-red-50 border border-red-100">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Error loading profiles</p>
              <p className="text-xs text-red-700 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {filteredProfiles && filteredProfiles.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ 
                background: `linear-gradient(135deg, ${THEME.primary}10 0%, ${THEME.dark}10 100%)` 
              }}>
                <UserPlus className="h-8 w-8" style={{ color: THEME.primary }} />
              </div>
              <p className="text-gray-700 font-medium">No profiles found</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">Try adjusting your search criteria</p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <CardContent className="p-0">
              <motion.div 
                variants={containerVariant}
                initial="hidden"
                animate="visible"
                className="divide-y divide-gray-100"
              >
                {filteredProfiles?.slice(0, 5).map((profile) => (
                  <motion.div
                    key={profile.id}
                    variants={rowVariant}
                    className="flex items-center justify-between p-4 cursor-pointer transition-all duration-300"
                    style={{
                      backgroundColor: hoveredRow === profile.id ? '#f9fafb' : 'white',
                      transform: hoveredRow === profile.id ? 'translateX(5px)' : 'translateX(0)',
                    }}
                    onMouseEnter={() => setHoveredRow(profile.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => window.location.href = `/youth-profiles/${profile.id}`}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 border-2 transition-all duration-300" style={{ 
                        borderColor: hoveredRow === profile.id ? THEME.primary : 'transparent' 
                      }}>
                        <AvatarImage src={profile.profilePicture} alt={profile.fullName} />
                        <AvatarFallback style={{ 
                          background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}20 50%, ${THEME.accent}20 100%)` 
                        }}>
                          {profile.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="text-sm font-bold" style={{ color: THEME.dark }}>{profile.fullName}</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Badge 
                            className="mr-2 px-1.5 py-0 text-xs text-white"
                            style={{ backgroundColor: getDistrictColor(profile.district) }}
                          >
                            {profile.district.split(',')[0]}
                          </Badge>
                          {profile.businessName ? profile.businessName : 'No business yet'}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/youth-profiles/${profile.id}`}>
                              <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-50 transition-colors" onClick={(e) => e.stopPropagation()}>
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Profile</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/youth-profiles/${profile.id}/edit`}>
                              <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-50 transition-colors" onClick={(e) => e.stopPropagation()}>
                                <Edit className="h-4 w-4 text-amber-600" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Profile</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Business tracking button removed as part of new tracking system implementation */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-full hover:bg-green-50 transition-colors opacity-50" 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Feature removed as part of new tracking system implementation
                              }}
                              disabled={true}
                            >
                              <BarChart2 className="h-4 w-4 text-green-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Business Data (Coming Soon)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Showing {filteredProfiles?.slice(0, 5).length || 0} of {filteredProfiles?.length || 0} profiles
                </div>
                <Link href="/youth-profiles">
                  <Button 
                    size="sm"
                    className="shadow-sm hover:shadow-md transition-all duration-300"
                    style={{ 
                      background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                      border: "none"
                    }}
                  >
                    View All Profiles
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          )}
        </>
      )}
    </Card>
  );
}