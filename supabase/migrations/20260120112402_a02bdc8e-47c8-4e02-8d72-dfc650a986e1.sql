-- Tabela de benchmarks do setor (dados agregados de todas as barbearias)
CREATE TABLE public.sector_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL UNIQUE,
  avg_value NUMERIC NOT NULL DEFAULT 0,
  p25_value NUMERIC NOT NULL DEFAULT 0,
  p50_value NUMERIC NOT NULL DEFAULT 0,
  p75_value NUMERIC NOT NULL DEFAULT 0,
  p90_value NUMERIC NOT NULL DEFAULT 0,
  sample_size INTEGER NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir benchmarks iniciais (valores estimados do mercado de barbearias)
INSERT INTO public.sector_benchmarks (metric_name, avg_value, p25_value, p50_value, p75_value, p90_value, sample_size) VALUES
('no_show_rate', 12.5, 5.0, 10.0, 15.0, 25.0, 500),
('cancel_rate', 8.0, 3.0, 6.0, 10.0, 18.0, 500),
('occupancy_rate', 65.0, 45.0, 60.0, 75.0, 90.0, 500),
('avg_ticket', 55.0, 35.0, 50.0, 70.0, 100.0, 500),
('client_retention_rate', 60.0, 40.0, 55.0, 70.0, 85.0, 500),
('new_services_per_quarter', 2.0, 0.0, 1.0, 3.0, 5.0, 500),
('revenue_growth_monthly', 5.0, -5.0, 3.0, 8.0, 15.0, 500);

-- Enable RLS
ALTER TABLE public.sector_benchmarks ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler benchmarks (dados públicos agregados)
CREATE POLICY "Benchmarks are publicly readable"
ON public.sector_benchmarks
FOR SELECT
USING (true);

-- Tabela para histórico de receita mensal (para comparação mês a mês)
CREATE TABLE IF NOT EXISTS public.monthly_revenue_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_year TEXT NOT NULL, -- formato: 'YYYY-MM'
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  completed_appointments INTEGER NOT NULL DEFAULT 0,
  new_clients INTEGER NOT NULL DEFAULT 0,
  returning_clients INTEGER NOT NULL DEFAULT 0,
  no_show_count INTEGER NOT NULL DEFAULT 0,
  cancellation_count INTEGER NOT NULL DEFAULT 0,
  avg_ticket NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_month UNIQUE (user_id, month_year)
);

-- Enable RLS
ALTER TABLE public.monthly_revenue_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own revenue history
CREATE POLICY "Users can view own revenue history"
ON public.monthly_revenue_history
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert own revenue history
CREATE POLICY "Users can insert own revenue history"
ON public.monthly_revenue_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update own revenue history
CREATE POLICY "Users can update own revenue history"
ON public.monthly_revenue_history
FOR UPDATE
USING (auth.uid() = user_id);

-- Tabela para alertas de gatilhos programados (datas comemorativas, etc)
CREATE TABLE IF NOT EXISTS public.scheduled_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_type TEXT NOT NULL,
  trigger_name TEXT NOT NULL,
  trigger_message TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_plans TEXT[] NOT NULL DEFAULT ARRAY['start'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_triggers ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler gatilhos programados
CREATE POLICY "Scheduled triggers are publicly readable"
ON public.scheduled_triggers
FOR SELECT
USING (true);

-- Inserir gatilhos para datas comemorativas
INSERT INTO public.scheduled_triggers (trigger_type, trigger_name, trigger_message, start_date, end_date, priority) VALUES
('TRIGGER_BLACK_FRIDAY', 'Black Friday', 'Black Friday chegando! Prepare sua barbearia para o pico de demanda. O Growth automatiza promoções e gerencia a lotação.', '2026-11-20', '2026-11-30', 1),
('TRIGGER_CHRISTMAS', 'Natal', 'Época de festas! Clientes querem ficar bonitos para confraternizações. O Growth envia lembretes automáticos e preenche sua agenda.', '2026-12-15', '2026-12-31', 2),
('TRIGGER_FATHERS_DAY', 'Dia dos Pais', 'Dia dos Pais se aproxima - época de alta demanda! O Growth cria campanhas automáticas para gift cards e combos.', '2026-08-01', '2026-08-10', 2),
('TRIGGER_NEW_YEAR', 'Ano Novo', 'Virada de ano = corrida para ficar bonito! Maximize sua agenda com automações do Growth.', '2026-12-26', '2027-01-01', 2),
('TRIGGER_CARNIVAL', 'Carnaval', 'Carnaval chegando! Alta temporada para cortes e estilos. O Growth otimiza sua agenda para máxima ocupação.', '2027-02-20', '2027-03-05', 2);

-- Function para atualizar benchmarks (será chamada periodicamente)
CREATE OR REPLACE FUNCTION public.update_sector_benchmarks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_barbershops INTEGER;
  no_show_stats RECORD;
  occupancy_stats RECORD;
BEGIN
  -- Contar total de barbearias ativas
  SELECT COUNT(DISTINCT user_id) INTO total_barbershops 
  FROM barbershop_performance 
  WHERE calculated_at > NOW() - INTERVAL '30 days';

  -- Se tiver dados suficientes, atualizar benchmarks
  IF total_barbershops >= 10 THEN
    -- Atualizar no_show_rate
    SELECT 
      AVG(no_show_rate) as avg_val,
      PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY no_show_rate) as p25,
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY no_show_rate) as p50,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY no_show_rate) as p75,
      PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY no_show_rate) as p90
    INTO no_show_stats
    FROM barbershop_performance
    WHERE calculated_at > NOW() - INTERVAL '30 days'
      AND no_show_rate IS NOT NULL;

    UPDATE sector_benchmarks SET
      avg_value = COALESCE(no_show_stats.avg_val, avg_value),
      p25_value = COALESCE(no_show_stats.p25, p25_value),
      p50_value = COALESCE(no_show_stats.p50, p50_value),
      p75_value = COALESCE(no_show_stats.p75, p75_value),
      p90_value = COALESCE(no_show_stats.p90, p90_value),
      sample_size = total_barbershops,
      last_calculated_at = NOW(),
      updated_at = NOW()
    WHERE metric_name = 'no_show_rate';

    -- Atualizar occupancy_rate
    SELECT 
      AVG(occupancy_rate) as avg_val,
      PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY occupancy_rate) as p25,
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY occupancy_rate) as p50,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY occupancy_rate) as p75,
      PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY occupancy_rate) as p90
    INTO occupancy_stats
    FROM barbershop_performance
    WHERE calculated_at > NOW() - INTERVAL '30 days'
      AND occupancy_rate IS NOT NULL;

    UPDATE sector_benchmarks SET
      avg_value = COALESCE(occupancy_stats.avg_val, avg_value),
      p25_value = COALESCE(occupancy_stats.p25, p25_value),
      p50_value = COALESCE(occupancy_stats.p50, p50_value),
      p75_value = COALESCE(occupancy_stats.p75, p75_value),
      p90_value = COALESCE(occupancy_stats.p90, p90_value),
      sample_size = total_barbershops,
      last_calculated_at = NOW(),
      updated_at = NOW()
    WHERE metric_name = 'occupancy_rate';
  END IF;
END;
$$;