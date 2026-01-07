-- Adicionar campo para template de mensagem de agendamento
ALTER TABLE whatsapp_settings 
ADD COLUMN IF NOT EXISTS appointment_message_template TEXT DEFAULT 
'✅ *Agendamento Confirmado!*

Olá *{nome}*!

Seu agendamento foi realizado com sucesso:

👤 Barbeiro: {barbeiro}
✂️ Serviço: {servico}
📅 Data: {data}
⏰ Horário: {horario}
💰 Valor: R$ {preco}

Aguardamos você! 😊';