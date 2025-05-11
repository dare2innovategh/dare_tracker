-- Add assigned_districts column to mentors table
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS assigned_districts JSONB DEFAULT NULL;

-- Update existing mentors to have their assigned_district as an array
UPDATE mentors 
SET assigned_districts = CASE
    WHEN assigned_district IS NOT NULL THEN jsonb_build_array(assigned_district)
    ELSE NULL
END;