import React, { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessAssignmentDialog } from "@/components/makerspace/business-assignment-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  Building2, 
  Users,
  Wrench,
  Pencil,
  Store,
  Eye,
  Plus,
  UserCircle,
  HelpCircle,
  FolderOpen,
  CircleSlash
} from "lucide-react";
import { Resource, Action, useHasPermission } from "@/lib/permissions";
import { PermissionGuard } from "@/components/permission-guard";
import THEME from '@/lib/theme';
import type { Makerspace } from "@shared/schema";
import { format } from "date-fns";

export default function MakerspaceViewPage() {
  const { id } = useParams<{ id: string }>();
  const makerspaceId = parseInt(id);
  const [, navigate] = useLocation();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  
  // Permission checks
  const canViewMakerspaces = useHasPermission(Resource.MAKERSPACES, Action.VIEW);
  const canEditMakerspace = useHasPermission(Resource.MAKERSPACES, Action.EDIT);
  const canManageResources = useHasPermission(Resource.MAKERSPACES, Action.MANAGE);
  const canViewBusinesses = useHasPermission(Resource.BUSINESSES, Action.VIEW);
  const canManageBusinessAssignments = useHasPermission(Resource.BUSINESS_YOUTH, Action.MANAGE);
  
  // Fetch makerspace data
  const { data: makerspace, isLoading: isLoadingMakerspace, error } = useQuery<Makerspace>({
    queryKey: [`/api/makerspaces/${makerspaceId}`],
    enabled: !isNaN(makerspaceId) && canViewMakerspaces,
  });
  
  // Fetch assigned businesses
  const { data: assignedBusinesses = [], isLoading: isLoadingBusinesses } = useQuery<any[]>({
    queryKey: [`/api/business-management/makerspaces/${makerspaceId}/businesses`],
    enabled: !isNaN(makerspaceId) && canViewMakerspaces && canViewBusinesses,
  });
  
  // Calculate businesses count
  const businessCount = assignedBusinesses.length;
  
  const handleEdit = () => {
    navigate(`/makerspaces/${makerspaceId}/edit`);
  };
  
  const handleBack = () => {
    navigate("/makerspaces");
  };
  
  const handleViewBusiness = (businessId: number) => {
    navigate(`/businesses/${businessId}`);
  };

  // If user doesn't have view permission, show access denied
  if (!canViewMakerspaces) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 max-w-7xl">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Makerspaces
          </Button>
          
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <CircleSlash className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              You don't have permission to view makerspace details. Please contact your administrator if you need access.
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Makerspaces
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Loading state
  if (isLoadingMakerspace) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 max-w-7xl">
          <div className="flex items-center mb-6">
            <Skeleton className="h-4 w-4 mr-2" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-10 w-1/3 mb-2" />
          <Skeleton className="h-5 w-1/2 mb-8" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-7 w-1/3 mb-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-7 w-1/2 mb-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Error state
  if (error || !makerspace) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 max-w-7xl">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Makerspaces
          </Button>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center flex flex-col items-center py-8">
                <div className="rounded-full bg-destructive/10 p-3 mb-3">
                  <Building2 className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-medium">Makerspace Not Found</h3>
                <p className="text-muted-foreground max-w-md mt-2 mb-6">
                  We couldn't find the makerspace you're looking for. It may have been removed or you
                  may have followed an invalid link.
                </p>
                <Button onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Makerspaces
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-7xl">
        <Header
          title={makerspace.name}
          description={`Makerspace in ${makerspace.district}`}
          backButton={{
            label: "Back to Makerspaces",
            href: "/makerspaces",
          }}
          actions={
            <div className="flex gap-2">
              {/* Manage Resources Button - Protected with MANAGE permission */}
              <PermissionGuard
                resource={Resource.MAKERSPACES}
                action={Action.MANAGE}
                fallback={null} // Don't show button if no permission
              >
                <Button variant="outline" onClick={() => navigate(`/makerspaces/${makerspace.id}/resources`)}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Manage Resources
                </Button>
              </PermissionGuard>
              
              {/* Edit Makerspace Button - Protected with EDIT permission */}
              <PermissionGuard
                resource={Resource.MAKERSPACES}
                action={Action.EDIT}
                fallback={null} // Don't show button if no permission
              >
                <Button onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Makerspace
                </Button>
              </PermissionGuard>
            </div>
          }
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Makerspace Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Address</h3>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <p>{makerspace.address}</p>
                </div>
                {makerspace.coordinates && (
                  <p className="text-xs text-muted-foreground mt-1 ml-7">
                    Coordinates: {makerspace.coordinates}
                  </p>
                )}
              </div>
              
              {makerspace.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <p>{makerspace.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {makerspace.contactPhone && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Phone</h3>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-primary mr-2" />
                      <p>{makerspace.contactPhone}</p>
                    </div>
                  </div>
                )}
                
                {makerspace.contactEmail && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Email</h3>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-primary mr-2" />
                      <p>{makerspace.contactEmail}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {makerspace.openDate && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Open Date</h3>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-primary mr-2" />
                      <p>{format(new Date(makerspace.openDate), "PPP")}</p>
                    </div>
                  </div>
                )}
                
                {makerspace.operatingHours && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Operating Hours</h3>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-primary mr-2" />
                      <p>{makerspace.operatingHours}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Sidebar Information */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">District</h3>
                <Badge className="ml-0">{makerspace.district}</Badge>
              </div>
              
              {/* Businesses Section - Only shown with VIEW_BUSINESSES permission */}
              <PermissionGuard
                resource={Resource.BUSINESSES}
                action={Action.VIEW}
              >
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Businesses</h3>
                  <div className="flex items-center">
                    <Store className="h-4 w-4 mr-2 text-primary" />
                    <span>{businessCount} assigned businesses</span>
                  </div>
                </div>
              </PermissionGuard>
              
              {makerspace.updatedAt && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Last Updated</h3>
                  <p className="text-sm">
                    {format(new Date(makerspace.updatedAt), "PPP")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Assigned Businesses Section - Protected with VIEW_BUSINESSES permission */}
        <PermissionGuard
          resource={Resource.BUSINESSES}
          action={Action.VIEW}
        >
          <div className="mt-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="flex items-center">
                    <Store className="h-5 w-5 mr-2 text-primary" />
                    Assigned Businesses
                  </CardTitle>
                  <CardDescription>
                    Businesses operating in this makerspace facility
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {/* Manage Assignments Button - Protected with MANAGE_BUSINESS_ASSIGNMENTS permission */}
                  <PermissionGuard
                    resource={Resource.BUSINESS_YOUTH}
                    action={Action.MANAGE}
                  >
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/makerspace-assignment/makerspace/${makerspaceId}`)}
                    >
                      <Store className="h-4 w-4 mr-1" />
                      Manage Assignments
                    </Button>
                  </PermissionGuard>
                  
                  {/* Assign Business Button - Protected with MANAGE_BUSINESS_ASSIGNMENTS permission */}
                  <PermissionGuard
                    resource={Resource.BUSINESS_YOUTH}
                    action={Action.MANAGE}
                  >
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsAssignDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Assign Business
                    </Button>
                  </PermissionGuard>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingBusinesses ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : assignedBusinesses.length === 0 ? (
                  <div className="text-center py-8">
                    <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Businesses Assigned</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      There are no businesses currently assigned to this makerspace. 
                      Businesses can be assigned from their business detail page.
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="py-3 px-4 text-left font-medium text-sm">Business Name</th>
                          <th className="py-3 px-4 text-left font-medium text-sm">Owner(s)</th>
                          <th className="py-3 px-4 text-left font-medium text-sm">Assigned Date</th>
                          <th className="py-3 px-4 text-left font-medium text-sm">Assigned By</th>
                          <th className="py-3 px-4 text-left font-medium text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedBusinesses.map((assignment) => (
                          <tr key={assignment.id} className="border-b hover:bg-muted/20">
                            <td className="py-3 px-4">{assignment.business?.businessName || 'Unknown Business'}</td>
                            <td className="py-3 px-4">
                              {assignment.ownerNames && assignment.ownerNames.length > 0 ? (
                                <div className="flex items-center">
                                  <UserCircle className="h-4 w-4 mr-2 text-primary" />
                                  {assignment.ownerNames.length === 1 ? (
                                    assignment.ownerNames[0]
                                  ) : (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger className="underline decoration-dotted">
                                          {assignment.ownerNames[0]} +{assignment.ownerNames.length - 1} more
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <ul className="list-disc pl-4">
                                            {assignment.ownerNames.map((name: string, idx: number) => (
                                              <li key={idx}>{name}</li>
                                            ))}
                                          </ul>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm italic">No owners assigned</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {assignment.assignedDate 
                                ? format(new Date(assignment.assignedDate), 'PP') 
                                : 'Unknown date'}
                            </td>
                            <td className="py-3 px-4">
                              {assignment.assignedByUser ? (
                                assignment.assignedByUser.username
                              ) : (
                                <span className="text-muted-foreground text-sm italic">Unknown</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewBusiness(assignment.business?.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </PermissionGuard>
      </div>
      
      {/* Business Assignment Dialog - Only included with MANAGE_BUSINESS_ASSIGNMENTS permission */}
      <PermissionGuard
        resource={Resource.BUSINESS_YOUTH}
        action={Action.MANAGE}
      >
        <BusinessAssignmentDialog 
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          makerspaceId={makerspaceId}
        />
      </PermissionGuard>
    </DashboardLayout>
  );
}