-- Adicionar campos de trial na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'start',
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '45 days'),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';

-- Atualizar função de criação de usuário para incluir trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    barbershop_name,
    plan,
    trial_started_at,
    trial_ends_at,
    subscription_status
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email),
    COALESCE(new.raw_user_meta_data ->> 'barbershop_name', 'Minha Barbearia'),
    'start',
    now(),
    now() + interval '45 days',
    'trial'
  );
  RETURN new;
END;
$$;

-- Migrar usuários existentes que não têm trial configurado
UPDATE public.profiles 
SET 
  plan = COALESCE(plan, 'start'),
  trial_started_at = COALESCE(trial_started_at, now()),
  trial_ends_at = COALESCE(trial_ends_at, now() + interval '45 days'),
  subscription_status = CASE 
    WHEN subscription_status = 'active' THEN 'active'
    ELSE 'trial'
  END
WHERE trial_started_at IS NULL OR trial_ends_at IS NULL;