import React from "react";
import { useQuery } from "@tanstack/react-query";
import BasicProfileForm from "@/components/youth-profile/basic-profile-form";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function BasicProfilePage() {
  const { user } = useAuth();
  
  // If loading, show loading indicator
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <BasicProfileForm userId={user.id} />
    </div>
  );
}