-- Configurar cron job para verificar clientes inativos diariamente às 09:00
-- Execute este SQL no banco de dados após configurar o WhatsApp
-- 
-- IMPORTANTE: Este arquivo usa variáveis de ambiente para segurança.
-- Antes de executar, configure a variável app.settings.anon_key no banco:
-- 
-- ALTER DATABASE postgres SET app.settings.anon_key = 'your-anon-key-here';
-- 
-- Ou use o service role key para maior segurança:
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key-here';

-- Habilitar extensões necessárias (se ainda não estiverem habilitadas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remover job existente se houver
SELECT cron.unschedule('check-inactive-clients-daily');

-- Criar job para executar todos os dias às 09:00
SELECT cron.schedule(
  'check-inactive-clients-daily',
  '0 9 * * *', -- Todo dia às 09:00 (horário UTC)
  $$
  SELECT
    net.http_post(
        url:='https://gufhndyzapnbpgikcvdb.supabase.co/functions/v1/check-inactive-clients',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.anon_key')
        ),
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Verificar jobs agendados
SELECT * FROM cron.job;
