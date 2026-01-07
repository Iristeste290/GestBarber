-- Tabela para armazenar feedback dos usuários ao final do trial
CREATE TABLE public.trial_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  liked_features TEXT[],
  improvement_suggestion TEXT,
  would_recommend BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trial_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" 
ON public.trial_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view own feedback" 
ON public.trial_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_trial_feedback_user_id ON public.trial_feedback(user_id);