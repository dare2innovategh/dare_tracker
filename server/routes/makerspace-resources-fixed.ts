import { Request, Response, Router } from 'express';
import { db } from '../db';
import { 
  makerspaces,
  makerspaceResources,
  makerspaceResourceCosts,
  insertMakerspaceResourceSchema,
  insertMakerspaceResourceCostSchema 
} from '@shared/schema';
import { eq, and, sql, sum } from 'drizzle-orm';
import { auth } from '../middleware/auth';

const router = Router();

// Get all resources for a makerspace
router.get('/makerspaces/:id/resources', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const makerspaceId = parseInt(id, 10);
    
    // Validate ID conversion
    if (isNaN(makerspaceId)) {
      return res.status(400).json({ message: 'Invalid makerspace ID format' });
    }
    
    console.log(`Fetching resources for makerspace with ID: ${makerspaceId}`);
    
    // Get makerspace details
    const [makerspace] = await db.select().from(makerspaces).where(eq(makerspaces.id, makerspaceId));
    
    if (!makerspace) {
      return res.status(404).json({ message: 'Makerspace not found' });
    }
    
    // Get resources with total cost aggregation
    const resources = await db.select({
      id: makerspaceResources.id,
      name: makerspaceResources.name, // Use 'name' consistently
      category: makerspaceResources.category,
      description: makerspaceResources.description,
      status: makerspaceResources.status,
      quantity: makerspaceResources.quantity,
      acquisitionDate: makerspaceResources.acquisitionDate,
      unitCost: makerspaceResources.unitCost,
      totalCost: makerspaceResources.totalCost,
      supplier: makerspaceResources.supplier,
      notes: makerspaceResources.notes,
      createdAt: makerspaceResources.createdAt,
      makerspaceId: makerspaceResources.makerspaceId // Include makerspaceId for consistency
    })
    .from(makerspaceResources)
    .where(eq(makerspaceResources.makerspaceId, makerspaceId));

    console.log(`Found ${resources.length} resources for makerspace ID ${makerspaceId}`);
    
    // After getting resources, update the resource count in the makerspace table
    await db.update(makerspaces)
      .set({ resourceCount: resources.length })
      .where(eq(makerspaces.id, makerspaceId));
      
    return res.json(resources);
  } catch (error) {
    console.error('Error fetching makerspace resources:', error);
    return res.status(500).json({ message: 'Failed to fetch makerspace resources' });
  }
});

// Get a specific resource by ID
router.get('/resources/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resourceId = parseInt(id, 10);
    
    // Validate ID conversion
    if (isNaN(resourceId)) {
      return res.status(400).json({ message: 'Invalid resource ID format' });
    }
    
    // Get the resource details
    const [resource] = await db.select().from(makerspaceResources).where(eq(makerspaceResources.id, resourceId));
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Get all costs associated with this resource
    const costs = await db.select().from(makerspaceResourceCosts)
      .where(eq(makerspaceResourceCosts.resourceId, resourceId));
    
    // Return resource with costs
    return res.json({
      ...resource,
      costs
    });
  } catch (error) {
    console.error('Error fetching resource details:', error);
    return res.status(500).json({ message: 'Failed to fetch resource details' });
  }
});

