-- Fix: Restrict barber-avatars storage policies to user-scoped paths
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar avatares" ON storage.objects;

-- Create user-scoped policies using folder structure: {user_id}/{filename}
CREATE POLICY "Users can upload avatars in their own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'barber-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update avatars in their own folder"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'barber-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete avatars in their own folder"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'barber-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);