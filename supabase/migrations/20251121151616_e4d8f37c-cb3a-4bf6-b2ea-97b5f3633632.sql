-- Criar tabela para intervalos/pausas dos barbeiros
CREATE TABLE IF NOT EXISTS public.barber_breaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_type TEXT NOT NULL DEFAULT 'lunch',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Criar índice para melhorar performance
CREATE INDEX idx_barber_breaks_barber_weekday ON public.barber_breaks(barber_id, weekday);

-- Habilitar RLS
ALTER TABLE public.barber_breaks ENABLE ROW LEVEL SECURITY;

-- Política: Barbeiros podem gerenciar seus próprios intervalos
CREATE POLICY "Barbeiros podem gerenciar seus intervalos"
ON public.barber_breaks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.barbers
    WHERE barbers.id = barber_breaks.barber_id
    AND barbers.user_id = auth.uid()
  )
);

-- Política: Intervalos são públicos para visualização
CREATE POLICY "Intervalos são públicos"
ON public.barber_breaks
FOR SELECT
USING (true);