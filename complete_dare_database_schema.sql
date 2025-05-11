-- DARE Youth-in-Jobs Tracker Platform Complete Database Schema

-- Drop tables if they exist (careful with this in production!)
-- The order matters for foreign key constraints
DROP TABLE IF EXISTS youth_training;
DROP TABLE IF EXISTS youth_skills;
DROP TABLE IF EXISTS certifications;
DROP TABLE IF EXISTS education;
DROP TABLE IF EXISTS mentorship_messages;
DROP TABLE IF EXISTS mentorship_meetings;
DROP TABLE IF EXISTS business_advice;
DROP TABLE IF EXISTS mentor_business_relationships;
DROP TABLE IF EXISTS business_youth_relationships;
DROP TABLE IF EXISTS equipment_inventory;
DROP TABLE IF EXISTS business_activity_log;
DROP TABLE IF EXISTS business_tracking;
DROP TABLE IF EXISTS business_profiles;
DROP TABLE IF EXISTS mentors;
DROP TABLE IF EXISTS youth_profiles;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS custom_roles;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS service_subcategories;
DROP TABLE IF EXISTS service_categories;
DROP TABLE IF EXISTS training_programs;
DROP TABLE IF EXISTS session;
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
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Roles Schema (System roles)
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_editable BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Custom Roles Schema (User-created roles)
CREATE TABLE custom_roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  created_by INTEGER
);

-- Permissions Schema
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  CONSTRAINT unique_permission UNIQUE (resource, action)
);

-- Role Permissions Schema (Junction table)
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  role TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Youth Profile Schema
CREATE TABLE youth_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  participant_code TEXT UNIQUE,
  full_name TEXT NOT NULL,
  profile_picture TEXT,
  district TEXT NOT NULL,
  town TEXT,
  phone_number TEXT,
  email TEXT,
  gender TEXT,
  marital_status TEXT,
  children_count INTEGER DEFAULT 0,
  year_of_birth INTEGER,
  age INTEGER,
  age_group TEXT,
  social_media_links JSONB DEFAULT '{}',
  core_skills TEXT,
  skill_level TEXT,
  industry_expertise TEXT,
  languages_spoken JSONB DEFAULT '[]',
  communication_style TEXT,
  years_of_experience INTEGER,
  work_history JSONB DEFAULT '[]',
  business_interest TEXT,
  employment_status TEXT,
  specific_job TEXT,
  pwd_status TEXT,
  dare_model TEXT,
  is_madam BOOLEAN DEFAULT FALSE,
  is_apprentice BOOLEAN DEFAULT FALSE,
  madam_name TEXT,
  madam_phone TEXT,
  apprentice_names JSONB DEFAULT '[]',
  apprentice_phone TEXT,
  guarantor TEXT,
  guarantor_phone TEXT,
  digital_skills TEXT,
  digital_skills_2 TEXT,
  financial_aspirations TEXT,
  dependents TEXT,
  national_id TEXT,
  training_status TEXT,
  program_status TEXT,
  
  -- Transition Framework specific fields
  transition_status TEXT DEFAULT 'Not Started',
  onboarded_to_tracker BOOLEAN DEFAULT FALSE,
  local_mentor_name TEXT,
  local_mentor_contact TEXT,
  
  -- Emergency contact information
  emergency_contact JSONB DEFAULT '{"name":"","relation":"","phone":"","email":"","address":""}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Service Categories table
