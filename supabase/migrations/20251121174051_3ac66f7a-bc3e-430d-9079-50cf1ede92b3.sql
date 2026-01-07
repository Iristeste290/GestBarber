-- Corrigir search_path nas funções
CREATE OR REPLACE FUNCTION generate_barber_slug(barber_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  base_slug := lower(barber_name);
  base_slug := translate(base_slug, 
    'àáâãäåāăąèéêëēĕėęěìíîïĩīĭįıòóôõöōŏőùúûüũūŭůçćĉċčñńņňśŝşšžźżþÿýŵœæß',
    'aaaaaaaaaeeeeeeeeeiiiiiiiiioooooooouuuuuuuuccccccnnnnsssszzzzpyywoeab');
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.barbers WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

CREATE OR REPLACE FUNCTION set_barber_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_barber_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;