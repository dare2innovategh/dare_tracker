import { db } from './db';
import { permissions, rolePermissions } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from 'fs';
import path from 'path';
import * as express from 'express';

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

// Special action mapping for specific endpoints
const specialActionMapping: Record<string, string> = {
  '/api/login': 'auth',
  '/api/logout': 'auth',
  '/api/register': 'auth',
  '/api/roles': 'manage',
  '/api/permissions': 'manage',
  '/api/stats': 'view',
  '/api/activities': 'view',
  '/api/reports': 'view'
};

/**
 * Function to extract all API routes from the Express app
 */
function extractApiRoutes(app: express.Express): { path: string; method: string; }[] {
  const routes: { path: string; method: string; }[] = [];

  // Function to process route stack
  function processStack(stack: any[], basePath: string = '') {
    stack.forEach(layer => {
      if (layer.route) {
        // Routes registered directly on the app
        const routePath = basePath + layer.route.path;
        Object.keys(layer.route.methods).forEach(method => {
          if (method !== '_all') {
            routes.push({ 
              path: routePath, 
              method: method.toUpperCase() 
            });
          }
        });
      } else if (layer.name === 'router' && layer.handle.stack) {
        // Router middleware
        let routerPath = basePath;
        if (layer.regexp && layer.regexp.source !== '^\\/?$') {
          // Extract the base path from regexp 
          // This is a simplistic approach and might need improvements
          const match = layer.regexp.toString().match(/^\^\\\/([^\\]+)/);
          if (match) {
            routerPath = basePath + '/' + match[1];
          }
        }
        processStack(layer.handle.stack, routerPath);
      }
    });
  }

  if ((app as any)._router && (app as any)._router.stack) {
    processStack((app as any)._router.stack);
  }

  return routes;
}

/**
 * Function to scan server files for API routes
 */
function scanServerFilesForRoutes(serverDir: string): string[] {
  const apiRoutes: string[] = [];
  const routesDir = path.join(serverDir, 'routes');
  
  // Get all TS files in the routes directory
  const routeFiles = fs.readdirSync(routesDir)
    .filter(file => file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts'));
  
  // Process each file
  routeFiles.forEach(file => {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract route patterns using regex
    // This is just a simple example - might need improvement based on actual code structure
    const routeMethods = ['get', 'post', 'put', 'patch', 'delete'];
    
    routeMethods.forEach(method => {
      const methodRegex = new RegExp(`\\.(${method})\\(['"]([^'"]+)['"]`, 'g');
      let match;
      
      while ((match = methodRegex.exec(content)) !== null) {
        const routePath = match[2];
        if (routePath.startsWith('/')) {
          apiRoutes.push(`${method.toUpperCase()} /api${routePath}`);
        } else if (!routePath.includes(':')) {
          apiRoutes.push(`${method.toUpperCase()} /api/${routePath}`);
        }
      }
    });
  });
  
  return apiRoutes;
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
  
  // Get the action based on HTTP method or special mapping
  let action = specialActionMapping[route.path] || methodToAction[route.method] || 'view';
  
  // Special case for list endpoints
  if (route.method === 'GET' && !route.path.includes('/:')) {
    action = 'list';
  }
  
  return { resource, action };
}

/**
 * Function to add missing permissions based on routes
 */
async function addMissingPermissions(routes: { path: string; method: string; }[]): Promise<number> {
  let addedCount = 0;
  
  // Get existing permissions
  const existingPermissions = await db.select().from(permissions);
  const existingPermSet = new Set(existingPermissions.map(p => `${p.resource}:${p.action}`));
  
  // Process each route
  for (const route of routes) {
    const extracted = extractResourceAndAction(route);
    if (!extracted) continue;
    
    const { resource, action } = extracted;
    const permKey = `${resource}:${action}`;
    
    // Skip if permission already exists
    if (existingPermSet.has(permKey)) continue;
    
    // Add new permission
    console.log(`Adding new permission: ${permKey} from route ${route.method} ${route.path}`);
    
    const [newPerm] = await db.insert(permissions)
      .values({
        resource,
        action,
        description: `${action} ${resource}`.replace(/_/g, ' ')
      })
      .returning();
    
    addedCount++;
    
    // Add permission to admin role
    const adminRoles = await db.select().from(rolePermissions)
      .where(eq(rolePermissions.role, 'admin'));
    
    if (adminRoles.length > 0) {
      const adminRoleId = adminRoles[0].roleId;
      
      await db.insert(rolePermissions)
        .values({
          roleId: adminRoleId,
          role: 'admin',
          resource,
          action,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .execute();
      
      console.log(`Added permission ${permKey} to admin role`);
    }
  }
  
  return addedCount;
}

/**
 * Main function to scan routes and update permissions
 */
export async function scanAndUpdatePermissions(): Promise<{ routes: number; newPermissions: number; }> {
  try {
    console.log("Starting dynamic permissions scanning...");
    
    // Step 1: Manually scan server files for routes
    console.log("Scanning server files for API routes...");
    const routesFromFiles = scanServerFilesForRoutes(path.resolve(__dirname));
    
    // Convert to standard format
    const routes = routesFromFiles.map(route => {
      const [method, path] = route.split(' ');
      return { path, method };
    });
    
    console.log(`Found ${routes.length} routes from server files`);
    
    // Step 2: Add missing permissions
    console.log("Adding missing permissions based on routes...");
    const addedCount = await addMissingPermissions(routes);
    
    console.log(`Added ${addedCount} new permissions based on routes`);
    
    return {
      routes: routes.length,
      newPermissions: addedCount
    };
  } catch (error) {
    console.error("Error scanning and updating permissions:", error);
    throw error;
  }
}

// Run immediately if this file is directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  scanAndUpdatePermissions()
    .then((result) => {
      console.log("Dynamic permissions scanning completed successfully");
      console.log("Summary:", result);
      process.exit(0);
    })
    .catch(error => {
      console.error("Dynamic permissions scanning failed:", error);
      process.exit(1);
    });
}