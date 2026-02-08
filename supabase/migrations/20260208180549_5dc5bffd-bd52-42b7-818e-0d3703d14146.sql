-- Security hardening for public booking: remove direct anonymous access to barbers/services,
-- and eliminate SECURITY DEFINER views by switching barbers_by_owner_public to security_invoker.

-- 1) Helper: allow RLS policies to check if a barber is active without granting anon SELECT on barbers
CREATE OR REPLACE FUNCTION public.is_barber_active(p_barber_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.barbers b
    WHERE b.id = p_barber_id
      AND b.is_active = true
  );
$$;

-- 2) PROFILES: remove confusing anon SELECT policy; rely on RLS default-deny for anon
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny anonymous select on profiles" ON public.profiles;

-- 3) BARBERS: remove anonymous SELECT and tighten policies to authenticated/admin only
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anonymous can view active barbers basic info" ON public.barbers;
DROP POLICY IF EXISTS "Users can view own barbers" ON public.barbers;
DROP POLICY IF EXISTS "Users can view their own barbers" ON public.barbers;
DROP POLICY IF EXISTS "Users can create own barbers" ON public.barbers;
DROP POLICY IF EXISTS "Users can update own barbers" ON public.barbers;
DROP POLICY IF EXISTS "Users can delete own barbers or barbers without user_id" ON public.barbers;
DROP POLICY IF EXISTS "Usuários podem gerenciar seus barbeiros" ON public.barbers;

CREATE POLICY "Authenticated can read own barbers"
ON public.barbers
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Authenticated can insert barbers"
ON public.barbers
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Authenticated can update own barbers"
ON public.barbers
FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  (user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Authenticated can delete own barbers"
ON public.barbers
FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Explicit deny for anon (defense-in-depth)
CREATE POLICY "Deny anonymous select on barbers"
ON public.barbers
FOR SELECT
TO anon
USING (false);

-- 4) SERVICES: remove anonymous SELECT and tighten policies to authenticated/admin only
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active services for scheduling" ON public.services;
DROP POLICY IF EXISTS "Users can view own services" ON public.services;
DROP POLICY IF EXISTS "Users can create own services" ON public.services;
DROP POLICY IF EXISTS "Users can update own services" ON public.services;
DROP POLICY IF EXISTS "Users can delete own services" ON public.services;
DROP POLICY IF EXISTS "Usuários podem gerenciar seus serviços" ON public.services;

CREATE POLICY "Authenticated can read own services"
ON public.services
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Authenticated can insert services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Authenticated can update own services"
ON public.services
FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  (user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Authenticated can delete own services"
ON public.services
FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Explicit deny for anon (defense-in-depth)
CREATE POLICY "Deny anonymous select on services"
ON public.services
FOR SELECT
TO anon
USING (false);

-- 5) Scheduling tables: keep anonymous scheduling possible without granting anon SELECT on barbers
-- Replace anon SELECT policies that depended on selecting from barbers.

-- Work hours
DROP POLICY IF EXISTS "Anonymous can view work hours for scheduling" ON public.barber_work_hours;
CREATE POLICY "Anonymous can view work hours for scheduling"
ON public.barber_work_hours
FOR SELECT
TO anon
USING (public.is_barber_active(barber_id));

-- Breaks
DROP POLICY IF EXISTS "Anonymous can view breaks for scheduling" ON public.barber_breaks;
CREATE POLICY "Anonymous can view breaks for scheduling"
ON public.barber_breaks
FOR SELECT
TO anon
USING (public.is_barber_active(barber_id));

-- Exceptions
DROP POLICY IF EXISTS "Anonymous can view exceptions for scheduling" ON public.barber_exceptions;
CREATE POLICY "Anonymous can view exceptions for scheduling"
ON public.barber_exceptions
FOR SELECT
TO anon
USING (public.is_barber_active(barber_id));

-- 6) View: eliminate SECURITY DEFINER view by recreating with security_invoker enabled
DROP VIEW IF EXISTS public.barbers_by_owner_public;
CREATE VIEW public.barbers_by_owner_public
WITH (security_invoker=on)
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
  JOIN public.profiles p ON p.id = b.user_id
  WHERE b.is_active = true;

GRANT SELECT ON public.barbers_by_owner_public TO authenticated;
