import DashboardLayout from "@/components/layout/dashboard-layout";
import MentorManagement from "@/components/mentors/mentor-management";

export default function MentorsPage() {
  return (
    <DashboardLayout>
      <div className="md:py-8 px-4 md:px-8 max-w-7xl mx-auto">
        <MentorManagement />
      </div>
    </DashboardLayout>
  );
}