// Add a new resource to a makerspace
router.post('/makerspaces/:id/resources', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const makerspaceId = parseInt(id, 10);
    
    // Validate ID conversion
    if (isNaN(makerspaceId)) {
      return res.status(400).json({ message: 'Invalid makerspace ID format' });
    }
    
    // Validate the request body
    console.log("Resource data received:", JSON.stringify(req.body));
    
    const validationResult = insertMakerspaceResourceSchema.safeParse({
      ...req.body,
      makerspaceId,
      createdBy: req.user?.id
    });
    
    if (!validationResult.success) {
      console.log("Validation errors:", JSON.stringify(validationResult.error.errors));
      return res.status(400).json({ 
        message: 'Invalid resource data', 
        errors: validationResult.error.errors 
      });
    }
    
    const resourceData = validationResult.data;
    
    // Calculate totalCost if unitCost and quantity are provided
    let totalCost = null;
    if (resourceData.unitCost && resourceData.quantity) {
      totalCost = Number(resourceData.unitCost) * Number(resourceData.quantity);
    }
    
    // The schema transformation already handles Date to string conversion
    // Just ensure all numbers are properly handled
    const dbResourceData = {
      ...resourceData,
      // Convert numeric values to strings for database storage
      unitCost: resourceData.unitCost !== null && resourceData.unitCost !== undefined 
        ? String(resourceData.unitCost) 
        : null,
      totalCost: totalCost !== null && totalCost !== undefined 
        ? String(totalCost) 
        : null,
      quantity: resourceData.quantity ? resourceData.quantity : 1,
    };
    
    console.log("Formatted resource data for DB:", dbResourceData);
    
    // Create the resource - FIX: Don't wrap in array brackets
    const [newResource] = await db.insert(makerspaceResources)
      .values(dbResourceData)
      .returning();
    
    // Update the resource count in the makerspace
    const resourceCount = await db.select({ count: sql`count(*)` })
      .from(makerspaceResources)
      .where(eq(makerspaceResources.makerspaceId, makerspaceId));
    
    await db.update(makerspaces)
      .set({ resourceCount: Number(resourceCount[0].count) })
      .where(eq(makerspaces.id, makerspaceId));
    
    return res.status(201).json(newResource);
  } catch (error) {
    console.error('Error creating resource:', error);
    return res.status(500).json({ message: 'Failed to create resource' });
  }
});

// Update a resource
router.patch('/resources/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resourceId = parseInt(id, 10);
    
    console.log("Received update request for resource ID:", resourceId);
    console.log("Update request body:", JSON.stringify(req.body, null, 2));
    
    // Validate ID conversion
    if (isNaN(resourceId)) {
      return res.status(400).json({ message: 'Invalid resource ID format' });
    }
    
    // Check if resource exists
    const [existingResource] = await db.select()
      .from(makerspaceResources)
      .where(eq(makerspaceResources.id, resourceId));
    
    if (!existingResource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    console.log("Found existing resource:", JSON.stringify(existingResource, null, 2));
    
    // Handle quantity conversion - ensure it's a valid number
    let parsedQuantity;
    if (req.body.quantity !== undefined) {
      try {
        parsedQuantity = Number(req.body.quantity);
        if (isNaN(parsedQuantity)) {
          console.log("Invalid quantity value:", req.body.quantity);
          parsedQuantity = existingResource.quantity || 1;
        }
      } catch (err) {
        console.log("Error parsing quantity:", err);
        parsedQuantity = existingResource.quantity || 1;
      }
    } else {
      parsedQuantity = existingResource.quantity || 1;
    }
    
    // Handle unit cost conversion - ensure it's a valid number or null
    let parsedUnitCost = null;
    if (req.body.unitCost !== undefined && req.body.unitCost !== null && req.body.unitCost !== '') {
      try {
        parsedUnitCost = parseFloat(String(req.body.unitCost).replace(/[^\d.-]/g, ''));
        if (isNaN(parsedUnitCost)) {
          console.log("Invalid unit cost value:", req.body.unitCost);
          parsedUnitCost = existingResource.unitCost 
            ? parseFloat(String(existingResource.unitCost)) 
            : null;
        }
      } catch (err) {
        console.log("Error parsing unit cost:", err);
        parsedUnitCost = existingResource.unitCost 
          ? parseFloat(String(existingResource.unitCost)) 
          : null;
      }
    } else if (existingResource.unitCost) {
      // Keep existing value if not provided
      try {
        parsedUnitCost = parseFloat(String(existingResource.unitCost));
      } catch (err) {
        console.log("Error parsing existing unit cost:", err);
      }
    }
    
    // Calculate total cost based on unit cost and quantity
    let parsedTotalCost = null;
    if (parsedUnitCost !== null && parsedQuantity !== null) {
      parsedTotalCost = parsedUnitCost * parsedQuantity;
      console.log(`Calculated total cost: ${parsedUnitCost} * ${parsedQuantity} = ${parsedTotalCost}`);
    }
    
    // Create clean update object
    const updateObj: any = {
      updatedAt: new Date(),
      updatedBy: req.user?.id
    };
    
    // Only set fields that are provided in the request
    if (req.body.name !== undefined) updateObj.name = req.body.name; // Use 'name' consistently
    if (req.body.category !== undefined) updateObj.category = req.body.category;
    if (req.body.description !== undefined) updateObj.description = req.body.description;
    if (req.body.status !== undefined) updateObj.status = req.body.status;
    updateObj.quantity = parsedQuantity;
    if (req.body.supplier !== undefined) updateObj.supplier = req.body.supplier;
    if (req.body.notes !== undefined) updateObj.notes = req.body.notes;
    
    // Handle acquisition date - convert to proper format for database
    if (req.body.acquisitionDate !== undefined) {
      if (req.body.acquisitionDate) {
        try {
          // Try to parse the date
          const date = new Date(req.body.acquisitionDate);
          if (!isNaN(date.getTime())) {
            // Valid date, format as YYYY-MM-DD for PostgreSQL
            updateObj.acquisitionDate = date.toISOString().split('T')[0];
          } else {
            console.log("Invalid acquisition date:", req.body.acquisitionDate);
            updateObj.acquisitionDate = null;
          }
        } catch (err) {
          console.log("Error parsing acquisition date:", err);
          updateObj.acquisitionDate = null;
        }
      } else {
        updateObj.acquisitionDate = null;
      }
    }
      
    // Always convert numeric fields to strings for storage
    if (parsedUnitCost !== null) updateObj.unitCost = String(parsedUnitCost);
    if (parsedTotalCost !== null) updateObj.totalCost = String(parsedTotalCost);
    
    console.log("Final update object:", JSON.stringify(updateObj, null, 2));
    
    // Update the resource
    const [updatedResource] = await db.update(makerspaceResources)
      .set(updateObj)
      .where(eq(makerspaceResources.id, resourceId))
      .returning();
    
    console.log("Updated resource:", JSON.stringify(updatedResource, null, 2));
    
    return res.json(updatedResource);
  } catch (error) {
    console.error('Error updating resource:', error);
    return res.status(500).json({ message: 'Failed to update resource', error: String(error) });
  }
});

