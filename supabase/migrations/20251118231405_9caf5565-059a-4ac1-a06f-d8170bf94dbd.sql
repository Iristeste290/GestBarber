-- Tabela de configurações do WhatsApp por barbearia
CREATE TABLE public.whatsapp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  business_account_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de configurações de automação por barbearia
CREATE TABLE public.automation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inactive_clients_enabled BOOLEAN NOT NULL DEFAULT false,
  inactive_clients_message TEXT NOT NULL DEFAULT 'Olá {nome}! Sentimos sua falta! Que tal agendar um horário conosco?',
  inactive_days_threshold INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de logs de automação
CREATE TABLE public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_settings
CREATE POLICY "Usuários podem ver suas próprias configurações de WhatsApp"
  ON public.whatsapp_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias configurações de WhatsApp"
  ON public.whatsapp_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias configurações de WhatsApp"
  ON public.whatsapp_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias configurações de WhatsApp"
  ON public.whatsapp_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para automation_settings
CREATE POLICY "Usuários podem ver suas próprias configurações de automação"
  ON public.automation_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias configurações de automação"
  ON public.automation_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias configurações de automação"
  ON public.automation_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas RLS para automation_logs
CREATE POLICY "Usuários podem ver seus próprios logs de automação"
  ON public.automation_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar logs de automação"
  ON public.automation_logs FOR INSERT
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_whatsapp_settings_updated_at
  BEFORE UPDATE ON public.whatsapp_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_settings_updated_at
  BEFORE UPDATE ON public.automation_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();