-- =============================================
-- GROWTH ENGINE - Sistema de Crescimento Automático
-- =============================================

-- 1️⃣ SISTEMA DE HORÁRIOS VAZIOS
CREATE TABLE public.empty_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time TIME WITHOUT TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'notified', 'filled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(barber_id, slot_date, slot_time)
);

ALTER TABLE public.empty_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own empty slots"
  ON public.empty_slots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own empty slots"
  ON public.empty_slots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2️⃣ SISTEMA DE CLIENTES PROBLEMÁTICOS
CREATE TABLE public.client_behavior (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  user_id UUID NOT NULL,
  client_name TEXT,
  client_phone TEXT,
  total_appointments INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  canceled INTEGER NOT NULL DEFAULT 0,
  no_show INTEGER NOT NULL DEFAULT 0,
  cancel_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  classification TEXT NOT NULL DEFAULT 'normal' CHECK (classification IN ('normal', 'risco', 'bloqueado')),
  last_appointment_date DATE,
  last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, user_id)
);

ALTER TABLE public.client_behavior ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own client behavior"
  ON public.client_behavior FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own client behavior"
  ON public.client_behavior FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3️⃣ MÁQUINA DE RETORNO DE CLIENTES
CREATE TABLE public.reactivation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  user_id UUID NOT NULL,
  client_name TEXT,
  client_phone TEXT,
  days_inactive INTEGER NOT NULL DEFAULT 0,
  last_appointment_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'returned')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, user_id)
);

ALTER TABLE public.reactivation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reactivation queue"
  ON public.reactivation_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own reactivation queue"
  ON public.reactivation_queue FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4️⃣ SCORE DO BARBEIRO
CREATE TABLE public.barber_score (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL,
  total_appointments INTEGER NOT NULL DEFAULT 0,
  completed_appointments INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  no_show_clients INTEGER NOT NULL DEFAULT 0,
  canceled_appointments INTEGER NOT NULL DEFAULT 0,
  cancel_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 100 CHECK (score >= 0 AND score <= 100),
  last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.barber_score ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own barber scores"
  ON public.barber_score FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own barber scores"
  ON public.barber_score FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5️⃣ ALERTAS DE DINHEIRO PERDIDO
CREATE TABLE public.money_lost_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_date DATE NOT NULL DEFAULT CURRENT_DATE,
  empty_slots_count INTEGER NOT NULL DEFAULT 0,
  cancellations_count INTEGER NOT NULL DEFAULT 0,
  no_shows_count INTEGER NOT NULL DEFAULT 0,
  estimated_loss NUMERIC(12,2) NOT NULL DEFAULT 0,
  cancel_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, alert_date)
);

ALTER TABLE public.money_lost_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own money lost alerts"
  ON public.money_lost_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own money lost alerts"
  ON public.money_lost_alerts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

-- Função para atualizar client_behavior após mudança de status do agendamento
CREATE OR REPLACE FUNCTION public.update_client_behavior_on_appointment()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_client_name TEXT;
  v_client_phone TEXT;
  v_total INTEGER;
  v_completed INTEGER;
  v_canceled INTEGER;
  v_no_show INTEGER;
  v_rate NUMERIC;
  v_class TEXT;
  v_last_date DATE;
