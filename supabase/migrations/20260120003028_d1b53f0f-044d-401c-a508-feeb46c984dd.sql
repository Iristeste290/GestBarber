-- Fix: Remove permissive policy that exposes all login_attempts to authenticated users
-- The policy "Users can read their own attempts" with USING (true) allows any user to read ALL rows

DROP POLICY IF EXISTS "Users can read their own attempts" ON public.login_attempts;

-- Verify remaining policies are secure:
-- 1. "Deny anonymous select on login_attempts" - blocks anonymous access
-- 2. "Only admins can view login_attempts" - admin-only SELECT
-- 3. "System can insert login attempts" - allows logging