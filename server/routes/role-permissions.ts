import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const router = express.Router();

// Schema for validating role permission request
const rolePermissionSchema = z.object({
  role: z.string(),
  resource: z.string(),
  action: z.string()
});

// Get all permissions for a specific role
router.get('/:roleName', async (req, res) => {
  try {
    const { roleName } = req.params;
    
    if (!roleName) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const permissions = await storage.getRolePermissionsByRole(roleName);
    return res.json(permissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

// Add a permission to a role
router.post('/', async (req, res) => {
  try {
    const validation = rolePermissionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.message });
    }
    
    const { role, resource, action } = validation.data;
    
    // Check if permission already exists
    const exists = await storage.checkRolePermissionExists(role, resource, action);
    if (exists) {
      return res.status(409).json({ error: 'Permission already exists for this role' });
    }
    
    // Create a new role permission
    const permission = await storage.createRolePermission({
      role,
      resource: resource as any,
      action: action as any
    });
    return res.status(201).json(permission);
  } catch (error) {
    console.error('Error adding role permission:', error);
    return res.status(500).json({ error: 'Failed to add role permission' });
  }
});

// Remove a permission from a role
router.delete('/', async (req, res) => {
  try {
    const validation = rolePermissionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.message });
    }
    
    const { role, resource, action } = validation.data;
    
    // Check if permission exists
    const exists = await storage.checkRolePermissionExists(role, resource, action);
    if (!exists) {
      return res.status(404).json({ error: 'Permission does not exist for this role' });
    }
    
    const permToDelete = await storage.checkRolePermissionExists(role, resource, action);
    if (permToDelete) {
      await storage.deleteRolePermission({
        role,
        resource: resource as any,
        action: action as any
      });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Error removing role permission:', error);
    return res.status(500).json({ error: 'Failed to remove role permission' });
  }
});

// Get available resources and actions
router.get('/resources-actions', async (req, res) => {
  try {
    // For now, return hardcoded values
    // In a real implementation, these could come from a database or configuration
    const resources = [
      'users',
      'roles',
      'permissions',
      'youth_profiles',
      'youth_education',
      'youth_certifications',
      'youth_skills',
      'businesses',
      'business_youth',
      'mentors',
      'mentor_assignments',
      'mentorship_messages',
      'business_advice',
      'reports',
      'system_settings'
    ];
    
    const actions = [
      'view',
      'create',
      'edit',
      'delete',
      'manage'
    ];
    
    return res.json({ resources, actions });
  } catch (error) {
    console.error('Error fetching resources and actions:', error);
    return res.status(500).json({ error: 'Failed to fetch resources and actions' });
  }
});

export default router;