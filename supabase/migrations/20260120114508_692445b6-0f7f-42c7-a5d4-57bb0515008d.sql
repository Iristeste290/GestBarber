
-- Criar view pública de exceções SEM o campo de notas pessoais
CREATE OR REPLACE VIEW public.barber_exceptions_public 
WITH (security_invoker = on) AS
SELECT 
  id, 
  barber_id, 
  date, 
  is_closed, 
  created_at
FROM public.barber_exceptions;
-- Não inclui o campo 'note' que contém informações pessoais

-- Garantir acesso à view
GRANT SELECT ON public.barber_exceptions_public TO anon, authenticated;

-- Comentário para documentação
COMMENT ON VIEW public.barber_exceptions_public IS 'View pública de exceções de barbeiros sem notas pessoais para preservar privacidade';
