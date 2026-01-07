-- Criar tabela de horários de trabalho dos barbeiros
CREATE TABLE IF NOT EXISTS public.barber_work_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(barber_id, weekday)
);

-- Criar tabela de exceções (folgas/feriados)
CREATE TABLE IF NOT EXISTS public.barber_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_closed BOOLEAN DEFAULT true,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(barber_id, date)
);

-- Adicionar campos necessários na tabela appointments se não existirem
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_barber_work_hours_barber ON public.barber_work_hours(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_exceptions_barber_date ON public.barber_exceptions(barber_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_date ON public.appointments(barber_id, appointment_date);

-- Função RPC para verificar disponibilidade de horário
CREATE OR REPLACE FUNCTION public.check_time_slot_available(
  p_barber_id UUID,
  p_date DATE,
  p_time TIME,
  p_duration_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_end_time TIME;
  v_weekday INTEGER;
  v_is_working BOOLEAN;
  v_has_exception BOOLEAN;
  v_conflict_count INTEGER;
BEGIN
  -- Calcular horário de término
  v_end_time := p_time + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Verificar dia da semana (0=domingo, 6=sábado)
  v_weekday := EXTRACT(DOW FROM p_date);
  
  -- Verificar se o barbeiro trabalha neste dia
  SELECT EXISTS(
    SELECT 1 FROM public.barber_work_hours
    WHERE barber_id = p_barber_id
    AND weekday = v_weekday
    AND start_time <= p_time
    AND end_time >= v_end_time
  ) INTO v_is_working;
  
  IF NOT v_is_working THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar exceções (folgas/feriados)
  SELECT EXISTS(
    SELECT 1 FROM public.barber_exceptions
    WHERE barber_id = p_barber_id
    AND date = p_date
    AND is_closed = true
  ) INTO v_has_exception;
  
  IF v_has_exception THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar conflitos com agendamentos existentes
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.appointments
  WHERE barber_id = p_barber_id
  AND appointment_date = p_date
  AND status NOT IN ('cancelled', 'completed')
  AND (
    -- O novo horário começa durante um agendamento existente
    (p_time >= appointment_time AND p_time < (appointment_time + (duration_minutes || ' minutes')::INTERVAL)) OR
    -- O novo horário termina durante um agendamento existente
    (v_end_time > appointment_time AND v_end_time <= (appointment_time + (duration_minutes || ' minutes')::INTERVAL)) OR
    -- O novo horário engloba completamente um agendamento existente
    (p_time <= appointment_time AND v_end_time >= (appointment_time + (duration_minutes || ' minutes')::INTERVAL))
  );
  
  RETURN v_conflict_count = 0;
END;
$$;

-- Função RPC para criar agendamento com verificação de disponibilidade
CREATE OR REPLACE FUNCTION public.create_appointment_safe(
  p_barber_id UUID,
  p_service_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_appointment_date DATE,
  p_appointment_time TIME,
  p_duration_minutes INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_available BOOLEAN;
  v_appointment_id UUID;
  v_client_id UUID;
BEGIN
  -- Verificar disponibilidade
  SELECT public.check_time_slot_available(
    p_barber_id,
    p_appointment_date,
    p_appointment_time,
    p_duration_minutes
  ) INTO v_is_available;
  
  IF NOT v_is_available THEN
    RAISE EXCEPTION 'Horário não disponível';
  END IF;
  
  -- Buscar ou criar client_id (usando o primeiro perfil encontrado ou o auth.uid() se existir)
  SELECT id INTO v_client_id FROM public.profiles LIMIT 1;
  IF v_client_id IS NULL AND auth.uid() IS NOT NULL THEN
    v_client_id := auth.uid();
  END IF;
  IF v_client_id IS NULL THEN
    -- Criar um perfil temporário para clientes públicos
    INSERT INTO public.profiles (id, full_name, phone, barbershop_name)
    VALUES (gen_random_uuid(), p_customer_name, p_customer_phone, '')
    RETURNING id INTO v_client_id;
  END IF;
  
  -- Criar agendamento
  INSERT INTO public.appointments (
    barber_id,
    service_id,
    client_id,
    customer_name,
    customer_phone,
    appointment_date,
    appointment_time,
    duration_minutes,
    status
  ) VALUES (
    p_barber_id,
    p_service_id,
    v_client_id,
    p_customer_name,
    p_customer_phone,
    p_appointment_date,
    p_appointment_time,
    p_duration_minutes,
    'pending'
  )
  RETURNING id INTO v_appointment_id;
  
  RETURN v_appointment_id;
END;
$$;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.barber_work_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_exceptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para barber_work_hours
CREATE POLICY "Horários de trabalho são públicos"
  ON public.barber_work_hours FOR SELECT
  USING (true);

CREATE POLICY "Barbeiros podem gerenciar seus horários"
  ON public.barber_work_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.barbers
      WHERE barbers.id = barber_work_hours.barber_id
      AND barbers.user_id = auth.uid()
    )
  );

-- Políticas RLS para barber_exceptions
CREATE POLICY "Exceções são públicas"
  ON public.barber_exceptions FOR SELECT
  USING (true);

CREATE POLICY "Barbeiros podem gerenciar suas exceções"
  ON public.barber_exceptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.barbers
      WHERE barbers.id = barber_exceptions.barber_id
      AND barbers.user_id = auth.uid()
    )
  );

-- Atualizar políticas de appointments para permitir inserção pública
DROP POLICY IF EXISTS "Usuários podem criar agendamentos" ON public.appointments;
CREATE POLICY "Qualquer um pode criar agendamentos"
  ON public.appointments FOR INSERT
  WITH CHECK (true);

-- Política para visualização pública de barbeiros
DROP POLICY IF EXISTS "Users can view own barbers" ON public.barbers;
CREATE POLICY "Barbeiros são públicos para visualização"
  ON public.barbers FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem gerenciar seus barbeiros"
  ON public.barbers FOR ALL
  USING (user_id = auth.uid());

-- Política para visualização pública de serviços
DROP POLICY IF EXISTS "Users can view own services" ON public.services;
CREATE POLICY "Serviços são públicos para visualização"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem gerenciar seus serviços"
  ON public.services FOR ALL
  USING (user_id = auth.uid());