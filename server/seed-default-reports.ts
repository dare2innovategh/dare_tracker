import { db } from "./db";
import { reports } from "@shared/schema";

/**
 * Script to seed default report templates
 * This creates usable report templates in the reports table
 */
async function seedDefaultReports() {
  try {
    console.log("Checking for existing report templates...");
    
    // Check if we already have report templates
    const existingReports = await db.select().from(reports).where(reports.isTemplate, '=', true);
    
    if (existingReports.length > 0) {
      console.log(`Found ${existingReports.length} existing report templates. Skipping seeding.`);
      return;
    }
    
    console.log("No report templates found. Seeding default report templates...");
    
    // Define default report templates
    const defaultReports = [
      {
        title: 'Youth Profile Basic Report',
        description: 'Basic information about youth profiles',
        reportType: 'youth',
        isTemplate: true,
        filters: {},
        columns: ['id', 'name', 'gender', 'age', 'district', 'phone'],
        sortBy: 'name',
        sortDirection: 'asc',
        createdAt: new Date()
      },
      {
        title: 'Business Basic Report',
        description: 'Basic information about businesses',
        reportType: 'business',
        isTemplate: true,
        filters: {},
        columns: ['id', 'name', 'businessType', 'district', 'status'],
        sortBy: 'name',
        sortDirection: 'asc',
        createdAt: new Date()
      },
      {
        title: 'Mentor Basic Report',
        description: 'Basic information about mentors',
        reportType: 'mentor',
        isTemplate: true,
        filters: {},
        columns: ['id', 'name', 'specialization', 'district', 'isActive'],
        sortBy: 'name',
        sortDirection: 'asc',
        createdAt: new Date()
      }
    ];
    
    // Insert each report template
    for (const reportTemplate of defaultReports) {
      await db.insert(reports).values({
        title: reportTemplate.title,
        description: reportTemplate.description,
        reportType: reportTemplate.reportType,
        isTemplate: reportTemplate.isTemplate,
        filters: reportTemplate.filters,
        columns: reportTemplate.columns,
        sortBy: reportTemplate.sortBy,
        sortDirection: reportTemplate.sortDirection,
        createdAt: reportTemplate.createdAt
      });
    }
    
    console.log(`Successfully seeded ${defaultReports.length} default report templates`);
  } catch (error) {
    console.error("Error seeding default report templates:", error);
    throw error;
  }
}

// Run the function
seedDefaultReports().then(() => {
  console.log("Default report templates seeding completed");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error during report templates seeding:", err);
  process.exit(1);
});