-- Make assigned_district nullable and ensure it has the correct enum values
ALTER TABLE mentors ALTER COLUMN assigned_district DROP NOT NULL;

-- Ensure assigned_districts field is properly set up
ALTER TABLE mentors ALTER COLUMN assigned_districts TYPE JSONB USING assigned_districts::JSONB;
ALTER TABLE mentors ALTER COLUMN assigned_districts SET DEFAULT '[]'::JSONB;