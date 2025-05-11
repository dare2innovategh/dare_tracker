import express from "express";
import { db } from "../../db";
import { isAuthenticated } from "../../middleware/auth";
import { hasPlatformPermission } from "../../middleware/permissions";
import { assessments } from "../../../shared/schema";

const router = express.Router();

/**
 * GET /api/feasibility/assessments/all
 * Get all feasibility assessments
 */
router.get(
  "/",
  isAuthenticated,
  hasPlatformPermission("feasibility", "view"),
  async (req, res) => {
    try {
      // Fetch all assessments with a JOIN to business_profiles to get business names
      const assessments = await db.query(`
        SELECT a.*, b.business_name as "businessName", b.district 
        FROM feasibility_assessments a
        LEFT JOIN business_profiles b ON a.business_id = b.id
        ORDER BY a.updated_at DESC NULLS LAST, a.created_at DESC
      `);

      // Map the database column names to camelCase for frontend consumption
      const formattedAssessments = assessments.rows.map((assessment: any) => {
        // Return assessment data in camelCase format
        return {
          id: assessment.id,
          businessId: assessment.business_id,
          youthId: assessment.youth_id,
          businessName: assessment.businessName,
          district: assessment.district,
          businessDescription: assessment.business_description,
          marketDemand: assessment.market_demand,
          competitionLevel: assessment.competition_level,
          customerAccessibility: assessment.customer_accessibility,
          pricingPower: assessment.pricing_power,
          marketingEffectiveness: assessment.marketing_effectiveness,
          locationAdvantage: assessment.location_advantage,
          resourceAvailability: assessment.resource_availability,
          productionEfficiency: assessment.production_efficiency,
          supplyChain: assessment.supply_chain,
          profitMargins: assessment.profit_margins,
          cashFlow: assessment.cash_flow,
          accessToCapital: assessment.access_to_capital,
          financialRecords: assessment.financial_records,
          leadershipCapability: assessment.leadership_capability,
          teamCompetence: assessment.team_competence,
          processDocumentation: assessment.process_documentation,
          innovationCapacity: assessment.innovation_capacity,
          comments: assessment.comments,
          status: assessment.status,
          assignedBy: assessment.assigned_by,
          createdAt: assessment.created_at,
          updatedAt: assessment.updated_at,
        };
      });

      return res.status(200).json(formattedAssessments);
    } catch (error: any) {
      console.error("Error fetching all feasibility assessments:", error);
      return res.status(500).json({ 
        message: "Failed to fetch feasibility assessments", 
        error: error.message 
      });
    }
  }
);

export default router;