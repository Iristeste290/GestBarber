-- Atualizar tabela de assinaturas para incluir campos do Stripe
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- Atualizar plan_type para os novos valores
ALTER TABLE public.subscriptions
ALTER COLUMN plan_type TYPE text;

-- Criar função para atribuir plano freemium automaticamente
CREATE OR REPLACE FUNCTION public.ensure_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário já tem uma assinatura
  IF NOT EXISTS (
    SELECT 1 FROM public.subscriptions WHERE user_id = NEW.id
  ) THEN
    -- Criar assinatura freemium
    INSERT INTO public.subscriptions (user_id, plan_type, status, start_date, end_date)
    VALUES (
      NEW.id,
      'freemium',
      'active',
      now(),
      now() + INTERVAL '365 days' -- Freemium não expira
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger para atribuir freemium automaticamente
DROP TRIGGER IF EXISTS on_user_created_subscription ON auth.users;
CREATE TRIGGER on_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_subscription();

-- Adicionar RLS policies para subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);