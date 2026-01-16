-- Create a secure public view for barbershop information
-- This view excludes sensitive PII fields (phone, full_name, plan, trial info, etc.)
CREATE OR REPLACE VIEW public.barbershop_public_info
WITH (security_invoker = on) AS
SELECT 
  id,
  barbershop_name,
  barbershop_logo_url,
  activation_completed,
  created_at
  -- Explicitly excludes: phone, full_name, plan, subscription_status, trial_ends_at, etc.
FROM profiles
WHERE activation_completed = true
  AND barbershop_name IS NOT NULL
  AND barbershop_name != '';

-- Grant access to the view for both anonymous and authenticated users
GRANT SELECT ON public.barbershop_public_info TO anon, authenticated;

-- Drop the overly permissive public SELECT policy on profiles
DROP POLICY IF EXISTS "Public can view active barbershop profiles" ON profiles;

-- Create a new restrictive policy for profiles - only owner can SELECT their own data
-- Note: We keep the existing "Users can read own profile" policy for authenticated users
-- This removes public (anonymous) SELECT access to the profiles table entirely
CREATE POLICY "Deny anonymous select on profiles"
ON profiles FOR SELECT
TO anon
USING (false);