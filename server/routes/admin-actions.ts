import { Router } from "express";
import { clearYouthData } from "../scripts/clear-youth-data";

const router = Router();

// Clear youth data route (admin only)
router.post("/clear-youth-data", async (req, res) => {
  try {
    // Check if user is admin
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Unauthorized. Only admin users can perform this action."
      });
    }

    console.log("Admin clear youth data request received");
    
    // Call the clear youth data function
    await clearYouthData();
    
    return res.status(200).json({
      success: true,
      message: "All youth profile data has been cleared successfully"
    });
  } catch (error) {
    console.error("Error clearing youth data:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      success: false,
      error: `Failed to clear youth data: ${errorMessage}`
    });
  }
});

export default router;