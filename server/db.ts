// db.ts or database.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use environment variables instead of hardcoded credentials
const connectionString = process.env.DATABASE_URL;

// Make sure to handle the case where the environment variable isn't set
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });