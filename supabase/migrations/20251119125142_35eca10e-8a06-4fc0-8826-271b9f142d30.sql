-- Criar tabela de vendas de produtos
CREATE TABLE IF NOT EXISTS public.product_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT quantity_positive CHECK (quantity > 0),
  CONSTRAINT prices_positive CHECK (unit_price >= 0 AND total_price >= 0)
);

-- Enable RLS
ALTER TABLE public.product_sales ENABLE ROW LEVEL SECURITY;

-- Policies para product_sales
CREATE POLICY "Usuários autenticados podem ver vendas"
  ON public.product_sales
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins e barbeiros podem criar vendas"
  ON public.product_sales
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'barber'::app_role)
  );

CREATE POLICY "Admins podem atualizar vendas"
  ON public.product_sales
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar vendas"
  ON public.product_sales
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar commission_percentage aos barbeiros
ALTER TABLE public.barbers 
ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC DEFAULT 10.00;

-- Trigger para atualizar estoque automaticamente após venda
CREATE OR REPLACE FUNCTION public.update_product_stock_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reduzir estoque do produto
  UPDATE public.products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  
  -- Verificar se estoque ficou negativo
  IF (SELECT stock_quantity FROM public.products WHERE id = NEW.product_id) < 0 THEN
    RAISE EXCEPTION 'Estoque insuficiente para o produto';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_product_sale_created
  AFTER INSERT ON public.product_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_stock_on_sale();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_product_sales_updated_at
  BEFORE UPDATE ON public.product_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies para notifications
CREATE POLICY "Usuários podem ver suas próprias notificações"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar notificações"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar suas próprias notificações"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias notificações"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime para product_sales e notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;