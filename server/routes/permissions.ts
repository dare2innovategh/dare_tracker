import { Request, Response } from "express";
import { storage } from "../storage";

/**
 * Get all permissions for the current user
 */
export async function getUserPermissions(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const { role } = req.user;
    
    // Admin has all permissions
    if (role === "admin") {
      return res.json([
        { resource: "*", action: "*" }
      ]);
    }
    
    // Get role permissions from storage
    const permissions = await storage.getRolePermissionsByRole(role);
    
    // Map to simpler format for client
    const userPermissions = permissions.map(p => ({
      resource: p.resource,
      action: p.action
    }));
    
    return res.json(userPermissions);
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return res.status(500).json({ error: "Failed to fetch user permissions" });
  }
}