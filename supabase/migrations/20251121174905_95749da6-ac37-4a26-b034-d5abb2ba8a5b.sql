-- Remove a constraint única que impede múltiplos horários no mesmo dia
ALTER TABLE public.barber_work_hours 
DROP CONSTRAINT IF EXISTS barber_work_hours_barber_id_weekday_key;

-- Cria função para validar sobreposição de horários
CREATE OR REPLACE FUNCTION public.check_work_hours_overlap()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Cria trigger para validar antes de inserir ou atualizar
DROP TRIGGER IF EXISTS validate_work_hours_overlap ON public.barber_work_hours;
CREATE TRIGGER validate_work_hours_overlap
  BEFORE INSERT OR UPDATE ON public.barber_work_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.check_work_hours_overlap();