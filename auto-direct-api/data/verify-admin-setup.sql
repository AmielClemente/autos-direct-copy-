-- Verify admin user and role setup
-- Run this in Supabase SQL Editor

-- 1. Check if admin user exists
SELECT userID, emailAddress, firstName, lastName, user_status 
FROM users 
WHERE emailAddress = 'admin@autosdirect.com.au';

-- 2. Check if admin has roles assigned
SELECT 
  u.emailAddress, 
  u.firstName,
  u.lastName,
  r.label as role
FROM users u
JOIN user_roles ur ON u.userID = ur.userID
JOIN roles r ON ur.roleID = r.roleID
WHERE u.emailAddress = 'admin@autosdirect.com.au';

-- 3. If admin doesn't have Administrator role, run this:
INSERT INTO user_roles (userRoleID, userID, roleID) 
VALUES ('ur_admin', 'c5af97c3-94ca-4026-9582-a249c55a3342', 'a18e5017-31fe-4f2b-b8c9-428c53e4159f')
ON CONFLICT (userRoleID) DO NOTHING;

-- 4. Verify all available roles
SELECT roleID, label FROM roles;

