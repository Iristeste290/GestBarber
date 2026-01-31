-- Adicionar campos de check-in e pagamento na tabela appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'pix', 'mixed')),
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação
COMMENT ON COLUMN public.appointments.checked_in_at IS 'Quando o cliente fez check-in (chegou)';
COMMENT ON COLUMN public.appointments.payment_status IS 'Status do pagamento: pending, paid, partial, refunded';
COMMENT ON COLUMN public.appointments.payment_method IS 'Método de pagamento: cash, credit_card, debit_card, pix, mixed';
COMMENT ON COLUMN public.appointments.payment_amount IS 'Valor pago (pode ser diferente do preço do serviço)';
COMMENT ON COLUMN public.appointments.paid_at IS 'Quando o pagamento foi registrado';

-- Função para registrar check-in do cliente
CREATE OR REPLACE FUNCTION public.appointment_check_in(p_appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
BEGIN
  -- Verificar status atual
  SELECT status INTO v_current_status
  FROM appointments
  WHERE id = p_appointment_id;
  
  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Agendamento não encontrado';
  END IF;
  
  IF v_current_status IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'Não é possível fazer check-in de agendamento %', v_current_status;
  END IF;
  
  -- Atualizar para confirmado e registrar check-in
  UPDATE appointments
  SET 
    status = 'confirmed',
    checked_in_at = now()
  WHERE id = p_appointment_id;
  
  RETURN TRUE;
END;
$$;

-- Função para registrar pagamento do agendamento
CREATE OR REPLACE FUNCTION public.appointment_register_payment(
  p_appointment_id UUID,
  p_payment_method TEXT,
  p_amount NUMERIC DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appointment RECORD;
  v_service_price NUMERIC;
  v_final_amount NUMERIC;
  v_open_session_id UUID;
BEGIN
  -- Buscar agendamento
  SELECT a.*, s.price as service_price
  INTO v_appointment
  FROM appointments a
  JOIN services s ON a.service_id = s.id
  WHERE a.id = p_appointment_id;
  
  IF v_appointment IS NULL THEN
    RAISE EXCEPTION 'Agendamento não encontrado';
  END IF;
  
  IF v_appointment.status IN ('cancelled') THEN
    RAISE EXCEPTION 'Não é possível registrar pagamento de agendamento cancelado';
  END IF;
  
  -- Usar valor informado ou preço do serviço
  v_final_amount := COALESCE(p_amount, v_appointment.service_price);
  
  -- Atualizar agendamento com pagamento
  UPDATE appointments
  SET 
    payment_status = 'paid',
    payment_method = p_payment_method,
    payment_amount = v_final_amount,
    paid_at = now(),
    status = 'completed'
  WHERE id = p_appointment_id;
  
  -- Buscar sessão de caixa aberta
  SELECT id INTO v_open_session_id
  FROM cash_register_sessions
  WHERE is_open = true
  ORDER BY opened_at DESC
  LIMIT 1;
  
  -- Se tem sessão aberta, registrar transação com método de pagamento
  IF v_open_session_id IS NOT NULL THEN
    INSERT INTO cash_transactions (
      session_id,
      amount,
      transaction_type,
      description,
      appointment_id
    ) VALUES (
      v_open_session_id,
      v_final_amount,
      'entrada',
      'Pagamento (' || 
        CASE p_payment_method 
          WHEN 'cash' THEN 'Dinheiro'
          WHEN 'credit_card' THEN 'Cartão Crédito'
          WHEN 'debit_card' THEN 'Cartão Débito'
          WHEN 'pix' THEN 'PIX'
          ELSE 'Outro'
        END || ') - ' || COALESCE(v_appointment.customer_name, 'Cliente'),
      p_appointment_id
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Atualizar o trigger existente para não duplicar ao registrar pagamento
-- (o trigger add_cash_transaction_on_completion só deve rodar se não tiver payment_method)
CREATE OR REPLACE FUNCTION public.add_cash_transaction_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_price NUMERIC;
  service_name TEXT;
  client_name TEXT;
  open_session_id UUID;
BEGIN
  -- Only process if status changed to 'completed' AND payment was not already registered
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Se já tem payment_method, o pagamento foi registrado pela função appointment_register_payment
    IF NEW.payment_method IS NOT NULL THEN
      RETURN NEW;
    END IF;
    
    -- Get service price and name
    SELECT price, name INTO service_price, service_name
    FROM public.services
    WHERE id = NEW.service_id;
    
    -- Get client name
    SELECT full_name INTO client_name
    FROM public.profiles
    WHERE id = NEW.client_id;
    
    -- Find open cash register session for today
    SELECT id INTO open_session_id
    FROM public.cash_register_sessions
    WHERE is_open = true
    AND DATE(opened_at) = CURRENT_DATE
    ORDER BY opened_at DESC
    LIMIT 1;
    
    -- If no open session, create one automatically
    IF open_session_id IS NULL THEN
      INSERT INTO public.cash_register_sessions (user_id, opening_amount, is_open, opened_at)
      VALUES (NEW.client_id, 0, true, now())
      RETURNING id INTO open_session_id;
    END IF;
    
    -- Create transaction record with correct transaction_type
    INSERT INTO public.cash_transactions (
      session_id,
      amount,
      transaction_type,
      description,
      appointment_id
    )
    VALUES (
      open_session_id,
      service_price,
      'entrada',
      'Entrada por agendamento concluído - Cliente: ' || COALESCE(NEW.customer_name, client_name, 'Cliente') || ' - Serviço: ' || service_name,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;