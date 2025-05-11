import { Request, Response, Router } from "express";
import { storage } from "../storage";
import { eq } from "drizzle-orm";
import { businessYouthRelationships } from "@shared/schema";
import { formatZodError } from "../utils";

// Create an Express router
const router = Router();

// Get all youth-business relationships (for youth selection)
router.get("/youth-business-relationships", async (req: Request, res: Response) => {
  try {
    // Get map of youth id to business profiles
    const relationships = await storage.getAllYouthBusinessRelationships();
    return res.status(200).json(relationships);
  } catch (error) {
    console.error("Error fetching youth-business relationships:", error);
    return res.status(500).json({ message: "Failed to fetch relationships" });
  }
});

// Get all businesses associated with a youth profile
router.get("/youth-profiles/:id/businesses", async (req: Request, res: Response) => {
  try {
    const youthId = parseInt(req.params.id);

    if (isNaN(youthId)) {
      console.error(`Invalid youthId: ${req.params.id}`);
      return res.status(400).json({ message: "Invalid youth profile ID" });
    }

    console.log(`Fetching businesses for youthId: ${youthId}`); // Debug log
    const youthProfile = await storage.getYouthProfile(youthId);
    if (!youthProfile) {
      return res.status(404).json({ message: "Youth profile not found" });
    }

    const businesses = await storage.getYouthBusinesses(youthId);
    
    console.log(`Found ${businesses.length} businesses for youthId: ${youthId}`); // Debug log
    return res.status(200).json(businesses);
  } catch (error) {
    console.error("Error fetching youth businesses for youthId:", req.params.id, error);
    return res.status(500).json({ message: "Failed to fetch associated businesses", error: error.message });
  }
});

// Add a youth to a business
router.post("/youth-profiles/:youthId/businesses/:businessId", async (req: Request, res: Response) => {
  try {
    const youthId = parseInt(req.params.youthId);
    const businessId = parseInt(req.params.businessId);
    const { role } = req.body;

    if (isNaN(youthId) || isNaN(businessId)) {
      return res.status(400).json({ message: "Invalid youth or business ID" });
    }

    // Verify youth profile exists
    const youthProfile = await storage.getYouthProfile(youthId);
    if (!youthProfile) {
      return res.status(404).json({ message: "Youth profile not found" });
    }

    // Verify business exists
    const business = await storage.getBusinessProfile(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business profile not found" });
    }

    // Check if relationship already exists
    const existingRelationships = await storage.getBusinessYouthRelationships(businessId);
    const alreadyExists = existingRelationships.some(rel => rel.youthId === youthId);
    
    if (alreadyExists) {
      return res.status(400).json({ message: "Youth is already associated with this business" });
    }

    // Add youth to business
    const relationship = await storage.addYouthToBusiness({
      businessId,
      youthId,
      joinDate: new Date().toISOString(),
      role: role || "Member",
      isActive: true
    });

    return res.status(201).json(relationship);
  } catch (error) {
    console.error("Error adding youth to business:", error);
    return res.status(500).json({ message: "Failed to add youth to business" });
  }
});

// Remove a youth from a business
router.delete("/youth-profiles/:youthId/businesses/:businessId", async (req: Request, res: Response) => {
  try {
    const youthId = parseInt(req.params.youthId);
    const businessId = parseInt(req.params.businessId);

    if (isNaN(youthId) || isNaN(businessId)) {
      return res.status(400).json({ message: "Invalid youth or business ID" });
    }

    // Remove youth from business
    await storage.removeYouthFromBusiness(businessId, youthId);

    return res.status(200).json({ message: "Youth removed from business successfully" });
  } catch (error) {
    console.error("Error removing youth from business:", error);
    return res.status(500).json({ message: "Failed to remove youth from business" });
  }
});

// Update a youth's role in a business
router.patch("/youth-profiles/:youthId/businesses/:businessId", async (req: Request, res: Response) => {
  try {
    const youthId = parseInt(req.params.youthId);
    const businessId = parseInt(req.params.businessId);
    const { role } = req.body;

    if (isNaN(youthId) || isNaN(businessId)) {
      return res.status(400).json({ message: "Invalid youth or business ID" });
    }

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    // Update youth's role in business
    const updatedRelationship = await storage.updateYouthBusinessRole(businessId, youthId, role);
    
    if (!updatedRelationship) {
      return res.status(404).json({ message: "Youth-business relationship not found" });
    }

    return res.status(200).json(updatedRelationship);
  } catch (error) {
    console.error("Error updating youth role in business:", error);
    return res.status(500).json({ message: "Failed to update youth role in business" });
  }
});

export { router as youthBusinessRouter };

// Function to register routes directly to the app if needed
export function registerYouthBusinessRoutes(app: any) {
  app.use('/api', router);
}