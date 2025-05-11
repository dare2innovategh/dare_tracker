import { db } from './db';
import { roles, rolePermissions, permissions, customRoles } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from 'fs';
import path from 'path';

// Define common actions for resources
type Action = 'create' | 'view' | 'edit' | 'delete' | 'list' | 'manage' | 'approve' | 'reject';

// Define the resources we want to track based on the API endpoints
const resourceGroups = [
  {
    name: 'youth_profiles',
    actions: ['create', 'view', 'edit', 'delete', 'list', 'manage'],
    description: 'Youth profile management'
  },
  {
    name: 'businesses',
    actions: ['create', 'view', 'edit', 'delete', 'list', 'manage'],
    description: 'Business profile management'
  },
  {
    name: 'business_tracking',
    actions: ['create', 'view', 'edit', 'delete', 'list'],
    description: 'Business tracking'
  },
  {
    name: 'mentors',
    actions: ['create', 'view', 'edit', 'delete', 'list', 'assign'],
    description: 'Mentor management'
  },
  {
    name: 'mentorship',
    actions: ['view', 'send', 'receive'],
    description: 'Mentorship messaging'
  },
  {
    name: 'users',
    actions: ['create', 'view', 'edit', 'delete', 'list'],
    description: 'User management'
  },
  {
    name: 'roles',
    actions: ['create', 'view', 'edit', 'delete', 'list'],
    description: 'Role management'
  },
  {
    name: 'permissions',
    actions: ['view', 'manage', 'assign'],
    description: 'Permission management'
  },
  {
    name: 'reports',
    actions: ['view', 'generate', 'export'],
    description: 'Report generation'
  },
  {
    name: 'training',
    actions: ['create', 'view', 'edit', 'delete', 'assign'],
    description: 'Training programs'
  },
  {
    name: 'skills',
    actions: ['create', 'view', 'edit', 'delete', 'assign'],
    description: 'Skills management'
  },
  {
    name: 'makerspaces',
    actions: ['create', 'view', 'edit', 'delete', 'list'],
    description: 'Makerspace management'
  },
  {
    name: 'certificates',
    actions: ['create', 'view', 'edit', 'delete', 'list', 'issue'],
    description: 'Certificate management'
  },
  {
    name: 'system',
    actions: ['view', 'configure', 'backup', 'restore'],
    description: 'System settings'
  },
  {
    name: 'diagnostics',
    actions: ['view', 'run'],
    description: 'System diagnostics'
  },
  {
    name: 'uploads',
    actions: ['create', 'view', 'delete'],
    description: 'File uploads'
  },
  {
    name: 'portfolio',
    actions: ['create', 'view', 'edit', 'delete'],
    description: 'Youth portfolios'
  },
  {
    name: 'education',
    actions: ['create', 'view', 'edit', 'delete'],
    description: 'Education records'
  },
  {
    name: 'dashboard',
    actions: ['view'],
    description: 'Dashboard access'
  },
  {
    name: 'activities',
    actions: ['view'],
    description: 'Activity feed'
  }
];

/**
 * Script to completely clean all roles and permissions and create a new dynamic system
 */
