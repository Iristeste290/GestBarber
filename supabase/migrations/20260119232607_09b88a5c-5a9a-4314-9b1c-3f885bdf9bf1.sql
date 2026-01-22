-- Create a view to get appointment counts by site (for social proof)
CREATE OR REPLACE VIEW public.barber_site_stats_public
WITH (security_invoker = on) AS
SELECT 
  bs.id as site_id,
  bs.slug as site_slug,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') as completed_appointments
FROM public.barber_sites bs
LEFT JOIN public.barbers b ON bs.user_id = b.user_id
LEFT JOIN public.appointments a ON b.id = a.barber_id
WHERE bs.published = true
GROUP BY bs.id, bs.slug;

-- Grant access
GRANT SELECT ON public.barber_site_stats_public TO anon, authenticated;

-- Create a function to insert leads without exposing user_id
CREATE OR REPLACE FUNCTION public.submit_barbershop_lead(
  p_site_id uuid,
  p_name text,
  p_phone text,
  p_source text DEFAULT 'website'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user_id from site_id
  SELECT user_id INTO v_user_id
  FROM barber_sites
  WHERE id = p_site_id AND published = true;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Site not found or not published';
  END IF;
  
  -- Insert the lead
  INSERT INTO barbershop_leads (user_id, site_id, name, phone, source)
  VALUES (v_user_id, p_site_id, p_name, p_phone, p_source);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.submit_barbershop_lead(uuid, text, text, text) TO anon, authenticated;

COMMENT ON VIEW public.barber_site_stats_public IS 'Public view of site statistics (appointment counts) for social proof.';
COMMENT ON FUNCTION public.submit_barbershop_lead IS 'Function to submit leads without exposing user_id.';