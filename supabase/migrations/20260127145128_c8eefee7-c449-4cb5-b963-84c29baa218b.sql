
-- ===========================================
-- FIX: login_attempts_enumeration_risk
-- Remover políticas de INSERT permissivas e forçar uso da função record_login_attempt
-- ===========================================

-- Remover políticas de INSERT permissivas que permitem qualquer um inserir
DROP POLICY IF EXISTS "Allow insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "System can insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Allow service role insert on login_attempts" ON public.login_attempts;

-- Remover políticas de SELECT duplicadas/redundantes
DROP POLICY IF EXISTS "Only admins can read login attempts" ON public.login_attempts;

-- Garantir que a função record_login_attempt é a única forma de inserir
-- (já é SECURITY DEFINER, então bypassa RLS)
-- Nenhuma política de INSERT é necessária pois a função já tem privilégios elevados

-- Política de DELETE: apenas admins podem deletar (para limpeza de logs)
CREATE POLICY "Only admins can delete login attempts"
ON public.login_attempts
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política de UPDATE: ninguém pode atualizar (logs são imutáveis)
-- Não criar política = ninguém pode fazer UPDATE

-- Comentário de segurança
COMMENT ON TABLE public.login_attempts IS 'Login attempts are immutable audit logs. Insert only via record_login_attempt() function. Only admins can view/delete.';