CREATE TABLE service_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Service Subcategories table
CREATE TABLE service_subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES service_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Business Profiles Schema
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
  service_category_id INTEGER,
  service_subcategory_id INTEGER,
  business_start_date DATE,
  registration_status TEXT,
  registration_number TEXT,
  registration_date DATE,
  business_objectives JSONB DEFAULT '[]',
  short_term_goals JSONB DEFAULT '[]',
  target_market TEXT,
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
  business_id INTEGER NOT NULL REFERENCES business_profiles(id),
  tracking_date DATE NOT NULL,
  tracking_month DATE NOT NULL,
  tracking_year INTEGER NOT NULL,
  tracking_period TEXT NOT NULL,
  projected_sales INTEGER,
  actual_sales INTEGER,
  projected_revenue INTEGER,
  actual_revenue INTEGER,
  internal_revenue INTEGER,
  external_revenue INTEGER,
  actual_expenditure INTEGER,
  actual_profit INTEGER,
  projected_employees INTEGER,
  actual_employees INTEGER,
  new_employees INTEGER,
  permanent_employees INTEGER,
  temporary_employees INTEGER,
  male_employees INTEGER,
  female_employees INTEGER,
  contract_workers INTEGER,
  client_count INTEGER,
  prominent_market TEXT,
  new_resources JSONB DEFAULT '[]',
  all_equipment JSONB DEFAULT '[]',
  key_decisions JSONB DEFAULT '[]',
  lessons_gained JSONB DEFAULT '[]',
  business_insights TEXT,
  challenges JSONB DEFAULT '[]',
  next_steps_planned JSONB DEFAULT '[]',
  performance_rating INTEGER,
  reviewer_id INTEGER REFERENCES users(id),
  review_date DATE,
  review_notes TEXT,
  approval_status TEXT,
  approved_by_id INTEGER REFERENCES users(id),
  approval_date DATE,
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

-- Business advice table
CREATE TABLE business_advice (
  id SERIAL PRIMARY KEY,
  mentor_id INTEGER NOT NULL REFERENCES mentors(id),
  business_id INTEGER NOT NULL REFERENCES business_profiles(id),
  advice_content TEXT NOT NULL,
  category TEXT NOT NULL,
  follow_up_notes TEXT,
  implementation_status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
);

