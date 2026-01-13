-- =====================================================
-- SECURITY FIX: Address 3 Critical Security Issues
-- =====================================================

-- Issue 1 & 2: Fix create_appointment_safe function
-- - Remove profile creation for unauthenticated users
-- - Add rate limiting to prevent spam
-- - Keep time slot validation

CREATE OR REPLACE FUNCTION public.create_appointment_safe(
  p_barber_id UUID,
  p_service_id UUID,
  p_appointment_date DATE,
  p_appointment_time TIME,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_appointment_id UUID;
  v_is_available BOOLEAN;
  v_service_duration INTEGER;
  v_recent_bookings_hour INTEGER;
  v_recent_bookings_day INTEGER;
BEGIN
  -- SECURITY: Rate limiting - max 3 appointments per phone per hour
  SELECT COUNT(*) INTO v_recent_bookings_hour
  FROM appointments
  WHERE customer_phone = p_customer_phone
  AND created_at > (now() - INTERVAL '1 hour')
  AND status != 'cancelled';
  
  IF v_recent_bookings_hour >= 3 THEN
    RAISE EXCEPTION 'Limite de agendamentos excedido. Tente novamente mais tarde.';
  END IF;
  
  -- SECURITY: Limit bookings per phone per day
  SELECT COUNT(*) INTO v_recent_bookings_day
  FROM appointments
  WHERE customer_phone = p_customer_phone
  AND appointment_date = p_appointment_date
  AND status IN ('pending', 'confirmed');
  
  IF v_recent_bookings_day >= 2 THEN
    RAISE EXCEPTION 'Você já tem agendamentos para esta data.';
  END IF;

  -- Get service duration
  SELECT duration_minutes INTO v_service_duration
  FROM services WHERE id = p_service_id;

  IF v_service_duration IS NULL THEN
    RAISE EXCEPTION 'Serviço não encontrado';
  END IF;

  -- Check if time slot is available
  SELECT public.check_time_slot_available(
    p_barber_id,
    p_appointment_date,
    p_appointment_time,
    v_service_duration
  ) INTO v_is_available;

  IF NOT v_is_available THEN
    RAISE EXCEPTION 'Horário não disponível';
  END IF;

  -- SECURITY FIX: Only use authenticated user's profile if logged in
  -- For guest bookings, use NULL client_id (we'll make it nullable)
  -- The customer_name and customer_phone fields store guest info
  IF auth.uid() IS NOT NULL THEN
    v_client_id := auth.uid();
  ELSE
    -- For guest bookings, try to find existing profile by phone
    SELECT id INTO v_client_id
    FROM profiles
    WHERE phone = p_customer_phone
    LIMIT 1;
    
    -- If no profile found, use NULL - the appointment still has customer info
    -- DO NOT create orphaned profiles for guests
  END IF;

  -- Create the appointment
  INSERT INTO appointments (
    client_id,
    barber_id,
    service_id,
    appointment_date,
    appointment_time,
    duration_minutes,
    customer_name,
    customer_phone,
    notes,
    status
  ) VALUES (
    COALESCE(v_client_id, '00000000-0000-0000-0000-000000000000'::UUID),
    p_barber_id,
    p_service_id,
    p_appointment_date,
    p_appointment_time,
    v_service_duration,
    p_customer_name,
    p_customer_phone,
    p_notes,
    'pending'
  ) RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;

-- Issue 2: Remove overly permissive public INSERT policy on appointments
-- Force all inserts through the validated RPC function
DROP POLICY IF EXISTS "Qualquer um pode criar agendamentos" ON public.appointments;

-- Issue 3: Fix profiles public exposure
-- Remove the policy that exposes ALL profile data
DROP POLICY IF EXISTS "Public can view barbershop info" ON public.profiles;

-- Create a more restrictive policy that only exposes active barbershop info
-- This allows public booking pages to work while protecting personal data
CREATE POLICY "Public can view active barbershop profiles"
ON public.profiles
FOR SELECT
USING (
  activation_completed = true
  AND barbershop_name IS NOT NULL
  AND barbershop_name != ''
);

-- Ensure the profiles table RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;