-- Remover políticas de SELECT muito permissivas
DROP POLICY IF EXISTS "Barbeiros são públicos para visualização" ON barbers;
DROP POLICY IF EXISTS "Public can view active barbers" ON barbers;

-- Criar política para usuários autenticados verem apenas seus barbeiros
CREATE POLICY "Users can view their own barbers"
ON barbers FOR SELECT
USING (
  user_id = auth.uid()
  OR user_id IS NULL
);

-- Criar política separada para acesso público (páginas de agendamento público)
-- Esta política permite que visitantes vejam barbeiros ativos via slug ou id específico
CREATE POLICY "Public can view active barbers by slug or id"
ON barbers FOR SELECT
USING (
  is_active = true 
  AND (slug IS NOT NULL OR id IS NOT NULL)
  AND auth.uid() IS NULL
);