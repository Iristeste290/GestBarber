-- Create support_tickets table with enhanced fields for Growth Support System
-- Only add new columns if table exists, or create fresh if not

-- Add new columns to existing support_tickets table
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS classification TEXT DEFAULT 'basic_question',
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS faturamento_30d NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS agendamentos_30d INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS taxa_retorno NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS assigned_to TEXT,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Create support_chat_messages table for storing Growth Support chat history
CREATE TABLE IF NOT EXISTS public.support_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  classification TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for support_chat_messages
CREATE POLICY "Users can view their own support messages" 
ON public.support_chat_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own support messages" 
ON public.support_chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create support_interaction_logs for tracking Start user interactions
CREATE TABLE IF NOT EXISTS public.support_interaction_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  interaction_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_interaction_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own interaction logs" 
ON public.support_interaction_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interaction logs" 
ON public.support_interaction_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_classification ON public.support_tickets(classification);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_chat_messages_user ON public.support_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_interaction_logs_user ON public.support_interaction_logs(user_id);