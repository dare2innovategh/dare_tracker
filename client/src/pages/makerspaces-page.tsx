import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  MapPin, 
  Users, 
  Plus, 
  Eye,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Store,
  CircleSlash
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Resource, Action, useHasPermission } from "@/lib/permissions";
import { PermissionGuard } from "@/components/permission-guard";
import THEME from '@/lib/theme';
import type { Makerspace } from "@shared/schema";

export default function MakerspacesPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [makerspaceToDelete, setMakerspaceToDelete] = useState<Makerspace | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  
  // Permission checks (kept for individual actions but not for page access)
  const canCreateMakerspace = useHasPermission(Resource.MAKERSPACES, Action.CREATE);
  const canEditMakerspace = useHasPermission(Resource.MAKERSPACES, Action.EDIT);
  const canDeleteMakerspace = useHasPermission(Resource.MAKERSPACES, Action.DELETE);
  
  // Fetch all makerspaces (no longer gated by canViewMakerspaces)
  const { 
    data: makerspaces,
    isLoading, 
    error,
    refetch 
  } = useQuery<Makerspace[]>({
    queryKey: ["/api/makerspaces"],
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/makerspaces/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Makerspace deleted successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({queryKey: ["/api/makerspaces"]});
      setMakerspaceToDelete(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete makerspace",
        variant: "destructive",
      });
    }
  });
  
  const handleAddNew = () => {
    navigate("/makerspaces/new");
  };
  
  const handleMakerspaceClick = (makerspace: Makerspace) => {
    navigate(`/makerspaces/${makerspace.id}/view`);
  };
  
  const handleDeleteMakerspace = (makerspace: Makerspace) => {
    setMakerspaceToDelete(makerspace);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (makerspaceToDelete) {
      deleteMutation.mutate(makerspaceToDelete.id);
    }
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Success",
        description: "Makerspace data has been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh makerspace data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const getFilteredMakerspaces = () => {
    if (!makerspaces) return [];
    
    if (activeTab === "all") return makerspaces;
    
    // Filter by district if needed
    return makerspaces.filter(makerspace => {
      if (activeTab === "bekwai") return makerspace.district === "Bekwai";
      if (activeTab === "gushegu") return makerspace.district === "Gushegu";
      if (activeTab === "lowermanya") return makerspace.district === "Lower Manya Krobo";
      if (activeTab === "yilokrobo") return makerspace.district === "Yilo Krobo";
      return true;
    });
  };
  
  const filteredMakerspaces = getFilteredMakerspaces();

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <Header
          title="Makerspace Management"
          description="Manage collaborative workspace locations across all DARE districts"
          onAddNew={canCreateMakerspace ? handleAddNew : undefined}
          addNewText="Add New Makerspace"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {error && (
          <Alert variant="destructive" className="mt-4 mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load makerspaces. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        <Tabs 
          defaultValue="all" 
          className="mt-6"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Makerspaces</TabsTrigger>
            <TabsTrigger value="bekwai">Bekwai</TabsTrigger>
            <TabsTrigger value="gushegu">Gushegu</TabsTrigger>
            <TabsTrigger value="lowermanya">Lower Manya Krobo</TabsTrigger>
            <TabsTrigger value="yilokrobo">Yilo Krobo</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-2">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-5/6 mb-2" />
                      <Skeleton className="h-4 w-4/6" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredMakerspaces.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center flex flex-col items-center py-8">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Makerspaces Found</h3>
                    <p className="text-muted-foreground max-w-md mb-6">
                      {activeTab === "all" 
                        ? "There are no makerspaces added to the system yet."
                        : `There are no makerspaces in the ${activeTab.replace(/([A-Z])/g, ' $1').trim()} district.`}
                    </p>
                    
                    <PermissionGuard
                      resource={Resource.MAKERSPACES}
                      action={Action.CREATE}
                      fallback={
                        <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Makerspace
                        </Button>
                      }
                    >
                      <Button onClick={handleAddNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Makerspace
                      </Button>
                    </PermissionGuard>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMakerspaces.map((makerspace) => (
                  <Card
                    key={makerspace.id}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-1.5 w-full" style={{ 
                      background: `linear-gradient(90deg, ${THEME.primary} 0%, ${THEME.secondary} 100%)`
                    }}></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{makerspace.name}</CardTitle>
                        <Badge>{makerspace.district}</Badge>
                      </div>
                      <CardDescription className="flex items-center text-sm">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        {makerspace.address}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm line-clamp-2 mb-4">
                        {makerspace.description || 'No description available'}
                      </p>
                      <div className="flex items-center justify-between text-muted-foreground text-sm mb-4">
                        <div className="flex items-center">
                          <Store className="h-4 w-4 mr-1" />
                          <span>{makerspace.memberCount || 0} businesses</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-auto pt-2 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/makerspaces/${makerspace.id}/view`);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        <PermissionGuard
                          resource={Resource.MAKERSPACES}
                          action={Action.EDIT}
                          fallback={
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled
                              className="opacity-50 cursor-not-allowed"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          }
                        >
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/makerspaces/${makerspace.id}/edit`);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </PermissionGuard>
                        
                        <PermissionGuard
                          resource={Resource.MAKERSPACES}
                          action={Action.DELETE}
                          fallback={
                            <Button 
                              variant="destructive" 
                              size="sm"
                              disabled
                              className="opacity-50 cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          }
                        >
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMakerspace(makerspace);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </PermissionGuard>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the makerspace 
              {makerspaceToDelete && <strong> "{makerspaceToDelete.name}"</strong>} and all its related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}