-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'client', 'barber');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::public.app_role
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Update appointments RLS policies FIRST (before dropping role column)
DROP POLICY IF EXISTS "Usuários podem atualizar seus agendamentos" ON public.appointments;
CREATE POLICY "Users can update own appointments or admins can update all"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Usuários podem deletar seus agendamentos" ON public.appointments;
CREATE POLICY "Users can delete own appointments or admins can delete all"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (auth.uid() = client_id OR public.has_role(auth.uid(), 'admin'));

-- NOW drop the role column from profiles
ALTER TABLE public.profiles DROP COLUMN role;

-- Update profiles RLS policies
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;
CREATE POLICY "Users can view own profile or admins can view all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update barbers RLS policies
DROP POLICY IF EXISTS "Apenas autenticados podem criar barbeiros" ON public.barbers;
CREATE POLICY "Only admins can create barbers"
  ON public.barbers FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Apenas autenticados podem atualizar barbeiros" ON public.barbers;
CREATE POLICY "Only admins can update barbers"
  ON public.barbers FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update services RLS policies
DROP POLICY IF EXISTS "Apenas autenticados podem criar serviços" ON public.services;
CREATE POLICY "Only admins can create services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Apenas autenticados podem atualizar serviços" ON public.services;
CREATE POLICY "Only admins can update services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update products RLS policies
DROP POLICY IF EXISTS "Apenas autenticados podem criar produtos" ON public.products;
CREATE POLICY "Only admins can create products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Apenas autenticados podem atualizar produtos" ON public.products;
CREATE POLICY "Only admins can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Apenas autenticados podem deletar produtos" ON public.products;
CREATE POLICY "Only admins can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update loyalty_rewards RLS policies
DROP POLICY IF EXISTS "Apenas autenticados podem gerenciar recompensas" ON public.loyalty_rewards;
CREATE POLICY "Only admins can manage rewards"
  ON public.loyalty_rewards FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can assign roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can modify roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update storage policies for barber-avatars bucket
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;

CREATE POLICY "Admins can insert barber avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'barber-avatars' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update barber avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'barber-avatars' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete barber avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'barber-avatars' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Barber avatars are publicly viewable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'barber-avatars');

-- Update storage policies for product-images bucket
CREATE POLICY "Admins can insert product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Product images are publicly viewable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Update handle_new_user function to assign default client role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  );
  
  -- Assign default client role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;