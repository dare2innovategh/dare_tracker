import { useQuery } from "@tanstack/react-query";

// Export Resource as enum so it can be used as a value
export enum Resource {
  USERS = "users",
  ROLES = "roles",
  PERMISSIONS = "permissions",
  YOUTH = "youth_profiles",
  YOUTH_EDUCATION = "youth_education",
  YOUTH_CERTIFICATIONS = "youth_certifications",
  YOUTH_SKILLS = "youth_skills",
  BUSINESSES = "businesses",
  BUSINESS_YOUTH = "business_youth",
  MENTORS = "mentors",
  MENTOR_ASSIGNMENT = "mentor_assignments",
  MENTORSHIP = "mentorship_messages",
  BUSINESS_ADVICE = "business_advice",
  BUSINESS_TRACKING = "business_tracking",
  MAKERSPACES = "makerspaces",
  REPORTS = "reports",
  TRAINING_PROGRAMS = "training_programs",
  SYSTEM_SETTINGS = "system_settings",
  ADMIN_PANEL = "admin_panel"
}

// Export Action as enum so it can be used as a value
export enum Action {
  VIEW = "view",
  CREATE = "create",
  EDIT = "edit",
  DELETE = "delete",
  MANAGE = "manage"
}

// Define Permission type using the enums
export type Permission = {
  resource: Resource;
  action: Action;
};

// Custom hook to check if the user has a specific permission
export function useHasPermission(resource: Resource, action: Action): boolean {
  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
  });

  return permissions.some(
    (p) => p.resource === resource && p.action === action
  );
}

// Custom hook to check if the user has any of the specified permissions
export function useHasAnyPermission(permissionsToCheck: Array<[Resource, Action]>): boolean {
  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
  });

  return permissionsToCheck.some(([resource, action]) =>
    permissions.some(
      (p) => p.resource === resource && p.action === action
    )
  );
}

// Custom hook to check if the user has all of the specified permissions
export function useHasAllPermissions(permissionsToCheck: Array<[Resource, Action]>): boolean {
  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
  });

  return permissionsToCheck.every(([resource, action]) =>
    permissions.some(
      (p) => p.resource === resource && p.action === action
    )
  );
}