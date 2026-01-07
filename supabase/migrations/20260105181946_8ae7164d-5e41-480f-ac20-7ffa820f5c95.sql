-- Adicionar campo para logo da barbearia na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS barbershop_logo_url text;

-- Criar bucket para logos de barbearias
INSERT INTO storage.buckets (id, name, public)
VALUES ('barbershop-logos', 'barbershop-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para visualização pública de logos
CREATE POLICY "Logos de barbearias são públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'barbershop-logos');

-- Policy para upload de logo pelo próprio usuário
CREATE POLICY "Usuários podem fazer upload de seus logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'barbershop-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy para atualização de logo pelo próprio usuário
CREATE POLICY "Usuários podem atualizar seus logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'barbershop-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy para deleção de logo pelo próprio usuário
CREATE POLICY "Usuários podem deletar seus logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'barbershop-logos' AND auth.uid()::text = (storage.foldername(name))[1]);