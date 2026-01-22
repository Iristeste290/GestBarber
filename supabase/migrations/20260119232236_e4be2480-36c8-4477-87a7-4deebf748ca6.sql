-- ================================================================
-- SECURITY FIX: Create secure public views for barber_sites and barbers
-- These views exclude sensitive data (phone, address, user_id)
-- ================================================================

-- 1. Create secure public view for barber_sites
-- Excludes: phone, address, user_id (sensitive PII)
CREATE OR REPLACE VIEW public.barber_sites_public
WITH (security_invoker = on) AS
SELECT 
  id,
  slug,
  title,
  description,
  theme,
  city,
  seo_data,
  site_content,
  published,
  created_at,
  updated_at
  -- Explicitly excludes: phone, address, user_id
FROM public.barber_sites
WHERE published = true;

-- Grant access to the view for both anonymous and authenticated users
GRANT SELECT ON public.barber_sites_public TO anon, authenticated;

-- 2. Create secure public view for barbers
-- Excludes: user_id (internal identifier)
CREATE OR REPLACE VIEW public.barbers_public
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  specialty,
  avatar_url,
  slug,
  is_active,
  created_at
  -- Explicitly excludes: user_id, commission_percentage
FROM public.barbers
WHERE is_active = true;

-- Grant access to the view for both anonymous and authenticated users
GRANT SELECT ON public.barbers_public TO anon, authenticated;

-- 3. Drop overly permissive public SELECT policies on barber_sites
DROP POLICY IF EXISTS "Public can view published barber sites" ON barber_sites;
DROP POLICY IF EXISTS "Anyone can view published sites" ON barber_sites;
DROP POLICY IF EXISTS "Enable read access for all users" ON barber_sites;
DROP POLICY IF EXISTS "Public can read published sites" ON barber_sites;

-- Create restrictive policy - deny anonymous direct SELECT on barber_sites
CREATE POLICY "Deny anonymous select on barber_sites"
ON barber_sites FOR SELECT
TO anon
USING (false);

-- Keep owner access for authenticated users
DROP POLICY IF EXISTS "Users can view own sites" ON barber_sites;
CREATE POLICY "Users can view own barber_sites"
ON barber_sites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Drop overly permissive public SELECT policies on barbers
DROP POLICY IF EXISTS "Public can view active barbers by slug or id" ON barbers;
DROP POLICY IF EXISTS "Anyone can view barbers" ON barbers;
DROP POLICY IF EXISTS "Enable read access for all users" ON barbers;
DROP POLICY IF EXISTS "Public can read barbers" ON barbers;

-- Create restrictive policy - deny anonymous direct SELECT on barbers
CREATE POLICY "Deny anonymous select on barbers"
ON barbers FOR SELECT
TO anon
USING (false);

-- Keep owner access for authenticated users (can see their own barbers)
DROP POLICY IF EXISTS "Users can view own barbers" ON barbers;
CREATE POLICY "Users can view own barbers"
ON barbers FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 5. Add comment to explain the views
COMMENT ON VIEW public.barber_sites_public IS 'Public-safe view of barber sites. Excludes phone, address, and user_id for privacy.';
COMMENT ON VIEW public.barbers_public IS 'Public-safe view of barbers. Excludes user_id and commission_percentage for security.';