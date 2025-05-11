-- Create the role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(role, resource, action)
);

-- Create an index for faster permission lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);