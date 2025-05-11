import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import SimpleProfileForm from "@/components/youth-profile/simple-profile-form";
import { YouthProfile } from "@shared/schema";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Link } from "wouter";

export default function SimpleProfileEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const profileId = parseInt(id);

  // Fetch the youth profile
  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery<YouthProfile>({
    queryKey: [`/api/youth/profiles/${profileId}`],
    queryFn: async () => {
      const response = await fetch(`/api/youth/profiles/${profileId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
    enabled: !isNaN(profileId),
  });

  // Fetch education data for this profile
  const { data: educationData, isLoading: educationLoading } = useQuery({
    queryKey: [`/api/education/youth/${profileId}`],
    queryFn: async () => {
      const response = await fetch(`/api/education/youth/${profileId}`);
      if (!response.ok) {
        return []; // Return empty array if no education records
      }
      return response.json();
    },
    enabled: !isNaN(profileId) && !!profileData,
  });

  // Handle error state
  if (profileError) {
    return (
      <DashboardLayout>
        <div className="container">
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="text-red-500 text-lg font-semibold mb-2">Error loading profile</div>
            <p className="text-muted-foreground mb-4">
              There was a problem loading the profile data. Please try again.
            </p>
            <Button
              onClick={() => navigate("/youth/profiles")}
              className="px-4 py-2"
            >
              Return to Profiles
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading state
  if (profileLoading || educationLoading || !profileData) {
    return (
      <DashboardLayout>
        <div className="container">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Loading profile data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Extract education fields from the first education record (if any)
  const highestEducation = educationData && educationData.length > 0 
    ? educationData.find(e => e.isHighestQualification) || educationData[0] 
    : null;

  // Create combined data for the form
  const combinedData = {
    ...profileData,
    educationLevel: highestEducation?.qualificationName || '',
    educationSpecialization: highestEducation?.specialization || '',
    educationInstitution: highestEducation?.institution || '',
    educationYear: highestEducation?.graduationYear ? String(highestEducation.graduationYear) : '',
    isHighestQualification: highestEducation?.isHighestQualification || false,
  };

  return (
    <DashboardLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <Link href={`/youth/profiles/${profileId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Profile
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Youth Profile</h1>
        </div>
        
        <SimpleProfileForm 
          userId={profileData.userId} 
          profileData={combinedData}
          isEdit={true}
        />
      </div>
    </DashboardLayout>
  );
}