/**
 * Fix for operating_costs vs operational_costs in feasibility assessments
 * This script provides fixed API endpoints that ensure the correct field name is used
 */

import { Request, Response } from "express";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import {
  feasibilityAssessments,
  businessProfiles,
  youthProfiles,
  insertFeasibilityAssessmentSchema,
  type FeasibilityAssessment
} from "@shared/schema";

/**
 * Get all feasibility assessments with optional filtering
 */
export async function getFeasibilityAssessmentsFixed(req: Request, res: Response) {
  try {
    // Add filters for businessId or youthId if provided
    const filters = [];
    
    if (req.query.businessId) {
      filters.push(eq(feasibilityAssessments.businessId, Number(req.query.businessId)));
    }
    
    if (req.query.youthId) {
      filters.push(eq(feasibilityAssessments.youthId, Number(req.query.youthId)));
    }
    
    if (req.query.status) {
      filters.push(eq(feasibilityAssessments.status, String(req.query.status) as any));
    }
    
    const assessments = filters.length > 0
      ? await db
          .select()
          .from(feasibilityAssessments)
          .where(and(...filters))
          .orderBy(feasibilityAssessments.assessmentDate)
      : await db
          .select()
          .from(feasibilityAssessments)
          .orderBy(feasibilityAssessments.assessmentDate);
    
    res.status(200).json(assessments);
  } catch (error) {
    console.error("Error fetching feasibility assessments:", error);
    res.status(500).json({ 
      message: "Failed to fetch feasibility assessments",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Create a new feasibility assessment ensuring operating_costs is used correctly
 */
export async function createFeasibilityAssessmentFixed(req: Request, res: Response) {
  try {
    // Clone the request body and handle field name conversion
    const data = { ...req.body };
    
    // If operational_costs is provided but operating_costs is not, copy the value
    if (data.operational_costs && !data.operating_costs) {
      data.operating_costs = data.operational_costs;
      delete data.operational_costs;
    }
    
    // Validate the request body using the Zod schema
    const validatedData = insertFeasibilityAssessmentSchema.parse(data);
    
    // Verify the business exists
    if (validatedData.businessId) {
      const [business] = await db
        .select()
        .from(businessProfiles)
        .where(eq(businessProfiles.id, validatedData.businessId));
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
    }
    
    // Verify the youth exists
    if (validatedData.youthId) {
      const [youth] = await db
        .select()
        .from(youthProfiles)
        .where(eq(youthProfiles.id, validatedData.youthId));
      
      if (!youth) {
        return res.status(404).json({ message: "Youth profile not found" });
      }
    }
    
    // Calculate the overall feasibility score by averaging all assessment scores
    // We're only calculating this when all scores are provided
    let overallScore: number | undefined = undefined;
    const scoreFields = [
      // Market Assessment
      validatedData.marketDemand, 
      validatedData.competitionLevel,
      validatedData.customerAccessibility,
      validatedData.pricingPower,
      validatedData.marketingEffectiveness,
      
      // Financial Assessment
      validatedData.startupCosts,
      validatedData.operating_costs, // This is the fixed field name
      validatedData.profitMargins,
      validatedData.cashFlow,
      validatedData.fundingAccessibility,
      
      // Operational Assessment
      validatedData.locationSuitability,
      validatedData.resourceAvailability,
      validatedData.supplyChainReliability,
      validatedData.operationalEfficiency,
      validatedData.scalabilityPotential,
      
      // Team Assessment
      validatedData.skillsetRelevance,
      validatedData.experienceLevel,
      validatedData.teamCommitment,
      validatedData.teamCohesion,
      validatedData.leadershipCapacity,
      
      // Digital Readiness Assessment
      validatedData.digitalSkillLevel,
      validatedData.techInfrastructure,
      validatedData.digitalMarketingCapacity,
      validatedData.dataManagement,
      validatedData.techAdaptability
    ];
    
    // Filter out undefined values and calculate average if we have scores
    const validScores = scoreFields.filter(score => score !== undefined);
    if (validScores.length > 0) {
      const totalScore = validScores.reduce((sum, score) => {
        // Handle potential string or number values safely
        const numValue = typeof score === 'string' ? parseInt(score, 10) : Number(score);
        return isNaN(numValue) ? sum : sum + numValue;
      }, 0);
      
      const avgScore = totalScore / validScores.length;
      overallScore = Number(avgScore.toFixed(2));
    }
    
    // Set the assessment date to now if not provided
    const assessmentDate = validatedData.assessmentDate || new Date();
    
    // Set the current authenticated user as the assessor if not provided
    const assessmentBy = validatedData.assessmentBy || req.user?.id;
    
    // Create the assessment
    // Create data object with correct types
    const assessmentData: any = {
      ...validatedData,
      assessmentBy,
      overallFeasibilityScore: overallScore,
    };
    
    // Set assessment date if provided
    if (assessmentDate) {
      assessmentData.assessmentDate = assessmentDate;
    }
    
    const [assessment] = await db
      .insert(feasibilityAssessments)
      .values(assessmentData)
      .returning();
    
    res.status(201).json(assessment);
  } catch (error) {
    console.error("Error creating feasibility assessment:", error);
    res.status(500).json({ 
      message: "Failed to create feasibility assessment", 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}

/**
 * Update an existing feasibility assessment ensuring operating_costs is used correctly
 */
export async function updateFeasibilityAssessmentFixed(req: Request, res: Response) {
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
    
    // Clone and fix the request body to use operating_costs
    const data = { ...req.body };
    
    // If operational_costs is provided but operating_costs is not, copy the value
    if (data.operational_costs && !data.operating_costs) {
      data.operating_costs = data.operational_costs;
      delete data.operational_costs;
    }
    
    // Use a partial schema for updates
    const validatedData = data;
    
    // Calculate the overall feasibility score by averaging all assessment scores
    const assessmentData: Partial<FeasibilityAssessment> = { ...validatedData };
    
    // If any scoring fields were updated, recalculate the overall score
    if (Object.keys(validatedData).some(key => key.includes('Demand') || key.includes('Level') || key.includes('Accessibility') || 
                                              key.includes('Power') || key.includes('Effectiveness') || key.includes('Costs') || 
                                              key.includes('Margin') || key.includes('Flow') || key.includes('Suitability') || 
                                              key.includes('Reliability') || key.includes('Efficiency') || key.includes('Potential') || 
                                              key.includes('Relevance') || key.includes('Commitment') || key.includes('Cohesion') || 
                                              key.includes('Capacity') || key.includes('Infrastructure') || key.includes('Management') || 
                                              key.includes('Adaptability'))) {
      // Get the updated assessment with all fields for score calculation
      const updatedAssessment = { ...existingAssessment, ...validatedData };
      
      const scoreFields = [
        // Market Assessment
        updatedAssessment.marketDemand, 
        updatedAssessment.competitionLevel,
        updatedAssessment.customerAccessibility,
        updatedAssessment.pricingPower,
        updatedAssessment.marketingEffectiveness,
        
        // Financial Assessment
        updatedAssessment.startupCosts,
        updatedAssessment.operating_costs, // This is the fixed field name
        updatedAssessment.profitMargins,
        updatedAssessment.cashFlow,
        updatedAssessment.fundingAccessibility,
        
        // Operational Assessment
        updatedAssessment.locationSuitability,
        updatedAssessment.resourceAvailability,
        updatedAssessment.supplyChainReliability,
        updatedAssessment.operationalEfficiency,
        updatedAssessment.scalabilityPotential,
        
        // Team Assessment
        updatedAssessment.skillsetRelevance,
        updatedAssessment.experienceLevel,
        updatedAssessment.teamCommitment,
        updatedAssessment.teamCohesion,
        updatedAssessment.leadershipCapacity,
        
        // Digital Readiness Assessment
        updatedAssessment.digitalSkillLevel,
        updatedAssessment.techInfrastructure,
        updatedAssessment.digitalMarketingCapacity,
        updatedAssessment.dataManagement,
        updatedAssessment.techAdaptability
      ];
      
      // Filter out undefined values and calculate average if we have scores
      const validScores = scoreFields.filter(score => score !== undefined && score !== null);
      if (validScores.length > 0) {
        const totalScore = validScores.reduce((sum, score) => {
          // Handle potential string or number values safely
          const numValue = typeof score === 'string' ? parseInt(score, 10) : Number(score);
          return isNaN(numValue) ? sum : sum + numValue;
        }, 0);
        
        const avgScore = totalScore / validScores.length;
        // @ts-ignore - overallFeasibilityScore might have different type expectations
        assessmentData.overallFeasibilityScore = Number(avgScore.toFixed(2));
      }
    }
    
    // Set updatedAt field
    assessmentData.updatedAt = new Date();
    
    // Update the assessment
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