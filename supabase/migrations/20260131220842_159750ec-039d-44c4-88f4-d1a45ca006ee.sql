
-- =====================================================
-- FIX: Converter views para SECURITY INVOKER
-- =====================================================

-- As views precisam ser SECURITY INVOKER para respeitar RLS das tabelas base

-- 1. services_public
DROP VIEW IF EXISTS public.services_public;
CREATE VIEW public.services_public 
WITH (security_invoker = on)
AS
SELECT 
  s.id,
  s.name,
  s.duration_minutes,
  s.price,
  s.user_id
FROM public.services s
WHERE s.is_active = true;

GRANT SELECT ON public.services_public TO anon;
GRANT SELECT ON public.services_public TO authenticated;

-- 2. barber_work_hours_public
DROP VIEW IF EXISTS public.barber_work_hours_public;
CREATE VIEW public.barber_work_hours_public 
WITH (security_invoker = on)
AS
SELECT 
  bwh.barber_id,
  bwh.weekday,
  bwh.start_time,
  bwh.end_time
FROM public.barber_work_hours bwh
JOIN public.barbers b ON b.id = bwh.barber_id
WHERE b.is_active = true;

GRANT SELECT ON public.barber_work_hours_public TO anon;
GRANT SELECT ON public.barber_work_hours_public TO authenticated;

-- 3. barber_breaks_public
DROP VIEW IF EXISTS public.barber_breaks_public;
CREATE VIEW public.barber_breaks_public 
WITH (security_invoker = on)
AS
SELECT 
  bb.barber_id,
  bb.weekday,
  bb.start_time,
  bb.end_time
FROM public.barber_breaks bb
JOIN public.barbers b ON b.id = bb.barber_id
WHERE b.is_active = true;

GRANT SELECT ON public.barber_breaks_public TO anon;
GRANT SELECT ON public.barber_breaks_public TO authenticated;

-- 4. barber_exceptions_public
DROP VIEW IF EXISTS public.barber_exceptions_public;
CREATE VIEW public.barber_exceptions_public 
WITH (security_invoker = on)
AS
SELECT 
  be.barber_id,
  be.date,
  be.is_closed
FROM public.barber_exceptions be
JOIN public.barbers b ON b.id = be.barber_id
WHERE b.is_active = true;

GRANT SELECT ON public.barber_exceptions_public TO anon;
GRANT SELECT ON public.barber_exceptions_public TO authenticated;
