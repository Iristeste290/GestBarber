-- Drop the view and recreate it without security_invoker for public access
DROP VIEW IF EXISTS public.barbers_by_owner_public;

-- Recreate view WITHOUT security_invoker (will use definer's permissions)
CREATE VIEW public.barbers_by_owner_public AS
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

-- Grant SELECT permissions to anon and authenticated
GRANT SELECT ON public.barbers_by_owner_public TO anon, authenticated;