-- Fix security definer view by recreating it with SECURITY INVOKER
DROP VIEW IF EXISTS public.help_article_stats;

CREATE VIEW public.help_article_stats 
WITH (security_invoker = true) AS
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