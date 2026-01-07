-- Add feedback_reason column for negative feedback explanation
ALTER TABLE public.help_article_feedback 
ADD COLUMN feedback_reason TEXT;