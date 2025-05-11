/**
 * Fix the month column in business_tracking for all API calls
 * This script creates a modified version of the business tracking APIs
 * that use tracking_month instead of month
 */

import { Request, Response } from "express";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import {
  businessProfiles,
  businessTracking,
  insertBusinessTrackingSchema
} from "@shared/schema";

/**
 * Get all business tracking records
 */
export async function getAllBusinessTrackingsFixed(req: Request, res: Response) {
  try {
    const trackings = await db
      .select()
      .from(businessTracking)
      .orderBy(businessTracking.trackingMonth);
    
    res.status(200).json(trackings);
  } catch (error) {
    console.error("Error fetching all tracking records:", error);
    res.status(500).json({
      message: "Failed to fetch tracking records",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get a single business tracking record by ID
 */
export async function getBusinessTrackingByIdFixed(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid tracking ID" });
    }
    
    const [tracking] = await db
      .select()
      .from(businessTracking)
      .where(eq(businessTracking.id, id));
    
    if (!tracking) {
      return res.status(404).json({ message: "Tracking record not found" });
    }
    
    res.status(200).json(tracking);
  } catch (error) {
    console.error(`Error fetching tracking record ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to fetch tracking record",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get all business tracking records for a specific business
 */
export async function getBusinessTrackingsByBusinessIdFixed(req: Request, res: Response) {
  try {
    const businessId = Number(req.params.businessId);
    
    if (isNaN(businessId)) {
      return res.status(400).json({ message: "Invalid business ID" });
    }
    
    // Verify the business exists
    const [business] = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.id, businessId));
    
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    
    const trackings = await db
      .select()
      .from(businessTracking)
      .where(eq(businessTracking.businessId, businessId))
      .orderBy(businessTracking.trackingMonth);
    
    res.status(200).json(trackings);
  } catch (error) {
    console.error(`Error fetching tracking records for business ${req.params.businessId}:`, error);
    res.status(500).json({
      message: "Failed to fetch tracking records",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Create a new business tracking record
 */
export async function createBusinessTrackingFixed(req: Request, res: Response) {
  try {
    // Handle month vs tracking_month field conversion
    const data = { ...req.body };
    
    // If month is provided but tracking_month is not, copy the value
    if (data.month && !data.tracking_month) {
      data.tracking_month = data.month;
      delete data.month;
    }
    
    // If year is provided but tracking_year is not, copy the value
    if (data.year && !data.tracking_year) {
      data.tracking_year = data.year;
      delete data.year;
    }
    
    // Validate the data using Zod schema
    const validatedData = insertBusinessTrackingSchema.parse(data);
    
    // Verify the business exists
    const [business] = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.id, validatedData.businessId));
    
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    
    // Check if a tracking record already exists for this month/year and business
    if (validatedData.trackingMonth) {
      const existingTrackings = await db
        .select()
        .from(businessTracking)
        .where(
          and(
            eq(businessTracking.businessId, validatedData.businessId),
            eq(businessTracking.trackingMonth, validatedData.trackingMonth)
          )
        );
      
      if (existingTrackings.length > 0) {
        return res.status(409).json({
          message: "A tracking record already exists for this business and month"
        });
      }
    }
    
    // Create the tracking record
    const [tracking] = await db
      .insert(businessTracking)
      .values(validatedData)
      .returning();
    
    res.status(201).json(tracking);
  } catch (error) {
    console.error("Error creating tracking record:", error);
    res.status(500).json({
      message: "Failed to create tracking record",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Update an existing business tracking record
 */
export async function updateBusinessTrackingFixed(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid tracking ID" });
    }
    
    // Verify the tracking record exists
    const [existingTracking] = await db
      .select()
      .from(businessTracking)
      .where(eq(businessTracking.id, id));
    
    if (!existingTracking) {
      return res.status(404).json({ message: "Tracking record not found" });
    }
    
    // Handle month vs tracking_month field conversion
    const data = { ...req.body };
    
    // If month is provided but tracking_month is not, copy the value
    if (data.month && !data.tracking_month) {
      data.tracking_month = data.month;
      delete data.month;
    }
    
    // If year is provided but tracking_year is not, copy the value
    if (data.year && !data.tracking_year) {
      data.tracking_year = data.year;
      delete data.year;
    }
    
    // Prepare update data
    const updateData = { ...data };
    
    // Update timestamp
    updateData.updatedAt = new Date();
    
    // Update the tracking record
    const [updatedTracking] = await db
      .update(businessTracking)
      .set(updateData)
      .where(eq(businessTracking.id, id))
      .returning();
    
    res.status(200).json(updatedTracking);
  } catch (error) {
    console.error(`Error updating tracking record ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to update tracking record",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}