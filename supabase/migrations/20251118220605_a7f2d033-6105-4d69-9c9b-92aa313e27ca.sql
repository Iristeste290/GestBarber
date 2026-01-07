-- Criar tabela de sessões de caixa
CREATE TABLE IF NOT EXISTS public.cash_register_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opening_amount NUMERIC NOT NULL DEFAULT 0,
  closing_amount NUMERIC,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  is_open BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de movimentações de caixa (entradas e saídas)
CREATE TABLE IF NOT EXISTS public.cash_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.cash_register_sessions(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('entrada', 'saida')),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cash_register_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para cash_register_sessions
CREATE POLICY "Usuários podem ver suas próprias sessões de caixa"
  ON public.cash_register_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias sessões"
  ON public.cash_register_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias sessões"
  ON public.cash_register_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para cash_transactions
CREATE POLICY "Usuários podem ver transações de suas sessões"
  ON public.cash_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cash_register_sessions
      WHERE id = cash_transactions.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar transações em suas sessões"
  ON public.cash_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cash_register_sessions
      WHERE id = cash_transactions.session_id
      AND user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_cash_register_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_cash_register_sessions_updated_at
  BEFORE UPDATE ON public.cash_register_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cash_register_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cash_register_sessions_user_id ON public.cash_register_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_register_sessions_is_open ON public.cash_register_sessions(is_open);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_session_id ON public.cash_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_appointment_id ON public.cash_transactions(appointment_id);