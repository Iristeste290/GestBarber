-- Create loyalty_points table to track user points balance
CREATE TABLE public.loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  available_points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create loyalty_transactions table to track all point movements
CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired')),
  description TEXT NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loyalty_rewards table for available rewards
CREATE TABLE public.loyalty_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  cashback_value NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_points
CREATE POLICY "Usuários podem ver seus próprios pontos"
ON public.loyalty_points
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios pontos"
ON public.loyalty_points
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios pontos"
ON public.loyalty_points
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for loyalty_transactions
CREATE POLICY "Usuários podem ver suas próprias transações"
ON public.loyalty_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar transações"
ON public.loyalty_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for loyalty_rewards
CREATE POLICY "Todos podem ver recompensas ativas"
ON public.loyalty_rewards
FOR SELECT
USING (is_active = true);

CREATE POLICY "Apenas autenticados podem gerenciar recompensas"
ON public.loyalty_rewards
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates on loyalty_points
CREATE TRIGGER update_loyalty_points_updated_at
BEFORE UPDATE ON public.loyalty_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to add points when appointment is completed
CREATE OR REPLACE FUNCTION public.add_loyalty_points_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  service_price NUMERIC;
  points_to_add INTEGER;
  current_points RECORD;
BEGIN
  -- Only process if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get service price
    SELECT price INTO service_price
    FROM public.services
    WHERE id = NEW.service_id;
    
    -- Calculate points (1 real = 1 point)
    points_to_add := FLOOR(service_price);
    
    -- Get or create user's loyalty points record
    SELECT * INTO current_points
    FROM public.loyalty_points
    WHERE user_id = NEW.client_id;
    
    IF current_points IS NULL THEN
      -- Create new loyalty points record
      INSERT INTO public.loyalty_points (user_id, total_points, available_points, lifetime_points)
      VALUES (NEW.client_id, points_to_add, points_to_add, points_to_add);
    ELSE
      -- Update existing record
      UPDATE public.loyalty_points
      SET 
        total_points = total_points + points_to_add,
        available_points = available_points + points_to_add,
        lifetime_points = lifetime_points + points_to_add
      WHERE user_id = NEW.client_id;
    END IF;
    
    -- Create transaction record
    INSERT INTO public.loyalty_transactions (user_id, points, transaction_type, description, appointment_id)
    VALUES (
      NEW.client_id,
      points_to_add,
      'earned',
      'Pontos ganhos pelo serviço: ' || (SELECT name FROM public.services WHERE id = NEW.service_id),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on appointments table
CREATE TRIGGER add_points_on_appointment_completion
AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.add_loyalty_points_on_completion();

-- Insert default reward (200 points = 10 reais)
INSERT INTO public.loyalty_rewards (name, description, points_required, cashback_value, is_active)
VALUES (
  'Cashback R$ 10,00',
  'Resgate 10 reais de desconto no próximo serviço',
  200,
  10.00,
  true
);