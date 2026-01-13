-- Criar tabela barber_sites para sites das barbearias
CREATE TABLE public.barber_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT DEFAULT 'moderna',
  city TEXT,
  phone TEXT,
  address TEXT,
  seo_data JSONB DEFAULT '{}',
  site_content JSONB DEFAULT '{}',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.barber_sites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sites
CREATE POLICY "Users can view their own sites"
ON public.barber_sites
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own sites
CREATE POLICY "Users can insert their own sites"
ON public.barber_sites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sites
CREATE POLICY "Users can update their own sites"
ON public.barber_sites
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Anyone can view published sites (for public access)
CREATE POLICY "Anyone can view published sites"
ON public.barber_sites
FOR SELECT
USING (published = true);

-- Create index for slug lookups
CREATE INDEX idx_barber_sites_slug ON public.barber_sites(slug);
CREATE INDEX idx_barber_sites_user_id ON public.barber_sites(user_id);

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION public.generate_site_slug(site_title TEXT)
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
  base_slug := lower(site_title);
  base_slug := translate(base_slug, 
    'àáâãäåāăąèéêëēĕėęěìíîïĩīĭįıòóôõöōŏőùúûüũūŭůçćĉċčñńņňśŝşšžźżþÿýŵœæß',
    'aaaaaaaaaeeeeeeeeeiiiiiiiiioooooooouuuuuuuuccccccnnnnsssszzzzpyywoeab');
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.barber_sites WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_barber_sites_updated_at
BEFORE UPDATE ON public.barber_sites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();