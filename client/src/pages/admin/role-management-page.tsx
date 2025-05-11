import DashboardLayout from "@/components/layout/dashboard-layout";
import RoleManagement from "@/components/admin/role-management";
import { usePermissions } from "@/hooks/use-permissions";
import AccessDenied from "@/components/common/access-denied";

export default function RoleManagementPage() {
  const { hasPermission, isLoading } = usePermissions();
  const canManageRoles = hasPermission("roles", "manage");

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Role Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canManageRoles) {
    return (
      <DashboardLayout pageTitle="Role Management">
        <AccessDenied 
          message="You don't have permission to manage roles." 
          permissionNeeded="Roles Management"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Role Management">
      <RoleManagement />
    </DashboardLayout>
  );
}