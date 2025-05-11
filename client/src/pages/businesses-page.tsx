import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { BusinessProfile, businessModelEnum } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Search, 
  Eye, 
  Edit, 
  BarChart2, 
  Plus, 
  Filter, 
  ChevronRight, 
  ChevronLeft,
  RefreshCcw,
  AlertTriangle,
  Store,
  MapPin,
  Tag,
  Info,
  ArrowUpRight
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useHasPermission } from "@/lib/permissions";
import { PermissionGuard } from "@/components/permission-guard";

// Mastercard color theme
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

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export default function BusinessesPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 6; // Reduced for better card layout

  // Fetch all business profiles
  const { data: businesses, isLoading, error, refetch } = useQuery<BusinessProfile[]>({
    queryKey: ['/api/business-profiles'],
  });

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Handle new business creation
  const handleAddNew = () => {
    navigate("/businesses/new");
  };

  // Filter businesses based on search query, district and model filter
  const filteredBusinesses = businesses?.filter(business => {
    // District filter
    if (districtFilter && districtFilter !== "all" && business.district !== districtFilter) {
      return false;
    }

    // Model filter
    if (modelFilter && modelFilter !== "all" && business.dareModel !== modelFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        business.businessName.toLowerCase().includes(query) ||
        (business.businessDescription && business.businessDescription.toLowerCase().includes(query)) ||
        (business.businessLocation && business.businessLocation.toLowerCase().includes(query)) ||
        business.district.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Pagination
  const totalPages = filteredBusinesses ? Math.ceil(filteredBusinesses.length / itemsPerPage) : 0;
  const paginatedBusinesses = filteredBusinesses?.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // Handle pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Get badge color based on Digital Access for Rural Empowerment model
  const getModelBadgeStyle = (model: string) => {
    switch (model) {
      case "Collaborative":
        return { backgroundColor: THEME.primary, color: "white" };
      case "MakerSpace":
        return { backgroundColor: THEME.secondary, color: "white" };
      case "Madam Anchor":
        return { backgroundColor: THEME.accent, color: THEME.dark };
      default:
        return { backgroundColor: THEME.dark, color: "white" };
    }
  };

  // Get district color
  const getDistrictColor = (district: string) => {
    if (district.includes("Bekwai")) return THEME.secondary;
    if (district.includes("Gushegu")) return THEME.primary;
    if (district.includes("Lower Manya")) return THEME.accent;
    if (district.includes("Yilo Krobo")) return THEME.dark;
    return "#6c757d";
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setDistrictFilter("all");
    setModelFilter("all");
    setCurrentPage(1);
  };

  // Get short district name
  const getShortDistrictName = (district: string) => {
    return district.replace(", Ghana", "");
  };

  return (
    <DashboardLayout>
      <div className="md:py-8 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <Header 
            title="Business Management" 
            description="View, edit and track all businesses across Digital Access for Rural Empowerment models" 
            onAddNew={
              useHasPermission("businesses", "create") ? handleAddNew : undefined
            }
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            addNewText="New Business"
          />
        </motion.div>

        {/* Filters */}
        <motion.div 
          className="mb-8 flex flex-col md:flex-row gap-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div className="relative flex-1" variants={fadeIn}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search businesses by name, description, or location..." 
              className="pl-9 border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1 transition-all duration-300"
              style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </motion.div>

          <motion.div className="w-full md:w-52" variants={fadeIn}>
            <Select value={districtFilter} onValueChange={(val) => {
              setDistrictFilter(val);
              setCurrentPage(1); // Reset to first page on filter change
            }}>
              <SelectTrigger className="border-gray-200 focus:ring-offset-1 transition-all duration-300" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="District" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                <SelectItem value="Bekwai, Ghana">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.secondary }}></div>
                    Bekwai
                  </div>
                </SelectItem>
                <SelectItem value="Gushegu, Ghana">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.primary }}></div>
                    Gushegu
                  </div>
                </SelectItem>
                <SelectItem value="Lower Manya Krobo, Ghana">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.accent }}></div>
                    Lower Manya Krobo
                  </div>
                </SelectItem>
                <SelectItem value="Yilo Krobo, Ghana">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.dark }}></div>
                    Yilo Krobo
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div className="w-full md:w-52" variants={fadeIn}>
            <Select value={modelFilter} onValueChange={(val) => {
              setModelFilter(val);
              setCurrentPage(1); // Reset to first page on filter change
            }}>
              <SelectTrigger className="border-gray-200 focus:ring-offset-1 transition-all duration-300" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                <div className="flex items-center">
                  <Store className="mr-2 h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Select model" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {businessModelEnum.options.map((model) => (
                  <SelectItem key={model} value={model}>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: getModelBadgeStyle(model).backgroundColor }}></div>
                      {model}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>


        </motion.div>

        {/* Active Filters Display */}
        {(searchQuery || districtFilter !== "all" || modelFilter !== "all") && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2 flex-wrap"
          >
            <span className="text-sm text-gray-500 mr-1">Active filters:</span>

            {searchQuery && (
              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer transition-colors" onClick={() => setSearchQuery("")}>
                Search: {searchQuery}
                <span className="ml-1 text-xs">×</span>
              </Badge>
            )}

            {districtFilter !== "all" && (
              <Badge 
                className="text-white hover:opacity-90 cursor-pointer transition-colors" 
                style={{ backgroundColor: getDistrictColor(districtFilter) }}
                onClick={() => setDistrictFilter("all")}
              >
                District: {getShortDistrictName(districtFilter)}
                <span className="ml-1 text-xs">×</span>
              </Badge>
            )}

            {modelFilter !== "all" && (
              <Badge 
                className="hover:opacity-90 cursor-pointer transition-colors" 
                style={getModelBadgeStyle(modelFilter)}
                onClick={() => setModelFilter("all")}
              >
                Model: {modelFilter}
                <span className="ml-1 text-xs">×</span>
              </Badge>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-xs"
              onClick={clearFilters}
            >
              <RefreshCcw className="mr-1 h-3 w-3" />
              Clear All Filters
            </Button>
          </motion.div>
        )}

        {/* Businesses Card Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
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
          ) : error ? (
            <div className="text-center py-16 px-4">
              <div className="inline-block p-4 rounded-full bg-red-50 mb-4">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load businesses</h3>
              <p className="text-gray-500 mb-4">{error.message}</p>
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
                <Store className="h-10 w-10" style={{ color: THEME.primary }} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">No businesses found</h3>
              <p className="text-gray-500 mb-4">No businesses match your search criteria</p>
              <Button 
                onClick={clearFilters}
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
            <>
              {/* Card Grid Layout */}
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
              >
                {paginatedBusinesses?.map((business) => (
                  <motion.div 
                    key={business.id} 
                    variants={cardVariant}
                    className="h-full"
                  >
                    <Card 
                      className="border-gray-100 shadow-md overflow-hidden h-full cursor-pointer transition-all duration-300"
                      style={{ 
                        transform: hoveredCard === business.id ? 'translateY(-5px)' : 'translateY(0)',
                        boxShadow: hoveredCard === business.id ? '0 10px 25px rgba(0,0,0,0.1)' : '0 2px 10px rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={() => setHoveredCard(business.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={() => navigate(`/businesses/${business.id}`)}
                    >
                      <div className="h-2 w-full" style={{ 
                        backgroundColor: getDistrictColor(business.district),
                      }}></div>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <Badge 
                            className="shadow-sm mb-2 transition-all duration-300"
                            style={getModelBadgeStyle(business.dareModel || '')}
                          >
                            {business.dareModel}
                          </Badge>
                          <Badge 
                            className="bg-gray-100 text-gray-700 shadow-sm"
                          >
                            {business.serviceCategoryId ? getCategoryNameById(business.serviceCategoryId) : 'Uncategorized'}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg" style={{ color: THEME.dark }}>
                          {business.businessName}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 h-10">
                          {business.businessDescription || 'No description available'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="flex items-center mb-3">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <div className="text-sm text-gray-600">
                            <Badge 
                              variant="outline"
                              className="mr-2 font-normal"
                            >
                              {getShortDistrictName(business.district)}
                            </Badge>
                            {business.businessLocation || 'No location specified'}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t border-gray-100 pt-3 pb-3 bg-gray-50">
                        <div className="flex justify-between items-center w-full">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/businesses/${business.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>

                          <div className="flex space-x-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="rounded-full h-8 w-8 hover:bg-amber-50 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/businesses/${business.id}/edit`);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 text-amber-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Business</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="rounded-full h-8 w-8 hover:bg-green-50 transition-colors opacity-50"
                                    disabled={true}
                                  >
                                    <BarChart2 className="h-4 w-4 text-green-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View Analytics</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 pt-6 pb-8">
                <div className="text-sm text-gray-600 mb-4 sm:mb-0 px-4 py-2 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredBusinesses.length)} to {Math.min(currentPage * itemsPerPage, filteredBusinesses.length)} of {filteredBusinesses.length} businesses
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 px-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-300"
                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex space-x-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className={`w-9 h-9 p-0 rounded-lg transition-all duration-300 ${
                            currentPage === page 
                              ? 'shadow-md' 
                              : 'border border-gray-200 hover:border-gray-300'
                          }`}
                          style={
                            currentPage === page 
                              ? { 
                                  background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                                  border: "none" 
                                } 
                              : {}
                          }
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 px-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-300"
                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}