-- DARE Youth-in-Jobs Tracker Platform Database Schema

-- Drop tables if they exist (careful with this in production!)
-- The order matters for foreign key constraints
DROP TABLE IF EXISTS mentorship_messages;
DROP TABLE IF EXISTS mentor_business_relationships;
DROP TABLE IF EXISTS business_youth_relationships;
DROP TABLE IF EXISTS business_tracking;
DROP TABLE IF EXISTS business_profiles;
DROP TABLE IF EXISTS mentors;
DROP TABLE IF EXISTS youth_profiles;
DROP TABLE IF EXISTS "session";
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'mentee',
  district TEXT,
  profile_picture TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Youth profiles table
CREATE TABLE youth_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  full_name TEXT NOT NULL,
  profile_picture TEXT,
  district TEXT NOT NULL,
  town TEXT,
  contact_info TEXT,
  social_media_links JSONB DEFAULT '{}',
  primary_skills JSONB DEFAULT '[]',
  secondary_skills JSONB DEFAULT '[]',
  skill_level TEXT,
  industry_expertise TEXT,
  languages_spoken JSONB DEFAULT '[]',
  communication_style TEXT,
  work_samples JSONB DEFAULT '[]',
  case_studies JSONB DEFAULT '[]',
  years_of_experience INTEGER,
  work_history JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  dare_training JSONB DEFAULT '[]',
  other_training JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Business profiles table
CREATE TABLE business_profiles (
  id SERIAL PRIMARY KEY,
  business_name TEXT NOT NULL,
  business_logo TEXT,
  district TEXT NOT NULL,
  business_location TEXT,
  business_contact TEXT,
  business_description TEXT,
  business_model TEXT,
  dare_model TEXT,
  service_category TEXT,
  business_start_date DATE,
  work_samples JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Business-youth relationships table
CREATE TABLE business_youth_relationships (
  business_id INTEGER NOT NULL REFERENCES business_profiles(id),
  youth_id INTEGER NOT NULL REFERENCES youth_profiles(id),
  role TEXT NOT NULL DEFAULT 'Member',
  join_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (business_id, youth_id)
);

-- Business tracking table
CREATE TABLE business_tracking (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER NOT NULL,
  business_id INTEGER REFERENCES business_profiles(id),
  tracking_date DATE NOT NULL,
  tracking_month DATE NOT NULL,
  tracking_year INTEGER NOT NULL,
  projected_revenue INTEGER,
  actual_employees INTEGER,
  new_employees INTEGER,
  actual_revenue INTEGER,
  internal_revenue INTEGER,
  external_revenue INTEGER,
  actual_expenditure INTEGER,
  actual_profit INTEGER,
  prominent_market TEXT,
  new_resources JSONB DEFAULT '[]',
  all_equipment JSONB DEFAULT '[]',
  key_decisions JSONB DEFAULT '[]',
  lessons_gained JSONB DEFAULT '[]',
  business_insights TEXT,
  challenges JSONB DEFAULT '[]',
  next_steps_planned JSONB DEFAULT '[]',
  mentor_feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Mentors table
CREATE TABLE mentors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  assigned_district TEXT,
  assigned_districts JSONB NOT NULL DEFAULT '[]',
  specialization TEXT,
  bio TEXT,
  profile_picture TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mentor-business relationships table
CREATE TABLE mentor_business_relationships (
  mentor_id INTEGER NOT NULL REFERENCES mentors(id),
  business_id INTEGER NOT NULL REFERENCES business_profiles(id),
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  mentorship_focus TEXT,
  meeting_frequency TEXT DEFAULT 'Monthly',
  last_meeting_date DATE,
  next_meeting_date DATE,
  mentorship_goals JSONB DEFAULT '[]',
  mentorship_progress TEXT,
  progress_rating INTEGER,
  PRIMARY KEY (mentor_id, business_id)
);

-- Mentorship messages table
CREATE TABLE mentorship_messages (
  id SERIAL PRIMARY KEY,
  mentor_id INTEGER NOT NULL REFERENCES mentors(id),
  business_id INTEGER NOT NULL REFERENCES business_profiles(id),
  message TEXT NOT NULL,
  sender TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  category TEXT,
  is_read BOOLEAN DEFAULT FALSE
);

-- Session store table for persistent sessions
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- Create indexes for performance
CREATE INDEX idx_youth_profiles_user_id ON youth_profiles(user_id);
CREATE INDEX idx_youth_profiles_district ON youth_profiles(district);
CREATE INDEX idx_business_profiles_district ON business_profiles(district);
CREATE INDEX idx_business_tracking_business_id ON business_tracking(business_id);
CREATE INDEX idx_business_tracking_profile_id ON business_tracking(profile_id);
CREATE INDEX idx_mentors_user_id ON mentors(user_id);
CREATE INDEX idx_mentorship_messages_mentor_id ON mentorship_messages(mentor_id);
CREATE INDEX idx_mentorship_messages_business_id ON mentorship_messages(business_id);
CREATE INDEX idx_mentor_business_relationships_mentor_id ON mentor_business_relationships(mentor_id);
CREATE INDEX idx_mentor_business_relationships_business_id ON mentor_business_relationships(business_id);
CREATE INDEX idx_business_youth_relationships_business_id ON business_youth_relationships(business_id);
CREATE INDEX idx_business_youth_relationships_youth_id ON business_youth_relationships(youth_id);

-- Create admin user for initial login
INSERT INTO users (username, password, full_name, role) VALUES 
('admin', '2388001895b922c82453bb4e8b39c526ec8c8e9a50bc3621a827933c3ae4e16f.5b71d48b22fedf37b9b4eb8ba9470372', 'System Administrator', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Data normalization function to apply after data import
-- COMMENT THIS OUT if you don't want it to run immediately

-- Update assigned_districts to include the district from assigned_district field
UPDATE mentors 
SET assigned_districts = json_build_array(assigned_district)::jsonb 
WHERE assigned_districts = '[]'::jsonb AND assigned_district IS NOT NULL;

-- Remove "Lower Manyo" district and replace with "Lower Manya Krobo"
UPDATE mentors
SET assigned_districts = CASE 
    WHEN assigned_districts @> '"Lower Manyo"'::jsonb THEN 
        jsonb_set(
            assigned_districts, 
            array[array_position(array(select jsonb_array_elements_text(assigned_districts)), 'Lower Manyo')::text], 
            '"Lower Manya Krobo"'
        )
    ELSE assigned_districts
END
WHERE assigned_districts @> '"Lower Manyo"'::jsonb;

-- Comment line below after first run
-- SELECT 'Database setup complete.' as result;