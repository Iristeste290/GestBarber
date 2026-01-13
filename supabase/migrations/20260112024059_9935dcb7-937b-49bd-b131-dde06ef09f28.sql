
-- =====================================================
-- 1. MOTOR DE SCORE DE CLIENTE
-- Adicionar campos de score à tabela client_behavior
-- =====================================================

ALTER TABLE public.client_behavior
ADD COLUMN IF NOT EXISTS customer_score INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS customer_status TEXT DEFAULT 'normal' CHECK (customer_status IN ('premium', 'normal', 'risk')),
ADD COLUMN IF NOT EXISTS months_as_client INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS attended_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rescheduled_count INTEGER DEFAULT 0;

-- =====================================================
-- 2. MOTOR DE PROTEÇÃO DE RECEITA
-- Criar tabela booking_rules
-- =====================================================

CREATE TABLE IF NOT EXISTS public.booking_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  require_confirmation BOOLEAN DEFAULT true,
  require_deposit BOOLEAN DEFAULT false,
  deposit_amount NUMERIC DEFAULT 0,
  auto_block_risk BOOLEAN DEFAULT true,
  min_score_no_confirmation INTEGER DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.booking_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own booking rules"
  ON public.booking_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own booking rules"
  ON public.booking_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own booking rules"
  ON public.booking_rules FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. MOTOR DE DINHEIRO PERDIDO
-- Criar tabela lost_revenue
-- =====================================================

CREATE TABLE IF NOT EXISTS public.lost_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  barber_id UUID REFERENCES public.barbers(id),
  appointment_id UUID,
  lost_date DATE NOT NULL DEFAULT CURRENT_DATE,
  value_lost NUMERIC NOT NULL DEFAULT 0,
  reason TEXT NOT NULL CHECK (reason IN ('no_show', 'late_cancel', 'empty_slot', 'cancelled')),
  service_name TEXT,
  slot_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lost_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lost revenue"
  ON public.lost_revenue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lost revenue"
  ON public.lost_revenue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. RANKING E PERFORMANCE
-- Criar tabela para métricas de performance
-- =====================================================