BEGIN
  -- Get the user_id from the barber
  SELECT user_id INTO v_user_id FROM public.barbers WHERE id = NEW.barber_id;
  
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get client info
  v_client_name := NEW.customer_name;
  v_client_phone := NEW.customer_phone;

  -- Calculate totals for this client
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'cancelled'),
    COUNT(*) FILTER (WHERE status = 'no_show'),
    MAX(appointment_date) FILTER (WHERE status = 'completed')
  INTO v_total, v_completed, v_canceled, v_no_show, v_last_date
  FROM public.appointments a
  JOIN public.barbers b ON a.barber_id = b.id
  WHERE a.client_id = NEW.client_id
    AND b.user_id = v_user_id;

  -- Calculate cancel rate
  IF v_total > 0 THEN
    v_rate := ((v_canceled + v_no_show)::NUMERIC / v_total::NUMERIC) * 100;
  ELSE
    v_rate := 0;
  END IF;

  -- Determine classification
  IF v_rate >= 40 THEN
    v_class := 'bloqueado';
  ELSIF v_rate >= 20 THEN
    v_class := 'risco';
  ELSE
    v_class := 'normal';
  END IF;

  -- Upsert client behavior
  INSERT INTO public.client_behavior (
    client_id, user_id, client_name, client_phone,
    total_appointments, completed, canceled, no_show,
    cancel_rate, classification, last_appointment_date, last_update
  ) VALUES (
    NEW.client_id, v_user_id, v_client_name, v_client_phone,
    v_total, v_completed, v_canceled, v_no_show,
    v_rate, v_class, v_last_date, now()
  )
  ON CONFLICT (client_id, user_id) DO UPDATE SET
    client_name = COALESCE(EXCLUDED.client_name, client_behavior.client_name),
    client_phone = COALESCE(EXCLUDED.client_phone, client_behavior.client_phone),
    total_appointments = EXCLUDED.total_appointments,
    completed = EXCLUDED.completed,
    canceled = EXCLUDED.canceled,
    no_show = EXCLUDED.no_show,
    cancel_rate = EXCLUDED.cancel_rate,
    classification = EXCLUDED.classification,
    last_appointment_date = EXCLUDED.last_appointment_date,
    last_update = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar comportamento do cliente
CREATE TRIGGER update_client_behavior_trigger
  AFTER INSERT OR UPDATE OF status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_behavior_on_appointment();

-- Função para atualizar barber_score após mudança de status
CREATE OR REPLACE FUNCTION public.update_barber_score_on_appointment()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_total INTEGER;
  v_completed INTEGER;
  v_canceled INTEGER;
  v_no_show INTEGER;
  v_revenue NUMERIC;
  v_rate NUMERIC;
  v_score INTEGER;
BEGIN
  -- Get the user_id from the barber
  SELECT user_id INTO v_user_id FROM public.barbers WHERE id = NEW.barber_id;
  
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate totals for this barber
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'cancelled'),
    COUNT(*) FILTER (WHERE status = 'no_show')
  INTO v_total, v_completed, v_canceled, v_no_show
  FROM public.appointments
  WHERE barber_id = NEW.barber_id;

  -- Calculate revenue
  SELECT COALESCE(SUM(s.price), 0)
  INTO v_revenue
  FROM public.appointments a
  JOIN public.services s ON a.service_id = s.id
  WHERE a.barber_id = NEW.barber_id
    AND a.status = 'completed';

  -- Calculate cancel rate
  IF v_total > 0 THEN
    v_rate := (v_canceled::NUMERIC / v_total::NUMERIC) * 100;
  ELSE
    v_rate := 0;
  END IF;

  -- Calculate score: 100 - (cancel_rate * 0.5) - (no_show * 2)
  v_score := GREATEST(0, LEAST(100, 100 - (v_rate * 0.5)::INTEGER - (v_no_show * 2)));

  -- Upsert barber score
  INSERT INTO public.barber_score (
    barber_id, user_id, total_appointments, completed_appointments,
    revenue, no_show_clients, canceled_appointments, cancel_rate, score, last_update
  ) VALUES (
    NEW.barber_id, v_user_id, v_total, v_completed,
    v_revenue, v_no_show, v_canceled, v_rate, v_score, now()
  )
  ON CONFLICT (barber_id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    total_appointments = EXCLUDED.total_appointments,
    completed_appointments = EXCLUDED.completed_appointments,
    revenue = EXCLUDED.revenue,
    no_show_clients = EXCLUDED.no_show_clients,
    canceled_appointments = EXCLUDED.canceled_appointments,
    cancel_rate = EXCLUDED.cancel_rate,
    score = EXCLUDED.score,
    last_update = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar score do barbeiro
CREATE TRIGGER update_barber_score_trigger
  AFTER INSERT OR UPDATE OF status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_barber_score_on_appointment();

-- Índices para performance
CREATE INDEX idx_empty_slots_user_date ON public.empty_slots(user_id, slot_date);
CREATE INDEX idx_client_behavior_user ON public.client_behavior(user_id);
CREATE INDEX idx_client_behavior_classification ON public.client_behavior(user_id, classification);
CREATE INDEX idx_reactivation_queue_user ON public.reactivation_queue(user_id, status);
CREATE INDEX idx_barber_score_user ON public.barber_score(user_id);
CREATE INDEX idx_money_lost_alerts_user ON public.money_lost_alerts(user_id, alert_date);