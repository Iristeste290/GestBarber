-- Fix record_login_attempt function by dropping and recreating
DROP FUNCTION IF EXISTS public.record_login_attempt(text, boolean, text);

CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email text,
  p_success boolean,
  p_ip_address text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Input validation
  IF p_email IS NULL OR LENGTH(TRIM(p_email)) < 5 OR LENGTH(p_email) > 255 THEN
    RETURN; -- Silently fail for invalid emails
  END IF;
  
  -- Basic email format check
  IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN;
  END IF;
  
  -- Validate IP address if provided
  IF p_ip_address IS NOT NULL AND LENGTH(p_ip_address) > 45 THEN
    p_ip_address := LEFT(p_ip_address, 45);
  END IF;

  INSERT INTO login_attempts (email, success, ip_address)
  VALUES (LOWER(TRIM(p_email)), p_success, p_ip_address);
END;
$$;

-- Grant execute to anon for login attempts
GRANT EXECUTE ON FUNCTION public.record_login_attempt(text, boolean, text) TO anon;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(text, boolean, text) TO authenticated;