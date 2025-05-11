// This file helps diagnose the specific database error
// Save this as /lib/debug-utils.ts

import { businessProfiles } from '@shared/schema';
import { db } from '@/lib/db'; // Adjust import based on your project structure
import { eq } from 'drizzle-orm';

/**
 * Enhanced error logger that extracts useful information from database errors
 */
export function logDbError(error: unknown, context: string) {
  console.error(`[DB ERROR] ${context}:`, {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    type: error?.constructor?.name,
    context
  });
}

/**
 * Special diagnostic function to help identify issues with business profiles
 */
export async function diagnoseBusiness(businessId?: number) {
  try {
    // Log the start of diagnosis
    console.log(`[DIAGNOSIS] Starting database diagnosis ${businessId ? `for business ${businessId}` : 'for all businesses'}`);
    
    if (businessId) {
      // Try a simple direct query first
      console.log(`[DIAGNOSIS] Attempting direct raw query for business ${businessId}`);
      const directResult = await db.execute(
        `SELECT id, business_name FROM business_profiles WHERE id = $1`,
        [businessId]
      );
      console.log('[DIAGNOSIS] Direct query result:', directResult);
      
      // Then try with the ORM
      console.log(`[DIAGNOSIS] Attempting ORM query for business ${businessId} with select`);
      const business = await db.select({
        id: businessProfiles.id,
        name: businessProfiles.businessName
      })
      .from(businessProfiles)
      .where(eq(businessProfiles.id, businessId));
      
      console.log('[DIAGNOSIS] ORM simple query result:', business);
    } else {
      // Query the first few records to diagnose general issues
      console.log('[DIAGNOSIS] Attempting raw query for all businesses (limited to 5)');
      const directResult = await db.execute(
        `SELECT id, business_name FROM business_profiles LIMIT 5`
      );
      console.log('[DIAGNOSIS] Raw query result:', directResult);
      
      // Try to identify which records may be causing issues
      console.log('[DIAGNOSIS] Checking individual fields for issues...');
      
      // Test potentially problematic fields
      const rawDbRows = await db.execute(
        `SELECT id, 
                business_name, 
                enterprise_type, 
                enterprise_size,
                business_objectives,
                short_term_goals
         FROM business_profiles LIMIT 10`
      );

      // Log each raw row for manual analysis
      if (Array.isArray(rawDbRows)) {
        console.log(`[DIAGNOSIS] Found ${rawDbRows.length} rows to analyze`);
        rawDbRows.forEach((row, index) => {
          console.log(`[DIAGNOSIS] Row ${index + 1}:`, {
            id: row.id,
            name: row.business_name,
            enterpriseType: row.enterprise_type,
            enterpriseSize: row.enterprise_size,
            // Check if these JSON fields are strings or properly parsed objects
            businessObjectivesType: typeof row.business_objectives,
            businessObjectives: row.business_objectives,
            shortTermGoalsType: typeof row.short_term_goals,
            shortTermGoals: row.short_term_goals
          });
        });
      }
    }
    
    // Test for specific schema issues
    console.log('[DIAGNOSIS] Examining schema definition...');
    // Log important schema fields
    console.log('[DIAGNOSIS] Business Profiles Schema Fields:', {
      enterpriseType: businessProfiles.enterpriseType,
      enterpriseSize: businessProfiles.enterpriseSize,
      businessObjectives: businessProfiles.businessObjectives,
      shortTermGoals: businessProfiles.shortTermGoals
    });
    
    return { success: true, message: 'Diagnosis completed successfully' };
  } catch (error) {
    console.error('[DIAGNOSIS] Error during diagnosis:', error);
    return { 
      success: false, 
      message: 'Diagnosis failed', 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
  }
}

/**
 * Bypass the database ORM to get business profiles directly
 * This can help identify if the issue is with the ORM or the data
 */
export async function getRawBusinessProfiles() {
  try {
    const result = await db.execute(`
      SELECT id, business_name, enterprise_type, enterprise_size, business_objectives, short_term_goals 
      FROM business_profiles LIMIT 20
    `);
    return { success: true, data: result };
  } catch (error) {
    logDbError(error, 'getRawBusinessProfiles');
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Function to check all business records for potential issues
 */
export async function auditBusinessRecords() {
  try {
    console.log('[AUDIT] Starting audit of business records');
    
    // Get all businesses with minimal fields first
    const basicData = await db.execute(`SELECT id, business_name FROM business_profiles`);
    
    if (!Array.isArray(basicData)) {
      console.log('[AUDIT] No business records found or unexpected return format');
      return { success: false, message: 'Unexpected return format from database' };
    }
    
    console.log(`[AUDIT] Found ${basicData.length} business records`);
    
    const problemRecords = [];
    
    // Check each record individually
    for (const record of basicData) {
      try {
        // Try to get the full record
        await db.execute(`
          SELECT * FROM business_profiles WHERE id = $1
        `, [record.id]);
        
        // No error occurred, so this record is probably ok
      } catch (error) {
        // This record caused an error
        problemRecords.push({
          id: record.id,
          name: record.business_name,
          error: error instanceof Error ? error.message : String(error)
        });
        
        console.log(`[AUDIT] Problem with business ID ${record.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    if (problemRecords.length > 0) {
      console.log(`[AUDIT] Found ${problemRecords.length} problematic records`);
      return { success: true, problemCount: problemRecords.length, problemRecords };
    } else {
      console.log('[AUDIT] No problematic records found');
      return { success: true, message: 'No problematic records found' };
    }
    
  } catch (error) {
    logDbError(error, 'auditBusinessRecords');
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}