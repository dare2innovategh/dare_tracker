import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Directly use the connection string for now (temporary fix)
const connectionString = 'postgres://dare_tracker:Pushitin98.@172.24.16.14:5432/dare_tracker_db';

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });