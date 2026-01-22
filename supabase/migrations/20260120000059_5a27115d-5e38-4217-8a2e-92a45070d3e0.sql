-- Tabela para rastrear tentativas de agendamento não concluídas
CREATE TABLE IF NOT EXISTS public.booking_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  step_reached TEXT NOT NULL DEFAULT 'start', -- start, date, time, service, barber, confirm
  abandoned_at TIMESTAMP WITH TIME ZONE,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para rastrear tempo em processos manuais
CREATE TABLE IF NOT EXISTS public.manual_process_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  process_type TEXT NOT NULL, -- 'manual_appointment', 'manual_payment', 'manual_reminder', 'manual_report'
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_booking_attempts_user_abandoned ON public.booking_attempts(user_id, abandoned_at) WHERE abandoned_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_booking_attempts_created ON public.booking_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_manual_process_logs_user ON public.manual_process_logs(user_id, created_at);

-- Enable RLS
ALTER TABLE public.booking_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_process_logs ENABLE ROW LEVEL SECURITY;

-- Policies para booking_attempts
CREATE POLICY "Users can view their own booking attempts" 
ON public.booking_attempts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own booking attempts" 
ON public.booking_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own booking attempts" 
ON public.booking_attempts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies para manual_process_logs
CREATE POLICY "Users can view their own manual process logs" 
ON public.manual_process_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own manual process logs" 
ON public.manual_process_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);