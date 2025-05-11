import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BusinessProfile } from "@shared/schema";
import BusinessResourcesManagement from "@/components/business/business-resources-management";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function BusinessResourcesPage() {
  const { businessId } = useParams();
  
  // Fetch business details
  const { data: business, isLoading, error } = useQuery<BusinessProfile>({
    queryKey: ["/api/business-profiles", businessId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/business-profiles/${businessId}`);
      return await response.json();
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-2xl font-bold mb-2">Error Loading Business</h1>
          <p className="text-muted-foreground mb-4">
            {(error as Error).message || "Failed to load business details"}
          </p>
          <Link href="/dashboard" className="text-primary hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!business) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-2xl font-bold mb-2">Business Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The business you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/dashboard" className="text-primary hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/businesses">Businesses</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/businesses/${businessId}`}>{business.businessName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            Resources
          </BreadcrumbItem>
        </Breadcrumb>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {business.businessName} - Resources
          </h1>
          <p className="text-muted-foreground">
            Manage business resources, tools, equipment, and materials.
          </p>
          
          <BusinessResourcesManagement business={business} />
        </div>
      </div>
    </DashboardLayout>
  );
}