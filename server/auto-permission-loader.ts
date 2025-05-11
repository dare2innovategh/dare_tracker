import { db } from './db';
import { roles, rolePermissions, permissions } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import fs from 'fs';
import path from 'path';

// Define resource mapping to make API paths more user-friendly
const resourceMapping: Record<string, string> = {
  'youth-profiles': 'youth_profiles',
  'youth': 'youth_profiles',
  'business-profiles': 'businesses',
  'business-tracking': 'business_tracking',
  'mentor-businesses': 'mentors',
  'mentorship-messages': 'mentorship',
  'makerspaces': 'makerspaces',
  'training-programs': 'training',
  'service-categories': 'skills',
  'service-subcategories': 'skills',
  'business-advice': 'businesses',
  'skills': 'skills',
  'uploads': 'uploads',
  'roles': 'roles',
  'role-permissions': 'permissions',
  'users': 'users',
  'permissions': 'permissions',
  'admin': 'system',
  'stats': 'dashboard',
  'activities': 'activities',
  'reports': 'reports',
  'diagnostics': 'diagnostics',
  'portfolio': 'portfolio',
  'certificates': 'certificates',
  'education': 'education'
};

// Define method to action mapping
const methodToAction: Record<string, string> = {
  'GET': 'view',
  'POST': 'create',
  'PUT': 'edit',
  'PATCH': 'edit',
  'DELETE': 'delete'
};

/**
 * Function to scan server files for API routes
 * This is a simplified version since we can't use the actual Express app directly
 */
