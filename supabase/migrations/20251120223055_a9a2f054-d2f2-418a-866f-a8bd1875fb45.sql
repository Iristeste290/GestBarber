-- Adicionar user_id às tabelas compartilhadas
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Atualizar RLS policies para barbers
DROP POLICY IF EXISTS "Todos podem ver barbeiros" ON public.barbers;
DROP POLICY IF EXISTS "Only admins can create barbers" ON public.barbers;
DROP POLICY IF EXISTS "Only admins can update barbers" ON public.barbers;

CREATE POLICY "Users can view own barbers"
ON public.barbers FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own barbers"
ON public.barbers FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own barbers"
ON public.barbers FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own barbers"
ON public.barbers FOR DELETE
USING (user_id = auth.uid());

-- Atualizar RLS policies para services
DROP POLICY IF EXISTS "Todos podem ver serviços" ON public.services;
DROP POLICY IF EXISTS "Only admins can create services" ON public.services;
DROP POLICY IF EXISTS "Only admins can update services" ON public.services;

CREATE POLICY "Users can view own services"
ON public.services FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own services"
ON public.services FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own services"
ON public.services FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own services"
ON public.services FOR DELETE
USING (user_id = auth.uid());

-- Atualizar RLS policies para products
DROP POLICY IF EXISTS "Todos podem ver produtos ativos" ON public.products;
DROP POLICY IF EXISTS "Only admins can create products" ON public.products;
DROP POLICY IF EXISTS "Only admins can update products" ON public.products;
DROP POLICY IF EXISTS "Only admins can delete products" ON public.products;

CREATE POLICY "Users can view own products"
ON public.products FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own products"
ON public.products FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own products"
ON public.products FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own products"
ON public.products FOR DELETE
USING (user_id = auth.uid());

-- Atualizar RLS policies para appointments (garantir isolamento completo)
DROP POLICY IF EXISTS "Usuários podem ver todos os agendamentos" ON public.appointments;

CREATE POLICY "Users can view own appointments"
ON public.appointments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.barbers
    WHERE barbers.id = appointments.barber_id
    AND barbers.user_id = auth.uid()
  )
);

-- Atualizar RLS policies para product_sales
DROP POLICY IF EXISTS "Usuários autenticados podem ver vendas" ON public.product_sales;
DROP POLICY IF EXISTS "Admins e barbeiros podem criar vendas" ON public.product_sales;
DROP POLICY IF EXISTS "Admins podem atualizar vendas" ON public.product_sales;
DROP POLICY IF EXISTS "Admins podem deletar vendas" ON public.product_sales;

CREATE POLICY "Users can view own product sales"
ON public.product_sales FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.barbers
    WHERE barbers.id = product_sales.barber_id
    AND barbers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own product sales"
ON public.product_sales FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.barbers
    WHERE barbers.id = product_sales.barber_id
    AND barbers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own product sales"
ON public.product_sales FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.barbers
    WHERE barbers.id = product_sales.barber_id
    AND barbers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own product sales"
ON public.product_sales FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.barbers
    WHERE barbers.id = product_sales.barber_id
    AND barbers.user_id = auth.uid()
  )
);