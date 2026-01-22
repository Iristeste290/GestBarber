-- Create a view to link barber_sites to services without exposing user_id
CREATE OR REPLACE VIEW public.barber_site_services_public
WITH (security_invoker = on) AS
SELECT 
  bs.id as site_id,
  bs.slug as site_slug,
  s.id as service_id,
  s.name as service_name,
  s.price,
  s.description as service_description,
  s.duration_minutes,
  s.image_url as service_image_url
FROM public.barber_sites bs
INNER JOIN public.services s ON bs.user_id = s.user_id
WHERE bs.published = true AND s.is_active = true;

-- Grant access
GRANT SELECT ON public.barber_site_services_public TO anon, authenticated;

-- Create a view to link barber_sites to barbers without exposing user_id
CREATE OR REPLACE VIEW public.barber_site_barbers_public
WITH (security_invoker = on) AS
SELECT 
  bs.id as site_id,
  bs.slug as site_slug,
  b.id as barber_id,
  b.name as barber_name,
  b.slug as barber_slug,
  b.avatar_url,
  b.specialty
FROM public.barber_sites bs
INNER JOIN public.barbers b ON bs.user_id = b.user_id
WHERE bs.published = true AND b.is_active = true;

-- Grant access
GRANT SELECT ON public.barber_site_barbers_public TO anon, authenticated;

COMMENT ON VIEW public.barber_site_services_public IS 'Public view linking barber sites to services without exposing user_id.';
COMMENT ON VIEW public.barber_site_barbers_public IS 'Public view linking barber sites to barbers without exposing user_id.';