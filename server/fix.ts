import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Fix and update database schema:
 * - Add month, year, and revenue columns to business_tracking
 * - Add output_url and result_count to report_runs
 * - Relax NOT NULL constraint on training_programs.program_name
 */
async function fixDatabaseSchema() {
  console.log("🔧 Starting database schema fixes...");

  try {
    // business_tracking table
    await fixTableColumns("business_tracking", [
      { name: "month", type: "INTEGER" },
      { name: "notes", type: "TEXT" },
      { name: "mentor_feedback", type: "TEXT" },
      { name: "year", type: "INTEGER" },
      { name: "revenue", type: "INTEGER" },
      { name: "expenses", type: "INTEGER" },
      { name: "profit", type: "INTEGER" },
      { name: "customer_count", type: "INTEGER" },
      { name: "employee_count", type: "INTEGER" },
      { name: "resources", type: "JSONB" },
      { name: "equipment", type: "JSONB" },
      { name: "decisions", type: "JSONB" },
      { name: "lessons", type: "JSONB" },
      { name: "challenges", type: "JSONB" },
      { name: "next_steps", type: "JSONB" },
    ]);

    // report_runs table
    await fixTableColumns("report_runs", [
      { name: "output_url", type: "TEXT" },
      { name: "result_count", type: "INTEGER" }
    ]);

    // training_programs: allow program_name to be nullable and set default ''
    if (await checkTableExists("training_programs")) {
      console.log("\n🔍 Modifying training_programs.program_name constraint...");
      await db.execute(sql`
        ALTER TABLE ${sql.identifier("training_programs")}
          ALTER COLUMN ${sql.identifier("program_name")} DROP NOT NULL,
          ALTER COLUMN ${sql.identifier("program_name")} SET DEFAULT '';
      `);
      console.log("✅ training_programs.program_name is now nullable with default ''.");
    } else {
      console.warn("⚠️ Table 'training_programs' does not exist. Skipping program_name fix.");
    }

    console.log("✅ All schema fixes applied successfully!");
  } catch (err) {
    console.error("❌ Error applying schema fixes:", err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

/**
 * Check if a table exists in the current schema
 */
async function checkTableExists(tableName: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = ${tableName}
    ) AS exists;
  `);
  return result.rows?.[0]?.exists === true;
}

/**
 * Check if a column exists in a table
 */
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = ${tableName}
        AND column_name = ${columnName}
    ) AS exists;
  `);
  return result.rows?.[0]?.exists === true;
}

/**
 * Add a column to a table if it does not already exist
 */
async function addColumnIfNotExists(
  tableName: string,
  columnName: string,
  dataType: string
): Promise<void> {
  const exists = await columnExists(tableName, columnName);
  if (!exists) {
    console.log(`🧱 Adding column '${columnName}' to '${tableName}'...`);
    await db.execute(sql`
      ALTER TABLE ${sql.identifier(tableName)}
      ADD COLUMN IF NOT EXISTS ${sql.identifier(columnName)} ${sql.raw(dataType)};
    `);
    console.log(`✅ Column '${columnName}' added to '${tableName}'.`);
  } else {
    console.log(`ℹ️ Column '${columnName}' already exists on '${tableName}'.`);
  }
}

/**
 * Helper to fix multiple columns for a given table
 */
async function fixTableColumns(
  tableName: string,
  columns: { name: string; type: string }[]
) {
  console.log(`\n🔍 Checking table '${tableName}'...`);
  const tableExists = await checkTableExists(tableName);
  if (!tableExists) {
    console.warn(`⚠️ Table '${tableName}' does not exist. Skipping.`);
    return;
  }
  for (const col of columns) {
    await addColumnIfNotExists(tableName, col.name, col.type);
  }
}

// Execute the fix
fixDatabaseSchema();