-- Update barber_sites_public view to include business contact info
-- Phone and address are intentionally public for published business sites
DROP VIEW IF EXISTS public.barber_sites_public;

CREATE OR REPLACE VIEW public.barber_sites_public
WITH (security_invoker = on) AS
SELECT 
  id,
  slug,
  title,
  description,
  theme,
  city,
  phone,    -- Business phone is public for published sites
  address,  -- Business address is public for published sites
  seo_data,
  site_content,
  published,
  created_at,
  updated_at
  -- Explicitly excludes: user_id (internal identifier)
FROM public.barber_sites
WHERE published = true;

-- Re-grant access
GRANT SELECT ON public.barber_sites_public TO anon, authenticated;

COMMENT ON VIEW public.barber_sites_public IS 'Public view of published barber sites. Excludes user_id but includes business contact info (phone, address).';