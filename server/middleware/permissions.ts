import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { permissions as permissionsTable, rolePermissions, roles, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { type PermissionResource, type PermissionAction } from '@shared/schema';

export function requirePermission(resource: PermissionResource, action: PermissionAction) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // No auth - return unauthorized
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get user's role from the database
      const userId = req.user.id;
      const [userWithRole] = await db.select({
        role: users.role
      }).from(users).where(eq(users.id, userId));

      if (!userWithRole?.role) {
        return res.status(403).json({ error: 'User has no assigned role' });
      }
      
      // Special case: Admin has all permissions
      console.log(`Checking if role '${userWithRole.role}' has permission for resource='${resource}', action='${action}'`);
      if (userWithRole.role === 'admin') {
        console.log(`Admin role has all permissions, returning true`);
        return next();
      }

      // Get the role ID from the roles table
      const [roleData] = await db
        .select({
          id: roles.id
        })
        .from(roles)
        .where(eq(roles.name, userWithRole.role));

      if (!roleData?.id) {
        return res.status(403).json({ error: 'Role not found in system' });
      }

      // Get permissions for the role - checking directly in rolePermissions
      const results = await db
        .select({
          rolePermission: rolePermissions.id
        })
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, roleData.id),
            eq(rolePermissions.resource, resource),
            eq(rolePermissions.action, action)
          )
        );

      // If user has permission, continue
      if (results.length > 0) {
        return next();
      }

      // No permission - return forbidden
      console.log(`Role '${userWithRole.role}' does NOT have permission for ${resource}:${action}`);
      return res.status(403).json({ 
        error: `You don't have permission to ${action} ${resource}` 
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Error checking permissions' });
    }
  };
}