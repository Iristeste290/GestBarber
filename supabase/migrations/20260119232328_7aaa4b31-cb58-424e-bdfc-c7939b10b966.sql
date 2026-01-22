-- Create a view that links barbers to services through user_id
-- without exposing user_id publicly
CREATE OR REPLACE VIEW public.barber_services_public
WITH (security_invoker = on) AS
SELECT 
  b.id as barber_id,
  s.id as service_id,
  s.name as service_name,
  s.duration_minutes,
  s.price,
  s.description as service_description,
  s.image_url as service_image_url
FROM public.barbers b
INNER JOIN public.services s ON b.user_id = s.user_id
WHERE b.is_active = true AND s.is_active = true;

-- Grant access to the view
GRANT SELECT ON public.barber_services_public TO anon, authenticated;

COMMENT ON VIEW public.barber_services_public IS 'Public view linking barbers to their services without exposing user_id.';

-- Also create a view for barbershop info linked by barber
CREATE OR REPLACE VIEW public.barber_barbershop_public
WITH (security_invoker = on) AS
SELECT 
  b.id as barber_id,
  p.barbershop_name,
  p.barbershop_logo_url
FROM public.barbers b
INNER JOIN public.profiles p ON b.user_id = p.id
WHERE b.is_active = true 
  AND p.activation_completed = true 
  AND p.barbershop_name IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON public.barber_barbershop_public TO anon, authenticated;

COMMENT ON VIEW public.barber_barbershop_public IS 'Public view linking barbers to their barbershop info without exposing user_id.';