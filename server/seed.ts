import { db } from "./db";
import { businessProfiles, businessYouthRelationships, users, youthProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";
import { createHash, randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  console.log("Starting database seeding...");

  // Check if users already exist
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    console.log("Database already has users. Skipping user seed.");
  } else {
    console.log("Seeding users...");
    // Create admin user
    await db.insert(users).values({
      username: "admin",
      password: await hashPassword("admin123"),
      fullName: "Admin User",
      email: "admin@example.com",
      role: "admin",
      district: null,
      profilePicture: null,
    });

    // Create district mentor users
    const districts = ["Bekwai, Ghana", "Gushegu, Ghana", "Lower Manya Krobo, Ghana", "Yilo Krobo, Ghana"];
    for (const district of districts) {
      const districtSlug = district.split(",")[0].toLowerCase();
      await db.insert(users).values({
        username: `mentor_${districtSlug}`,
        password: await hashPassword("mentor123"),
        fullName: `${district.split(",")[0]} Mentor`,
        email: `mentor_${districtSlug}@example.com`,
        role: "mentor",
        district,
        profilePicture: null,
      });
    }

    // Create sample youth users
    const youthData = [
      { name: "Ama Mensah", district: "Bekwai, Ghana" },
      { name: "Kofi Osei", district: "Bekwai, Ghana" },
      { name: "Sarah Addo", district: "Gushegu, Ghana" },
      { name: "Emmanuel Boateng", district: "Gushegu, Ghana" },
      { name: "Grace Owusu", district: "Lower Manya Krobo, Ghana" },
      { name: "Daniel Asare", district: "Lower Manya Krobo, Ghana" },
      { name: "Abena Mensah", district: "Yilo Krobo, Ghana" },
      { name: "Kwame Ansah", district: "Yilo Krobo, Ghana" },
    ];

    for (const youth of youthData) {
      const username = youth.name.toLowerCase().replace(" ", "_") + "_" + youth.district.split(",")[0].toLowerCase();
      await db.insert(users).values({
        username,
        password: await hashPassword("password123"),
        fullName: youth.name,
        email: `${username}@example.com`,
        role: "mentee",
        district: youth.district,
        profilePicture: null,
      });
    }
  }

  // Check if we need to create youth profiles
  const existingProfiles = await db.select().from(youthProfiles).limit(1);
  if (existingProfiles.length > 0) {
    console.log("Youth profiles already exist. Skipping profile seed.");
  } else {
    console.log("Seeding youth profiles...");
    
    // Get all mentee users
    const menteeUsers = await db.select().from(users).where(eq(users.role, "mentee"));
    
    for (const user of menteeUsers) {
      // Create youth profile linked to user
      await db.insert(youthProfiles).values({
        userId: user.id,
        fullName: user.fullName,
        district: user.district as any,
        gender: Math.random() > 0.5 ? "Male" : "Female",
        birthDate: new Date(1995 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        contactPhone: `+233${Math.floor(Math.random() * 900000000) + 100000000}`,
        contactEmail: user.email,
        educationLevel: ["High School", "Technical School", "University", "Certificate Program"][Math.floor(Math.random() * 4)],
        skillCategories: ["Web Design", "Tailoring", "Catering", "Graphic Design"][Math.floor(Math.random() * 4)],
        participantId: `YIW-${user.district?.split(",")[0].substring(0, 3).toUpperCase() || "XXX"}-${Math.floor(Math.random() * 9000) + 1000}`,
        enrollmentDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        profilePicture: null,
      });
    }
  }

  // Check if business profiles already exist
  const existingBusinesses = await db.select().from(businessProfiles).limit(1);
  if (existingBusinesses.length > 0) {
    console.log("Business profiles already exist. Skipping business seed.");
  } else {
    console.log("Seeding business profiles...");
    
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
    for (const business of businessData) {
      await db.insert(businessProfiles).values({
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
      });
    }
  }

  // Check if business-youth relationships exist
  const existingRelationships = await db.select().from(businessYouthRelationships).limit(1);
  if (existingRelationships.length > 0) {
    console.log("Business-youth relationships already exist. Skipping relationship seed.");
  } else {
    console.log("Seeding business-youth relationships...");
    
    // Get all businesses and youth profiles
    const businesses = await db.select().from(businessProfiles);
    const youth = await db.select().from(youthProfiles);
    
    // Associate youths with businesses in their district
    for (const business of businesses) {
      // Find youth in the same district
      const districtYouth = youth.filter(y => y.district === business.district);
      
      // Create relationships (1-2 youth per business)
      for (let i = 0; i < Math.min(2, districtYouth.length); i++) {
        const isOwner = i === 0; // First youth is the owner
        
        await db.insert(businessYouthRelationships).values({
          businessId: business.id,
          youthId: districtYouth[i].id,
          role: isOwner ? "Owner" : "Member",
          joinDate: new Date(2024, business.businessStartDate!.getMonth(), business.businessStartDate!.getDate() + 1),
          isActive: true
        });
      }
    }
  }

  console.log("Database seeding completed!");
}

// Run the seed function if this file is executed directly
// For ESM compatibility
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error seeding database:", error);
      process.exit(1);
    });
}

export { seedDatabase };