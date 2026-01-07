-- Adicionar campo is_public para permitir compartilhamento público
ALTER TABLE public.generated_posts
ADD COLUMN is_public boolean DEFAULT false;

-- Atualizar RLS policy para permitir leitura pública de posts compartilhados
CREATE POLICY "Posts públicos podem ser vistos por todos"
ON public.generated_posts
FOR SELECT
USING (is_public = true OR auth.uid() = user_id);