function scanServerFilesForRoutes(): { path: string; method: string; }[] {
  const routes: { path: string; method: string; }[] = [];
  const currentDir = process.cwd();
  const routesDir = path.join(currentDir, 'routes');
  
  if (!fs.existsSync(routesDir)) {
    console.log(`Routes directory does not exist: ${routesDir}`);
    return routes;
  }
  
  console.log(`Scanning routes directory: ${routesDir}`);
  
  // Get all TS files in the routes directory
  const routeFiles = fs.readdirSync(routesDir)
    .filter(file => file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts'));
  
  console.log(`Found ${routeFiles.length} route files`);
  
  // Process each file
  routeFiles.forEach(file => {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract route patterns using regex
    const routeMethods = ['get', 'post', 'put', 'patch', 'delete'];
    
    routeMethods.forEach(method => {
      const methodRegex = new RegExp(`\\.(${method})\\(['"]([^'"]+)['"]`, 'g');
      let match;
      
      while ((match = methodRegex.exec(content)) !== null) {
        const routePath = match[2];
        if (routePath.startsWith('/')) {
          routes.push({ path: `/api${routePath}`, method: method.toUpperCase() });
        } else if (!routePath.includes(':')) {
          routes.push({ path: `/api/${routePath}`, method: method.toUpperCase() });
        }
      }
    });
  });
  
  // Also check the main routes.ts
  const routesFilePath = path.join(currentDir, 'routes.ts');
  if (fs.existsSync(routesFilePath)) {
    console.log(`Found routes.ts at ${routesFilePath}`);
    const content = fs.readFileSync(routesFilePath, 'utf8');
    
    // Find app.use route registrations
    const useRegex = /app\.use\(['"]\/api(?:\/([^'"]+))?['"]/g;
    let match;
    
    while ((match = useRegex.exec(content)) !== null) {
      const route = match[1] ? `/api/${match[1]}` : '/api';
      // For router registrations, we add the base route for listing
      routes.push({ path: route, method: 'GET' });
    }
    
    // Find direct route definitions
    const routeMethods = ['get', 'post', 'put', 'patch', 'delete'];
    routeMethods.forEach(method => {
      const methodRegex = new RegExp(`app\\.${method}\\(['"](\\/api[^'"]+)['"]`, 'g');
      let match;
      
      while ((match = methodRegex.exec(content)) !== null) {
        routes.push({ path: match[1], method: method.toUpperCase() });
      }
    });
  }

  return routes;
}

/**
 * Extract resource and action from route
 */
function extractResourceAndAction(route: { path: string; method: string; }): { resource: string; action: string; } | null {
  // Skip auth routes and other non-resource routes
  if (route.path.includes('/login') || route.path.includes('/logout') || 
      route.path.includes('/register') || !route.path.startsWith('/api')) {
    return null;
  }
  
  // Extract the resource name from the path
  const pathParts = route.path.split('/').filter(p => p);
  if (pathParts.length < 2) return null;
  
  const apiResourcePath = pathParts[1]; // e.g., 'youth-profiles'
  
  // Map to a normalized resource name
  let resource = resourceMapping[apiResourcePath] || apiResourcePath;
  
  // Get the action based on HTTP method
  let action = methodToAction[route.method] || 'view';
  
  // Special case for list endpoints
  if (route.method === 'GET' && !route.path.includes('/:')) {
    action = 'list';
  }
  
  return { resource, action };
}

/**
 * Automatically ensure the admin role has all permissions
 */
export async function autoAssignAdminPermissions() {
  try {
    console.log("Starting auto permission assignment for admin...");
    
    // 1. Get the admin role (or create it if it doesn't exist)
    let adminRole = (await db.select().from(roles).where(eq(roles.name, 'admin')))[0];
    
    if (!adminRole) {
      console.log("Admin role not found, creating it...");
      const [newAdminRole] = await db.insert(roles)
        .values({
          name: "admin",
          description: "Administrator with full access",
          isSystem: true,
          isEditable: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      adminRole = newAdminRole;
      console.log(`Admin role created with ID: ${adminRole.id}`);
    } else {
      console.log(`Found existing admin role with ID: ${adminRole.id}`);
    }
    
    // 2. Get all existing permissions
    const existingPermissions = await db.select().from(permissions);
    console.log(`Found ${existingPermissions.length} existing permissions`);
    
    // 3. Get admin's current permissions
    const adminPermissions = await db.select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, adminRole.id));
    
    console.log(`Admin currently has ${adminPermissions.length} permissions`);
    
    // 4. Find any missing permissions
    const adminPermSet = new Set(adminPermissions.map(p => `${p.resource}:${p.action}`));
    const missingPermissions = existingPermissions.filter(p => 
      !adminPermSet.has(`${p.resource}:${p.action}`)
    );
    
    // 5. Assign any missing permissions to admin
    if (missingPermissions.length > 0) {
      console.log(`Found ${missingPermissions.length} missing permissions for admin, adding them...`);
      
      // First, delete all existing admin permissions to avoid duplicates
      await db.delete(rolePermissions)
        .where(eq(rolePermissions.roleId, adminRole.id))
        .execute();
      console.log("Deleted all admin permissions");
      
      // Now, insert all permissions at once
      const allPermissions = existingPermissions.map(perm => ({
        roleId: adminRole.id,
        role: adminRole.name,
        resource: perm.resource,
        action: perm.action,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      await db.insert(rolePermissions)
        .values(allPermissions)
        .execute();
      
      console.log(`Added ${allPermissions.length} permissions to admin role`);
    } else {
      console.log(`Admin already has all permissions`);
    }
    
    // 6. Scan for new API routes
    console.log("Scanning for new API routes...");
    const routes = scanServerFilesForRoutes();
    console.log(`Found ${routes.length} API routes from server files`);
    
    // 7. Generate permissions from routes
    let newPermissionsCount = 0;
    
    // Keep track of existing permissions
    const existingPermSet = new Set(existingPermissions.map(p => `${p.resource}:${p.action}`));
    
    for (const route of routes) {
      const extracted = extractResourceAndAction(route);
      if (!extracted) continue;
      
      const { resource, action } = extracted;
      const permKey = `${resource}:${action}`;
      
      // Skip if permission already exists
      if (existingPermSet.has(permKey)) continue;
      
      // Add new permission
      console.log(`Adding new permission: ${permKey} from route ${route.method} ${route.path}`);
      
      try {
        const [newPerm] = await db.insert(permissions)
          .values({
            resource,
            action,
            description: `${action} ${resource}`.replace(/_/g, ' ')
          })
          .returning();
        
        // Add permission to admin role
        await db.insert(rolePermissions)
          .values({
            roleId: adminRole.id,
            role: adminRole.name,
            resource,
            action,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .execute();
        
        console.log(`Added permission ${permKey} to admin role`);
        newPermissionsCount++;
        
        // Add to existing set to avoid duplicates
        existingPermSet.add(permKey);
      } catch (err) {
        console.log(`Error adding permission ${permKey}:`, err);
      }
    }
    
    console.log(`Added ${newPermissionsCount} new permissions from API routes`);
    
    // 8. Final verification
    const finalAdminPerms = await db.select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, adminRole.id));
    
    console.log(`Admin role now has ${finalAdminPerms.length} permissions`);
    
    console.log("Auto permission assignment completed successfully");
    return {
      adminRoleId: adminRole.id,
      totalPermissions: existingPermissions.length + newPermissionsCount,
      adminPermissions: finalAdminPerms.length,
      newPermissionsAdded: newPermissionsCount
    };
  } catch (error) {
    console.error("Error in auto permission assignment:", error);
    throw error;
  }
}

// Run immediately if this file is directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  autoAssignAdminPermissions()
    .then((result) => {
      console.log("Auto permission assignment completed successfully");
      console.log("Summary:", result);
      process.exit(0);
    })
    .catch(error => {
      console.error("Auto permission assignment failed:", error);
      process.exit(1);
    });
}