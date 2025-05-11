import React, { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  Users, 
  Wrench as Tool, 
  Calendar, 
  Clock, 
  Briefcase,
  Phone
} from "lucide-react";
import THEME from '@/lib/theme';

export default function MakerspaceLocationPage() {
  const { location } = useParams();
  const decodedLocation = location ? decodeURIComponent(location) : '';
  
  // Fetch makerspace information by location
  const { 
    data: makerspace, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: [`/api/makerspaces/${decodedLocation}`],
    enabled: !!decodedLocation
  });
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 max-w-7xl">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 max-w-7xl">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <h3 className="text-lg font-medium">Error loading makerspace information</h3>
            <p>We encountered a problem while loading the information for this makerspace location.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Define interface for makerspace data
  interface MakerspaceData {
    name: string;
    address: string;
    description: string;
    coordinates: string;
    contactPhone: string;
    operatingHours: string;
    resourceCount: number;
    memberCount: number;
    openDate: string;
  }
  
  // Create a properly typed object with real values from the database or fallback to defaults when needed
  const locationData: MakerspaceData = {
    name: makerspace?.name || decodedLocation,
    address: makerspace?.address || `${decodedLocation} DARE Makerspace`,
    description: makerspace?.description || "Information not available.",
    coordinates: makerspace?.coordinates || "Location coordinates not available.",
    contactPhone: makerspace?.contactPhone || "Contact information not available.",
    operatingHours: makerspace?.operatingHours || "Operating hours not specified.",
    resourceCount: makerspace?.resourceCount || 0,
    memberCount: makerspace?.memberCount || 0,
    openDate: makerspace?.openDate || "Opening date not specified."
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-7xl">
        <Header 
          title={`${locationData.name} Makerspace`}
          description="DARE Makerspace location details and resources"
        />
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>About This Makerspace</CardTitle>
                <CardDescription>Details and information about this location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-medium">Description</h3>
                  <p className="text-gray-600">{locationData.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Location</h4>
                      <p className="text-gray-600 text-sm">{locationData.address}</p>
                      <p className="text-gray-400 text-xs mt-1">{locationData.coordinates}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Contact</h4>
                      <p className="text-gray-600 text-sm">{locationData.contactPhone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Operating Hours</h4>
                      <p className="text-gray-600 text-sm">{locationData.operatingHours}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Opened</h4>
                      <p className="text-gray-600 text-sm">{locationData.openDate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Available Resources</CardTitle>
                <CardDescription>Equipment and resources at this location</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All Resources</TabsTrigger>
                    <TabsTrigger value="tools">Tools</TabsTrigger>
                    <TabsTrigger value="equipment">Equipment</TabsTrigger>
                    <TabsTrigger value="materials">Materials</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Array.from({length: 6}).map((_, i) => (
                        <div key={i} className="flex items-start space-x-3 p-3 rounded-md border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="bg-gray-100 p-2 rounded-md">
                            <Tool className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="font-medium">Resource Item {i+1}</h4>
                            <p className="text-sm text-gray-600">Category: {i % 3 === 0 ? 'Tools' : i % 3 === 1 ? 'Equipment' : 'Materials'}</p>
                            <div className="flex items-center mt-1">
                              <Badge variant={i % 4 === 0 ? 'destructive' : 'secondary'} className="text-xs">
                                {i % 4 === 0 ? 'In Use' : 'Available'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-center mt-6">
                      <Button variant="outline">View All {locationData.resourceCount} Resources</Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tools" className="mt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Array.from({length: 2}).map((_, i) => (
                        <div key={i} className="flex items-start space-x-3 p-3 rounded-md border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="bg-gray-100 p-2 rounded-md">
                            <Tool className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="font-medium">Tool {i+1}</h4>
                            <p className="text-sm text-gray-600">Category: Tools</p>
                            <div className="flex items-center mt-1">
                              <Badge variant={i % 2 === 0 ? 'destructive' : 'secondary'} className="text-xs">
                                {i % 2 === 0 ? 'In Use' : 'Available'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="equipment" className="mt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Array.from({length: 2}).map((_, i) => (
                        <div key={i} className="flex items-start space-x-3 p-3 rounded-md border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="bg-gray-100 p-2 rounded-md">
                            <Tool className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="font-medium">Equipment {i+1}</h4>
                            <p className="text-sm text-gray-600">Category: Equipment</p>
                            <div className="flex items-center mt-1">
                              <Badge variant={i % 2 === 0 ? 'destructive' : 'secondary'} className="text-xs">
                                {i % 2 === 0 ? 'In Use' : 'Available'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="materials" className="mt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Array.from({length: 2}).map((_, i) => (
                        <div key={i} className="flex items-start space-x-3 p-3 rounded-md border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="bg-gray-100 p-2 rounded-md">
                            <Tool className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="font-medium">Material {i+1}</h4>
                            <p className="text-sm text-gray-600">Category: Materials</p>
                            <div className="flex items-center mt-1">
                              <Badge variant={i % 2 === 0 ? 'destructive' : 'secondary'} className="text-xs">
                                {i % 2 === 0 ? 'Low Stock' : 'In Stock'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Makerspace Stats</CardTitle>
                <CardDescription>Key information about this location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="font-medium">Members</span>
                  </div>
                  <Badge variant="outline">{locationData.memberCount}</Badge>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center">
                    <Tool className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="font-medium">Resources</span>
                  </div>
                  <Badge variant="outline">{locationData.resourceCount}</Badge>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="font-medium">Businesses</span>
                  </div>
                  <Badge variant="outline">18</Badge>
                </div>
                
                <Button 
                  className="w-full mt-4"
                  style={{
                    background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 100%)`,
                    border: 'none'
                  }}
                >
                  Book a Resource
                </Button>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Location Managers</CardTitle>
                <CardDescription>Contact persons for this makerspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({length: 2}).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors">
                    <Avatar>
                      <AvatarFallback>{`M${i+1}`}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">Manager {i+1}</h4>
                      <p className="text-sm text-gray-600">+233 50 123 456{i}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}