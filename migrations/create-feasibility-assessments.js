import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';

// Configure neon websocket
neonConfig.webSocketConstructor = ws;

// Make sure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

/**
 * Creates the feasibility_assessments table
 */
export async function createFeasibilityAssessmentsTable() {
  try {
    // Check if table already exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'feasibility_assessments'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('feasibility_assessments table already exists, skipping');
      return;
    }
    
    // Create the table
    await db.execute(sql`
      CREATE TABLE "feasibility_assessments" (
        "id" SERIAL PRIMARY KEY,
        "business_id" INTEGER REFERENCES "business_profiles"("id") ON DELETE SET NULL,
        "youth_id" INTEGER REFERENCES "youth_profiles"("id") ON DELETE SET NULL,
        
        -- Business Information
        "business_name" TEXT NOT NULL,
        "district" TEXT NOT NULL,
        "assessment_date" DATE DEFAULT CURRENT_DATE,
        "status" TEXT DEFAULT 'Draft',
        
        -- Market Assessment
        "market_demand" TEXT,
        "competition_level" TEXT,
        "customer_accessibility" TEXT,
        "pricing_power" TEXT,
        "marketing_effectiveness" TEXT,
        "market_comments" TEXT,
        
        -- Financial Assessment
        "startup_costs" TEXT,
        "operating_costs" TEXT,
        "profit_margin" TEXT,
        "cash_flow" TEXT,
        "funding_accessibility" TEXT,
        "financial_comments" TEXT,
        
        -- Operational Assessment
        "location_suitability" TEXT,
        "resource_availability" TEXT,
        "supply_chain_reliability" TEXT,
        "operational_efficiency" TEXT,
        "scalability_potential" TEXT,
        "operational_comments" TEXT,
        
        -- Team Assessment
        "skillset_relevance" TEXT,
        "experience_level" TEXT,
        "team_commitment" TEXT,
        "team_cohesion" TEXT,
        "leadership_capacity" TEXT,
        "team_comments" TEXT,
        
        -- Digital Readiness Assessment
        "digital_skill_level" TEXT,
        "tech_infrastructure" TEXT,
        "digital_marketing_capacity" TEXT,
        "data_management" TEXT,
        "tech_adaptability" TEXT,
        "digital_comments" TEXT,
        
        -- Summary and Results
        "overall_feasibility_score" NUMERIC(4, 2),
        "strengths_weaknesses" JSONB DEFAULT '{"strengths": [], "weaknesses": []}',
        "recommendations" TEXT,
        
        -- Metadata
        "assessment_by" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "reviewed_by" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "review_date" DATE,
        "review_comments" TEXT,
        
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP
      );
    `);
    
    console.log('Successfully created feasibility_assessments table');
    
  } catch (error) {
    console.error('Error creating feasibility_assessments table:', error);
    throw error;
  }
}

// Run the migration
createFeasibilityAssessmentsTable()
  .then(() => console.log('Migration completed successfully'))
  .catch(err => console.error('Migration failed:', err));