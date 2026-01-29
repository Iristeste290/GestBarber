
-- Corrigir a view para usar SECURITY INVOKER (padrão seguro)
-- Isso garante que as permissões do usuário que consulta são respeitadas

DROP VIEW IF EXISTS public.appointments_public_safe;

CREATE VIEW public.appointments_public_safe 
WITH (security_invoker = true)
AS
SELECT 
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.barber_id,
  a.service_id,
  a.duration_minutes,
  a.status,
  b.name as barber_name,
  s.name as service_name,
  s.price as service_price
FROM appointments a
JOIN barbers b ON b.id = a.barber_id
JOIN services s ON s.id = a.service_id
WHERE a.status != 'cancelled';

COMMENT ON VIEW public.appointments_public_safe IS 'View segura de agendamentos - não expõe dados de clientes. Usa SECURITY INVOKER para respeitar RLS.';
