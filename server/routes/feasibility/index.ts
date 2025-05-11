import { Router } from "express";
import {
  getFeasibilityAssessments,
  getFeasibilityAssessmentById,
  createFeasibilityAssessment,
  updateFeasibilityAssessment,
  deleteFeasibilityAssessment,
  submitAssessmentForReview,
  reviewFeasibilityAssessment
} from "./assessments";
import { auth } from "../../middleware/auth";

const router = Router();

// Apply authentication middleware to all routes
router.use(auth);

// Feasibility assessments routes
router.get("/assessments", getFeasibilityAssessments);
router.get("/assessments/business/:businessId", async (req, res) => {
  // Redirect to the main assessments endpoint with a filter
  req.query.businessId = req.params.businessId;
  return getFeasibilityAssessments(req, res);
});
router.get("/assessments/:id", getFeasibilityAssessmentById);
router.post("/assessments", createFeasibilityAssessment);
router.patch("/assessments/:id", updateFeasibilityAssessment);
router.delete("/assessments/:id", deleteFeasibilityAssessment);
router.post("/assessments/:id/submit", submitAssessmentForReview);
router.post("/assessments/:id/review", reviewFeasibilityAssessment);

export default router;