-- Fix critical security issue: login_attempts table exposing user emails publicly
-- The login_attempts table should NOT be publicly readable as it contains sensitive user email addresses

-- First, drop any existing public SELECT policies on login_attempts
DROP POLICY IF EXISTS "Allow public read" ON login_attempts;
DROP POLICY IF EXISTS "Public can read login_attempts" ON login_attempts;
DROP POLICY IF EXISTS "Anyone can read login_attempts" ON login_attempts;
DROP POLICY IF EXISTS "Enable read access for all users" ON login_attempts;

-- Create a restrictive policy that denies anonymous access
CREATE POLICY "Deny anonymous select on login_attempts"
ON login_attempts FOR SELECT
TO anon
USING (false);

-- Create admin-only policy for authenticated users with admin role
CREATE POLICY "Only admins can view login_attempts"
ON login_attempts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Drop any existing INSERT policies that might be too permissive
DROP POLICY IF EXISTS "Allow public insert" ON login_attempts;
DROP POLICY IF EXISTS "Anyone can insert login_attempts" ON login_attempts;

-- Allow inserts only from the service role (server-side) for logging login attempts
-- The auth system should handle logging via service role, not public access
CREATE POLICY "Allow service role insert on login_attempts"
ON login_attempts FOR INSERT
TO authenticated
WITH CHECK (false);

-- Note: The actual login attempt logging should be done server-side via edge functions
-- using the service role key, not through client-side inserts