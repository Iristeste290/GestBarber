
-- =====================================================
-- SECURITY FIX: Corrigir exposição de dados sensíveis
-- =====================================================

-- 1. SERVICES: Remover políticas públicas excessivamente permissivas
DROP POLICY IF EXISTS "Serviços são públicos para visualização" ON public.services;
DROP POLICY IF EXISTS "Public can view active services" ON public.services;

-- Recriar view segura para serviços públicos (só dados necessários para agendamento)
DROP VIEW IF EXISTS public.services_public;
CREATE VIEW public.services_public AS
SELECT 
  s.id,
  s.name,
  s.duration_minutes,
  s.price,
  s.user_id
FROM public.services s
WHERE s.is_active = true;

-- Permitir SELECT público na view (dados mínimos para agendamento)
GRANT SELECT ON public.services_public TO anon;
GRANT SELECT ON public.services_public TO authenticated;

-- Manter serviços completos apenas para donos
CREATE POLICY "Users can view own services"
ON public.services FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- 2. BARBER_WORK_HOURS: Remover políticas públicas
DROP POLICY IF EXISTS "Horários de trabalho são públicos" ON public.barber_work_hours;
DROP POLICY IF EXISTS "Public can view barber work hours" ON public.barber_work_hours;

-- Recriar view segura para horários públicos (apenas dados necessários)
DROP VIEW IF EXISTS public.barber_work_hours_public;
CREATE VIEW public.barber_work_hours_public AS
SELECT 
  bwh.barber_id,
  bwh.weekday,
  bwh.start_time,
  bwh.end_time
FROM public.barber_work_hours bwh
JOIN public.barbers b ON b.id = bwh.barber_id
WHERE b.is_active = true;

GRANT SELECT ON public.barber_work_hours_public TO anon;
GRANT SELECT ON public.barber_work_hours_public TO authenticated;

-- Manter política para donos gerenciarem horários
CREATE POLICY "Authenticated users can view work hours"
ON public.barber_work_hours FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM barbers
    WHERE barbers.id = barber_work_hours.barber_id
    AND barbers.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3. BARBER_BREAKS: Remover políticas públicas
DROP POLICY IF EXISTS "Intervalos são públicos" ON public.barber_breaks;
DROP POLICY IF EXISTS "Public can view barber breaks" ON public.barber_breaks;

-- Recriar view segura para intervalos públicos (para agendamento)
DROP VIEW IF EXISTS public.barber_breaks_public;
CREATE VIEW public.barber_breaks_public AS
SELECT 
  bb.barber_id,
  bb.weekday,
  bb.start_time,
  bb.end_time
FROM public.barber_breaks bb
JOIN public.barbers b ON b.id = bb.barber_id
WHERE b.is_active = true;

GRANT SELECT ON public.barber_breaks_public TO anon;
GRANT SELECT ON public.barber_breaks_public TO authenticated;

-- Manter política para donos
CREATE POLICY "Authenticated users can view breaks"
ON public.barber_breaks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM barbers
    WHERE barbers.id = barber_breaks.barber_id
    AND barbers.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 4. BARBER_EXCEPTIONS: Remover políticas públicas
DROP POLICY IF EXISTS "Exceções são públicas" ON public.barber_exceptions;
DROP POLICY IF EXISTS "Public can view barber exceptions" ON public.barber_exceptions;

-- Recriar view segura para exceções públicas (sem notas pessoais)
DROP VIEW IF EXISTS public.barber_exceptions_public;
CREATE VIEW public.barber_exceptions_public AS
SELECT 
  be.barber_id,
  be.date,
  be.is_closed
FROM public.barber_exceptions be
JOIN public.barbers b ON b.id = be.barber_id
WHERE b.is_active = true;

GRANT SELECT ON public.barber_exceptions_public TO anon;
GRANT SELECT ON public.barber_exceptions_public TO authenticated;

-- Manter política para donos
CREATE POLICY "Authenticated users can view exceptions"
ON public.barber_exceptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM barbers
    WHERE barbers.id = barber_exceptions.barber_id
    AND barbers.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 5. CLIENT_BEHAVIOR: Garantir que admin tem acesso total
DROP POLICY IF EXISTS "Users can view their own client behavior" ON public.client_behavior;

CREATE POLICY "Users can view own client data or admins view all"
ON public.client_behavior FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 6. PAYMENTS: Adicionar acesso admin para faturamento
DROP POLICY IF EXISTS "Usuários podem ver seus próprios pagamentos" ON public.payments;

CREATE POLICY "Users can view own payments or admins view all"
ON public.payments FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 7. CASH_REGISTER_SESSIONS: Adicionar acesso admin
DROP POLICY IF EXISTS "Usuários podem ver suas próprias sessões de caixa" ON public.cash_register_sessions;

CREATE POLICY "Users can view own sessions or admins view all"
ON public.cash_register_sessions FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 8. CASH_TRANSACTIONS: Adicionar acesso admin
DROP POLICY IF EXISTS "Usuários podem ver transações de suas sessões" ON public.cash_transactions;

CREATE POLICY "Users can view own transactions or admins view all"
ON public.cash_transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cash_register_sessions
    WHERE cash_register_sessions.id = cash_transactions.session_id
    AND cash_register_sessions.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 9. SUBSCRIPTIONS: Adicionar acesso admin
CREATE POLICY "admins_can_view_all_subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. EXPENSES: Adicionar acesso admin
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;

CREATE POLICY "Users can view own expenses or admins view all"
ON public.expenses FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 11. PRODUCTS: Adicionar acesso admin
DROP POLICY IF EXISTS "Users can view own products" ON public.products;

CREATE POLICY "Users can view own products or admins view all"
ON public.products FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 12. PRODUCT_SALES: Adicionar acesso admin
DROP POLICY IF EXISTS "Users can view own product sales" ON public.product_sales;

CREATE POLICY "Users can view own product sales or admins view all"
ON public.product_sales FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM barbers
    WHERE barbers.id = product_sales.barber_id
    AND barbers.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);
