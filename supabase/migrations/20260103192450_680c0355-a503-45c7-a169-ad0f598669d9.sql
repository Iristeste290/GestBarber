-- Create table for help article feedback
CREATE TABLE public.help_article_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  user_id UUID,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for analytics queries
CREATE INDEX idx_help_article_feedback_article ON public.help_article_feedback(article_id);
CREATE INDEX idx_help_article_feedback_created ON public.help_article_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE public.help_article_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (anonymous or authenticated)
CREATE POLICY "Anyone can submit feedback"
ON public.help_article_feedback
FOR INSERT
WITH CHECK (true);

-- Only admins can view feedback for analysis
CREATE POLICY "Admins can view all feedback"
ON public.help_article_feedback
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create view for aggregated feedback stats
CREATE OR REPLACE VIEW public.help_article_stats AS
SELECT 
  article_id,
  category_id,
  COUNT(*) as total_feedback,
  SUM(CASE WHEN is_helpful THEN 1 ELSE 0 END) as helpful_count,
  SUM(CASE WHEN NOT is_helpful THEN 1 ELSE 0 END) as not_helpful_count,
  ROUND(
    (SUM(CASE WHEN is_helpful THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
    1
  ) as helpful_percentage
FROM public.help_article_feedback
GROUP BY article_id, category_id
ORDER BY not_helpful_count DESC, total_feedback DESC;