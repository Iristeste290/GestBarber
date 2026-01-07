-- Fix function search_path mutable issues by ensuring all functions have SET search_path

-- Update add_loyalty_points_on_completion function
CREATE OR REPLACE FUNCTION public.add_loyalty_points_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;