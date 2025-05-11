-- Add missing columns to the users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Ensure all nullable fields are properly defined
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN district DROP NOT NULL;
ALTER TABLE users ALTER COLUMN profile_picture DROP NOT NULL;

-- Sync the role_permissions table structure
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- Sync the youth_profiles table structure
ALTER TABLE youth_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE youth_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
ALTER TABLE youth_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE youth_profiles ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Sync the mentors table structure
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS profile_picture TEXT;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS assigned_districts JSONB DEFAULT '[]'::JSONB NOT NULL;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS specialization TEXT;

-- Sync the business_profiles table structure
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- Sync business_tracking table structure
ALTER TABLE business_tracking ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE business_tracking ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
ALTER TABLE business_tracking ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP;
ALTER TABLE business_tracking ADD COLUMN IF NOT EXISTS approved_by INTEGER;
ALTER TABLE business_tracking ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';

-- Sync the mentorship_messages table
ALTER TABLE mentorship_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE mentorship_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Sync the business_advice table
ALTER TABLE business_advice ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE business_advice ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
ALTER TABLE business_advice ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE business_advice ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;