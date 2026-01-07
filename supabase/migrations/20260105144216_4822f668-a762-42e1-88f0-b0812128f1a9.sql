-- Função para auto-concluir agendamentos após horário + duração
CREATE OR REPLACE FUNCTION public.auto_complete_appointments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_appointment RECORD;
  v_end_time TIMESTAMP;
BEGIN
  -- Buscar agendamentos confirmados que já passaram do horário de término
  FOR v_appointment IN 
    SELECT a.*
    FROM public.appointments a
    WHERE a.status IN ('pending', 'confirmed')
    AND a.appointment_date <= CURRENT_DATE
    AND (
      -- Se for de hoje, verificar se já passou do horário + duração + 15min de tolerância
      (a.appointment_date = CURRENT_DATE AND 
       (a.appointment_time + (a.duration_minutes || ' minutes')::INTERVAL + INTERVAL '15 minutes') < CURRENT_TIME)
      OR
      -- Se for de dias anteriores, concluir automaticamente
      a.appointment_date < CURRENT_DATE
    )
  LOOP
    -- Atualizar para concluído
    UPDATE public.appointments
    SET status = 'completed'
    WHERE id = v_appointment.id;
  END LOOP;
END;
$function$;