import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// Types for permissions
export type PermissionResource = 
  | 'users' 
  | 'roles' 
  | 'permissions' 
  | 'youth_profiles' 
  | 'youth_education' 
  | 'youth_certifications' 
  | 'youth_skills' 
  | 'businesses' 
  | 'business_youth' 
  | 'mentors' 
  | 'mentor_assignments' 
  | 'mentorship_messages' 
  | 'business_advice' 
  | 'reports' 
  | 'system_settings'
  | 'dashboard'
  | 'activities'
  | 'training';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'manage';

export interface Permission {
  resource: PermissionResource;
  action: PermissionAction;
}

interface PermissionsContextType {
  permissions: Permission[];
  isLoading: boolean;
  error: Error | null;
  can: (resource: PermissionResource, action: PermissionAction) => boolean;
  hasPermission: (resource: PermissionResource, action: PermissionAction) => boolean;
  hasRole: (role: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // Fetch permissions from the API
  const { 
    data: fetchedPermissions, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/permissions'],
    enabled: !!user, // Only fetch if user is logged in
  });

  // Update permissions when data is fetched
  useEffect(() => {
    if (fetchedPermissions) {
      setPermissions(fetchedPermissions as Permission[]);
    }
  }, [fetchedPermissions]);

  // Check if user has a specific permission
  const can = (resource: PermissionResource, action: PermissionAction): boolean => {
    // Admin has all permissions
    if (user?.role === 'admin') return true;
    
    // Extra checks for mentors to ensure they cannot create/edit/delete youth profiles
    if (user?.role === 'mentor' && resource === 'youth_profiles') {
      if (action === 'create' || action === 'edit' || action === 'delete' || action === 'manage') {
        console.log(`Mentor tried to access restricted permission: ${resource}:${action}, denying access`);
        return false;
      }
    }
    
    // Check if the user has the specific permission
    return permissions.some(
      (p) => p.resource === resource && p.action === action
    );
  };

  // Check if user has a specific role
  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  // Add alias for can as hasPermission to maintain compatibility
  const hasPermission = can;

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        isLoading,
        error,
        can,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}

// Commonly used permission check hooks
export function useCanAccess(resource: PermissionResource, action: PermissionAction = 'view') {
  const { can, isLoading } = usePermissions();
  return {
    canAccess: can(resource, action),
    isLoading
  };
}

export function useCanView(resource: PermissionResource) {
  const { can, isLoading } = usePermissions();
  return {
    hasPermission: can(resource, 'view'),
    isLoading
  };
}

export function useCanCreate(resource: PermissionResource) {
  const { can, isLoading } = usePermissions();
  return {
    hasPermission: can(resource, 'create'),
    isLoading
  };
}

export function useCanEdit(resource: PermissionResource) {
  const { can, isLoading } = usePermissions();
  return {
    hasPermission: can(resource, 'edit'),
    isLoading
  };
}

export function useCanDelete(resource: PermissionResource) {
  const { can, isLoading } = usePermissions();
  return {
    hasPermission: can(resource, 'delete'),
    isLoading
  };
}

export function useCanManage(resource: PermissionResource) {
  const { can, isLoading } = usePermissions();
  return {
    hasPermission: can(resource, 'manage'),
    isLoading
  };
}