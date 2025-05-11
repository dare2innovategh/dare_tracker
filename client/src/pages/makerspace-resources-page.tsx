import React from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ResourcesManagement from "@/components/makerspace/resources-management";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function MakerspaceResourcesPage() {
  const { id } = useParams<{ id: string }>();
  const makerspaceId = parseInt(id);

  // Fetch makerspace details
  const { data: makerspace, isLoading } = useQuery({
    queryKey: [`/api/makerspaces/${makerspaceId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/makerspaces/${makerspaceId}`);
      return await response.json();
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!makerspace) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold">Makerspace Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The makerspace you're looking for does not exist or has been removed.
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
              <BreadcrumbLink href={`/makerspaces/${makerspace.id}`}>
                {makerspace.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Resources</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          <Link href={`/makerspaces/${makerspace.id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Makerspace
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{makerspace.name} - Resource Management</CardTitle>
            <CardDescription>
              Manage all resources for this makerspace location in {makerspace.district}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResourcesManagement makerspace={makerspace} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}