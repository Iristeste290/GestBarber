-- Adicionar coluna de template de lembrete na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reminder_template TEXT DEFAULT 'Olá {nome}! 👋

Lembrete do seu agendamento:

📅 *{data}*
🕐 *{horario}*
✂️ *{servico}*
💈 com *{barbeiro}*

Te esperamos! 😊';