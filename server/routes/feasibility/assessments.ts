import { Request, Response } from "express";
import { db } from "../../db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import {
  feasibilityAssessments,
  businessProfiles,
  youthProfiles,
  users,
  feasibilityStatusEnum,
  type InsertFeasibilityAssessment,
} from "@shared/schema";

// Define the Zod schema for validation
const feasibilityAssessmentSchema = z.object({
  businessId: z.number().optional(),
  youthId: z.number().optional(),
  plannedBusinessLocation: z.string().optional(),
  isGroundRentRequired: z.union([z.boolean(), z.literal("true"), z.literal("false")]).optional(),
  hasStructureOrStall: z.union([z.boolean(), z.literal("true"), z.literal("false")]).optional(),
  structureNeeds: z.string().optional(),
  estimatedSpaceCost: z.union([z.number(), z.string()]).optional(),
  spaceCostContribution: z.union([z.number(), z.string()]).optional(),
  equipmentNeeded: z.union([z.array(z.string()), z.string()]).optional(),
  equipmentCurrentlyOwned: z.union([z.array(z.string()), z.string()]).optional(),
  equipmentMissing: z.union([z.array(z.string()), z.string()]).optional(),
  equipmentTotalCost: z.union([z.number(), z.string()]).optional(),
  equipmentCostContribution: z.union([z.number(), z.string()]).optional(),
  startupSuppliesNeeded: z.union([z.array(z.string()), z.string()]).optional(),
  suppliesCurrentlyOwned: z.union([z.array(z.string()), z.string()]).optional(),
  suppliesMissing: z.union([z.array(z.string()), z.string()]).optional(),
  suppliesTotalCost: z.union([z.number(), z.string()]).optional(),
  suppliesCostContribution: z.union([z.number(), z.string()]).optional(),
  marketingToolsNeeded: z.union([z.array(z.string()), z.string()]).optional(),
  marketingToolsCurrentlyOwned: z.union([z.array(z.string()), z.string()]).optional(),
  marketingToolsMissing: z.union([z.array(z.string()), z.string()]).optional(),
  marketingTotalCost: z.union([z.number(), z.string()]).optional(),
  marketingCostContribution: z.union([z.number(), z.string()]).optional(),
  needsDelivery: z.union([z.boolean(), z.literal("true"), z.literal("false")]).optional(),
  deliveryMethod: z.string().optional(),
  deliveryResourcesAvailable: z.string().optional(),
  deliverySetupCost: z.union([z.number(), z.string()]).optional(),
  deliveryCostContribution: z.union([z.number(), z.string()]).optional(),
  monthlyNonBusinessExpenses: z.union([z.number(), z.string()]).optional(),
  fixedFinancialObligations: z.string().optional(),
  expectedPrice: z.union([z.number(), z.string()]).optional(),
  expectedSalesDaily: z.union([z.number(), z.string()]).optional(),
  expectedSalesWeekly: z.union([z.number(), z.string()]).optional(),
  expectedSalesMonthly: z.union([z.number(), z.string()]).optional(),
  expectedMonthlyRevenue: z.union([z.number(), z.string()]).optional(),
  expectedMonthlyExpenditure: z.union([z.number(), z.string()]).optional(),
  expectedMonthlySavings: z.union([z.number(), z.string()]).optional(),
  expectedPayToSelf: z.union([z.number(), z.string()]).optional(),
  isPlanFeasible: z.union([z.boolean(), z.literal("true"), z.literal("false")]).optional(),
  planAdjustments: z.string().optional(),
  seedCapitalNeeded: z.union([z.number(), z.string()]).optional(),
  seedCapitalUsage: z.string().optional(),
  status: z.enum(["Draft", "In Progress", "Completed", "Reviewed"]).default("Draft"),
  overallFeasibilityPercentage: z.union([z.number(), z.string()]).optional(),
  reviewComments: z.string().optional(),
  recommendations: z.string().optional(),
  riskFactors: z.string().optional(),
  growthOpportunities: z.string().optional(),
  recommendedActions: z.string().optional(),
});

