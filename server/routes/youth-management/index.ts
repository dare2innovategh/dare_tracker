import { Router } from "express";
import profilesRouter from "./profiles";
import businessesRouter from "./businesses";
import skillsRouter from "./skills";
import educationRouter from "./education";
// Use the completely rebuilt certifications and training routes
import newCertificationsRouter from "./new-certifications";
import fixedTrainingRouter from "./fixed-training";
// Keep old routes for compatibility
import certificationsRouter from "./fixed-certifications";
import youthProfileImportRouter from "../youth-profile-import";
import youthProfilesImportRouter from "../youth-profiles-import";
import youthProfilesTsvImportRouter from "../youth-profiles-tsv-import";
import youthTrainingRouter from "../youth-training";
import oldCertificationsRouter from "../certifications"; // For backward compatibility

const router = Router();

// Mount all youth-related routes under a common prefix
router.use("/profiles", profilesRouter);
router.use("/businesses", businessesRouter);
router.use("/skills", skillsRouter);
router.use("/education", educationRouter);

// Mount completely rebuilt routes as primary routes
router.use("/certifications-v2", newCertificationsRouter);
router.use("/training-v2", fixedTrainingRouter);

// Keep existing routes for backwards compatibility 
router.use("/certifications", certificationsRouter);
router.use("/training", youthTrainingRouter);

// Keep backward compatibility with existing import routes
router.use("/profile-import", youthProfileImportRouter);
router.use("/profiles-import", youthProfilesImportRouter);
router.use("/profiles-tsv-import", youthProfilesTsvImportRouter);
router.use("/old-certifications", oldCertificationsRouter); // Keep for backward compatibility

// Add info endpoint to document the organization of youth management routes
router.get("/", (req, res) => {
  res.json({
    module: "Youth Management",
    description: "API endpoints for managing youth profiles and related data",
    endpoints: [
      { path: "/youth/profiles", description: "Youth profile management" },
      { path: "/youth/businesses", description: "Business associations for youth" },
      { path: "/youth/skills", description: "Skills associated with youth profiles" },
      { path: "/youth/education", description: "Education records for youth profiles" },
      { path: "/youth/certifications", description: "Certifications held by youth" },
      { path: "/youth/training", description: "Training programs for youth" }
    ]
  });
});

export default router;