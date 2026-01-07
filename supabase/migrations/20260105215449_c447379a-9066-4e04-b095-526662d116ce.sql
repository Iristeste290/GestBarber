-- Tabela para anúncios de novos recursos
CREATE TABLE public.feature_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT 'sparkles',
  is_premium_only BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para rastrear quais usuários viram os anúncios
CREATE TABLE public.feature_announcement_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.feature_announcements(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

-- RLS para feature_announcements (leitura pública para anúncios ativos)
ALTER TABLE public.feature_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements"
ON public.feature_announcements
FOR SELECT
USING (is_active = true);

-- RLS para feature_announcement_views
ALTER TABLE public.feature_announcement_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own announcement views"
ON public.feature_announcement_views
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark announcements as viewed"
ON public.feature_announcement_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Inserir um anúncio de exemplo
INSERT INTO public.feature_announcements (title, description, icon, is_premium_only)
VALUES (
  'Sistema de Notificações Premium',
  'Agora você recebe em primeira mão as novidades do sistema! Como usuário Premium, você tem acesso antecipado a todos os novos recursos.',
  'crown',
  true
);