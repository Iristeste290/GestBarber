
-- =====================================================
-- 1. GOOGLE BUSINESS PROFILE INTEGRATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.google_business_connection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  business_id TEXT,
  account_name TEXT,
  location_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_connected BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.google_business_connection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own google connection"
  ON public.google_business_connection FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own google connection"
  ON public.google_business_connection FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own google connection"
  ON public.google_business_connection FOR UPDATE
  USING (auth.uid() = user_id);

-- Métricas do Google Business
CREATE TABLE IF NOT EXISTS public.google_business_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  views_count INTEGER DEFAULT 0,
  searches_count INTEGER DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  average_rating NUMERIC(2,1) DEFAULT 0,
  unanswered_reviews INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  direction_requests INTEGER DEFAULT 0,
  phone_calls INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, metric_date)
);

ALTER TABLE public.google_business_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics"
  ON public.google_business_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics"
  ON public.google_business_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 2. BARBERSHOP WEBSITE (IA Generated)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.barbershop_website (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  site_name TEXT,
  site_style TEXT DEFAULT 'moderna' CHECK (site_style IN ('classica', 'moderna', 'premium')),
  site_description TEXT,
  site_content JSONB DEFAULT '{}',
  site_url TEXT,
  whatsapp TEXT,
  address TEXT,
  photos TEXT[] DEFAULT '{}',
  services_highlight TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.barbershop_website ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own website"
  ON public.barbershop_website FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own website"
  ON public.barbershop_website FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own website"
  ON public.barbershop_website FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. CUSTOMER LOCATIONS (for Map)
-- =====================================================

-- Adicionar campos de localização na tabela de comportamento do cliente
ALTER TABLE public.client_behavior
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- Tabela para estatísticas de bairros
CREATE TABLE IF NOT EXISTS public.neighborhood_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  neighborhood TEXT NOT NULL,
  city TEXT,
  clients_count INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  avg_latitude NUMERIC(10, 7),
  avg_longitude NUMERIC(10, 7),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, neighborhood)
);

ALTER TABLE public.neighborhood_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own neighborhood stats"
  ON public.neighborhood_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own neighborhood stats"
  ON public.neighborhood_stats FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. Índices para performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_google_metrics_user_date 
  ON public.google_business_metrics(user_id, metric_date);

CREATE INDEX IF NOT EXISTS idx_client_behavior_neighborhood 
  ON public.client_behavior(user_id, neighborhood);

CREATE INDEX IF NOT EXISTS idx_neighborhood_stats_user 
  ON public.neighborhood_stats(user_id);
