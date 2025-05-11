import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ResourceCosts from "@/components/makerspace/resource-costs";
import { Loader2, ArrowLeft, Package, Wrench, Layers, Square } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const resourceId = parseInt(id);

  // Fetch resource details
  const { data: resource, isLoading } = useQuery({
    queryKey: ["/api/makerspace-resources/resources", resourceId],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/makerspace-resources/resources/${resourceId}`
      );
      return await response.json();
    },
  });

  // Format currency values
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(value);
  };

  // Format date values
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Function to get the appropriate status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "In Use":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "Out of Stock":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  // Function to get the appropriate icon for each category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Tool":
        return <Wrench className="h-5 w-5 mr-2" />;
      case "Equipment":
        return <Package className="h-5 w-5 mr-2" />;
      case "Material":
        return <Layers className="h-5 w-5 mr-2" />;
      case "Space":
        return <Square className="h-5 w-5 mr-2" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!resource) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold">Resource Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The resource you're looking for does not exist or has been removed.
          </p>
          <Link href="/makerspaces">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Makerspaces
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink href="/makerspaces">Makerspaces</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/makerspaces/${resource.makerspaceId}`}>
                Makerspace Details
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/makerspaces/${resource.makerspaceId}/resources`}>
                Resources
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>{resource.name}</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          <Link href={`/makerspaces/${resource.makerspaceId}/resources`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Resources
            </Button>
          </Link>
        </div>

        <div className="flex items-center">
          <div className="flex items-center mr-4">
            {getCategoryIcon(resource.category)}
            <h1 className="text-2xl font-bold">{resource.name}</h1>
          </div>
          <Badge className={getStatusColor(resource.status || "Available")}>
            {resource.status}
          </Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Resource Details</CardTitle>
              <CardDescription>
                Comprehensive information about this resource
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Category
                  </h3>
                  <p className="flex items-center">
                    {getCategoryIcon(resource.category)}
                    {resource.category}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Status
                  </h3>
                  <Badge className={getStatusColor(resource.status || "Available")}>
                    {resource.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Quantity
                  </h3>
                  <p>{resource.quantity}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Unit Cost
                  </h3>
                  <p>{formatCurrency(resource.unitCost)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Total Cost
                  </h3>
                  <p>{formatCurrency(resource.totalCost)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Acquisition Date
                  </h3>
                  <p>{formatDate(resource.acquisitionDate)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Supplier
                  </h3>
                  <p>{resource.supplier || "Not specified"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Serial Number
                  </h3>
                  <p>{resource.serialNumber || "N/A"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Warranty
                  </h3>
                  <p>{resource.warranty || "N/A"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Maintenance Schedule
                  </h3>
                  <p>{resource.maintenanceSchedule || "Not specified"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Life Expectancy
                  </h3>
                  <p>{resource.lifeExpectancy || "Not specified"}</p>
                </div>
              </div>

              {resource.description && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Description
                  </h3>
                  <p className="whitespace-pre-wrap">{resource.description}</p>
                </div>
              )}

              {resource.notes && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Notes
                  </h3>
                  <p className="whitespace-pre-wrap">{resource.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resource Information</CardTitle>
              <CardDescription>
                Additional details and metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Created At
                  </h3>
                  <p>{formatDate(resource.createdAt)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Last Updated
                  </h3>
                  <p>{formatDate(resource.updatedAt)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Resource ID
                  </h3>
                  <p className="font-mono text-sm">{resource.id}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Makerspace ID
                  </h3>
                  <p className="font-mono text-sm">{resource.makerspaceId}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resource Cost History */}
        <ResourceCosts resource={resource} />
      </div>
    </DashboardLayout>
  );
}