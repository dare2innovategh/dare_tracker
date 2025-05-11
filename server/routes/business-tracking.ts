import { Router } from "express";
import { storage } from "../storage";
import { 
  insertBusinessTrackingSchema, 
  insertBusinessTrackingAttachmentSchema 
} from "@shared/schema";
import { z } from "zod";

const router = Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Not authenticated" });
};

// Middleware to check if user is admin or mentor
const isAdminOrMentor = (req: any, res: any, next: any) => {
  if (req.isAuthenticated() && (req.user.role === "admin" || req.user.role === "mentor")) {
    return next();
  }
  return res.status(403).json({ message: "Not authorized, requires admin or mentor role" });
};

// Get all tracking records (for analytics and charts)
router.get("/all", isAuthenticated, async (req, res) => {
  try {
    const records = await storage.getAllBusinessTrackings();
    
    const chartData = records.map(record => ({
      id: record.id,
      businessId: record.businessId,
      trackingDate: record.tracking_date || record.trackingDate,
      trackingMonth: record.tracking_month || record.trackingMonth,
      trackingYear: record.tracking_year || record.trackingYear,
      projectedRevenue: record.projected_revenue || record.projectedRevenue,
      actualRevenue: record.actual_revenue || record.actualRevenue,
      actualEmployees: record.actual_employees || record.actualEmployees,
      isVerified: record.is_verified || record.isVerified,
      createdAt: record.created_at || record.createdAt,
      updatedAt: record.updated_at || record.updatedAt
    }));
    
    return res.json(chartData);
  } catch (error) {
    console.error("Error fetching all tracking records:", error);
    return res.status(500).json({ message: "Failed to fetch tracking records" });
  }
});

