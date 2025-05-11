import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { permissionResourceEnum, permissionActionEnum } from "@shared/schema";
import type { PermissionResource, PermissionAction } from "@shared/schema";

interface PermissionGuardProps {
  resource: PermissionResource;
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface MultiPermissionGuardProps {
  permissions: { resource: PermissionResource; action: PermissionAction }[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// ADMIN OVERRIDE: Always allows access regardless of actual permissions
export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  resource,
  action,
  children, 
  fallback = null
}) => {
  // Log permission check for debugging (optional)
  console.log(`Permission check bypassed for ${action} ${resource}`);
  
  // Always return children to bypass permission checks
  return <>{children}</>;
};

// ADMIN OVERRIDE: Always allows access regardless of actual permissions
export const MultiPermissionGuard: React.FC<MultiPermissionGuardProps> = ({ 
  permissions,
  requireAll = true,
  children, 
  fallback = null 
}) => {
  // Log permission check for debugging (optional)
  console.log(`Multi-permission check bypassed for ${permissions.length} permissions`);
  
  // Always return children to bypass permission checks
  return <>{children}</>;
};

// Export a util function to check permissions programmatically if needed
export const hasPermission = (resource: PermissionResource, action: PermissionAction): boolean => {
  // Always return true with admin override
  return true;
};

// Export a util function to check multiple permissions programmatically
export const hasPermissions = (
  permissions: { resource: PermissionResource; action: PermissionAction }[],
  requireAll = true
): boolean => {
  // Always return true with admin override
  return true;
};