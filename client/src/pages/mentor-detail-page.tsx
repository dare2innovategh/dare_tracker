import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mentor, BusinessProfile, MentorBusinessRelationship } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { 
  UserCog, 
  MapPin, 
  Mail, 
  Phone, 
  Briefcase, 
  ArrowLeft, 
  Edit, 
  Calendar,
  CheckCircle2,
  GraduationCap,
  FileText,
  Building2,
  Loader2,
  FileQuestion,
  Clock,
  Store,
  Eye,
  Tag,
  PlusCircle,
  AlertTriangle
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Mastercard color theme - matching other pages
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

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
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

export default function MentorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState("overview");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Fetch mentor details
  const {
    data: mentor,
    isLoading: isLoadingMentor,
    error: mentorError,
  } = useQuery<Mentor>({
    queryKey: [`/api/mentors/${id}`],
    enabled: !!id,
  });

  // Fetch mentor-business relationships (API returns businesses directly)
  const {
    data: assignedBusinessData,
    isLoading: isLoadingRelationships,
    error: relationshipsError,
  } = useQuery<BusinessProfile[]>({
    queryKey: [`/api/mentor-businesses/mentor/${id}`],
    enabled: !!id,
  });
  
  // Fetch all mentor-business relationships to get details like assignedDate
  const {
    data: allRelationships,
  } = useQuery<MentorBusinessRelationship[]>({
    queryKey: ['/api/mentor-businesses'],
    enabled: !!id,
  });

  // Fetch all businesses for reference
  const {
    data: businesses,
    isLoading: isLoadingBusinesses,
    error: businessesError,
  } = useQuery<BusinessProfile[]>({
    queryKey: ['/api/business-profiles'],
  });

  // Get district color
  const getDistrictColor = (district: string | null) => {
    if (!district) return "#6c757d";
    if (district.includes("Bekwai")) return THEME.secondary;
    if (district.includes("Gushegu")) return THEME.primary;
    if (district.includes("Lower Manya")) return THEME.accent;
    if (district.includes("Yilo Krobo")) return THEME.dark;
    return "#6c757d";
  };

  // Get model color
  const getModelColor = (model: string) => {
    switch (model) {
      case "Collaborative":
        return { bg: THEME.primary, text: "white" };
      case "MakerSpace":
        return { bg: THEME.secondary, text: "white" };
      case "Madam Anchor":
        return { bg: THEME.accent, text: THEME.dark };
      default:
        return { bg: "#6c757d", text: "white" };
    }
  };

  // Get business name by ID
  const getBusinessName = (businessId: number) => {
    const business = businesses?.find(b => b.id === businessId);
    return business ? business.businessName : 'Unknown Business';
  };

  // Get business district by ID
  const getBusinessDistrict = (businessId: number) => {
    const business = businesses?.find(b => b.id === businessId);
    return business ? business.district : 'Unknown';
  };

  // Get business model by ID
  const getBusinessModel = (businessId: number) => {
    const business = businesses?.find(b => b.id === businessId);
    return business ? business.dareModel : '';
  };

  // Loading state
  if (isLoadingMentor || isLoadingRelationships || isLoadingBusinesses) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10 px-4">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full" style={{ backgroundColor: `${THEME.secondary}20` }}></div>
              <div className="w-24 h-24 rounded-full absolute top-0 left-0" style={{ 
                borderTopColor: THEME.secondary, 
                borderRightColor: 'transparent', 
                borderBottomColor: 'transparent', 
                borderLeftColor: THEME.primary, 
                borderWidth: '4px', 
                animation: 'spin 1s linear infinite' 
              }}></div>
            </div>
            <h3 className="text-xl font-medium mb-2" style={{ color: THEME.dark }}>
              Loading Mentor Data
            </h3>
            <p className="text-gray-500">Please wait while we fetch the mentor information</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error or not found state
  if (mentorError || !mentor) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10 px-4">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-xl p-10 text-center shadow-sm"
          >
            <div className="inline-block p-4 rounded-full bg-blue-100 mb-4">
              <FileQuestion className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-blue-700 mb-3">Mentor Not Found</h3>
            <p className="text-blue-600 mb-6">
              The requested mentor could not be found. They may have been deleted or you may not have permission to view this profile.
            </p>
            <Button 
              className="shadow-sm hover:shadow-md transition-all duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                border: "none" 
              }}
              onClick={() => navigate("/mentors")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Mentors
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Use the business data returned directly by the API
  const assignedBusinesses = assignedBusinessData || [];
  
  // Find relationship details for each business (like assignment date)
  const getRelationshipForBusiness = (businessId: number) => {
    return allRelationships?.find(rel => 
      rel.mentorId === parseInt(id as string) && rel.businessId === businessId
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10 px-4">
        {/* Header with back button */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
        >
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/mentors")}
              className="mr-4 rounded-full hover:bg-gray-100 transition-colors duration-300"
              style={{ color: THEME.primary }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: THEME.dark }}>{mentor.name}</h1>
              <div className="flex flex-wrap items-center mt-1 gap-2">
                {/* District badges - prefer showing multiple when available */}
                {mentor.assignedDistricts && Array.isArray(mentor.assignedDistricts) && mentor.assignedDistricts.length > 0 ? (
                  mentor.assignedDistricts.map((district, index) => (
                    <Badge 
                      key={index}
                      className="text-white shadow-sm"
                      style={{ backgroundColor: typeof district === 'string' ? getDistrictColor(district) : '#6c757d' }}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      {typeof district === 'string' ? district.split(',')[0] : 'Unknown District'}
                    </Badge>
                  ))
                ) : mentor.assignedDistrict ? (
                  <Badge 
                    className="text-white shadow-sm"
                    style={{ backgroundColor: getDistrictColor(mentor.assignedDistrict) }}
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    {mentor.assignedDistrict.split(',')[0]}
                  </Badge>
                ) : null}
                
                {/* Specialization */}
                {mentor.specialization && (
                  <p className="text-gray-500 flex items-center">
                    <GraduationCap className="h-3.5 w-3.5 mr-1" />
                    {mentor.specialization}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="border-gray-200 hover:border-gray-300 transition-all duration-300 group"
              onClick={() => navigate(`/mentors/${id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" style={{ color: THEME.accent }} />
              Edit Mentor
            </Button>
            <Button
              variant="outline"
              className="border-gray-200 hover:border-gray-300 transition-all duration-300 group"
              onClick={() => navigate(`/mentor-assignment?mentorId=${id}`)}
            >
              <Briefcase className="mr-2 h-4 w-4" style={{ color: THEME.primary }} />
              Manage Assignments
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <Tabs 
            value={tab} 
            onValueChange={setTab} 
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
                value="overview" 
                className="rounded-full data-[state=active]:shadow-md transition-all duration-300"
                style={{ 
                  color: tab === "overview" ? "white" : THEME.dark,
                  background: tab === "overview" 
                    ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                    : "transparent"
                }}
              >
                <UserCog className="mr-2 h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="businesses" 
                className="rounded-full data-[state=active]:shadow-md transition-all duration-300"
                style={{ 
                  color: tab === "businesses" ? "white" : THEME.dark,
                  background: tab === "businesses" 
                    ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                    : "transparent"
                }}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Businesses ({assignedBusinesses?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8 mt-6">
              {/* Overview Section */}
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {/* Mentor Details */}
                <motion.div variants={cardVariant}>
                  <Card className="border-gray-100 shadow-md overflow-hidden h-full">
                    <div className="h-1 w-full" style={{ 
                      background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary})` 
                    }}></div>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-lg" style={{ color: THEME.dark }}>
                        <div className="h-9 w-9 rounded-full flex items-center justify-center mr-3" style={{ 
                          background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}10 100%)` 
                        }}>
                          <UserCog className="h-5 w-5" style={{ color: THEME.primary }} />
                        </div>
                        <div className="flex items-center">
                          Mentor Profile
                          {mentor.isActive && (
                            <Badge className="ml-2 bg-green-100 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex justify-center mb-4">
                        <Avatar className="h-32 w-32">
                          <AvatarImage src={mentor.profilePicture || undefined} alt={mentor.name} />
                          <AvatarFallback className="text-3xl bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700">
                            {mentor.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="p-5 rounded-lg bg-gray-50">
                        <div className="space-y-6">
                          <div>
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <UserCog className="h-4 w-4 mr-2 text-gray-400" />
                              Full Name
                            </span>
                            <p className="mt-1 pl-6 text-gray-700 font-medium">
                              {mentor.name}
                            </p>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              {mentor.assignedDistricts && Array.isArray(mentor.assignedDistricts) && mentor.assignedDistricts.length > 0 ? 
                                "Assigned Districts" : "Assigned District"}
                            </span>
                            <div className="mt-1 pl-6">
                              {/* Show assigned districts - prefer the array if available */}
                              {mentor.assignedDistricts && Array.isArray(mentor.assignedDistricts) && mentor.assignedDistricts.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {mentor.assignedDistricts.map((district, index) => (
                                    <Badge 
                                      key={index}
                                      className="text-white"
                                      style={{ backgroundColor: getDistrictColor(district as string) }}
                                    >
                                      {typeof district === 'string' ? district.split(',')[0] : 'Unknown'}
                                    </Badge>
                                  ))}
                                </div>
                              ) : mentor.assignedDistrict ? (
                                <Badge 
                                  className="text-white"
                                  style={{ backgroundColor: getDistrictColor(mentor.assignedDistrict) }}
                                >
                                  {mentor.assignedDistrict.split(',')[0]}
                                </Badge>
                              ) : (
                                <span className="text-gray-500 italic">No districts assigned</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              Email Address
                            </span>
                            <p className="mt-1 pl-6 text-gray-700">
                              {mentor.email || "No email address provided"}
                            </p>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              Phone Number
                            </span>
                            <p className="mt-1 pl-6 text-gray-700">
                              {mentor.phone || "No phone number provided"}
                            </p>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              Joined Date
                            </span>
                            <p className="mt-1 pl-6 text-gray-700">
                              {mentor.createdAt
                                ? formatDate(mentor.createdAt)
                                : "Not specified"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Specialization and Additional Info */}
                <motion.div variants={cardVariant}>
                  <Card className="border-gray-100 shadow-md overflow-hidden h-full">
                    <div className="h-1 w-full" style={{ 
                      background: `linear-gradient(to right, ${THEME.primary}, ${THEME.accent})` 
                    }}></div>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-lg" style={{ color: THEME.dark }}>
                        <div className="h-9 w-9 rounded-full flex items-center justify-center mr-3" style={{ 
                          background: `linear-gradient(135deg, ${THEME.primary}20 0%, ${THEME.accent}10 100%)` 
                        }}>
                          <FileText className="h-5 w-5" style={{ color: THEME.accent }} />
                        </div>
                        Specialization & Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="p-5 rounded-lg bg-gray-50">
                        <p className="text-sm font-medium text-gray-500 flex items-center">
                          <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                          Professional Background
                        </p>
                        <p className="mt-2 text-gray-700">
                          {mentor.specialization || "No specialization information provided."}
                        </p>
                      </div>

                      <div className="p-5 rounded-lg bg-gray-50">
                        <p className="text-sm font-medium text-gray-500 flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-gray-400" />
                          Mentor Bio
                        </p>
                        <p className="mt-2 text-gray-700">
                          {mentor.bio || "No mentor bio provided."}
                        </p>
                      </div>

                      <div className="p-5 rounded-lg bg-gray-50">
                        <p className="text-sm font-medium text-gray-500 flex items-center justify-between">
                          <span className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                            Assigned Businesses
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-7 text-xs font-normal shadow-sm"
                            onClick={() => navigate(`/mentor-assignment?mentorId=${id}`)}
                          >
                            <PlusCircle className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                        </p>
                        <div className="mt-3">
                          {isLoadingRelationships ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                          ) : relationshipsError ? (
                            <div className="text-center py-4">
                              <p className="text-red-500 mb-2">Failed to load business relationships</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.location.reload()}
                              >
                                Retry
                              </Button>
                            </div>
                          ) : assignedBusinesses && assignedBusinesses.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {assignedBusinesses.map((business) => (
                                <div 
                                  key={business.id} 
                                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100 shadow-sm"
                                  onClick={() => navigate(`/businesses/${business.id}`)}
                                >
                                  <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full flex items-center justify-center mr-2" style={{ 
                                      backgroundColor: `${getDistrictColor(business.district)}20` 
                                    }}>
                                      <Building2 className="h-4 w-4" style={{ color: getDistrictColor(business.district) }} />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-800">{business.businessName}</p>
                                      <div className="flex items-center text-xs text-gray-500">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {business.district.split(',')[0]}
                                        {business.dareModel && (
                                          <>
                                            <span className="mx-1">•</span>
                                            <Store className="h-3 w-3 mr-1" />
                                            {business.dareModel}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <Badge 
                                    className="ml-2"
                                    style={{
                                      backgroundColor: business.dareModel ? getModelColor(business.dareModel).bg : "#6c757d",
                                      color: business.dareModel ? getModelColor(business.dareModel).text : "white"
                                    }}
                                  >
                                    {business.dareModel || "Not Specified"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                              <Briefcase className="h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-gray-500 text-sm mb-3">No businesses assigned to this mentor yet.</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs"
                                onClick={() => navigate(`/mentor-assignment?mentorId=${id}`)}
                              >
                                <PlusCircle className="h-3 w-3 mr-1" />
                                Assign Businesses
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            <TabsContent value="businesses" className="mt-6">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <Card className="border-gray-100 shadow-md overflow-hidden">
                  <div className="h-1 w-full" style={{ 
                    background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})` 
                  }}></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full flex items-center justify-center mr-3" style={{ 
                          background: `linear-gradient(135deg, ${THEME.dark}20 0%, ${THEME.dark}10 100%)` 
                        }}>
                          <Briefcase className="h-5 w-5" style={{ color: THEME.dark }} />
                        </div>
                        <div>
                          <CardTitle className="text-lg" style={{ color: THEME.dark }}>
                            Assigned Businesses
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Businesses this mentor is responsible for
                          </CardDescription>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 hover:border-gray-300 transition-all duration-300"
                        onClick={() => navigate(`/mentor-assignment?mentorId=${id}`)}
                      >
                        <PlusCircle className="mr-2 h-3.5 w-3.5" style={{ color: THEME.primary }} />
                        Assign Businesses
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {relationshipsError ? (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-red-100">
                          <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-medium text-red-700">Error Loading Data</h3>
                        <p className="text-gray-500 mt-2 mb-6 max-w-md mx-auto">
                          We couldn't load the business assignment data. Please try again.
                        </p>
                        <Button 
                          onClick={() => window.location.reload()}
                          className="shadow-sm hover:shadow-md transition-all duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                            border: "none" 
                          }}
                        >
                          Retry
                        </Button>
                      </div>
                    ) : assignedBusinesses && assignedBusinesses.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader style={{ background: "#f9fafb" }}>
                            <TableRow>
                              <TableHead className="font-semibold" style={{ color: THEME.dark }}>Business Name</TableHead>
                              <TableHead className="font-semibold" style={{ color: THEME.dark }}>DARE Model</TableHead>
                              <TableHead className="font-semibold" style={{ color: THEME.dark }}>Assignment Date</TableHead>
                              <TableHead className="font-semibold" style={{ color: THEME.dark }}>District</TableHead>
                              <TableHead className="text-right font-semibold" style={{ color: THEME.dark }}>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Motion animation for each row */}
                            {assignedBusinesses.map((business) => {
                              const relationship = allRelationships?.find(rel => 
                                rel.mentorId === parseInt(id as string) && rel.businessId === business.id
                              );
                              return (
                                <motion.tr
                                  key={business.id}
                                  variants={rowVariant}
                                  className="cursor-pointer transition-all duration-300"
                                  style={{
                                    backgroundColor: hoveredRow === business.id ? '#f9fafb' : 'white',
                                    transform: hoveredRow === business.id ? 'scale(1.005)' : 'scale(1)',
                                    boxShadow: hoveredRow === business.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                  }}
                                  onMouseEnter={() => setHoveredRow(business.id)}
                                  onMouseLeave={() => setHoveredRow(null)}
                                  onClick={() => navigate(`/businesses/${business.id}`)}
                                >
                                  <TableCell>
                                    <div className="flex items-center">
                                      <div className="h-8 w-8 rounded-full flex items-center justify-center mr-3" style={{ 
                                        backgroundColor: `${getDistrictColor(business.district)}10` 
                                      }}>
                                        <Building2 className="h-4 w-4" style={{ color: getDistrictColor(business.district) }} />
                                      </div>
                                      <div className="font-medium text-gray-900">{business.businessName}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {business.dareModel ? (
                                      <Badge 
                                        style={{
                                          backgroundColor: getModelColor(business.dareModel).bg,
                                          color: getModelColor(business.dareModel).text
                                        }}
                                      >
                                        {business.dareModel}
                                      </Badge>
                                    ) : (
                                      <span className="text-gray-500 italic">Not specified</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                      {relationship?.assignedDate
                                        ? formatDate(relationship.assignedDate)
                                        : "Not specified"}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      className="text-white shadow-sm"
                                      style={{ backgroundColor: getDistrictColor(business.district) }}
                                    >
                                      {business.district.split(',')[0]}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full hover:bg-blue-50 transition-colors"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigate(`/businesses/${business.id}`);
                                            }}
                                          >
                                            <Eye className="h-4 w-4 text-blue-600" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>View Business</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </TableCell>
                                </motion.tr>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ 
                          background: `linear-gradient(135deg, ${THEME.primary}10 0%, ${THEME.accent}10 100%)` 
                        }}>
                          <Briefcase className="h-8 w-8" style={{ color: THEME.primary }} />
                        </div>
                        <h3 className="text-lg font-medium" style={{ color: THEME.dark }}>No Assigned Businesses</h3>
                        <p className="text-gray-500 mt-2 mb-6 max-w-md mx-auto">
                          This mentor doesn't have any business assignments yet. Assign businesses to enable mentorship and tracking.
                        </p>
                        <Button
                          className="shadow-sm hover:shadow-md transition-all duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                            border: "none" 
                          }}
                          onClick={() => navigate(`/mentor-assignment?mentorId=${id}`)}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Assign Businesses
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}