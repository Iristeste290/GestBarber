-- Adicionar coluna telefone na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Atualizar a função create_profile para aceitar parâmetros
CREATE OR REPLACE FUNCTION public.create_profile(
  full_name TEXT,
  telefone TEXT,
  papel TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Inserir perfil com nome e telefone
  INSERT INTO public.profiles (id, full_name, phone, barbershop_name)
  VALUES (
    auth.uid(),
    full_name,
    telefone,
    ''
  )
  ON CONFLICT (id) DO UPDATE 
  SET full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone;
  
  -- Atribuir role na tabela user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'client'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;