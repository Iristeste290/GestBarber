-- Criar tabela de metas dos barbeiros
CREATE TABLE public.barber_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  target_haircuts INTEGER NOT NULL DEFAULT 20,
  target_avg_ticket NUMERIC NOT NULL DEFAULT 50.00,
  target_product_sales NUMERIC NOT NULL DEFAULT 200.00,
  current_haircuts INTEGER NOT NULL DEFAULT 0,
  current_avg_ticket NUMERIC NOT NULL DEFAULT 0,
  current_product_sales NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(barber_id, week_start_date)
);

-- Enable RLS
ALTER TABLE public.barber_goals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Barbeiros podem ver suas próprias metas"
ON public.barber_goals
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sistema pode criar metas"
ON public.barber_goals
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Sistema pode atualizar metas"
ON public.barber_goals
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_barber_goals_updated_at
BEFORE UPDATE ON public.barber_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular progresso das metas
CREATE OR REPLACE FUNCTION public.update_barber_goals_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  goal_record RECORD;
  haircuts_count INTEGER;
  avg_ticket NUMERIC;
  product_sales NUMERIC;
BEGIN
  -- Iterar por todas as metas da semana atual
  FOR goal_record IN 
    SELECT * FROM public.barber_goals 
    WHERE week_start_date <= CURRENT_DATE 
    AND week_end_date >= CURRENT_DATE
  LOOP
    -- Contar cortes completados na semana
    SELECT COUNT(*) INTO haircuts_count
    FROM public.appointments
    WHERE barber_id = goal_record.barber_id
    AND status = 'completed'
    AND appointment_date >= goal_record.week_start_date
    AND appointment_date <= goal_record.week_end_date;
    
    -- Calcular ticket médio
    SELECT COALESCE(AVG(s.price), 0) INTO avg_ticket
    FROM public.appointments a
    JOIN public.services s ON a.service_id = s.id
    WHERE a.barber_id = goal_record.barber_id
    AND a.status = 'completed'
    AND a.appointment_date >= goal_record.week_start_date
    AND a.appointment_date <= goal_record.week_end_date;
    
    -- Calcular vendas de produtos (implementar quando houver tabela de vendas)
    product_sales := 0;
    
    -- Atualizar o registro de meta
    UPDATE public.barber_goals
    SET 
      current_haircuts = haircuts_count,
      current_avg_ticket = avg_ticket,
      current_product_sales = product_sales,
      updated_at = now()
    WHERE id = goal_record.id;
  END LOOP;
END;
$$;