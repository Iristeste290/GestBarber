-- Tabela para armazenar atualizações do app
CREATE TABLE public.app_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT DEFAULT '🚀',
  version TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para rastrear visualizações de atualizações por usuário
CREATE TABLE public.app_update_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  update_id UUID NOT NULL REFERENCES public.app_updates(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, update_id)
);

-- RLS para app_updates (todos podem ler, apenas admin pode escrever)
ALTER TABLE public.app_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver atualizações ativas"
  ON public.app_updates
  FOR SELECT
  USING (is_active = true);

-- RLS para app_update_views
ALTER TABLE public.app_update_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias visualizações"
  ON public.app_update_views
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem marcar como lida"
  ON public.app_update_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_app_updates_active ON public.app_updates(is_active, created_at DESC);
CREATE INDEX idx_app_update_views_user ON public.app_update_views(user_id, update_id);

-- Inserir primeira atualização de exemplo
INSERT INTO public.app_updates (title, description, emoji, version)
VALUES (
  'Nova atualização GestBarber 20/01!',
  'Super atualização! Melhorias de segurança, correções de bugs e novo sistema de notificações de atualizações. Mais estabilidade para seu negócio!',
  '🚀',
  '1.0.0'
);