CREATE TABLE IF NOT EXISTS public.barbershop_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_revenue NUMERIC DEFAULT 0,
  occupancy_rate NUMERIC DEFAULT 0,
  retention_rate NUMERIC DEFAULT 0,
  no_show_rate NUMERIC DEFAULT 0,
  avg_ticket NUMERIC DEFAULT 0,
  performance_score INTEGER DEFAULT 50,
  performance_percentile INTEGER DEFAULT 50,
  clients_count INTEGER DEFAULT 0,
  appointments_count INTEGER DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.barbershop_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own performance"
  ON public.barbershop_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance"
  ON public.barbershop_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance"
  ON public.barbershop_performance FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. FUNÇÃO PARA CALCULAR SCORE DO CLIENTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_customer_score(
  p_attended INTEGER,
  p_no_show INTEGER,
  p_cancelled INTEGER,
  p_rescheduled INTEGER,
  p_months_as_client INTEGER,
  p_days_inactive INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_score INTEGER := 50;
BEGIN
  -- Compareceu: +5 por comparecimento (máx +50)
  v_score := v_score + LEAST(p_attended * 5, 50);
  
  -- Agendou e veio: +10 para clientes consistentes
  IF p_attended >= 5 THEN
    v_score := v_score + 10;
  END IF;
  
  -- Faltou: -20 por falta
  v_score := v_score - (p_no_show * 20);
  
  -- Cancelou: -10 por cancelamento
  v_score := v_score - (p_cancelled * 10);
  
  -- Reagendou: -3 por reagendamento
  v_score := v_score - (p_rescheduled * 3);
  
  -- Cliente há +6 meses: +10
  IF p_months_as_client >= 6 THEN
    v_score := v_score + 10;
  END IF;
  
  -- Inativo > 45 dias: -15
  IF p_days_inactive > 45 THEN
    v_score := v_score - 15;
  END IF;
  
  -- Garantir que está entre 0 e 100
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$;

-- =====================================================
-- 6. FUNÇÃO PARA DETERMINAR STATUS DO CLIENTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_customer_status(p_score INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  IF p_score >= 80 THEN
    RETURN 'premium';
  ELSIF p_score >= 50 THEN
    RETURN 'normal';
  ELSE
    RETURN 'risk';
  END IF;
END;
$$;

-- =====================================================
-- 7. TRIGGER PARA ATUALIZAR SCORE AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_customer_score_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_months INTEGER;
  v_days_inactive INTEGER;
  v_score INTEGER;
BEGIN
  -- Calcular meses como cliente
  IF NEW.last_appointment_date IS NOT NULL THEN
    v_months := EXTRACT(MONTH FROM age(now(), NEW.last_appointment_date::timestamp));
    v_days_inactive := EXTRACT(DAY FROM age(now(), NEW.last_appointment_date::timestamp));
  ELSE
    v_months := 0;
    v_days_inactive := 999;
  END IF;
  
  -- Calcular score
  v_score := calculate_customer_score(
    COALESCE(NEW.completed, 0),
    COALESCE(NEW.no_show, 0),
    COALESCE(NEW.canceled, 0),
    COALESCE(NEW.rescheduled_count, 0),
    v_months,
    v_days_inactive
  );
  
  -- Atualizar campos
  NEW.customer_score := v_score;
  NEW.customer_status := get_customer_status(v_score);
  NEW.months_as_client := v_months;
  NEW.attended_count := COALESCE(NEW.completed, 0);
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_customer_score ON public.client_behavior;
CREATE TRIGGER update_customer_score
  BEFORE INSERT OR UPDATE ON public.client_behavior
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_score_trigger();

-- =====================================================
-- 8. TRIGGER PARA REGISTRAR DINHEIRO PERDIDO
-- =====================================================

CREATE OR REPLACE FUNCTION public.record_lost_revenue_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_service_price NUMERIC;
  v_service_name TEXT;
  v_reason TEXT;
BEGIN
  -- Só processar mudanças de status para cancelled ou no_show
  IF NEW.status IN ('cancelled', 'no_show') AND OLD.status NOT IN ('cancelled', 'no_show', 'completed') THEN
    -- Obter user_id do barbeiro
    SELECT user_id INTO v_user_id FROM public.barbers WHERE id = NEW.barber_id;
    
    IF v_user_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Obter preço e nome do serviço
    SELECT price, name INTO v_service_price, v_service_name
    FROM public.services WHERE id = NEW.service_id;
    
    -- Determinar razão
    IF NEW.status = 'no_show' THEN
      v_reason := 'no_show';
    ELSE
      -- Verificar se foi cancelamento tardio (menos de 6 horas)
      IF NEW.appointment_date = CURRENT_DATE AND 
         (NEW.appointment_time - CURRENT_TIME) < INTERVAL '6 hours' THEN
        v_reason := 'late_cancel';
      ELSE
        v_reason := 'cancelled';
      END IF;
    END IF;
    
    -- Registrar perda
    INSERT INTO public.lost_revenue (
      user_id,
      customer_id,
      customer_name,
      customer_phone,
      barber_id,
      appointment_id,
      lost_date,
      value_lost,
      reason,
      service_name,
      slot_time
    ) VALUES (
      v_user_id,
      NEW.client_id,
      NEW.customer_name,
      NEW.customer_phone,
      NEW.barber_id,
      NEW.id,
      NEW.appointment_date,
      COALESCE(v_service_price, 0),
      v_reason,
      v_service_name,
      NEW.appointment_time
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS record_lost_revenue ON public.appointments;
CREATE TRIGGER record_lost_revenue
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.record_lost_revenue_trigger();

-- =====================================================
-- 9. ATUALIZAR SCORES EXISTENTES
-- =====================================================

UPDATE public.client_behavior
SET 
  customer_score = calculate_customer_score(
    COALESCE(completed, 0),
    COALESCE(no_show, 0),
    COALESCE(canceled, 0),
    0,
    CASE WHEN last_appointment_date IS NOT NULL 
      THEN EXTRACT(MONTH FROM age(now(), last_appointment_date::timestamp))::INTEGER
      ELSE 0 END,
    CASE WHEN last_appointment_date IS NOT NULL 
      THEN EXTRACT(DAY FROM age(now(), last_appointment_date::timestamp))::INTEGER
      ELSE 999 END
  ),
  attended_count = COALESCE(completed, 0);

UPDATE public.client_behavior
SET customer_status = get_customer_status(customer_score);
