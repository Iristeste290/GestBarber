-- Adicionar coluna para identificar o tipo de plano do usuário no feedback
ALTER TABLE public.trial_feedback 
ADD COLUMN plan_type text DEFAULT 'freemium';