// Helper functions for type conversion
const processArrayField = (field: unknown): string[] => {
  console.log("Processing array field:", field);
  if (field === undefined || field === null || typeof field !== "string") return [];
  if (Array.isArray(field)) return field;
  return field.split("\n").filter((item) => item.trim() !== "");
};

const processBooleanField = (field: unknown): boolean | undefined => {
  console.log("Processing boolean field:", field);
  if (field === undefined || field === null) return undefined;
  if (typeof field === "boolean") return field;
  return field === "true" ? true : false;
};

const processNumberField = (field: unknown): number | null => {
  console.log("Processing number field:", field);
  if (field === undefined || field === null || field === "") return null;
  return typeof field === "string" ? parseFloat(field) : field;
};

export async function createFeasibilityAssessment(req: Request, res: Response) {
  try {
    // Log the raw request body
    console.log("Received request body:", req.body);

    // Validate the request body
    const validatedData = feasibilityAssessmentSchema.parse(req.body);
    console.log("Validated data:", validatedData);

    // Verify business existence if provided
    if (validatedData.businessId) {
      const [business] = await db
        .select()
        .from(businessProfiles)
        .where(eq(businessProfiles.id, validatedData.businessId));
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
    }

    // Verify youth existence if provided
    if (validatedData.youthId) {
      const [youth] = await db
        .select()
        .from(youthProfiles)
        .where(eq(youthProfiles.id, validatedData.youthId));
      if (!youth) {
        return res.status(404).json({ message: "Youth profile not found" });
      }
    }

    // Set default values
    const assessmentDate = new Date();
    const assessmentBy = req.user?.id;

    // Prepare assessment data with type conversions
    const assessmentData: InsertFeasibilityAssessment = {
      businessId: validatedData.businessId,
      youthId: validatedData.youthId,
      assessmentDate,
      assessmentBy,
      status: validatedData.status,
      overallFeasibilityPercentage: processNumberField(
        validatedData.overallFeasibilityPercentage
      ),
      reviewComments: validatedData.reviewComments,
      recommendations: validatedData.recommendations,
      riskFactors: validatedData.riskFactors,
      growthOpportunities: validatedData.growthOpportunities,
      recommendedActions: validatedData.recommendedActions,
      plannedBusinessLocation: validatedData.plannedBusinessLocation,
      isGroundRentRequired: processBooleanField(validatedData.isGroundRentRequired),
      hasStructureOrStall: processBooleanField(validatedData.hasStructureOrStall),
      structureNeeds: validatedData.structureNeeds,
      estimatedSpaceCost: processNumberField(validatedData.estimatedSpaceCost),
      spaceCostContribution: processNumberField(validatedData.spaceCostContribution),
      equipmentNeeded: processArrayField(validatedData.equipmentNeeded),
      equipmentCurrentlyOwned: processArrayField(validatedData.equipmentCurrentlyOwned),
      equipmentMissing: processArrayField(validatedData.equipmentMissing),
      equipmentTotalCost: processNumberField(validatedData.equipmentTotalCost),
      equipmentCostContribution: processNumberField(
        validatedData.equipmentCostContribution
      ),
      startupSuppliesNeeded: processArrayField(validatedData.startupSuppliesNeeded),
      suppliesCurrentlyOwned: processArrayField(validatedData.suppliesCurrentlyOwned),
      suppliesMissing: processArrayField(validatedData.suppliesMissing),
      suppliesTotalCost: processNumberField(validatedData.suppliesTotalCost),
      suppliesCostContribution: processNumberField(
        validatedData.suppliesCostContribution
      ),
      marketingToolsNeeded: processArrayField(validatedData.marketingToolsNeeded),
      marketingToolsCurrentlyOwned: processArrayField(
        validatedData.marketingToolsCurrentlyOwned
      ),
      marketingToolsMissing: processArrayField(validatedData.marketingToolsMissing),
      marketingTotalCost: processNumberField(validatedData.marketingTotalCost),
      marketingCostContribution: processNumberField(
        validatedData.marketingCostContribution
      ),
      needsDelivery: processBooleanField(validatedData.needsDelivery),
      deliveryMethod: validatedData.deliveryMethod,
      deliveryResourcesAvailable: validatedData.deliveryResourcesAvailable,
      deliverySetupCost: processNumberField(validatedData.deliverySetupCost),
      deliveryCostContribution: processNumberField(
        validatedData.deliveryCostContribution
      ),
      monthlyNonBusinessExpenses: processNumberField(
        validatedData.monthlyNonBusinessExpenses
      ),
      fixedFinancialObligations: validatedData.fixedFinancialObligations,
      expectedPrice: processNumberField(validatedData.expectedPrice),
      expectedSalesDaily: processNumberField(validatedData.expectedSalesDaily),
      expectedSalesWeekly: processNumberField(validatedData.expectedSalesWeekly),
      expectedSalesMonthly: processNumberField(validatedData.expectedSalesMonthly),
      expectedMonthlyRevenue: processNumberField(validatedData.expectedMonthlyRevenue),
      expectedMonthlyExpenditure: processNumberField(
        validatedData.expectedMonthlyExpenditure
      ),
      expectedMonthlySavings: processNumberField(validatedData.expectedMonthlySavings),
      expectedPayToSelf: processNumberField(validatedData.expectedPayToSelf),
      isPlanFeasible: processBooleanField(validatedData.isPlanFeasible),
      planAdjustments: validatedData.planAdjustments,
      seedCapitalNeeded: processNumberField(validatedData.seedCapitalNeeded),
      seedCapitalUsage: validatedData.seedCapitalUsage,
    };

    // Insert the assessment into the database
    const [assessment] = await db
      .insert(feasibilityAssessments)
      .values(assessmentData)
      .returning();

    res.status(201).json(assessment);
  } catch (error) {
    console.error("Error creating feasibility assessment:", error);
    res.status(500).json({
      message: "Failed to create feasibility assessment",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
/**
 * Get all feasibility assessments with optional filtering and related data
 */
export async function getFeasibilityAssessments(req: Request, res: Response) {
  try {
    const { businessId, youthId, status } = req.query;
    const filters = [];
    
    if (businessId) {
      filters.push(eq(feasibilityAssessments.businessId, Number(businessId)));
    }
    
    if (youthId) {
      filters.push(eq(feasibilityAssessments.youthId, Number(youthId)));
    }
    
    if (status) {
      filters.push(eq(feasibilityAssessments.status, String(status)));
    }
    
    // Build query with filters if they exist
    const query = filters.length > 0
      ? db
          .select()
          .from(feasibilityAssessments)
          .leftJoin(businessProfiles, eq(feasibilityAssessments.businessId, businessProfiles.id))
          .leftJoin(youthProfiles, eq(feasibilityAssessments.youthId, youthProfiles.id))
          .leftJoin(users, eq(feasibilityAssessments.assessmentBy, users.id))
          .where(and(...filters))
          .orderBy(desc(feasibilityAssessments.assessmentDate))
      : db
          .select()
          .from(feasibilityAssessments)
          .leftJoin(businessProfiles, eq(feasibilityAssessments.businessId, businessProfiles.id))
          .leftJoin(youthProfiles, eq(feasibilityAssessments.youthId, youthProfiles.id))
          .leftJoin(users, eq(feasibilityAssessments.assessmentBy, users.id))
          .orderBy(desc(feasibilityAssessments.assessmentDate));
    
    const assessments = await query;
    
    // Format response to include related data
    const formattedAssessments = assessments.map(assessment => {
      // Extract nested objects and format them in a cleaner way
      const { businessProfiles: business, youthProfiles: youth, users: assessor, ...assessmentData } = assessment;
      
      return {
        ...assessmentData,
        business: business ? {
          id: business.id,
          name: business.businessName,
          district: business.district,
          logo: business.businessLogo
        } : null,
        youth: youth ? {
          id: youth.id,
          name: youth.fullName,
          district: youth.district,
          profilePicture: youth.profilePicture
        } : null,
        assessor: assessor ? {
          id: assessor.id,
          name: assessor.fullName,
          role: assessor.role
        } : null
      };
    });
    
    res.status(200).json(formattedAssessments);
  } catch (error) {
    console.error("Error fetching feasibility assessments:", error);
    res.status(500).json({ message: "Failed to fetch feasibility assessments", error: error.message });
  }
}

/**
 * Get a single feasibility assessment by ID
 */
export async function getFeasibilityAssessmentById(req: Request, res: Response) {
  try {
    const assessmentId = Number(req.params.id);
    
    if (isNaN(assessmentId)) {
      return res.status(400).json({ message: "Invalid assessment ID" });
    }
    
    const [result] = await db
      .select()
      .from(feasibilityAssessments)
      .leftJoin(businessProfiles, eq(feasibilityAssessments.businessId, businessProfiles.id))
      .leftJoin(youthProfiles, eq(feasibilityAssessments.youthId, youthProfiles.id))
      .leftJoin(users, eq(feasibilityAssessments.assessmentBy, users.id))
      .where(eq(feasibilityAssessments.id, assessmentId));
    
    if (!result) {
      return res.status(404).json({ message: "Feasibility assessment not found" });
    }
    
    // Extract nested objects for cleaner response
    const { businessProfiles: business, youthProfiles: youth, users: assessor, ...assessmentData } = result;
    
    // Format and send the response
    const formattedAssessment = {
      ...assessmentData,
      business: business ? {
        id: business.id,
        name: business.businessName,
        district: business.district,
        logo: business.businessLogo
      } : null,
      youth: youth ? {
        id: youth.id,
        name: youth.fullName,
        district: youth.district,
        profilePicture: youth.profilePicture
      } : null,
      assessor: assessor ? {
        id: assessor.id,
        name: assessor.fullName,
        role: assessor.role
      } : null
    };
    
    res.status(200).json(formattedAssessment);
  } catch (error) {
    console.error(`Error fetching feasibility assessment ${req.params.id}:`, error);
    res.status(500).json({ message: "Failed to fetch feasibility assessment", error: error.message });
  }
}


/**
 * Update an existing feasibility assessment
 */
export async function updateFeasibilityAssessment(req: Request, res: Response) {
  try {
    const assessmentId = Number(req.params.id);
    
    if (isNaN(assessmentId)) {
      return res.status(400).json({ message: "Invalid assessment ID" });
    }
    
    // Verify the assessment exists
    const [existingAssessment] = await db
      .select()
      .from(feasibilityAssessments)
      .where(eq(feasibilityAssessments.id, assessmentId));
    
    if (!existingAssessment) {
      return res.status(404).json({ message: "Feasibility assessment not found" });
    }
    
    console.log("Received request body:", req.body); // Log the raw request body

    // Validate the request body
    const validatedData = feasibilityAssessmentSchema.parse(req.body);
    console.log("Validated data:", validatedData); // Log the validated data

    // Helper functions for type conversion
    const processArrayField = (field) => {
      console.log("Processing array field:", field); // Log the field being processed
      if (field === undefined || field === null) return undefined; // Don't update if not provided
      if (Array.isArray(field)) return field;
      return field.split('\n').filter(item => item.trim() !== '');
    };
    
    const processBooleanField = (field) => {
      console.log("Processing boolean field:", field); // Log the field being processed
      if (field === undefined || field === null) return undefined; // Don't update if not provided
      if (typeof field === "boolean") return field;
      return field === "true" ? true : false;
    };
    
    const processNumberField = (field) => {
      console.log("Processing number field:", field); // Log the field being processed
      if (field === undefined || field === null || field === "") return undefined; // Don't update if not provided
      return typeof field === "string" ? parseFloat(field) : field;
    };
    
    // Set the updated fields with proper type conversions
    const assessmentData: Partial<InsertFeasibilityAssessment> = {
      businessId: validatedData.businessId,
      youthId: validatedData.youthId,
      status: validatedData.status,
      overallFeasibilityPercentage: processNumberField(validatedData.overallFeasibilityPercentage),
      reviewComments: validatedData.reviewComments,
      recommendations: validatedData.recommendations,
      riskFactors: validatedData.riskFactors,
      growthOpportunities: validatedData.growthOpportunities,
      recommendedActions: validatedData.recommendedActions,
      
      // Location & Structure
      plannedBusinessLocation: validatedData.plannedBusinessLocation,
      isGroundRentRequired: processBooleanField(validatedData.isGroundRentRequired),
      hasStructureOrStall: processBooleanField(validatedData.hasStructureOrStall),
      structureNeeds: validatedData.structureNeeds,
      estimatedSpaceCost: processNumberField(validatedData.estimatedSpaceCost),
      spaceCostContribution: processNumberField(validatedData.spaceCostContribution),
      
      // Equipment
      equipmentNeeded: processArrayField(validatedData.equipmentNeeded),
      equipmentCurrentlyOwned: processArrayField(validatedData.equipmentCurrentlyOwned),
      equipmentMissing: processArrayField(validatedData.equipmentMissing),
      equipmentTotalCost: processNumberField(validatedData.equipmentTotalCost),
      equipmentCostContribution: processNumberField(validatedData.equipmentCostContribution),
      
      // Supplies
      startupSuppliesNeeded: processArrayField(validatedData.startupSuppliesNeeded),
      suppliesCurrentlyOwned: processArrayField(validatedData.suppliesCurrentlyOwned),
      suppliesMissing: processArrayField(validatedData.suppliesMissing),
      suppliesTotalCost: processNumberField(validatedData.suppliesTotalCost),
      suppliesCostContribution: processNumberField(validatedData.suppliesCostContribution),
      
      // Marketing
      marketingToolsNeeded: processArrayField(validatedData.marketingToolsNeeded),
      marketingToolsCurrentlyOwned: processArrayField(validatedData.marketingToolsCurrentlyOwned),
      marketingToolsMissing: processArrayField(validatedData.marketingToolsMissing),
      marketingTotalCost: processNumberField(validatedData.marketingTotalCost),
      marketingCostContribution: processNumberField(validatedData.marketingCostContribution),
      
      // Delivery
      needsDelivery: processBooleanField(validatedData.needsDelivery),
      deliveryMethod: validatedData.deliveryMethod,
      deliveryResourcesAvailable: validatedData.deliveryResourcesAvailable,
      deliverySetupCost: processNumberField(validatedData.deliverySetupCost),
      deliveryCostContribution: processNumberField(validatedData.deliveryCostContribution),
      
      // Livelihood Expenses
      monthlyNonBusinessExpenses: processNumberField(validatedData.monthlyNonBusinessExpenses),
      fixedFinancialObligations: validatedData.fixedFinancialObligations,
      
      // Revenue & Financial Projections
      expectedPrice: processNumberField(validatedData.expectedPrice),
      expectedSalesDaily: processNumberField(validatedData.expectedSalesDaily),
      expectedSalesWeekly: processNumberField(validatedData.expectedSalesWeekly),
      expectedSalesMonthly: processNumberField(validatedData.expectedSalesMonthly),
      expectedMonthlyRevenue: processNumberField(validatedData.expectedMonthlyRevenue),
      expectedMonthlyExpenditure: processNumberField(validatedData.expectedMonthlyExpenditure),
      expectedMonthlySavings: processNumberField(validatedData.expectedMonthlySavings),
      expectedPayToSelf: processNumberField(validatedData.expectedPayToSelf),
      isPlanFeasible: processBooleanField(validatedData.isPlanFeasible),
      planAdjustments: validatedData.planAdjustments,
      
      // Seed Capital
      seedCapitalNeeded: processNumberField(validatedData.seedCapitalNeeded),
      seedCapitalUsage: validatedData.seedCapitalUsage,
      
      // Always set the updated_at field
      updatedAt: new Date(),
    };
    
    // Remove undefined fields
    for (const key in assessmentData) {
      if (assessmentData[key] === undefined) {
        delete assessmentData[key];
      }
    }
    
    // Update the assessment in the database
    const [updatedAssessment] = await db
      .update(feasibilityAssessments)
      .set(assessmentData)
      .where(eq(feasibilityAssessments.id, assessmentId))
      .returning();
    
    res.status(200).json(updatedAssessment);
  } catch (error) {
    console.error(`Error updating feasibility assessment ${req.params.id}:`, error);
    res.status(500).json({ 
      message: "Failed to update feasibility assessment", 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}
/**
 * Submit a feasibility assessment for review
 */
export async function submitAssessmentForReview(req: Request, res: Response) {
  try {
    const assessmentId = Number(req.params.id);
    
    if (isNaN(assessmentId)) {
      return res.status(400).json({ message: "Invalid assessment ID" });
    }
    
    // Verify the assessment exists
    const [existingAssessment] = await db
      .select()
      .from(feasibilityAssessments)
      .where(eq(feasibilityAssessments.id, assessmentId));
    
    if (!existingAssessment) {
      return res.status(404).json({ message: "Feasibility assessment not found" });
    }
    
    // Change status to "Completed" and update timestamp
    const [updatedAssessment] = await db
      .update(feasibilityAssessments)
      .set({ 
        status: "Completed",
        updatedAt: new Date()
      })
      .where(eq(feasibilityAssessments.id, assessmentId))
      .returning();
    
    res.status(200).json(updatedAssessment);
  } catch (error) {
    console.error(`Error submitting feasibility assessment ${req.params.id} for review:`, error);
    res.status(500).json({ message: "Failed to submit feasibility assessment for review", error: error.message });
  }
}

/**
 * Review a feasibility assessment
 */
export async function reviewFeasibilityAssessment(req: Request, res: Response) {
  try {
    const assessmentId = Number(req.params.id);
    
    if (isNaN(assessmentId)) {
      return res.status(400).json({ message: "Invalid assessment ID" });
    }
    
    // Get the required fields from the request body
    const { 
      reviewComments, 
      recommendations,
      overallFeasibilityPercentage,
      riskFactors,
      growthOpportunities,
      recommendedActions
    } = req.body;
    
    // Verify the assessment exists
    const [existingAssessment] = await db
      .select()
      .from(feasibilityAssessments)
      .where(eq(feasibilityAssessments.id, assessmentId));
    
    if (!existingAssessment) {
      return res.status(404).json({ message: "Feasibility assessment not found" });
    }
    
    // Update the assessment with review details
    const [updatedAssessment] = await db
      .update(feasibilityAssessments)
      .set({ 
        status: "Reviewed",
        reviewedBy: req.user?.id,
        reviewDate: new Date(),
        reviewComments,
        recommendations,
        overallFeasibilityPercentage: typeof overallFeasibilityPercentage === "string" 
          ? parseFloat(overallFeasibilityPercentage) 
          : overallFeasibilityPercentage,
        riskFactors,
        growthOpportunities,
        recommendedActions,
        updatedAt: new Date()
      })
      .where(eq(feasibilityAssessments.id, assessmentId))
      .returning();
    
    res.status(200).json(updatedAssessment);
  } catch (error) {
    console.error(`Error reviewing feasibility assessment ${req.params.id}:`, error);
    res.status(500).json({ message: "Failed to review feasibility assessment", error: error.message });
  }
}

/**
 * Delete a feasibility assessment
 */
export async function deleteFeasibilityAssessment(req: Request, res: Response) {
  try {
    const assessmentId = Number(req.params.id);
    
    if (isNaN(assessmentId)) {
      return res.status(400).json({ message: "Invalid assessment ID" });
    }
    
    // Verify the assessment exists
    const [existingAssessment] = await db
      .select()
      .from(feasibilityAssessments)
      .where(eq(feasibilityAssessments.id, assessmentId));
    
    if (!existingAssessment) {
      return res.status(404).json({ message: "Feasibility assessment not found" });
    }
    
    // Delete the assessment
    await db
      .delete(feasibilityAssessments)
      .where(eq(feasibilityAssessments.id, assessmentId));
    
    res.status(200).json({ 
      message: "Feasibility assessment deleted successfully",
      id: assessmentId
    });
  } catch (error) {
    console.error(`Error deleting feasibility assessment ${req.params.id}:`, error);
    res.status(500).json({ message: "Failed to delete feasibility assessment", error: error.message });
  }
}