import { Request, Response } from "express";
import { storage } from "../storage";
import { insertRoleSchema } from "@shared/schema";
import { z } from "zod";

/**
 * Get all custom roles
 */
export async function getAllRoles(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Check if user has permission to view roles
    const hasPermission = await storage.hasPermission(req.user.role, "roles", "view");
    if (!hasPermission && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to view roles" });
    }
    
    // Get all roles from storage
    const roles = await storage.getAllRoles();
    
    return res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return res.status(500).json({ error: "Failed to fetch roles" });
  }
}

/**
 * Create a new role
 */
export async function createRole(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Check if user has permission to create roles
    const hasPermission = await storage.hasPermission(req.user.role, "roles", "create");
    if (!hasPermission && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to create roles" });
    }
    
    // Validate request body
    const validatedData = insertRoleSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        error: "Invalid role data", 
        details: validatedData.error.format() 
      });
    }
    
    // Check if role with the same name already exists
    const existingRole = await storage.getRoleByName(validatedData.data.name);
    if (existingRole) {
      return res.status(409).json({ error: "Role with this name already exists" });
    }
    
    // Create the role
    const role = await storage.createRole(validatedData.data);
    
    return res.status(201).json(role);
  } catch (error) {
    console.error("Error creating role:", error);
    return res.status(500).json({ error: "Failed to create role" });
  }
}

/**
 * Update an existing role
 */
export async function updateRole(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Check if user has permission to edit roles
    const hasPermission = await storage.hasPermission(req.user.role, "roles", "edit");
    if (!hasPermission && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to edit roles" });
    }
    
    const roleId = parseInt(req.params.id);
    if (isNaN(roleId)) {
      return res.status(400).json({ error: "Invalid role ID" });
    }
    
    // Ensure role exists - use system roles table
    const existingRole = await storage.getRoleById(roleId);
    if (!existingRole) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    // Validate request body (partial update)
    const updateSchema = insertRoleSchema.partial();
    const validatedData = updateSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        error: "Invalid role data", 
        details: validatedData.error.format() 
      });
    }
    
    // If updating name, check if new name already exists
    if (validatedData.data.name && validatedData.data.name !== existingRole.name) {
      // Use getRoleByName to check
      const roleWithSameName = await storage.getRoleByName(validatedData.data.name);
      if (roleWithSameName) {
        return res.status(409).json({ error: "Role with this name already exists" });
      }
    }
    
    // Update the role with the system roles method
    const updatedRole = await storage.updateRole(roleId, validatedData.data);
    console.log("Updated role:", updatedRole);
    
    return res.json(updatedRole);
  } catch (error) {
    console.error("Error updating role:", error);
    return res.status(500).json({ error: "Failed to update role" });
  }
}

/**
 * Delete a role
 */
export async function deleteRole(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Check if user has permission to delete roles
    const hasPermission = await storage.hasPermission(req.user.role, "roles", "delete");
    if (!hasPermission && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to delete roles" });
    }
    
    const roleId = parseInt(req.params.id);
    if (isNaN(roleId)) {
      return res.status(400).json({ error: "Invalid role ID" });
    }
    
    // Ensure role exists - use system roles table
    const role = await storage.getRoleById(roleId);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    // Don't allow deletion of system roles
    if (role.isSystem) {
      return res.status(403).json({ error: "Cannot delete system roles" });
    }
    
    // Delete the role - using deleteRole
    await storage.deleteRole(roleId);
    console.log(`Deleted role with ID ${roleId}`);
    
    return res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    return res.status(500).json({ error: "Failed to delete role" });
  }
}

/**
 * Get a single role by ID
 */
export async function getRoleById(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Check if user has permission to view roles
    const hasPermission = await storage.hasPermission(req.user.role, "roles", "view");
    if (!hasPermission && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to view roles" });
    }
    
    const roleId = parseInt(req.params.id);
    if (isNaN(roleId)) {
      return res.status(400).json({ error: "Invalid role ID" });
    }
    
    // Get the role - use system roles table
    const role = await storage.getRoleById(roleId);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    return res.json(role);
  } catch (error) {
    console.error("Error fetching role:", error);
    return res.status(500).json({ error: "Failed to fetch role" });
  }
}