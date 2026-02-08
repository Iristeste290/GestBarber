-- Create a secure view for public agenda that includes user_id for filtering
-- This allows filtering barbers by barbershop owner without exposing sensitive data
CREATE OR REPLACE VIEW public.barbers_by_owner_public
WITH (security_invoker = true)
AS
SELECT 
  b.id,
  b.name,
  b.specialty,
  b.avatar_url,
  b.slug,
  b.user_id,
  p.barbershop_name,
  p.barbershop_logo_url
FROM public.barbers b
JOIN public.profiles p ON b.user_id = p.id
WHERE b.is_active = true;

-- Grant select to anon and authenticated
GRANT SELECT ON public.barbers_by_owner_public TO anon, authenticated;