// Delete a resource
router.delete('/resources/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resourceId = parseInt(id, 10);
    
    // Validate ID conversion
    if (isNaN(resourceId)) {
      return res.status(400).json({ message: 'Invalid resource ID format' });
    }
    
    // Check if resource exists and get its makerspace ID
    const [existingResource] = await db.select({
      id: makerspaceResources.id,
      makerspaceId: makerspaceResources.makerspaceId
    })
    .from(makerspaceResources)
    .where(eq(makerspaceResources.id, resourceId));
    
    if (!existingResource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    const makerspaceId = existingResource.makerspaceId;
    
    // Delete the resource
    await db.delete(makerspaceResources)
      .where(eq(makerspaceResources.id, resourceId));
    
    // Update the resource count in the makerspace
    const resourceCount = await db.select({ count: sql`count(*)` })
      .from(makerspaceResources)
      .where(eq(makerspaceResources.makerspaceId, makerspaceId));
    
    await db.update(makerspaces)
      .set({ resourceCount: Number(resourceCount[0].count) })
      .where(eq(makerspaces.id, makerspaceId));
    
    return res.status(200).json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return res.status(500).json({ message: 'Failed to delete resource' });
  }
});

// Add a cost entry to a resource
router.post('/resources/:id/costs', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resourceId = parseInt(id, 10);
    
    // Validate ID conversion
    if (isNaN(resourceId)) {
      return res.status(400).json({ message: 'Invalid resource ID format' });
    }
    
    // Check if resource exists
    const [existingResource] = await db.select()
      .from(makerspaceResources)
      .where(eq(makerspaceResources.id, resourceId));
    
    if (!existingResource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Validate the request body
    const validationResult = insertMakerspaceResourceCostSchema.safeParse({
      ...req.body,
      resourceId,
      recordedBy: req.user?.id
    });
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid cost data', 
        errors: validationResult.error.errors 
      });
    }
    
    const costData = validationResult.data;
    
    // The schema transformation should already handle Date to string conversion
    // and number formatting, but ensure we have correct types
    const dbCostData = {
      ...costData,
      // Convert amount to string for database storage
      amount: costData.amount !== null && costData.amount !== undefined 
        ? String(costData.amount) 
        : "0"
    };
    
    console.log("Formatted cost data for DB:", dbCostData);
    
    // Create the cost entry - FIX: Don't wrap in array brackets
    const [newCost] = await db.insert(makerspaceResourceCosts)
      .values(dbCostData)
      .returning();
    
    return res.status(201).json(newCost);
  } catch (error) {
    console.error('Error adding cost entry:', error);
    return res.status(500).json({ message: 'Failed to add cost entry' });
  }
});

