import express from "express";
import { resetAdminPermissions } from "../reset-admin-permissions";
import generateMissingPermissions from "../generate-missing-permissions";
import { requirePermission } from "../middleware/permissions";

const router = express.Router();

/**
 * POST /api/admin/reset-permissions
 * Reset all admin permissions to ensure admin has all available permissions
 */
router.post("/reset-permissions", requirePermission("system", "manage"), async (req, res) => {
  try {
    await resetAdminPermissions();
    
    return res.status(200).json({ 
      success: true, 
      message: "Admin permissions have been reset successfully" 
    });
  } catch (error: any) {
    console.error("Error in admin permissions reset endpoint:", error);
    return res.status(500).json({ 
      error: "Failed to reset admin permissions", 
      details: error.message || String(error) 
    });
  }
});

/**
 * POST /api/admin/generate-missing-permissions
 * Generate any missing permissions from all possible resource-action combinations
 */
router.post("/generate-missing-permissions", requirePermission("system", "manage"), async (req, res) => {
  try {
    const result = await generateMissingPermissions();
    
    return res.status(200).json({ 
      success: true, 
      message: "Successfully generated missing permissions", 
      data: result
    });
  } catch (error: any) {
    console.error("Error generating missing permissions:", error);
    return res.status(500).json({ 
      error: "Failed to generate missing permissions", 
      details: error.message || String(error)
    });
  }
});

export default router;