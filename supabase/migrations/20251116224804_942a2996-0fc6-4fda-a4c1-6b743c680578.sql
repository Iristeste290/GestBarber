-- Criar tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuários podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar tabela de barbeiros
CREATE TABLE public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver barbeiros"
  ON public.barbers FOR SELECT
  USING (true);

CREATE POLICY "Apenas autenticados podem criar barbeiros"
  ON public.barbers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas autenticados podem atualizar barbeiros"
  ON public.barbers FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Criar tabela de serviços
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver serviços"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "Apenas autenticados podem criar serviços"
  ON public.services FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas autenticados podem atualizar serviços"
  ON public.services FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Criar tabela de agendamentos
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver todos os agendamentos"
  ON public.appointments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem criar agendamentos"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Usuários podem atualizar seus agendamentos"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Usuários podem deletar seus agendamentos"
  ON public.appointments FOR DELETE
  USING (auth.uid() = client_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Criar índices para performance
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_barber ON public.appointments(barber_id);
CREATE INDEX idx_appointments_client ON public.appointments(client_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para agendamentos
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- Inserir dados de exemplo
INSERT INTO public.barbers (name, specialty) VALUES
  ('João Silva', 'Cortes clássicos'),
  ('Pedro Santos', 'Barbas e degradês'),
  ('Carlos Oliveira', 'Cortes modernos');

INSERT INTO public.services (name, description, duration_minutes, price) VALUES
  ('Corte de Cabelo', 'Corte tradicional masculino', 30, 35.00),
  ('Barba', 'Aparar e modelar barba', 20, 25.00),
  ('Corte + Barba', 'Pacote completo', 45, 55.00),
  ('Degradê', 'Corte degradê profissional', 40, 45.00);