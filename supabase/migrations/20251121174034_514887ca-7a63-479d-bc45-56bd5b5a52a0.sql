-- Adicionar coluna slug para URLs amigáveis dos barbeiros
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS slug TEXT;

-- Criar índice único para slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_barbers_slug_unique ON barbers(slug);

-- Função para gerar slug a partir do nome (sem usar unaccent)
CREATE OR REPLACE FUNCTION generate_barber_slug(barber_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Converte para minúsculas e substitui caracteres especiais
  base_slug := lower(barber_name);
  
  -- Remove acentos manualmente (principais caracteres)
  base_slug := translate(base_slug, 
    'àáâãäåāăąèéêëēĕėęěìíîïĩīĭįıòóôõöōŏőùúûüũūŭůçćĉċčñńņňśŝşšžźżþÿýŵœæß',
    'aaaaaaaaaeeeeeeeeeiiiiiiiiioooooooouuuuuuuuccccccnnnnsssszzzzpyywoeab');
  
  -- Substitui espaços e caracteres não alfanuméricos por hífens
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  
  -- Remove hífens do início e fim
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  final_slug := base_slug;
  
  -- Garante que o slug seja único
  WHILE EXISTS (SELECT 1 FROM barbers WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Trigger para gerar slug automaticamente em novos barbeiros
CREATE OR REPLACE FUNCTION set_barber_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_barber_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_barber_slug ON barbers;
CREATE TRIGGER trigger_set_barber_slug
  BEFORE INSERT OR UPDATE ON barbers
  FOR EACH ROW
  EXECUTE FUNCTION set_barber_slug();

-- Gerar slugs para barbeiros existentes
UPDATE barbers 
SET slug = generate_barber_slug(name) 
WHERE slug IS NULL;