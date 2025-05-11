-- Add last_login column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;