import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Search,
  UserPlus,
  ArrowLeft,
  Loader2,
  ChevronLeft, 
  ChevronRight,
  ListFilter,
  UserCheck,
  MapPin,
  Phone,
  CheckCircle2,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BusinessProfile, YouthProfile } from "@shared/schema";

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

export default function BusinessAddMembersPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedYouthIds, setSelectedYouthIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState<string>("all_districts");
  const [skillsFilter, setSkillsFilter] = useState<string>("all_skills");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch business details
  const {
    data: business,
    isLoading: isLoadingBusiness,
    error: businessError,
  } = useQuery<BusinessProfile>({
    queryKey: [`/api/business-profiles/${id}`],
    enabled: !!id,
  });

  // Fetch all youth profiles for selection
  const {
    data: youthProfiles,
    isLoading: isLoadingProfiles,
    error: profilesError,
  } = useQuery<YouthProfile[]>({
    queryKey: ["/api/youth-profiles"],
  });

  // Fetch existing members of the business
  const {
    data: existingMembers,
    isLoading: isLoadingMembers,
  } = useQuery<YouthProfile[]>({
    queryKey: [`/api/business-profiles/${id}/members`],
    enabled: !!id,
  });

  // Filter the youth profiles based on search term and district filter
  // Also exclude existing members
  const filteredProfiles = React.useMemo(() => {
    if (!youthProfiles) return [];

    const existingMemberIds = existingMembers?.map(member => member.id) || [];
    
    let result = youthProfiles.filter(profile => {
      const nameMatch = profile.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Handle the new "all_districts" value
      const districtMatch = !districtFilter || 
                           districtFilter === "all_districts" || 
                           profile.district.includes(districtFilter);
      
      // Handle the new "all_skills" value
      const skillsMatch = !skillsFilter || 
                         skillsFilter === "all_skills" || 
                         (profile.skills && Array.isArray(profile.skills) && 
                          profile.skills.some(skill => 
                            typeof skill === 'string' ? 
                              skill.toLowerCase().includes(skillsFilter.toLowerCase()) : 
                              false
                          ));
      
      // Exclude existing members
      const notAlreadyMember = !existingMemberIds.includes(profile.id);
      
      return nameMatch && districtMatch && skillsMatch && notAlreadyMember;
    });
    
    return result;
  }, [youthProfiles, existingMembers, searchTerm, districtFilter, skillsFilter]);

  // Pagination
  const paginatedProfiles = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredProfiles.slice(start, end);
  }, [filteredProfiles, page, pageSize]);

  const totalPages = Math.ceil(filteredProfiles.length / pageSize);

  // Add selected youth profiles to business
  const addMembersMutation = useMutation({
    mutationFn: async () => {
      if (selectedYouthIds.length === 0) {
        throw new Error("No youth profiles selected");
      }

      const responses = await Promise.all(
        selectedYouthIds.map(async (youthId) => {
          const response = await apiRequest(
            "POST",
            `/api/youth-profiles/${youthId}/businesses/${id}`
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to add member");
          }

          return await response.json();
        })
      );

      return responses;
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/business-profiles/${id}/members`] });
      
      toast({
        title: "Members Added",
        description: `${selectedYouthIds.length} youth profile(s) added to the business successfully`,
        variant: "default",
      });
      
      // Navigate back to business detail page
      navigate(`/businesses/${id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add members",
        variant: "destructive",
      });
    },
  });

  // Handle adding members
  const handleAddMembers = () => {
    if (selectedYouthIds.length === 0) {
      toast({
        title: "No Profiles Selected",
        description: "Please select at least one youth profile to add to the business",
        variant: "destructive",
      });
      return;
    }

    addMembersMutation.mutate();
  };

  // Handle checkbox selection
  const handleToggleSelection = (id: number) => {
    setSelectedYouthIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((youthId) => youthId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle "Select All" on current page
  const handleSelectAllOnPage = () => {
    if (paginatedProfiles.length === 0) return;
    
    const allSelected = paginatedProfiles.every(profile => 
      selectedYouthIds.includes(profile.id)
    );
    
    if (allSelected) {
      // Deselect all on current page
      setSelectedYouthIds(prevSelected => 
        prevSelected.filter(id => 
          !paginatedProfiles.some(profile => profile.id === id)
        )
      );
    } else {
      // Select all on current page
      const pageIds = paginatedProfiles.map(profile => profile.id);
      setSelectedYouthIds(prevSelected => {
        const uniqueIds = new Set([...prevSelected, ...pageIds]);
        return Array.from(uniqueIds);
      });
    }
  };

  // Handle error with useEffect to avoid re-renders
  useEffect(() => {
    if (businessError) {
      toast({
        title: "Error",
        description: "Failed to load business details",
        variant: "destructive",
      });
    }

    if (profilesError) {
      toast({
        title: "Error",
        description: "Failed to load youth profiles",
        variant: "destructive",
      });
    }
  }, [businessError, profilesError, toast]);

  // Loading state
  if (isLoadingBusiness || isLoadingProfiles || isLoadingMembers) {
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
              Loading Youth Profiles
            </h3>
            <p className="text-gray-500">Please wait while we fetch available youth profiles</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Business not found state
  if (!business) {
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
              <X className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-blue-700 mb-3">Business Not Found</h3>
            <p className="text-blue-600 mb-6">
              The requested business could not be found. It may have been deleted or you may not have permission to view it.
            </p>
            <Button 
              className="shadow-sm hover:shadow-md transition-all duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                border: "none" 
              }}
              onClick={() => navigate("/businesses")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Businesses
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Extract unique districts for filter
  const districts = youthProfiles 
    ? Array.from(new Set(youthProfiles.map(profile => profile.district)))
    : [];

  // Extract unique skills for filter
  const allSkills = new Set<string>();
  youthProfiles?.forEach(profile => {
    if (profile.skills && Array.isArray(profile.skills)) {
      profile.skills.forEach(skill => {
        if (typeof skill === 'string') {
          allSkills.add(skill);
        }
      });
    }
  });
  const skills = Array.from(allSkills);

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10 px-4">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/businesses/${id}`)}
              className="mr-4"
            >
              <ArrowLeft className="h-5 w-5" style={{ color: THEME.primary }} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: THEME.dark }}>
                Add Members to {business.businessName}
              </h1>
              <p className="text-gray-500">
                Select youth profiles to add as members to this business
              </p>
            </div>
          </div>

          <Card className="border-gray-100 shadow-md mt-6">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1); // Reset to first page when searching
                    }}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <Select
                    value={districtFilter}
                    onValueChange={(value) => {
                      setDistrictFilter(value);
                      setPage(1); // Reset to first page when filtering
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                        <span>{districtFilter || "All Districts"}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_districts">All Districts</SelectItem>
                      {districts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={skillsFilter}
                    onValueChange={(value) => {
                      setSkillsFilter(value);
                      setPage(1); // Reset to first page when filtering
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <div className="flex items-center">
                        <ListFilter className="mr-2 h-4 w-4 text-gray-500" />
                        <span>{skillsFilter || "All Skills"}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_skills">All Skills</SelectItem>
                      {skills.map((skill) => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pb-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Checkbox 
                    id="select-all"
                    className="mr-2"
                    checked={
                      paginatedProfiles.length > 0 &&
                      paginatedProfiles.every(profile => 
                        selectedYouthIds.includes(profile.id)
                      )
                    }
                    onCheckedChange={handleSelectAllOnPage}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Select All on Page
                  </label>
                </div>
                
                <div className="text-sm text-gray-500">
                  {selectedYouthIds.length} selected
                </div>
              </div>
              
              {filteredProfiles.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader style={{ background: "#f9fafb" }}>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead className="font-semibold" style={{ color: THEME.dark }}>Name</TableHead>
                        <TableHead className="font-semibold" style={{ color: THEME.dark }}>District</TableHead>
                        <TableHead className="font-semibold" style={{ color: THEME.dark }}>Skills</TableHead>
                        <TableHead className="font-semibold" style={{ color: THEME.dark }}>Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProfiles.map((profile) => (
                        <TableRow key={profile.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedYouthIds.includes(profile.id)}
                              onCheckedChange={() => handleToggleSelection(profile.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell className="font-medium" onClick={() => handleToggleSelection(profile.id)}>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarImage src={profile.profilePicture || undefined} alt={profile.fullName} />
                                <AvatarFallback style={{ 
                                  background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.primary}20 50%, ${THEME.accent}20 100%)` 
                                }}>
                                  {profile.fullName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">{profile.fullName}</div>
                                <div className="text-xs text-gray-500">ID: {profile.participantCode || 'No ID'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell onClick={() => handleToggleSelection(profile.id)}>
                            <Badge 
                              className="text-white shadow-sm"
                              style={{ 
                                backgroundColor: profile.district.includes("Bekwai") ? THEME.secondary :
                                  profile.district.includes("Gushegu") ? THEME.primary :
                                  profile.district.includes("Lower Manya") ? THEME.accent :
                                  profile.district.includes("Yilo Krobo") ? THEME.dark :
                                  "#6c757d"
                              }}
                            >
                              {profile.district.split(',')[0]}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={() => handleToggleSelection(profile.id)}>
                            <div className="flex flex-wrap gap-1 max-w-[250px]">
                              {profile.skills && Array.isArray(profile.skills) ? 
                                profile.skills.slice(0, 3).map((skill, index) => (
                                  <Badge 
                                    key={index}
                                    variant="outline"
                                    className="bg-blue-50 text-blue-800 border-blue-100"
                                  >
                                    {typeof skill === 'string' ? skill : ''}
                                  </Badge>
                                )) : 
                                <span className="text-sm text-gray-500 italic">No skills listed</span>
                              }
                              {profile.skills && Array.isArray(profile.skills) && profile.skills.length > 3 && (
                                <Badge variant="outline" className="bg-gray-50 text-gray-600">
                                  +{profile.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell onClick={() => handleToggleSelection(profile.id)}>
                            <div className="flex items-center">
                              <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                              <span className="text-sm">{profile.phone || 'No contact'}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="inline-block p-3 rounded-full bg-gray-100 mb-4">
                    <UserCheck className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Matching Profiles</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {searchTerm || districtFilter || skillsFilter ? 
                      "No youth profiles match your search criteria. Try adjusting your filters." :
                      "No available youth profiles found. All profiles might already be members of this business."}
                  </p>
                </div>
              )}
            </CardContent>
            
            {filteredProfiles.length > 0 && (
              <CardFooter className="flex flex-col sm:flex-row items-center justify-between pt-6 pb-4 border-t">
                <div className="flex items-center space-x-1 mb-4 sm:mb-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm text-gray-500 mx-2">
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/businesses/${id}`)}
                  >
                    Cancel
                  </Button>
                  <Button
                    style={{ backgroundColor: THEME.primary }}
                    className="text-white shadow-sm hover:shadow-md transition-all duration-300"
                    onClick={handleAddMembers}
                    disabled={selectedYouthIds.length === 0 || addMembersMutation.isPending}
                  >
                    {addMembersMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    Add {selectedYouthIds.length} {selectedYouthIds.length === 1 ? 'Member' : 'Members'}
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}