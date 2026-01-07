-- Modificar tabela whatsapp_settings para formato mais simples
ALTER TABLE whatsapp_settings 
DROP COLUMN IF EXISTS access_token,
DROP COLUMN IF EXISTS phone_number_id,
DROP COLUMN IF EXISTS business_account_id;

ALTER TABLE whatsapp_settings
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS api_token TEXT;

COMMENT ON COLUMN whatsapp_settings.whatsapp_number IS 'Número do WhatsApp Business (apenas números)';
COMMENT ON COLUMN whatsapp_settings.api_token IS 'Token da API de envio (UltraMsg, Evolution API, etc)';