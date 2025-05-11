import { db } from "./db";
import { businessProfiles, businessYouthRelationships, youthProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedBusinessProfiles() {
  try {
    console.log("Seeding business profiles...");
    
    // Create an additional MakerSpace business for one district and a Madam Anchor for another
    const additionalBusinessData = [
      {
        businessName: "AgriTech Systems",
        district: "Bekwai, Ghana",
        businessLocation: "Innovation Zone, Bekwai",
        businessContact: "+233123876509",
        businessDescription: "Agricultural technology solutions focusing on sustainable farming practices.",
        businessModel: "Product & Service",
        dareModel: "MakerSpace",
        serviceCategory: "Agriculture & Agro-processing",
        businessStartDate: new Date(2024, 1, 15)
      },
      {
        businessName: "Krobo Pottery Cooperative",
        district: "Lower Manya Krobo, Ghana",
        businessLocation: "Artisan Village, Lower Manya Krobo",
        businessContact: "+233567123890",
        businessDescription: "Traditional pottery production and training collective.",
        businessModel: "Product & Training",
        dareModel: "Madam Anchor",
        serviceCategory: "Crafts & Artisanal Products",
        businessStartDate: new Date(2024, 2, 20)
      },
      {
        businessName: "Yilo Organic Fruits",
        district: "Yilo Krobo, Ghana",
        businessLocation: "Farm District, Yilo Krobo",
        businessContact: "+233234567891",
        businessDescription: "Organic fruit farming and processing collective.",
        businessModel: "Product",
        dareModel: "Madam Anchor",
        serviceCategory: "Agriculture & Agro-processing",
        businessStartDate: new Date(2024, 1, 5)
      },
      {
        businessName: "Digital Learning Hub",
        district: "Gushegu, Ghana",
        businessLocation: "Community Center, Gushegu",
        businessContact: "+233345678912",
        businessDescription: "Digital skills training and computer services for the community.",
        businessModel: "Service",
        dareModel: "Collaborative",
        serviceCategory: "Information Technology",
        businessStartDate: new Date(2024, 0, 25)
      }
    ];
    
    // Get all existing businesses
    const existingBusinesses = await db.select().from(businessProfiles);
    
    // Add new businesses if needed
    let seededBusinesses = [...existingBusinesses];
    
    if (existingBusinesses.length === 0 || existingBusinesses.length < 8) {
      console.log("Seeding additional business profiles...");
      
      // Sample business data for initial 4 businesses
      const initialBusinessData = [
        {
          businessName: "CreativeSew Ghana",
          district: "Bekwai, Ghana",
          businessLocation: "Main Street, Bekwai",
          businessContact: "+233123456789",
          businessDescription: "A tailoring and fashion design business specializing in traditional and modern garments.",
          businessModel: "Service",
          dareModel: "Collaborative",
          serviceCategory: "Textiles & Apparel",
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
          serviceCategory: "Information Technology",
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
          serviceCategory: "Crafts & Artisanal Products",
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
          serviceCategory: "Food & Beverage Production",
          businessStartDate: new Date(2024, 3, 20)
        }
      ];
      
      // Combine all business data
      const allBusinessData = [...initialBusinessData, ...additionalBusinessData];
      
      // Skip businesses that already exist
      const businessToAdd = allBusinessData.filter(business => 
        !existingBusinesses.some(existing => existing.businessName === business.businessName)
      );
      
      // Insert new business profiles
      for (const business of businessToAdd) {
        // Insert business profile
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
      }
    }
    
    // Check existing relationships
    const existingRelationships = await db.select().from(businessYouthRelationships);
    
    // Clear existing relationships if requested by resetting
    if (existingRelationships.length > 0) {
      console.log(`Found ${existingRelationships.length} existing business-youth relationships`);
      
      // If you want to reset relationships, uncomment this:
      // await db.delete(businessYouthRelationships);
      // console.log("Cleared existing business-youth relationships");
    }
    
    // Only create new relationships if none exist
    if (existingRelationships.length === 0) {
      // Get all youth profiles
      const allYouth = await db.select().from(youthProfiles);
      
      if (allYouth.length === 0) {
        console.log("No youth profiles found. Cannot create business-youth relationships.");
        return {
          success: true,
          count: seededBusinesses.length,
          businesses: seededBusinesses.map(b => b.businessName),
          message: "Created businesses but no youth profiles available for relationships"
        };
      }
      
      // Group businesses by DARE model
      const collaborativeBusinesses = seededBusinesses.filter(b => b.dareModel === "Collaborative");
      const makerSpaceBusinesses = seededBusinesses.filter(b => b.dareModel === "MakerSpace");
      const madamAnchorBusinesses = seededBusinesses.filter(b => b.dareModel === "Madam Anchor");
      
      // Initialize counters for each model
      let collaborativeCount = 0;
      let makerSpaceCount = 0;
      let madamAnchorCount = 0;
      
      // Create a map of youth already assigned to avoid duplication
      const assignedYouth = new Map();
      
      // Distribute 3 youth to collaborative businesses
      for (const business of collaborativeBusinesses) {
        // Skip if we've assigned enough youth to this model
        if (collaborativeCount >= 3) continue;
        
        // Find youth in the same district who aren't assigned yet
        const availableYouth = allYouth.filter(youth => 
          youth.district === business.district &&
          !assignedYouth.has(youth.id)
        );
        
        if (availableYouth.length === 0) continue;
        
        // Assign this youth to the business
        const youth = availableYouth[0];
        assignedYouth.set(youth.id, business.id);
        
        try {
          await db.insert(businessYouthRelationships).values({
            businessId: business.id,
            youthId: youth.id,
            role: "Member",
            joinDate: new Date(),
            isActive: true
          });
          collaborativeCount++;
          console.log(`Added youth ${youth.fullName} to collaborative business ${business.businessName}`);
        } catch (error) {
          console.error(`Failed to create relationship for youth ${youth.id} and business ${business.id}:`, error);
        }
      }
      
      // Distribute 2 youth to makerspace businesses
      for (const business of makerSpaceBusinesses) {
        // Skip if we've assigned enough youth to this model
        if (makerSpaceCount >= 2) continue;
        
        // Find youth in the same district who aren't assigned yet
        const availableYouth = allYouth.filter(youth => 
          youth.district === business.district &&
          !assignedYouth.has(youth.id)
        );
        
        if (availableYouth.length === 0) continue;
        
        // Assign this youth to the business
        const youth = availableYouth[0];
        assignedYouth.set(youth.id, business.id);
        
        try {
          await db.insert(businessYouthRelationships).values({
            businessId: business.id,
            youthId: youth.id,
            role: "Member",
            joinDate: new Date(),
            isActive: true
          });
          makerSpaceCount++;
          console.log(`Added youth ${youth.fullName} to makerspace business ${business.businessName}`);
        } catch (error) {
          console.error(`Failed to create relationship for youth ${youth.id} and business ${business.id}:`, error);
        }
      }
      
      // Distribute 3 youth to madam anchor businesses
      for (const business of madamAnchorBusinesses) {
        // Skip if we've assigned enough youth to this model
        if (madamAnchorCount >= 3) continue;
        
        // Find youth in the same district who aren't assigned yet
        const availableYouth = allYouth.filter(youth => 
          youth.district === business.district &&
          !assignedYouth.has(youth.id)
        );
        
        if (availableYouth.length === 0) continue;
        
        // Assign this youth to the business
        const youth = availableYouth[0];
        assignedYouth.set(youth.id, business.id);
        
        try {
          await db.insert(businessYouthRelationships).values({
            businessId: business.id,
            youthId: youth.id,
            role: "Member",
            joinDate: new Date(),
            isActive: true
          });
          madamAnchorCount++;
          console.log(`Added youth ${youth.fullName} to madam anchor business ${business.businessName}`);
        } catch (error) {
          console.error(`Failed to create relationship for youth ${youth.id} and business ${business.id}:`, error);
        }
      }
      
      // If we still need more relationships, assign remaining youth to any business
      // until we reach the required counts
      const remainingYouth = allYouth.filter(youth => !assignedYouth.has(youth.id));
      
      for (const youth of remainingYouth) {
        // Determine where to assign this youth based on current counts
        let targetBusinesses = [];
        
        if (collaborativeCount < 3) {
          targetBusinesses = collaborativeBusinesses;
        } else if (makerSpaceCount < 2) {
          targetBusinesses = makerSpaceBusinesses;
        } else if (madamAnchorCount < 3) {
          targetBusinesses = madamAnchorBusinesses;
        } else {
          break; // All quotas reached
        }
        
        // Find a business preferably in the same district
        let business = targetBusinesses.find(b => b.district === youth.district);
        if (!business && targetBusinesses.length > 0) {
          business = targetBusinesses[0]; // Take any if no district match
        }
        
        if (!business) continue;
        
        try {
          await db.insert(businessYouthRelationships).values({
            businessId: business.id,
            youthId: youth.id,
            role: "Member",
            joinDate: new Date(),
            isActive: true
          });
          
          // Update the appropriate counter
          if (business.dareModel === "Collaborative") collaborativeCount++;
          else if (business.dareModel === "MakerSpace") makerSpaceCount++;
          else if (business.dareModel === "Madam Anchor") madamAnchorCount++;
          
          console.log(`Added youth ${youth.fullName} to ${business.dareModel} business ${business.businessName}`);
        } catch (error) {
          console.error(`Failed to create relationship for youth ${youth.id} and business ${business.id}:`, error);
        }
      }
      
      console.log(`Created relationships: ${collaborativeCount} in Collaborative, ${makerSpaceCount} in MakerSpace, ${madamAnchorCount} in Madam Anchor`);
    }
    
    return {
      success: true,
      count: seededBusinesses.length,
      businesses: seededBusinesses.map(b => b.businessName)
    };
  } catch (error) {
    console.error("Error seeding business profiles:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// If this file is executed directly, run the seed function
if (import.meta.url === `file://${process.argv[1]}`) {
  seedBusinessProfiles()
    .then((result) => {
      console.log("Seed result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed error:", error);
      process.exit(1);
    });
}

export { seedBusinessProfiles };