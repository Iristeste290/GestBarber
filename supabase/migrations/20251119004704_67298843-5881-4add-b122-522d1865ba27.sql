-- Criar tabela de posts gerados
CREATE TABLE IF NOT EXISTS public.generated_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('weekly', 'promotion', 'campaign')),
  image_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus próprios posts"
  ON public.generated_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios posts"
  ON public.generated_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios posts"
  ON public.generated_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios posts"
  ON public.generated_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_generated_posts_updated_at
  BEFORE UPDATE ON public.generated_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index para performance
CREATE INDEX idx_generated_posts_user_id ON public.generated_posts(user_id);
CREATE INDEX idx_generated_posts_type ON public.generated_posts(post_type);
CREATE INDEX idx_generated_posts_created_at ON public.generated_posts(created_at DESC);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.generated_posts;