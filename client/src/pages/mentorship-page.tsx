import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mentor, BusinessProfile } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, 
  Search, 
  User, 
  Users, 
  Building2,
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Store, 
  ChevronRight,
  Filter,
  Plus,
  MessageCircle,
  BarChart4
} from "lucide-react";
import MessageList from "@/components/mentorship/message-list";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { useHasPermission } from "@/lib/permissions";

// Helper function for district names (normalized in database already)
const normalizeDistrictName = (district: string | null | string[]): string => {
  if (!district) return "";
  if (Array.isArray(district)) {
    // If district is an array (assignedDistricts), return the first one
    return district.length > 0 ? 
      (typeof district[0] === 'string' ? district[0] : "") : "";
  }
  return district;
};

// Helper function for message categories
export const getMessageCategoryName = (categoryId: string): string => {
  const categoryMap: Record<string, string> = {
    "operations": "Operations",
    "marketing": "Marketing",
    "finance": "Finance",
    "management": "Management",
    "strategy": "Business Strategy",
    "other": "Other"
  };
  
  return categoryMap[categoryId] || categoryId;
};

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

// Get service category name by ID
const getCategoryNameById = (id: number | null): string => {
  if (!id) return "Uncategorized";
  const categories = {
    1: "Building & Construction",
    2: "Food & Beverage",
    3: "Fashion & Apparel",
    4: "Beauty & Wellness",
    5: "Media & Creative Arts"
  };
  return categories[id as keyof typeof categories] || "Uncategorized";
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

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const slideInFromRight = {
  hidden: { x: 20, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export default function MentorshipPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("mentors");
  const [selectedMentor, setSelectedMentor] = useState<number | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Permission checks
  const canCreateMentor = useHasPermission("mentors", "create");
  const canCreateAssignment = useHasPermission("mentor_assignments", "create");

  // Fetch all mentors
  const { data: mentors, isLoading: isLoadingMentors, error: mentorsError } = useQuery<Mentor[]>({
    queryKey: ['/api/mentors'],
  });

  // Fetch all business profiles
  const { 
    data: businesses, 
    isLoading: isLoadingBusinesses, 
    error: businessesError 
  } = useQuery<BusinessProfile[]>({
    queryKey: ['/api/business-profiles'],
  });
  
  // Fetch mentor-business relationships
  const {
    data: mentorBusinessRelationships,
    isLoading: isLoadingRelationships,
    error: relationshipsError
  } = useQuery({
    queryKey: ['/api/mentor-businesses'],
    enabled: !!mentors && !!businesses,
  });
  
  // For a selected business, fetch the assigned mentors
  const {
    data: assignedMentorsForSelectedBusiness,
    isLoading: isLoadingAssignedMentors
  } = useQuery({
    queryKey: ['/api/mentor-businesses/business', selectedBusiness],
    enabled: !!selectedBusiness && !isLoadingMentors && !isLoadingBusinesses,
  });

  // Determine if user is a mentor
  const isMentor = user?.role === 'mentor';
  const isBusiness = user?.role === 'mentee'; // keeping mentee in check for backward compatibility

  // If user is a mentor, find their mentor profile
  const currentMentor = isMentor && mentors ? 
    mentors.find(mentor => mentor.userId === user.id) : null;

  // If user is a business owner/representative
  const userHasBusinesses = isBusiness && businesses && Array.isArray(businesses) ?
    businesses.some(business => business.businessName.toLowerCase().includes((user?.username || '').toLowerCase())) : false;

  // Filter mentors based on search query
  const filteredMentors = mentors?.filter(mentor => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      mentor.name.toLowerCase().includes(query) ||
      (mentor.email ? mentor.email.toLowerCase().includes(query) : false) ||
      (mentor.assignedDistrict ? mentor.assignedDistrict.toLowerCase().includes(query) : false)
    );
  });

  // Helper function to check if a business is assigned to a mentor
  const isBusinessAssignedToMentor = (businessId: number, mentorId: number) => {
    if (!mentorBusinessRelationships || !Array.isArray(mentorBusinessRelationships)) return false;
    
    return mentorBusinessRelationships.some(
      (rel: { businessId: number, mentorId: number }) => 
        rel.businessId === businessId && rel.mentorId === mentorId
    );
  };
  
  // Filter businesses based on search query, mentor-business relationships, and district
  const filteredBusinesses = businesses?.filter(business => {
    // If a mentor is selected, show only businesses assigned to this mentor
    if (selectedMentor && mentorBusinessRelationships) {
      // Check if this business is assigned to the selected mentor
      if (!isBusinessAssignedToMentor(business.id, selectedMentor)) {
        // If no relationship exists, fallback to district check
        const mentor = mentors?.find(m => m.id === selectedMentor);
        // Only show businesses in the same district as the mentor
        if (mentor) {
          // Normalize both district names for comparison
          const mentorDistrict = normalizeDistrictName(mentor.assignedDistrict);
          const businessDistrict = normalizeDistrictName(business.district);
          
          if (mentorDistrict && businessDistrict && mentorDistrict !== businessDistrict) {
            return false;
          }
        }
      }
    }

    // If user is a mentor, show only businesses from their district or assigned to them
    if (isMentor && currentMentor) {
      if (mentorBusinessRelationships && !isBusinessAssignedToMentor(business.id, currentMentor.id)) {
        // If no relationship exists, fallback to district check
        // Normalize both district names for comparison
        const mentorDistrict = normalizeDistrictName(currentMentor.assignedDistrict);
        const businessDistrict = normalizeDistrictName(business.district);
        
        if (mentorDistrict && businessDistrict && mentorDistrict !== businessDistrict) {
          return false;
        }
      }
    }

    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      business.businessName.toLowerCase().includes(query) ||
      business.district.toLowerCase().includes(query) ||
      (business.serviceCategoryId && business.serviceCategoryId.toString().toLowerCase().includes(query))
    );
  });

  // Initialize conversation if user is a mentor and shows a business directly
  useEffect(() => {
    if (isMentor && currentMentor && !selectedBusiness && filteredBusinesses && filteredBusinesses.length > 0) {
      setSelectedBusiness(filteredBusinesses[0].id);
    }

    if (isBusiness && userHasBusinesses && !selectedMentor && filteredMentors && filteredMentors.length > 0) {
      // Find mentor for user's district based on first business
      // Use businessYouthRelationships instead of youthIds
      const userBusiness = businesses?.find(b => {
        // Check business associations through API data
        return b.businessName.toLowerCase().includes((user?.username || '').toLowerCase());
      })?.district;
      
      if (userBusiness) {
        // Normalize the district name for comparison
        const normalizedBusinessDistrict = normalizeDistrictName(userBusiness);
        
        const districtMentor = filteredMentors.find(m => 
          normalizeDistrictName(m.assignedDistrict) === normalizedBusinessDistrict
        );
        
        if (districtMentor) {
          setSelectedMentor(districtMentor.id);
        }
      }
    }
  }, [isMentor, isBusiness, currentMentor, userHasBusinesses, filteredBusinesses, filteredMentors, selectedBusiness, selectedMentor, businesses, user]);

  // Determine if we're in conversation view
  const isConversationView = selectedMentor && selectedBusiness;

  // District name normalization moved to module level

  // Get district color
  const getDistrictColor = (district: string | null) => {
    if (!district) return "#6c757d";
    
    // Use the normalized district name
    const normalizedDistrict = normalizeDistrictName(district);
    
    switch(normalizedDistrict) {
      case "Bekwai": return THEME.secondary;
      case "Gushegu": return THEME.primary;
      case "Lower Manya Krobo": return THEME.accent;
      case "Yilo Krobo": return THEME.dark;
      default: return "#6c757d";
    }
  };

  return (
    <DashboardLayout>
      <div className="md:py-8 px-4 md:px-8 max-w-7xl mx-auto">
        {isConversationView ? (
          <>
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="mb-8 flex justify-between items-center"
            >
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="rounded-full mr-3 hover:bg-gray-100 transition-colors duration-300"
                  onClick={() => {
                    setSelectedMentor(null);
                    setSelectedBusiness(null);
                  }}
                >
                  <ArrowLeft className="h-5 w-5" style={{ color: THEME.primary }} />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: THEME.dark }}>Business Advisory</h1>
                  <p className="text-gray-500 text-sm">
                    {mentors?.find(m => m.id === selectedMentor)?.name} & {businesses?.find(b => b.id === selectedBusiness)?.businessName}
                  </p>
                </div>
              </div>

              <Button
                className="shadow-sm hover:shadow-md transition-all duration-300"
                style={{ 
                  background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                  border: "none" 
                }}
                onClick={() => {
                  // View business details
                  navigate(`/businesses/${selectedBusiness}`);
                }}
              >
                View Business
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border border-gray-100 shadow-md overflow-hidden">
                <MessageList mentorId={selectedMentor} businessId={selectedBusiness} />
              </Card>
            </motion.div>
          </>
        ) : (
          <>
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <Header 
                title="Business Mentorship" 
                description="Connect businesses with expert mentors for guidance and support"
                showActions={canCreateMentor || canCreateAssignment}
                onAddNew={canCreateMentor ? () => navigate("/mentors/new") : undefined}
                addNewText="Add Mentor"
              />
            </motion.div>

            {/* Search bar and Filters - Enhanced with Mastercard styling */}
            <motion.div 
              className="mb-8 flex flex-col md:flex-row gap-4"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div className="relative flex-1" variants={fadeIn}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="Search mentors or businesses..." 
                  className="pl-9 border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1 transition-all duration-300"
                  style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </motion.div>
            </motion.div>

            {/* Tabs for mentors and mentees */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Tabs 
                defaultValue={activeTab} 
                value={activeTab}
                onValueChange={setActiveTab}
                className="mb-6"
              >
                <TabsList 
                  className="grid w-full max-w-md grid-cols-2 p-1 rounded-full"
                  style={{ 
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb"
                  }}
                >
                  <TabsTrigger 
                    value="mentors" 
                    className="rounded-full data-[state=active]:shadow-md transition-all duration-300"
                    style={{ 
                      color: activeTab === "mentors" ? "white" : THEME.dark,
                      background: activeTab === "mentors" 
                        ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                        : "transparent"
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Mentors
                  </TabsTrigger>
                  <TabsTrigger 
                    value="businesses" 
                    className="rounded-full data-[state=active]:shadow-md transition-all duration-300"
                    style={{ 
                      color: activeTab === "businesses" ? "white" : THEME.dark,
                      background: activeTab === "businesses" 
                        ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                        : "transparent"
                    }}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Businesses
                  </TabsTrigger>
                </TabsList>

                {/* Mentors Tab */}
                <TabsContent value="mentors" className="mt-8">
                  {isLoadingMentors ? (
                    <div className="flex justify-center items-center py-32">
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
                        <p className="mt-4 text-gray-500">Loading mentors...</p>
                      </div>
                    </div>
                  ) : mentorsError ? (
                    <div className="text-center py-16 px-4">
                      <div className="inline-block p-4 rounded-full bg-red-50 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load mentors</h3>
                      <p className="text-gray-500 mb-4">{mentorsError.message}</p>
                      <Button 
                        onClick={() => window.location.reload()}
                        style={{ 
                          background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                          border: "none" 
                        }}
                        className="shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : filteredMentors?.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <div className="inline-block p-4 rounded-full" style={{ backgroundColor: `${THEME.primary}10` }}>
                        <Users className="h-10 w-10" style={{ color: THEME.primary }} />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">No mentors found</h3>
                      <p className="text-gray-500 mb-4">No mentors match your search criteria</p>
                      <Button 
                        onClick={() => {
                          setSearchQuery("");
                        }}
                        style={{ 
                          background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                          border: "none" 
                        }}
                        className="shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr"
                      initial="hidden"
                      animate="visible"
                      variants={staggerContainer}
                    >
                      {filteredMentors?.map((mentor, index) => (
                        <motion.div
                          key={mentor.id}
                          variants={slideInFromRight}
                          transition={{ delay: index * 0.1 }}
                          onMouseEnter={() => setHoveredCard(`mentor-${mentor.id}`)}
                          onMouseLeave={() => setHoveredCard(null)}
                        >
                          <Card 
                            className="border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 h-full flex flex-col"
                            style={{ 
                              boxShadow: hoveredCard === `mentor-${mentor.id}` ? '0 10px 30px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
                              transform: hoveredCard === `mentor-${mentor.id}` ? 'translateY(-5px)' : 'translateY(0)',
                              borderLeft: selectedMentor === mentor.id ? `4px solid ${THEME.primary}` : '4px solid transparent'
                            }}
                            onClick={() => {
                              setSelectedMentor(mentor.id);
                              setActiveTab("businesses");
                            }}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                {/* Show assigned districts as badges */}
                                {mentor.assignedDistricts && Array.isArray(mentor.assignedDistricts) && mentor.assignedDistricts.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {mentor.assignedDistricts.map((district, idx) => (
                                      <Badge 
                                        key={idx}
                                        className="text-white shadow-sm transition-all duration-300"
                                        style={{ 
                                          backgroundColor: getDistrictColor(district as string),
                                          transform: hoveredCard === `mentor-${mentor.id}` ? 'scale(1.05)' : 'scale(1)'
                                        }}
                                      >
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {typeof district === 'string' ? district : ''}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <Badge 
                                    className="text-white shadow-sm transition-all duration-300"
                                    style={{ 
                                      backgroundColor: getDistrictColor(mentor.assignedDistrict),
                                      transform: hoveredCard === `mentor-${mentor.id}` ? 'scale(1.05)' : 'scale(1)'
                                    }}
                                  >
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {mentor.assignedDistrict}
                                  </Badge>
                                )}
                                <Badge 
                                  className="bg-green-100 text-green-700 border-green-200"
                                  style={{ 
                                    opacity: hoveredCard === `mentor-${mentor.id}` ? 1 : 0.9,
                                    transform: hoveredCard === `mentor-${mentor.id}` ? 'scale(1.05)' : 'scale(1)'
                                  }}
                                >
                                  Active
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-6 flex flex-col flex-1 justify-between">
                              <div className="flex items-start mb-4">
                                <Avatar className="h-14 w-14 mr-4 border-2 flex-shrink-0 transition-all duration-300" style={{ 
                                  borderColor: hoveredCard === `mentor-${mentor.id}` ? 
                                    (mentor.assignedDistricts && Array.isArray(mentor.assignedDistricts) && mentor.assignedDistricts.length > 0 ? 
                                      getDistrictColor(mentor.assignedDistricts[0] as string) : 
                                      getDistrictColor(mentor.assignedDistrict)
                                    ) : 'transparent' 
                                }}>
                                  <AvatarFallback style={{ 
                                    background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}20 50%, ${THEME.accent}20 100%)` 
                                  }}>
                                    <User className="h-6 w-6 text-gray-700" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="w-full min-w-0">
                                  <h3 className="font-bold text-lg break-words line-clamp-2" style={{ color: THEME.dark }}>{mentor.name}</h3>
                                  <p className="text-sm text-gray-500 flex items-center mt-1">
                                    <Mail className="h-3 w-3 mr-1 flex-shrink-0" /> 
                                    <span className="truncate">{mentor.email || 'No email available'}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="mb-4 pb-4 border-b border-gray-100">
                                <p className="text-sm text-gray-600 line-clamp-3">
                                  {mentor.specialization || mentor.bio || 'No profile information available'}
                                </p>
                              </div>

                              <div className="space-y-4 mt-auto">
                                <div className="flex items-center text-sm">
                                  <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="text-gray-500 truncate">{mentor.phone}</span>
                                </div>
                                
                                <div className="flex justify-end">
                                  <motion.div whileHover={{ x: 5 }}>
                                    <Button 
                                      size="sm" 
                                      className="shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap"
                                      style={{ 
                                        background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                                        border: "none" 
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedMentor(mentor.id);
                                        setActiveTab("businesses");
                                      }}
                                    >
                                      <Users className="mr-2 h-4 w-4" />
                                      View Businesses
                                      <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </TabsContent>

                {/* Businesses Tab */}
                <TabsContent value="businesses" className="mt-8">
                  {isMentor && !selectedMentor && currentMentor && (
                    <motion.div 
                      className="mb-6 p-4 rounded-xl relative overflow-hidden"
                      style={{ backgroundColor: `${THEME.accent}10` }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ 
                        backgroundColor: `${THEME.accent}10`,
                        zIndex: 0
                      }}></div>
                      <div className="relative z-10 flex items-center">
                        <Filter className="h-5 w-5 mr-3" style={{ color: THEME.accent }} />
                        <div>
                          <p className="text-gray-700 mb-1">
                            {currentMentor.assignedDistricts && Array.isArray(currentMentor.assignedDistricts) && currentMentor.assignedDistricts.length > 1 ? 
                              "Showing businesses in your assigned districts:" : 
                              "Showing businesses in your assigned district:"}
                          </p>
                          {currentMentor.assignedDistricts && Array.isArray(currentMentor.assignedDistricts) && currentMentor.assignedDistricts.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {currentMentor.assignedDistricts.map((district, idx) => (
                                <Badge 
                                  key={idx}
                                  className="text-white shadow-sm"
                                  style={{ backgroundColor: getDistrictColor(district as string) }}
                                >
                                  {typeof district === 'string' ? district : ''}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="font-semibold" style={{ color: THEME.dark }}>{currentMentor.assignedDistrict}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {selectedMentor && mentors && (
                    <motion.div 
                      className="mb-8"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="border border-gray-100 shadow-md overflow-hidden">
                        <div className="h-1 w-full" style={{ 
                          background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})`
                        }}></div>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center" style={{ color: THEME.dark }}>
                            <Users className="h-5 w-5 mr-2" style={{ color: THEME.primary }} />
                            Selected Mentor: {mentors.find(m => m.id === selectedMentor)?.name}
                          </CardTitle>
                          <CardDescription>
                            <div className="flex items-center mb-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {mentors.find(m => m.id === selectedMentor)?.assignedDistricts && 
                               Array.isArray(mentors.find(m => m.id === selectedMentor)?.assignedDistricts) && 
                               (mentors.find(m => m.id === selectedMentor)?.assignedDistricts as string[]).length > 1 ? 
                                'Districts:' : 'District:'}
                            </div>
                            <div className="flex flex-wrap gap-1 pl-4">
                              {/* Show assigned districts as badges */}
                              {(() => {
                                const mentor = mentors.find(m => m.id === selectedMentor);
                                if (mentor?.assignedDistricts && Array.isArray(mentor.assignedDistricts) && mentor.assignedDistricts.length > 0) {
                                  return mentor.assignedDistricts.map((district, idx) => (
                                    <Badge 
                                      key={idx}
                                      className="text-white shadow-sm"
                                      style={{ backgroundColor: getDistrictColor(district as string) }}
                                    >
                                      {typeof district === 'string' ? district : ''}
                                    </Badge>
                                  ));
                                } else if (mentor?.assignedDistrict) {
                                  return (
                                    <Badge 
                                      className="text-white shadow-sm"
                                      style={{ backgroundColor: getDistrictColor(mentor.assignedDistrict) }}
                                    >
                                      {mentor.assignedDistrict}
                                    </Badge>
                                  );
                                }
                                return <span className="text-gray-500">No district assigned</span>;
                              })()}
                            </div>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Button 
                            variant="outline"
                            className="border-gray-200 hover:border-gray-300 transition-all duration-300"
                            onClick={() => setSelectedMentor(null)}
                          >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to All Mentors
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                  
                  {/* Show assigned mentors for selected business if no mentor is selected */}
                  {selectedBusiness && !selectedMentor && businesses && (
                    <motion.div 
                      className="mb-8"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="border border-gray-100 shadow-md overflow-hidden">
                        <div className="h-1 w-full" style={{ 
                          background: `linear-gradient(to right, ${THEME.accent}, ${THEME.primary}, ${THEME.secondary})`
                        }}></div>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center" style={{ color: THEME.dark }}>
                            <Building2 className="h-5 w-5 mr-2" style={{ color: THEME.primary }} />
                            Selected Business: {businesses.find(b => b.id === selectedBusiness)?.businessName}
                          </CardTitle>
                          <CardDescription className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            District: {businesses.find(b => b.id === selectedBusiness)?.district}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Assigned Mentors:</h4>
                            {isLoadingAssignedMentors ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                <span className="ml-2 text-sm text-gray-500">Loading assigned mentors...</span>
                              </div>
                            ) : assignedMentorsForSelectedBusiness && Array.isArray(assignedMentorsForSelectedBusiness) && assignedMentorsForSelectedBusiness.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {assignedMentorsForSelectedBusiness.map((assignedMentor: any) => (
                                  <Badge 
                                    key={assignedMentor.id}
                                    className="bg-green-100 text-green-700 border-green-200 py-1.5 flex items-center"
                                  >
                                    <User className="h-3 w-3 mr-1" />
                                    {assignedMentor.name}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No mentors assigned to this business yet.</p>
                            )}
                          </div>
                          
                          <Button 
                            variant="outline"
                            className="border-gray-200 hover:border-gray-300 transition-all duration-300"
                            onClick={() => setSelectedBusiness(null)}
                          >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to All Businesses
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {isLoadingBusinesses ? (
                    <div className="flex justify-center items-center py-32">
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
                        <p className="mt-4 text-gray-500">Loading businesses...</p>
                      </div>
                    </div>
                  ) : businessesError ? (
                    <div className="text-center py-16 px-4">
                      <div className="inline-block p-4 rounded-full bg-red-50 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load businesses</h3>
                      <p className="text-gray-500 mb-4">{businessesError.message}</p>
                      <Button 
                        onClick={() => window.location.reload()}
                        style={{ 
                          background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                          border: "none" 
                        }}
                        className="shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : filteredBusinesses?.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <div className="inline-block p-4 rounded-full" style={{ backgroundColor: `${THEME.primary}10` }}>
                        <User className="h-10 w-10" style={{ color: THEME.primary }} />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">No businesses found</h3>
                      <p className="text-gray-500 mb-4">No businesses match your search criteria</p>
                      <Button 
                        onClick={() => {
                          setSearchQuery("");
                        }}
                        style={{ 
                          background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                          border: "none" 
                        }}
                        className="shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr"
                      initial="hidden"
                      animate="visible"
                      variants={staggerContainer}
                    >
                      {filteredBusinesses?.map((business, index) => (
                        <motion.div
                          key={business.id}
                          variants={slideInFromRight}
                          transition={{ delay: index * 0.1 }}
                          onMouseEnter={() => setHoveredCard(`business-${business.id}`)}
                          onMouseLeave={() => setHoveredCard(null)}
                        >
                          <Card 
                            className="border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300"
                            style={{ 
                              boxShadow: hoveredCard === `business-${business.id}` ? '0 10px 30px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
                              transform: hoveredCard === `business-${business.id}` ? 'translateY(-5px)' : 'translateY(0)',
                              borderLeft: selectedBusiness === business.id ? `4px solid ${THEME.primary}` : '4px solid transparent'
                            }}
                            onClick={() => {
                              if (selectedMentor || (isMentor && currentMentor)) {
                                setSelectedBusiness(business.id);
                              } else {
                                setActiveTab("mentors");
                              }
                            }}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <Badge 
                                  className="text-white shadow-sm transition-all duration-300"
                                  style={{ 
                                    backgroundColor: getDistrictColor(business.district),
                                    transform: hoveredCard === `business-${business.id}` ? 'scale(1.05)' : 'scale(1)'
                                  }}
                                >
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {business.district}
                                </Badge>
                                <div className="flex space-x-2">
                                  {/* If selected mentor exists, show whether this business is assigned to them */}
                                  {selectedMentor && (
                                    <Badge 
                                      className={
                                        isBusinessAssignedToMentor(business.id, selectedMentor)
                                          ? "bg-green-100 text-green-700 border-green-200"
                                          : "bg-gray-100 text-gray-700 border-gray-200"
                                      }
                                      style={{ 
                                        opacity: hoveredCard === `business-${business.id}` ? 1 : 0.9,
                                        transform: hoveredCard === `business-${business.id}` ? 'scale(1.05)' : 'scale(1)'
                                      }}
                                    >
                                      <User className="h-3 w-3 mr-1" />
                                      {isBusinessAssignedToMentor(business.id, selectedMentor) ? 'Assigned' : 'Unassigned'}
                                    </Badge>
                                  )}
                                  <Badge 
                                    className="bg-blue-100 text-blue-700 border-blue-200"
                                    style={{ 
                                      opacity: hoveredCard === `business-${business.id}` ? 1 : 0.9,
                                      transform: hoveredCard === `business-${business.id}` ? 'scale(1.05)' : 'scale(1)'
                                    }}
                                  >
                                    <Store className="h-3 w-3 mr-1" />
                                    {business.dareModel || 'Standard'}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center mb-4">
                                <Avatar className="h-14 w-14 mr-4 border-2 transition-all duration-300" style={{ 
                                  borderColor: hoveredCard === `business-${business.id}` ? getDistrictColor(business.district) : 'transparent' 
                                }}>
                                  <AvatarImage src={business.businessLogo || ''} alt={business.businessName} />
                                  <AvatarFallback style={{ 
                                    background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}20 50%, ${THEME.accent}20 100%)` 
                                  }}>
                                    {business.businessName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-bold text-lg" style={{ color: THEME.dark }}>{business.businessName}</h3>
                                  <p className="text-sm text-gray-500">
                                    {business.businessContact || 'No contact info'}
                                  </p>
                                </div>
                              </div>

                              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: `${THEME.accent}10` }}>
                                <p className="text-sm font-medium flex items-center mb-1" style={{ color: THEME.dark }}>
                                  <Store className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                                  {business.serviceCategoryId ? getCategoryNameById(business.serviceCategoryId) : 'No category specified'}
                                </p>
                                <p className="text-xs text-gray-600 ml-6">{business.businessDescription ? business.businessDescription.substring(0, 50) + '...' : 'No description available'}</p>
                              </div>

                              <Separator className="my-3 opacity-50" />

                              <div className="flex justify-between items-center text-sm mt-2">
                                <span className="text-gray-500 flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {business.businessLocation || business.district}
                                </span>
                                {(selectedMentor || (isMentor && currentMentor)) && (
                                  <motion.div whileHover={{ x: 5 }}>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      {/* Active business tracking button */}
                                      <Button 
                                        size="sm" 
                                        variant="secondary"
                                        className="shadow-sm hover:shadow-md transition-all duration-300"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          navigate(`/businesses/${business.id}/performance`);
                                        }}
                                      >
                                        <BarChart4 className="mr-2 h-4 w-4" />
                                        <span className="whitespace-nowrap">View Performance</span>
                                      </Button>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}