async function createDynamicPermissions() {
  try {
    console.log("Starting dynamic permissions creation...");
    
    // 1. Drop all existing permissions and roles
    console.log("1. Deleting all role permissions...");
    await db.delete(rolePermissions).execute();
    console.log("All role permissions deleted");
    
    console.log("2. Deleting all custom roles...");
    await db.delete(customRoles).execute();
    console.log("All custom roles deleted");
    
    console.log("3. Deleting all permissions...");
    await db.delete(permissions).execute();
    console.log("All permissions deleted");
    
    console.log("4. Deleting all system roles...");
    await db.delete(roles).execute();
    console.log("All system roles deleted");
    
    // 5. Create the admin role
    console.log("5. Creating admin role...");
    const [adminRole] = await db.insert(roles)
      .values({
        name: "admin",
        description: "Administrator with full access",
        isSystem: true,
        isEditable: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log(`Admin role created with ID: ${adminRole.id}`);
    
    // 6. Create essential leadership roles
    const leadershipRoles = [
      { name: "Program Lead", description: "Program Leadership" },
      { name: "Communication Lead", description: "Communication Leadership" },
      { name: "RMEL Lead", description: "Research/Monitoring/Evaluations/Learning Leadership" },
      { name: "IHS Lead", description: "Innovation Hubs/Spaces Leadership" },
      { name: "MKTS Lead", description: "Mentoring/Knowledge Transfer/Sustainability Leadership" },
      { name: "Mentor", description: "Mentor with limited access" },
      { name: "User", description: "Regular user with minimal access" }
    ];
    
    console.log("6. Creating essential leadership roles...");
    const createdRoles = [];
    
    for (const role of leadershipRoles) {
      const [createdRole] = await db.insert(roles)
        .values({
          name: role.name,
          description: role.description,
          isSystem: true,
          isEditable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      createdRoles.push(createdRole);
      console.log(`Created role: ${createdRole.name} with ID: ${createdRole.id}`);
    }
    
    // 7. Create permissions for all resources and actions
    console.log("7. Creating dynamic permissions for all resources...");
    const allPermissions = [];
    
    for (const group of resourceGroups) {
      for (const action of group.actions) {
        const [permission] = await db.insert(permissions)
          .values({
            resource: group.name,
            action: action,
            description: `${action} ${group.description}`
          })
          .returning();
        
        allPermissions.push(permission);
      }
      console.log(`Created permissions for resource: ${group.name}`);
    }
    
    console.log(`Created ${allPermissions.length} permissions across ${resourceGroups.length} resources`);
    
    // 8. Assign all permissions to admin
    console.log("8. Assigning all permissions to admin role...");
    
    for (const perm of allPermissions) {
      await db.insert(rolePermissions)
        .values({
          roleId: adminRole.id,
          role: adminRole.name,
          resource: perm.resource,
          action: perm.action,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .execute();
    }
    
    console.log(`Assigned ${allPermissions.length} permissions to admin role`);
    
    // 9. Assign default permissions to leadership roles
    console.log("9. Assigning default permissions to leadership roles...");
    
    // Program Lead - Gets most permissions except system management
    const programLeadRole = createdRoles.find(r => r.name === "Program Lead");
    if (programLeadRole) {
      const programLeadPermissions = allPermissions.filter(p => 
        p.resource !== 'system' && 
        p.resource !== 'permissions' &&
        p.resource !== 'roles' &&
        p.resource !== 'diagnostics' &&
        !(p.resource === 'users' && p.action === 'delete')
      );
      
      for (const perm of programLeadPermissions) {
        await db.insert(rolePermissions)
          .values({
            roleId: programLeadRole.id,
            role: programLeadRole.name,
            resource: perm.resource,
            action: perm.action,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .execute();
      }
      
      console.log(`Assigned ${programLeadPermissions.length} permissions to Program Lead role`);
    }
    
    // Mentor - Gets view access and some management permissions for mentorship
    const mentorRole = createdRoles.find(r => r.name === "Mentor");
    if (mentorRole) {
      const mentorPermissions = allPermissions.filter(p => 
        (p.action === 'view' || p.action === 'list') ||
        (p.resource === 'mentorship' && (p.action === 'send' || p.action === 'receive')) ||
        (p.resource === 'business_tracking' && p.action === 'edit') ||
        (p.resource === 'portfolio' && p.action === 'view')
      );
      
      for (const perm of mentorPermissions) {
        await db.insert(rolePermissions)
          .values({
            roleId: mentorRole.id,
            role: mentorRole.name,
            resource: perm.resource,
            action: perm.action,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .execute();
      }
      
      console.log(`Assigned ${mentorPermissions.length} permissions to Mentor role`);
    }
    
    // User - Gets minimal view access
    const userRole = createdRoles.find(r => r.name === "User");
    if (userRole) {
      const userPermissions = allPermissions.filter(p => 
        (p.resource === 'dashboard' && p.action === 'view') ||
        (p.resource === 'activities' && p.action === 'view') ||
        (p.resource === 'portfolio' && p.action === 'view') ||
        (p.resource === 'youth_profiles' && p.action === 'view')
      );
      
      for (const perm of userPermissions) {
        await db.insert(rolePermissions)
          .values({
            roleId: userRole.id,
            role: userRole.name,
            resource: perm.resource,
            action: perm.action,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .execute();
      }
      
      console.log(`Assigned ${userPermissions.length} permissions to User role`);
    }
    
    // 10. Verify everything
    const finalRoles = await db.select().from(roles);
    const finalPermissions = await db.select().from(permissions);
    const finalRolePermissions = await db.select().from(rolePermissions);
    
    console.log(`=== Final Counts ===`);
    console.log(`Roles: ${finalRoles.length}`);
    console.log(`Permissions: ${finalPermissions.length}`);
    console.log(`Role-Permissions Assignments: ${finalRolePermissions.length}`);
    
    console.log("Dynamic permissions system created successfully!");
    return {
      roles: finalRoles.length,
      permissions: finalPermissions.length,
      rolePermissions: finalRolePermissions.length
    };
  } catch (error) {
    console.error("Error creating dynamic permissions:", error);
    throw error;
  }
}

// Run immediately if this file is directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  createDynamicPermissions()
    .then((result) => {
      console.log("Dynamic permissions creation completed successfully");
      console.log("Summary:", result);
      process.exit(0);
    })
    .catch(error => {
      console.error("Dynamic permissions creation failed:", error);
      process.exit(1);
    });
}