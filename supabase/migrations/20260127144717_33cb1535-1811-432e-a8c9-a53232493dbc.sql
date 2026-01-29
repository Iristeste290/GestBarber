
-- ===========================================
-- FIX 1: profiles_table_public_exposure
-- Adicionar política de DELETE para profiles (faltava)
-- ===========================================

-- Política de DELETE: apenas o próprio usuário ou admin pode deletar
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- FIX 2: appointments_customer_data_exposure
-- Criar view segura que oculta dados sensíveis de clientes
-- e fortalecer políticas de appointments
-- ===========================================

-- Remover política antiga que usa public (deveria ser authenticated)
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;

-- Política de SELECT: apenas dono da barbearia (via barber) ou o cliente pode ver
CREATE POLICY "Barbershop owners can view their appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  -- Dono da barbearia (via barbers.user_id)
  EXISTS (
    SELECT 1 FROM barbers
    WHERE barbers.id = appointments.barber_id
    AND barbers.user_id = auth.uid()
  )
  -- Ou o próprio cliente
  OR client_id = auth.uid()
  -- Ou admin
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Política de INSERT: apenas autenticados podem criar para si mesmos
DROP POLICY IF EXISTS "Users can insert appointments" ON public.appointments;
CREATE POLICY "Authenticated users can create appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  -- Cliente pode criar para si mesmo
  client_id = auth.uid()
  -- Ou dono da barbearia pode criar para qualquer cliente
  OR EXISTS (
    SELECT 1 FROM barbers
    WHERE barbers.id = appointments.barber_id
    AND barbers.user_id = auth.uid()
  )
);

-- Criar view segura para agenda pública (sem expor dados sensíveis)
CREATE OR REPLACE VIEW public.appointments_public_safe AS
SELECT 
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.barber_id,
  a.service_id,
  a.duration_minutes,
  a.status,
  -- Não expor: customer_name, customer_phone, client_id, notes
  b.name as barber_name,
  s.name as service_name,
  s.price as service_price
FROM appointments a
JOIN barbers b ON b.id = a.barber_id
JOIN services s ON s.id = a.service_id
WHERE a.status != 'cancelled';

-- Comentário de segurança
COMMENT ON VIEW public.appointments_public_safe IS 'View pública segura de agendamentos - não expõe dados de clientes';
