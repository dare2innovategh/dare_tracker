import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration to add category and totalModules fields to training_programs table
 */
export async function addTrainingProgramFields() {
  console.log("Starting migration to add new fields to training_programs table...");
  
  try {
    // Check if category column exists
    const categoryExists = await checkColumnExists('training_programs', 'category');
    if (!categoryExists) {
      console.log("Adding category column to training_programs table");
      await db.execute(sql`
        ALTER TABLE training_programs 
        ADD COLUMN category TEXT
      `);
    } else {
      console.log("category column already exists in training_programs table, skipping");
    }

    // Check if totalModules column exists
    const totalModulesExists = await checkColumnExists('training_programs', 'total_modules');
    if (!totalModulesExists) {
      console.log("Adding total_modules column to training_programs table");
      await db.execute(sql`
        ALTER TABLE training_programs 
        ADD COLUMN total_modules INTEGER DEFAULT 0
      `);
    } else {
      console.log("total_modules column already exists in training_programs table, skipping");
    }

    console.log("Migration completed successfully!");
    return { success: true };
  } catch (error) {
    console.error("Error in training programs migration:", error);
    return { success: false, error };
  }
}

/**
 * Helper function to check if a column exists in a table
 */
async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = ${tableName} AND column_name = ${columnName}
    `);
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
    return false;
  }
}