-- Criar bucket para avatares de barbeiros (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('barber-avatars', 'barber-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket de avatares
CREATE POLICY "Usuários autenticados podem fazer upload de avatares"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'barber-avatars');

CREATE POLICY "Avatares são publicamente acessíveis"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'barber-avatars');

CREATE POLICY "Usuários autenticados podem atualizar avatares"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'barber-avatars');

CREATE POLICY "Usuários autenticados podem deletar avatares"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'barber-avatars');