// Get all costs for a resource
router.get('/resources/:id/costs', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resourceId = parseInt(id, 10);
    
    // Validate ID conversion
    if (isNaN(resourceId)) {
      return res.status(400).json({ message: 'Invalid resource ID format' });
    }
    
    // Get costs
    const costs = await db.select().from(makerspaceResourceCosts)
      .where(eq(makerspaceResourceCosts.resourceId, resourceId));
    
    return res.json(costs);
  } catch (error) {
    console.error('Error fetching resource costs:', error);
    return res.status(500).json({ message: 'Failed to fetch resource costs' });
  }
});

// Delete a cost entry
router.delete('/costs/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const costId = parseInt(id, 10);
    
    // Validate ID conversion
    if (isNaN(costId)) {
      return res.status(400).json({ message: 'Invalid cost ID format' });
    }
    
    // Check if cost exists
    const [existingCost] = await db.select()
      .from(makerspaceResourceCosts)
      .where(eq(makerspaceResourceCosts.id, costId));
    
    if (!existingCost) {
      return res.status(404).json({ message: 'Cost entry not found' });
    }
    
    // Delete the cost entry
    await db.delete(makerspaceResourceCosts)
      .where(eq(makerspaceResourceCosts.id, costId));
    
    return res.status(200).json({ message: 'Cost entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting cost entry:', error);
    return res.status(500).json({ message: 'Failed to delete cost entry' });
  }
});

// Add endpoint to get resource statistics
router.get('/makerspaces/:id/resource-stats', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const makerspaceId = parseInt(id, 10);
    
    // Validate ID conversion
    if (isNaN(makerspaceId)) {
      return res.status(400).json({ message: 'Invalid makerspace ID format' });
    }
    
    // Get total inventory value
    const valueResult = await db.select({
      totalValue: sql`SUM(CAST(${makerspaceResources.totalCost} AS DECIMAL(10,2)))`
    })
    .from(makerspaceResources)
    .where(eq(makerspaceResources.makerspaceId, makerspaceId));
    
    // Get category stats
    const categoryStats = await db.select({
      category: makerspaceResources.category,
      count: sql`count(*)`,
      totalItems: sql`sum(${makerspaceResources.quantity})`,
      categoryValue: sql`SUM(CAST(${makerspaceResources.totalCost} AS DECIMAL(10,2)))`
    })
    .from(makerspaceResources)
    .where(eq(makerspaceResources.makerspaceId, makerspaceId))
    .groupBy(makerspaceResources.category);
    
    // Get maintenance costs
    const maintenanceCosts = await db.select({
      totalMaintenance: sql`SUM(CAST(${makerspaceResourceCosts.amount} AS DECIMAL(10,2)))`
    })
    .from(makerspaceResourceCosts)
    .innerJoin(
      makerspaceResources,
      eq(makerspaceResourceCosts.resourceId, makerspaceResources.id)
    )
    .where(
      and(
        eq(makerspaceResources.makerspaceId, makerspaceId),
        eq(makerspaceResourceCosts.costType, 'Maintenance')
      )
    );
    
    return res.json({
      totalInventoryValue: valueResult[0].totalValue || 0,
      totalMaintenanceCost: maintenanceCosts[0].totalMaintenance || 0,
      categoryStats
    });
  } catch (error) {
    console.error('Error fetching resource statistics:', error);
    return res.status(500).json({ message: 'Failed to fetch resource statistics' });
  }
});

// Add this endpoint to your makerspace-resources-fixed.ts file:

// Get resource count for a makerspace
router.get('/makerspaces/:id/count', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const makerspaceId = parseInt(id, 10);
    
    // Validate ID conversion
    if (isNaN(makerspaceId)) {
      return res.status(400).json({ message: 'Invalid makerspace ID format' });
    }
    
    // Count resources
    const result = await db.select({
      count: db.fn.count(makerspaceResources.id)
    })
    .from(makerspaceResources)
    .where(eq(makerspaceResources.makerspaceId, makerspaceId));
    
    const count = Number(result[0].count);
    
    // Update the makerspace's resourceCount field
    await db.update(makerspaces)
      .set({ resourceCount: count })
      .where(eq(makerspaces.id, makerspaceId));
    
    // Return the count
    return res.json({ count });
  } catch (error) {
    console.error('Error fetching resource count:', error);
    return res.status(500).json({ message: 'Failed to fetch resource count' });
  }
});

export default router;