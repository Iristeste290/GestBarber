-- Fix critical: login_attempts exposing user emails publicly
-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.login_attempts;
DROP POLICY IF EXISTS "Allow public insert" ON public.login_attempts;
DROP POLICY IF EXISTS "Allow insert" ON public.login_attempts;
DROP POLICY IF EXISTS "Allow read" ON public.login_attempts;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.login_attempts;

-- Create restrictive policies - only admins can read login attempts
CREATE POLICY "Only admins can read login attempts"
ON public.login_attempts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow system to insert login attempts (no auth required for logging)
CREATE POLICY "System can insert login attempts"
ON public.login_attempts
FOR INSERT
WITH CHECK (true);