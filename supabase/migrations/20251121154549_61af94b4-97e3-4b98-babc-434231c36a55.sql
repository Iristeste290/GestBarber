-- Adicionar campo api_url à tabela whatsapp_settings para armazenar a URL da API
ALTER TABLE public.whatsapp_settings
ADD COLUMN api_url TEXT;

-- Atualizar registros existentes com URL padrão do UltraMsg (usuários precisarão atualizar com sua instância)
UPDATE public.whatsapp_settings
SET api_url = 'https://api.ultramsg.com/instance151611/messages/chat'
WHERE api_url IS NULL;