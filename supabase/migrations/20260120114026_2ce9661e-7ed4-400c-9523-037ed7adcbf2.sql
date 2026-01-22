
-- Drop todas as políticas existentes na tabela subscriptions para limpar
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON public.subscriptions;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias assinaturas" ON public.subscriptions;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias assinaturas" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role manages subscriptions" ON public.subscriptions;

-- Criar políticas limpas e seguras (apenas para authenticated, não public)
-- SELECT: Usuários autenticados podem ver apenas suas próprias assinaturas
CREATE POLICY "authenticated_users_select_own_subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Usuários autenticados podem criar apenas suas próprias assinaturas
CREATE POLICY "authenticated_users_insert_own_subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuários autenticados podem atualizar apenas suas próprias assinaturas
CREATE POLICY "authenticated_users_update_own_subscriptions"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role tem acesso total (para webhooks do Stripe)
CREATE POLICY "service_role_full_access_subscriptions"
ON public.subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