-- Mentorship meetings table
CREATE TABLE mentorship_meetings (
  id SERIAL PRIMARY KEY,
  mentor_id INTEGER NOT NULL REFERENCES mentors(id),
  business_id INTEGER NOT NULL REFERENCES business_profiles(id),
  meeting_date DATE NOT NULL,
  meeting_type TEXT NOT NULL,
  location TEXT,
  duration INTEGER,
  agenda TEXT,
  summary TEXT,
  outcomes JSONB DEFAULT '[]',
  next_steps JSONB DEFAULT '[]',
  attendees JSONB DEFAULT '[]',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Skills table
CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category_id INTEGER,
  subcategory_id INTEGER,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Youth skills junction table
CREATE TABLE youth_skills (
  youth_id INTEGER NOT NULL REFERENCES youth_profiles(id),
  skill_id INTEGER NOT NULL REFERENCES skills(id),
  proficiency TEXT DEFAULT 'Intermediate',
  is_primary BOOLEAN DEFAULT FALSE,
  years_of_experience INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  PRIMARY KEY (youth_id, skill_id)
);

-- Education table
CREATE TABLE education (
  id SERIAL PRIMARY KEY,
  youth_id INTEGER NOT NULL REFERENCES youth_profiles(id),
  highest_qualification TEXT,
  specialization TEXT,
  highest_level_completed TEXT,
  institution TEXT,
  graduation_year INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Training Programs table
CREATE TABLE training_programs (
  id SERIAL PRIMARY KEY,
  program_name TEXT NOT NULL,
  description TEXT,
  program_type TEXT,
  duration TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Youth training table
CREATE TABLE youth_training (
  id SERIAL PRIMARY KEY,
  youth_id INTEGER NOT NULL REFERENCES youth_profiles(id),
  program_id INTEGER NOT NULL REFERENCES training_programs(id),
  start_date DATE,
  completion_date DATE,
  status TEXT DEFAULT 'In Progress',
  certification_received BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Certifications table
CREATE TABLE certifications (
  id SERIAL PRIMARY KEY,
  youth_id INTEGER NOT NULL REFERENCES youth_profiles(id),
  certification_name TEXT NOT NULL,
  issuing_organization TEXT,
  issue_date DATE,
  expiry_date DATE,
  certification_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Business activity log
CREATE TABLE business_activity_log (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES business_profiles(id),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  performed_by INTEGER REFERENCES users(id),
  activity_date DATE DEFAULT CURRENT_DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Equipment inventory
CREATE TABLE equipment_inventory (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES business_profiles(id),
  equipment_name TEXT NOT NULL,
  equipment_type TEXT,
  manufacturer TEXT,
  model TEXT,
  purchase_date DATE,
  purchase_price INTEGER,
  current_value INTEGER,
  condition TEXT,
  status TEXT DEFAULT 'Active' NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Reports
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  report_period TEXT,
  start_date DATE,
  end_date DATE,
  parameters JSONB DEFAULT '{}',
  generated_by INTEGER REFERENCES users(id),
  download_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Session store table for persistent sessions
CREATE TABLE session (
  sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_youth_profiles_user_id ON youth_profiles(user_id);
CREATE INDEX idx_youth_profiles_district ON youth_profiles(district);
CREATE INDEX idx_business_profiles_district ON business_profiles(district);
CREATE INDEX idx_business_tracking_business_id ON business_tracking(business_id);
CREATE INDEX idx_mentors_user_id ON mentors(user_id);
CREATE INDEX idx_mentorship_messages_mentor_id ON mentorship_messages(mentor_id);
CREATE INDEX idx_mentorship_messages_business_id ON mentorship_messages(business_id);
CREATE INDEX idx_mentor_business_relationships_mentor_id ON mentor_business_relationships(mentor_id);
CREATE INDEX idx_mentor_business_relationships_business_id ON mentor_business_relationships(business_id);
CREATE INDEX idx_business_youth_relationships_business_id ON business_youth_relationships(business_id);
CREATE INDEX idx_business_youth_relationships_youth_id ON business_youth_relationships(youth_id);
CREATE INDEX idx_youth_training_youth_id ON youth_training(youth_id);
CREATE INDEX idx_youth_training_program_id ON youth_training(program_id);
CREATE INDEX idx_certifications_youth_id ON certifications(youth_id);
CREATE INDEX idx_education_youth_id ON education(youth_id);

-- Create admin user for initial login (password is 'admin')
INSERT INTO users (username, password, full_name, role) VALUES 
('admin', '2388001895b922c82453bb4e8b39c526ec8c8e9a50bc3621a827933c3ae4e16f.5b71d48b22fedf37b9b4eb8ba9470372', 'System Administrator', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Create an admin role
INSERT INTO roles (name, display_name, description, is_system, is_editable, is_active)
VALUES ('admin', 'Administrator', 'System administrator with full access', TRUE, FALSE, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Create the basic required service categories
INSERT INTO service_categories (name, description)
VALUES 
  ('Building & Construction', 'Services related to building, construction, and infrastructure'),
  ('Food & Beverage', 'Food preparation, catering, and food service businesses'),
  ('Fashion & Apparel', 'Clothing design, production, and retail'),
  ('Beauty & Wellness', 'Beauty services, cosmetics, and wellness services'),
  ('Media & Creative Arts', 'Media production, art, and creative services')
ON CONFLICT (name) DO NOTHING;

-- Create the DARE Core Skills training program
INSERT INTO training_programs (program_name, description, program_type, duration)
VALUES ('DARE Core Skills Training', 'Essential skills training for DARE participants', 'Core', '3 months')
ON CONFLICT DO NOTHING;

-- Add the session cleanup index
CREATE INDEX IDX_session_expire ON session (expire);

-- Data normalization function to apply after data import
-- COMMENT THIS OUT if you don't want it to run immediately
/*
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
*/

-- Comment line below after first run
SELECT 'Database setup complete. You can now restart the server.' as result;