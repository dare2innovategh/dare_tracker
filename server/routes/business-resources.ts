/**
 * Business resources management API endpoints
 */
import { Router } from "express";
import { db } from "../db";
import { 
  insertBusinessResourceSchema, 
  businessResources, 
  businessResourceCosts,
  businessProfiles,
} from "@shared/schema";
import { and, eq, sql } from "drizzle-orm";

const router = Router();

// Get all resources for a business
router.get("/businesses/:businessId/resources", async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Validate the ID
    if (!businessId || isNaN(parseInt(businessId))) {
      return res.status(400).send("Invalid business ID");
    }
    
    // Check if business exists
    const businessExists = await db.query.businessProfiles.findFirst({
      where: eq(businessProfiles.id, parseInt(businessId))
    });
    
    if (!businessExists) {
      return res.status(404).send("Business not found");
    }
    
    // Fetch resources
    const resources = await db.select().from(businessResources)
      .where(eq(businessResources.businessId, parseInt(businessId)))
      .orderBy(businessResources.name);
    
    res.json(resources);
  } catch (error) {
    console.error("Error fetching business resources:", error);
    res.status(500).send("Internal server error");
  }
});

// Get resource statistics for a business
router.get("/businesses/:businessId/resource-stats", async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Validate the ID
    if (!businessId || isNaN(parseInt(businessId))) {
      return res.status(400).send("Invalid business ID");
    }
    
    // Check if business exists
    const businessExists = await db.query.businessProfiles.findFirst({
      where: eq(businessProfiles.id, parseInt(businessId))
    });
    
    if (!businessExists) {
      return res.status(404).send("Business not found");
    }
    
    // Get statistics
    const resourceCountByStatus = await db.execute(sql`
      SELECT status, COUNT(*) as count 
      FROM business_resources 
      WHERE business_id = ${parseInt(businessId)} 
      GROUP BY status
    `);
    
    const totalResourceValue = await db.execute(sql`
      SELECT SUM(unit_cost * quantity) as total_value 
      FROM business_resources 
      WHERE business_id = ${parseInt(businessId)}
    `);
    
    const resourceCountByCategory = await db.execute(sql`
      SELECT category, COUNT(*) as count 
      FROM business_resources 
      WHERE business_id = ${parseInt(businessId)} 
      GROUP BY category
    `);
    
    res.json({
      countByStatus: resourceCountByStatus.rows || [],
      totalValue: totalResourceValue.rows?.[0]?.total_value || 0,
      countByCategory: resourceCountByCategory.rows || []
    });
  } catch (error) {
    console.error("Error fetching business resource statistics:", error);
    res.status(500).send("Internal server error");
  }
});

// Add a new resource to a business
router.post("/businesses/:businessId/resources", async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Validate the ID
    if (!businessId || isNaN(parseInt(businessId))) {
      return res.status(400).send("Invalid business ID");
    }
    
    // Check if business exists
    const businessExists = await db.query.businessProfiles.findFirst({
      where: eq(businessProfiles.id, parseInt(businessId))
    });
    
    if (!businessExists) {
      return res.status(404).send("Business not found");
    }
    
    // Validate the input
    const validatedData = insertBusinessResourceSchema.parse({
      ...req.body,
      businessId: parseInt(businessId)
    });
    
    // Calculate total cost if unit cost is provided
    let totalCost = null;
    if (validatedData.unitCost && validatedData.quantity) {
      totalCost = Number(validatedData.unitCost) * validatedData.quantity;
    }
    
    // Add assignedBy if user is authenticated
    const assignedBy = req.user?.id || null;
    
    // Insert the resource
    const [newResource] = await db.insert(businessResources).values({
      ...validatedData,
      totalCost,
      assignedBy,
      updatedAt: new Date()
    }).returning();
    
    res.status(201).json(newResource);
  } catch (error) {
    console.error("Error adding business resource:", error);
    res.status(400).send(error.message || "Failed to add resource");
  }
});

