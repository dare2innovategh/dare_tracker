import DashboardLayout from "@/components/layout/dashboard-layout";
import RolePermissionsRedesigned from "@/components/admin/role-permissions-redesigned";
import { AdminPermissionsControls } from "@/components/admin/admin-permissions-controls";
import { usePermissions } from "@/hooks/use-permissions";
import AccessDenied from "@/components/common/access-denied";

export default function PermissionsManagementPage() {
  const { hasPermission, isLoading } = usePermissions();
  const canManagePermissions = hasPermission("permissions", "manage");
  const isSystemAdmin = hasPermission("system", "manage");

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Permissions Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canManagePermissions) {
    return (
      <DashboardLayout pageTitle="Permissions Management">
        <AccessDenied 
          message="You don't have permission to manage system permissions." 
          permissionNeeded="Permissions Management"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Permissions Management">
      {isSystemAdmin && <AdminPermissionsControls />}
      <RolePermissionsRedesigned />
    </DashboardLayout>
  );
}