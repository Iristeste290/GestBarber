
-- =====================================================
-- ADICIONAR POLÍTICAS DE LEITURA PÚBLICA RESTRITAS
-- Para que as views _public funcionem para agendamento anônimo
-- =====================================================

-- SERVICES: Acesso público aos serviços ativos (apenas dados básicos via view)
-- A tabela base precisa de política para que SECURITY INVOKER views funcionem
CREATE POLICY "Public can read active services for scheduling"
ON public.services FOR SELECT
TO anon
USING (is_active = true);

-- BARBERS: Já existe barbers_public view e política de bloqueio para anon
-- Criar política limitada para barbeiros ativos (necessário para joins nas views)
DROP POLICY IF EXISTS "Deny anonymous select on barbers" ON public.barbers;

CREATE POLICY "Anonymous can view active barbers basic info"
ON public.barbers FOR SELECT
TO anon
USING (is_active = true);

-- BARBER_WORK_HOURS: Permitir leitura anônima para verificar disponibilidade
CREATE POLICY "Anonymous can view work hours for scheduling"
ON public.barber_work_hours FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM barbers
    WHERE barbers.id = barber_work_hours.barber_id
    AND barbers.is_active = true
  )
);

-- BARBER_BREAKS: Permitir leitura anônima para verificar disponibilidade
CREATE POLICY "Anonymous can view breaks for scheduling"
ON public.barber_breaks FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM barbers
    WHERE barbers.id = barber_breaks.barber_id
    AND barbers.is_active = true
  )
);

-- BARBER_EXCEPTIONS: Permitir leitura anônima para verificar disponibilidade
CREATE POLICY "Anonymous can view exceptions for scheduling"
ON public.barber_exceptions FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM barbers
    WHERE barbers.id = barber_exceptions.barber_id
    AND barbers.is_active = true
  )
);
