-- Corrige o search_path da função para segurança
CREATE OR REPLACE FUNCTION public.check_work_hours_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica se existe sobreposição de horários para o mesmo barbeiro no mesmo dia
  IF EXISTS (
    SELECT 1 
    FROM public.barber_work_hours
    WHERE barber_id = NEW.barber_id
      AND weekday = NEW.weekday
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        -- O novo horário começa durante um período existente
        (NEW.start_time >= start_time AND NEW.start_time < end_time)
        OR
        -- O novo horário termina durante um período existente
        (NEW.end_time > start_time AND NEW.end_time <= end_time)
        OR
        -- O novo horário engloba completamente um período existente
        (NEW.start_time <= start_time AND NEW.end_time >= end_time)
      )
  ) THEN
    RAISE EXCEPTION 'Horário sobrepõe com outro período já cadastrado';
  END IF;
  
  RETURN NEW;
END;
$$;