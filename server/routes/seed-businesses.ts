import { Request, Response, Router } from "express";
import { db } from "../db";
import { businessProfiles, businessYouthRelationships, youthProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// This endpoint is for seeding the database with sample business profiles
router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(401).json({ error: "Unauthorized. Only admins can seed data." });
    }
    
    // Check if business profiles already exist
    const existingBusinesses = await db.select().from(businessProfiles).limit(1);
    if (existingBusinesses.length > 0) {
      return res.status(400).json({ message: "Business profiles already exist. Seeding skipped." });
    }
    
    // Sample business data
    const businessData = [
      {
        businessName: "CreativeSew Ghana",
        district: "Bekwai, Ghana",
        businessLocation: "Main Street, Bekwai",
        businessContact: "+233123456789",
        businessDescription: "A tailoring and fashion design business specializing in traditional and modern garments.",
        businessModel: "Service",
        dareModel: "Collaborative",
        serviceCategory: "Tailoring and Fashion",
        businessStartDate: new Date(2024, 0, 15)
      },
      {
        businessName: "TechConnect Solutions",
        district: "Gushegu, Ghana",
        businessLocation: "Tech Hub, Gushegu Center",
        businessContact: "+233987654321",
        businessDescription: "IT services and computer training for local businesses and schools.",
        businessModel: "Service",
        dareModel: "MakerSpace",
        serviceCategory: "Technology Services",
        businessStartDate: new Date(2024, 1, 10)
      },
      {
        businessName: "Krobo Beads Collective",
        district: "Lower Manya Krobo, Ghana",
        businessLocation: "Craft Market, Lower Manya",
        businessContact: "+233555666777",
        businessDescription: "Traditional beadwork and jewelry making cooperative.",
        businessModel: "Product",
        dareModel: "Madam Anchor",
        serviceCategory: "Handicrafts",
        businessStartDate: new Date(2024, 2, 5)
      },
      {
        businessName: "Fresh Harvest Catering",
        district: "Yilo Krobo, Ghana",
        businessLocation: "Food District, Yilo Krobo",
        businessContact: "+233444555666",
        businessDescription: "Catering service specializing in local cuisine for events and businesses.",
        businessModel: "Service",
        dareModel: "Collaborative",
        serviceCategory: "Food Services",
        businessStartDate: new Date(2024, 3, 20)
      }
    ];
    
    // Insert business profiles
    const seededBusinesses = [];
    for (const business of businessData) {
      const [newBusiness] = await db.insert(businessProfiles).values({
        businessName: business.businessName,
        district: business.district as any,
        businessLocation: business.businessLocation,
        businessContact: business.businessContact,
        businessDescription: business.businessDescription,
        businessModel: business.businessModel,
        dareModel: business.dareModel as any,
        serviceCategory: business.serviceCategory as any,
        businessStartDate: business.businessStartDate,
        businessLogo: null,
        portfolioLinks: {},
        workSamples: [],
      }).returning();
      
      seededBusinesses.push(newBusiness);
      
      // Get youth profiles in the same district
      const districtYouth = await db.select().from(youthProfiles).where(eq(youthProfiles.district, business.district as any));
      
      // Associate up to 2 youth with each business
      for (let i = 0; i < Math.min(2, districtYouth.length); i++) {
        const isOwner = i === 0; // First youth is the owner
        
        await db.insert(businessYouthRelationships).values({
          businessId: newBusiness.id,
          youthId: districtYouth[i].id,
          role: isOwner ? "Owner" : "Member",
          joinDate: business.businessStartDate,
          isActive: true
        });
      }
    }
    
    res.status(201).json({ 
      message: "Successfully seeded business profiles",
      createdBusinesses: seededBusinesses.map(b => b.businessName)
    });
  } catch (error) {
    console.error("Error seeding business profiles:", error);
    res.status(500).json({ error: "Failed to seed business profiles" });
  }
});

export default router;