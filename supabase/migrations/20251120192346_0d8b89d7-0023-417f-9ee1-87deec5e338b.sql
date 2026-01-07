-- Create RPC function to create user profile
CREATE OR REPLACE FUNCTION public.create_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, barbershop_name)
  VALUES (
    auth.uid(),
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;