// Update a resource
router.patch("/resources/:resourceId", async (req, res) => {
  try {
    const { resourceId } = req.params;
    
    // Validate the ID
    if (!resourceId || isNaN(parseInt(resourceId))) {
      return res.status(400).send("Invalid resource ID");
    }
    
    // Check if resource exists
    const existingResource = await db.query.businessResources.findFirst({
      where: eq(businessResources.id, parseInt(resourceId))
    });
    
    if (!existingResource) {
      return res.status(404).send("Resource not found");
    }
    
    // Validate the input
    const validatedData = insertBusinessResourceSchema.partial().parse(req.body);
    
    // Calculate total cost if unit cost is provided
    let totalCost = existingResource.totalCost;
    if (
      (validatedData.unitCost !== undefined) || 
      (validatedData.quantity !== undefined)
    ) {
      const unitCost = validatedData.unitCost !== undefined ? 
        validatedData.unitCost : 
        existingResource.unitCost;
      
      const quantity = validatedData.quantity !== undefined ? 
        validatedData.quantity : 
        existingResource.quantity;
      
      if (unitCost && quantity) {
        totalCost = Number(unitCost) * quantity;
      } else {
        totalCost = null;
      }
    }
    
    // Update the resource
    const [updatedResource] = await db.update(businessResources)
      .set({ 
        ...validatedData, 
        totalCost,
        updatedAt: new Date() 
      })
      .where(eq(businessResources.id, parseInt(resourceId)))
      .returning();
    
    res.json(updatedResource);
  } catch (error) {
    console.error("Error updating business resource:", error);
    res.status(400).send(error.message || "Failed to update resource");
  }
});

// Delete a resource
router.delete("/resources/:resourceId", async (req, res) => {
  try {
    const { resourceId } = req.params;
    
    // Validate the ID
    if (!resourceId || isNaN(parseInt(resourceId))) {
      return res.status(400).send("Invalid resource ID");
    }
    
    // Check if resource exists
    const existingResource = await db.query.businessResources.findFirst({
      where: eq(businessResources.id, parseInt(resourceId))
    });
    
    if (!existingResource) {
      return res.status(404).send("Resource not found");
    }
    
    // Delete related costs first (should cascade, but being explicit)
    await db.delete(businessResourceCosts)
      .where(eq(businessResourceCosts.resourceId, parseInt(resourceId)));
    
    // Delete the resource
    const [deletedResource] = await db.delete(businessResources)
      .where(eq(businessResources.id, parseInt(resourceId)))
      .returning();
    
    res.json(deletedResource);
  } catch (error) {
    console.error("Error deleting business resource:", error);
    res.status(500).send("Internal server error");
  }
});

// Resource cost management
router.get("/resources/:resourceId/costs", async (req, res) => {
  try {
    const { resourceId } = req.params;
    
    // Validate the ID
    if (!resourceId || isNaN(parseInt(resourceId))) {
      return res.status(400).send("Invalid resource ID");
    }
    
    // Fetch costs
    const costs = await db.select().from(businessResourceCosts)
      .where(eq(businessResourceCosts.resourceId, parseInt(resourceId)))
      .orderBy(businessResourceCosts.date);
    
    res.json(costs);
  } catch (error) {
    console.error("Error fetching resource costs:", error);
    res.status(500).send("Internal server error");
  }
});

// Add a cost record to a resource
router.post("/resources/:resourceId/costs", async (req, res) => {
  try {
    const { resourceId } = req.params;
    
    // Validate the ID
    if (!resourceId || isNaN(parseInt(resourceId))) {
      return res.status(400).send("Invalid resource ID");
    }
    
    // Check if resource exists
    const existingResource = await db.query.businessResources.findFirst({
      where: eq(businessResources.id, parseInt(resourceId))
    });
    
    if (!existingResource) {
      return res.status(404).send("Resource not found");
    }
    
    // Add recordedBy if user is authenticated
    const recordedBy = req.user?.id || null;
    
    // Insert the cost record
    const [newCost] = await db.insert(businessResourceCosts).values({
      ...req.body,
      resourceId: parseInt(resourceId),
      recordedBy,
      updatedAt: new Date()
    }).returning();
    
    // Update resource total cost
    const totalCosts = await db.execute(sql`
      SELECT SUM(amount) as total 
      FROM business_resource_costs 
      WHERE resource_id = ${parseInt(resourceId)}
    `);
    
    // Update resource with new total cost if it's a purchase
    if (req.body.costType === 'Purchase') {
      await db.update(businessResources)
        .set({ 
          unitCost: req.body.amount / existingResource.quantity,
          totalCost: req.body.amount,
          updatedAt: new Date() 
        })
        .where(eq(businessResources.id, parseInt(resourceId)));
    }
    
    res.status(201).json(newCost);
  } catch (error) {
    console.error("Error adding resource cost:", error);
    res.status(400).send(error.message || "Failed to add cost record");
  }
});

export default router;