-- Função para criar/atualizar perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, barbershop_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'barbershop_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefone', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    barbershop_name = COALESCE(EXCLUDED.barbershop_name, profiles.barbershop_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone);
  
  RETURN NEW;
END;
$$;

-- Remove trigger antigo se existir e cria novo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();