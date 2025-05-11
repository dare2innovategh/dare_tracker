/**
 * Script to create the makerspaces and makerspace_resources tables
 * This will ensure the tables have all the columns defined in our schema
 */
import { db } from "./db";
import { makerspaces, makerspaceResources } from "@shared/schema";
import { sql } from "drizzle-orm";

async function createMakerspacesTable() {
  console.log("Creating makerspaces tables...");

  try {
    // Create the makerspaces table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS makerspaces (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        description TEXT,
        coordinates TEXT,
        district TEXT NOT NULL,
        contact_phone TEXT,
        contact_email TEXT,
        operating_hours TEXT,
        resource_count INTEGER DEFAULT 0,
        member_count INTEGER DEFAULT 0,
        open_date TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      )
    `);

    // Create the makerspace_resources table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS makerspace_resources (
        id SERIAL PRIMARY KEY,
        makerspace_id INTEGER NOT NULL REFERENCES makerspaces(id),
        resource_name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'Available',
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      )
    `);

    console.log("Makerspaces tables created successfully!");
  } catch (error) {
    console.error("Error creating makerspaces tables:", error);
  }
}

// For ES modules, we need to check if this is the main module differently
import { fileURLToPath } from 'url';

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  createMakerspacesTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Failed to create makerspaces tables:", error);
      process.exit(1);
    });
}

export { createMakerspacesTable };