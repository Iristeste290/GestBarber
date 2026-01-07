-- Verificar e adicionar tabelas ao realtime que ainda não estão
DO $$
BEGIN
  -- Tentar adicionar cada tabela, ignorando erros se já existir
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_register_sessions;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_transactions;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.barber_goals;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;