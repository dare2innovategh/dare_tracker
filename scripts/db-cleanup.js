// scripts/db-cleanup.js
const { db } = require('../server/db');
const { feasibilityAssessments } = require('../shared/schema');
const { eq } = require('drizzle-orm');

/**
 * This script helps clean up database issues that might cause deployment problems
 * Run this script when you encounter database inconsistencies
 */
async function cleanupDatabase() {
  console.log('Starting database cleanup...');
  
  try {
    // Fix potential issues with feasibility assessments
    console.log('Checking feasibility assessments for inconsistencies...');
    
    // 1. Find assessments with invalid score data
    const assessments = await db.select().from(feasibilityAssessments);
    console.log(`Found ${assessments.length} assessments`);
    
    // 2. Fix inconsistent data
    let fixedCount = 0;
    for (const assessment of assessments) {
      let needsUpdate = false;
      const updates = {};
      
      // Fix score fields that should be strings
      const scoreFields = [
        'marketDemand', 'competitionLevel', 'customerAccessibility', 
        'pricingPower', 'marketingEffectiveness', 'startupCosts',
        'operatingCosts', 'profitMargin', 'cashFlow', 
        'fundingAccessibility', 'locationSuitability', 'resourceAvailability',
        'supplyChainReliability', 'operationalEfficiency', 'scalabilityPotential',
        'skillsetRelevance', 'experienceLevel', 'teamCommitment',
        'teamCohesion', 'leadershipCapacity', 'digitalSkillLevel',
        'techInfrastructure', 'digitalMarketingCapacity', 'dataManagement',
        'techAdaptability'
      ];
      
      for (const field of scoreFields) {
        if (assessment[field] !== null && typeof assessment[field] !== 'string') {
          updates[field] = String(assessment[field]);
          needsUpdate = true;
        }
      }
      
      // Recalculate overall score if needed
      if (needsUpdate) {
        // Calculate valid scores for averaging
        const validScores = scoreFields
          .map(field => assessment[field])
          .filter(score => score !== null && score !== undefined)
          .map(score => typeof score === 'string' ? parseInt(score, 10) : Number(score))
          .filter(score => !isNaN(score));
          
        if (validScores.length > 0) {
          const totalScore = validScores.reduce((sum, score) => sum + score, 0);
          const avgScore = totalScore / validScores.length;
          updates.overallFeasibilityScore = Number(avgScore.toFixed(2));
        }
        
        // Update the assessment
        await db
          .update(feasibilityAssessments)
          .set(updates)
          .where(eq(feasibilityAssessments.id, assessment.id));
          
        fixedCount++;
      }
    }
    
    console.log(`Fixed ${fixedCount} assessments with data inconsistencies`);
    
    // Add more cleanup operations as needed
    
    console.log('Database cleanup completed successfully');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Run the cleanup function
cleanupDatabase();