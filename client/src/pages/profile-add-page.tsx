import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import SimpleProfileForm from "@/components/youth-profile/simple-profile-form";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function ProfileAddPage() {
  // Get current user ID for creating a profile
  const { data: user } = useQuery<{ id: number }>({
    queryKey: ["/api/user"],
  });

  return (
    <DashboardLayout>
      <div className="md:py-8 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <Header
            title="Create New Youth Profile"
            description="Create a new profile with personal information, skills, and education records"
            showActions={false}
          />

          {user ? (
            <SimpleProfileForm 
              userId={user.id} 
              isEdit={false}
            />
          ) : (
            <div className="flex justify-center items-center py-12">
              <p className="text-gray-500">Loading user information...</p>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}