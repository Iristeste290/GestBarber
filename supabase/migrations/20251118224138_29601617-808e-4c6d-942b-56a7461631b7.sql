-- Create function to add cash transaction when appointment is completed
CREATE OR REPLACE FUNCTION public.add_cash_transaction_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  service_price NUMERIC;
  service_name TEXT;
  client_name TEXT;
  open_session_id UUID;
BEGIN
  -- Only process if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
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
    
    -- Create transaction record
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
      'income',
      'Entrada por agendamento concluído - Cliente: ' || client_name || ' - Serviço: ' || service_name,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS add_cash_transaction_on_appointment_completion ON public.appointments;

-- Create trigger
CREATE TRIGGER add_cash_transaction_on_appointment_completion
AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.add_cash_transaction_on_completion();