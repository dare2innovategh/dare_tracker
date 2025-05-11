import express from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertRolePermissionSchema } from "@shared/schema";

// Create a router for permission management
const router = express.Router();

/**
 * Check if user has admin permission
 */
function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.isAuthenticated() || req.user?.role !== "admin") {
    return res.status(403).json({
      error: "Only administrators can manage permissions"
    });
  }
  next();
}

/**
 * Get all role permissions
 */
router.get("/role-permissions", async (req, res, next) => {
  try {
    const permissions = await storage.getAllRolePermissions();
    res.json(permissions);
  } catch (error) {
    next(error);
  }
});

/**
 * Get permissions for a specific role
 */
router.get("/role-permissions/:role", async (req, res, next) => {
  try {
    const { role } = req.params;
    const permissions = await storage.getRolePermissionsByRole(role);
    res.json(permissions);
  } catch (error) {
    next(error);
  }
});

/**
 * Create a new role permission
 */
router.post("/role-permissions", isAdmin, async (req, res, next) => {
  try {
    const permissionData = req.body;
    
    try {
      // Validate the input data against the schema
      const validatedData = insertRolePermissionSchema.parse(permissionData);
      
      // Check for duplicate permission
      const existingPermission = await storage.checkRolePermissionExists(
        validatedData.role,
        validatedData.resource,
        validatedData.action
      );
      
      if (existingPermission) {
        return res.status(409).json({
          error: "This permission already exists",
          permission: existingPermission
        });
      }
      
      // Create permission
      const permission = await storage.createRolePermission(validatedData);
      res.status(201).json(permission);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: validationError.errors
        });
      }
      throw validationError;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Delete a role permission
 */
router.delete("/role-permissions", isAdmin, async (req, res, next) => {
  try {
    const { role, resource, action } = req.body;
    
    if (!role || !resource || !action) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["role", "resource", "action"]
      });
    }
    
    await storage.deleteRolePermission({ role, resource, action });
    res.status(200).json({ message: "Permission deleted successfully" });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete all permissions for a role
 */
router.delete("/role-permissions/:role", isAdmin, async (req, res, next) => {
  try {
    const { role } = req.params;
    await storage.deleteRolePermissionsByRole(role);
    res.status(200).json({ message: `All permissions for role '${role}' deleted successfully` });
  } catch (error) {
    next(error);
  }
});

/**
 * Update multiple permissions for a role at once
 */
router.put("/role-permissions/batch", isAdmin, async (req, res, next) => {
  try {
    const { role, permissions } = req.body;
    
    if (!role || !Array.isArray(permissions)) {
      return res.status(400).json({
        error: "Invalid request body",
        required: {
          role: "string",
          permissions: "array of {resource, action, granted}"
        }
      });
    }
    
    // First, get current permissions for this role
    const existingPermissions = await storage.getRolePermissionsByRole(role);
    
    // Track permissions to add and remove
    const toAdd = [];
    const toRemove = [];
    
    // Process each permission in the request
    for (const perm of permissions) {
      const { resource, action, granted } = perm;
      
      if (!resource || !action || typeof granted !== 'boolean') {
        return res.status(400).json({
          error: "Invalid permission object",
          required: {
            resource: "string",
            action: "string",
            granted: "boolean"
          }
        });
      }
      
      // Check if permission exists
      const exists = existingPermissions.some(
        p => p.resource === resource && p.action === action
      );
      
      if (granted && !exists) {
        // Need to add this permission
        toAdd.push({
          role,
          resource,
          action
        });
      } else if (!granted && exists) {
        // Need to remove this permission
        toRemove.push({
          role,
          resource,
          action
        });
      }
    }
    
    // Apply changes
    const results = {
      added: 0,
      removed: 0
    };
    
    // Add new permissions
    for (const perm of toAdd) {
      await storage.createRolePermission(perm);
      results.added++;
    }
    
    // Remove permissions
    for (const perm of toRemove) {
      await storage.deleteRolePermission(perm);
      results.removed++;
    }
    
    res.status(200).json({
      message: "Permissions updated successfully",
      results
    });
  } catch (error) {
    next(error);
  }
});

export default router;