// Get all tracking records for a business
router.get("/businesses/:businessId/tracking", isAuthenticated, async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    if (isNaN(businessId)) {
      return res.status(400).json({ message: "Invalid business ID" });
    }

    const trackingRecords = await storage.getBusinessTrackingsByBusinessId(businessId);
    return res.status(200).json(trackingRecords);
  } catch (error: any) {
    console.error("Error getting business tracking records:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

// Get statistics summary for a business
router.get("/businesses/:businessId/stats", isAuthenticated, async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    if (isNaN(businessId)) {
      return res.status(400).json({ message: "Invalid business ID" });
    }

    const trackingRecords = await storage.getBusinessTrackingsByBusinessId(businessId);
    
    const stats: {
      latestRevenue: number;
      currentEmployees: number;
      growthRate: number;
      revenueTimeline: Array<{date: string; month: string; value: number}>;
      employeesTimeline: Array<{date: string; month: string; value: number}>;
    } = {
      latestRevenue: 0,
      currentEmployees: 0,
      growthRate: 0,
      revenueTimeline: [],
      employeesTimeline: []
    };
    
    if (trackingRecords.length > 0) {
      const normalizedRecords = trackingRecords.map(record => ({
        id: record.id,
        businessId: record.businessId || record.business_id,
        trackingDate: record.trackingDate || record.tracking_date,
        trackingMonth: record.trackingMonth || record.tracking_month,
        trackingYear: record.trackingYear || record.tracking_year,
        projectedRevenue: record.projectedRevenue || record.projected_revenue,
        actualRevenue: record.actualRevenue || record.actual_revenue,
        actualEmployees: record.actualEmployees || record.actual_employees,
        isVerified: record.isVerified || record.is_verified
      }));
      
      const sortedRecords = [...normalizedRecords].sort((a, b) => 
        new Date(b.trackingDate).getTime() - new Date(a.trackingDate).getTime()
      );
      
      const latestRecord = sortedRecords[0];
      
      const latestRevenue = latestRecord.actualRevenue !== null ? latestRecord.actualRevenue : 0;
      const latestEmployees = latestRecord.actualEmployees !== null ? latestRecord.actualEmployees : 0;
      stats.latestRevenue = latestRevenue;
      stats.currentEmployees = latestEmployees;
      
      if (sortedRecords.length > 1) {
        const previousRecord = sortedRecords.find(record => 
          new Date(record.trackingDate).getMonth() !== new Date(latestRecord.trackingDate).getMonth() ||
          new Date(record.trackingDate).getFullYear() !== new Date(latestRecord.trackingDate).getFullYear()
        );
        
        if (previousRecord && previousRecord.actualRevenue !== null && previousRecord.actualRevenue > 0) {
          const previousRevenue = previousRecord.actualRevenue;
          const growthRate = ((latestRevenue - previousRevenue) / previousRevenue) * 100;
          stats.growthRate = Math.round(growthRate * 10) / 10;
        }
      }
      
      stats.revenueTimeline = sortedRecords.map(record => ({
        date: record.trackingDate,
        month: record.trackingMonth,
        value: record.actualRevenue !== null ? record.actualRevenue : 0
      })).reverse();
      
      stats.employeesTimeline = sortedRecords.map(record => ({
        date: record.trackingDate,
        month: record.trackingMonth,
        value: record.actualEmployees !== null ? record.actualEmployees : 0
      })).reverse();
    }
    
    return res.status(200).json(stats);
  } catch (error: any) {
    console.error("Error getting business statistics:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

// Get a specific tracking record
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid tracking ID" });
    }

    const trackingRecord = await storage.getBusinessTracking(id);
    if (!trackingRecord) {
      return res.status(404).json({ message: "Tracking record not found" });
    }

    return res.status(200).json(trackingRecord);
  } catch (error: any) {
    console.error("Error getting tracking record:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

// Create a new tracking record
router.post("/", isAdminOrMentor, async (req, res) => {
  try {
    // Log incoming request body for debugging
    console.log("Incoming request body:", JSON.stringify(req.body, null, 2));

    // Process the request body, applying default for tracking_period
    const processedData = {
      ...req.body,
      recordedBy: req.user?.id || 0,
      tracking_period: req.body.tracking_period ?? "monthly",
      trackingDate: req.body.trackingDate ? new Date(req.body.trackingDate) : new Date(),
      trackingMonth: req.body.trackingMonth ? new Date(req.body.trackingMonth) : new Date(),
      trackingYear: req.body.trackingYear || new Date().getFullYear()
    };

    // Log processed data before validation
    console.log("Processed data:", JSON.stringify(processedData, null, 2));

    // Validate request body using the schema (tracking_period is now a string)
    const validatedData = insertBusinessTrackingSchema.parse(processedData);

    const newTracking = await storage.createBusinessTracking(validatedData);
    return res.status(201).json(newTracking);
  } catch (error: any) {
    console.error("Error creating tracking record:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

// Update a tracking record
router.patch("/:id", isAdminOrMentor, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid tracking ID" });
    }

    const existingRecord = await storage.getBusinessTracking(id);
    if (!existingRecord) {
      return res.status(404).json({ message: "Tracking record not found" });
    }

    const processedData = {
      ...req.body,
      tracking_period: req.body.tracking_period ?? existingRecord.tracking_period ?? "monthly",
      trackingDate: req.body.trackingDate ? new Date(req.body.trackingDate) : undefined,
      trackingMonth: req.body.trackingMonth ? new Date(req.body.trackingMonth) : undefined
    };

    const updatedRecord = await storage.updateBusinessTracking(id, processedData);
    return res.status(200).json(updatedRecord);
  } catch (error: any) {
    console.error("Error updating tracking record:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

// Delete a tracking record
router.delete("/:id", isAdminOrMentor, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid tracking ID" });
    }

    const existingRecord = await storage.getBusinessTracking(id);
    if (!existingRecord) {
      return res.status(404).json({ message: "Tracking record not found" });
    }

    await storage.deleteBusinessTracking(id);
    return res.status(200).json({ message: "Tracking record deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting tracking record:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

// Verify a tracking record
router.post("/:id/verify", isAdminOrMentor, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid tracking ID" });
    }

    const existingRecord = await storage.getBusinessTracking(id);
    if (!existingRecord) {
      return res.status(404).json({ message: "Tracking record not found" });
    }

    const verifiedRecord = await storage.verifyBusinessTracking(id, req.user?.id || 0);
    return res.status(200).json(verifiedRecord);
  } catch (error: any) {
    console.error("Error verifying tracking record:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

// Get attachments for a tracking record
router.get("/:id/attachments", isAuthenticated, async (req, res) => {
  try {
    const trackingId = parseInt(req.params.id);
    if (isNaN(trackingId)) {
      return res.status(400).json({ message: "Invalid tracking ID" });
    }

    const attachments = await storage.getBusinessTrackingAttachmentsByTrackingId(trackingId);
    return res.status(200).json(attachments);
  } catch (error: any) {
    console.error("Error getting tracking attachments:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

// Add an attachment to a tracking record
router.post("/:id/attachments", isAdminOrMentor, async (req, res) => {
  try {
    const trackingId = parseInt(req.params.id);
    if (isNaN(trackingId)) {
      return res.status(400).json({ message: "Invalid tracking ID" });
    }

    const validatedData = insertBusinessTrackingAttachmentSchema.parse({
      ...req.body,
      trackingId,
      uploadedBy: req.user?.id || 0
    });

    const newAttachment = await storage.createBusinessTrackingAttachment(validatedData);
    return res.status(201).json(newAttachment);
  } catch (error: any) {
    console.error("Error creating tracking attachment:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

// Delete an attachment
router.delete("/attachments/:id", isAdminOrMentor, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid attachment ID" });
    }

    const attachment = await storage.getBusinessTrackingAttachment(id);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    await storage.deleteBusinessTrackingAttachment(id);
    return res.status(200).json({ message: "Attachment deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting attachment:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

export default router;