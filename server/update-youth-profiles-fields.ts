import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Fix and update the youth_profiles table with all Mastercard and missing fields
 */
async function fixYouthProfilesSchema() {
  console.log("🔧 Starting fix for youth_profiles table...");

  try {
    const tableExists = await checkTableExists("youth_profiles");

    if (!tableExists) {
      console.warn("⚠️ youth_profiles table does not exist. Aborting.");
      return;
    }

    const columnsToAdd = [
      // Mastercard-specific and missing fields
      { name: "first_name", type: "TEXT NOT NULL DEFAULT ''" },
      { name: "middle_name", type: "TEXT" },
      { name: "last_name", type: "TEXT NOT NULL DEFAULT ''" },
      { name: "preferred_name", type: "TEXT" },
      { name: "date_of_birth", type: "DATE NOT NULL DEFAULT CURRENT_DATE" },
      { name: "implementing_partner_name", type: "TEXT" },
      { name: "refugee_status", type: "BOOLEAN DEFAULT FALSE" },
      { name: "idp_status", type: "BOOLEAN DEFAULT FALSE" },
      { name: "community_hosts_refugees", type: "BOOLEAN DEFAULT FALSE" },
      { name: "home_address", type: "TEXT" },
      { name: "country", type: "TEXT DEFAULT 'Ghana'" },
      { name: "admin_level_1", type: "TEXT" },
      { name: "admin_level_2", type: "TEXT" },
      { name: "admin_level_3", type: "TEXT" },
      { name: "admin_level_4", type: "TEXT" },
      { name: "admin_level_5", type: "TEXT" },
      { name: "highest_education_level", type: "TEXT" },
      { name: "active_student_status", type: "BOOLEAN DEFAULT FALSE" },
      { name: "partner_start_date", type: "DATE" },
      { name: "program_name", type: "TEXT" },
      { name: "program_details", type: "TEXT" },
      { name: "program_contact_person", type: "TEXT" },
      { name: "program_contact_phone_number", type: "TEXT" },
      { name: "new_data_submission", type: "BOOLEAN DEFAULT FALSE" },
      { name: "additional_phone_number_1", type: "TEXT" },
      { name: "additional_phone_number_2", type: "TEXT" }
    ];

    for (const column of columnsToAdd) {
      await addColumnIfNotExists("youth_profiles", column.name, column.type);
    }

    console.log("✅ youth_profiles table updated with all required fields");
  } catch (err) {
    console.error("❌ Error updating youth_profiles table:", err);
    process.exit(1);
  }
}

// Utilities

async function checkTableExists(tableName: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = ${tableName}
    );
  `);
  return result.rows?.[0]?.exists === true;
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = ${tableName}
      AND column_name = ${columnName}
    );
  `);
  return result.rows?.[0]?.exists === true;
}

async function addColumnIfNotExists(
  tableName: string,
  columnName: string,
  dataType: string
): Promise<void> {
  const exists = await columnExists(tableName, columnName);
  if (!exists) {
    console.log(`🧱 Adding column '${columnName}'...`);
    await db.execute(sql`
      ALTER TABLE ${sql.identifier(tableName)}
      ADD COLUMN IF NOT EXISTS ${sql.identifier(columnName)} ${sql.raw(dataType)};
    `);
    console.log(`✅ Column '${columnName}' added.`);
  } else {
    console.log(`ℹ️ Column '${columnName}' already exists.`);
  }
}

// Run it
fixYouthProfilesSchema().then(() => {
  console.log("\n🎉 Youth profile schema updated successfully!");
  process.exit(0);
});
