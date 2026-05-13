-- Profesyonel analiz sistemi için tablolar

-- 1. Profesyonel Analiz (🟦)
CREATE TABLE IF NOT EXISTS public.professional_analysis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Mevcut durum analizi
  current_level_assessment text,
  main_bottlenecks text,
  strategic_mistakes text,
  strengths text,
  weaknesses text,
  realistic_growth_potential text,
  
  -- Meta
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. AI Profil Kartı (🟩)
CREATE TABLE IF NOT EXISTS public.ai_profile_card (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Profil kartı bileşenleri
  profile_summary text,
  positioning_strategy text,
  target_audience text,
  content_strategy text,
  opportunities text,
  risks text,
  three_month_roadmap jsonb, -- Detaylı plan
  
  -- Meta
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Gelişim Planı (🟧)
CREATE TABLE IF NOT EXISTS public.development_plan (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- 30 günlük plan
  first_30_days jsonb,
  
  -- 90 günlük plan  
  first_90_days jsonb,
  
  -- Video planı
  video_frequency text,
  content_categories jsonb,
  tone_guidelines text,
  content_themes jsonb,
  performance_targets jsonb,
  
  -- Meta
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Müşteri Sunumu (🟥)
CREATE TABLE IF NOT EXISTS public.client_presentation (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Sunum içeriği
  executive_summary text,
  current_situation_analysis text,
  strategic_recommendations text,
  action_plan text,
  expected_results text,
  
  -- Sunum formatı
  presentation_html text, -- Hazır HTML formatı
  presentation_pdf_url text, -- PDF linki (opsiyonel)
  
  -- Meta
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Rakip analizi tablosu (Selenium verileri için)
CREATE TABLE IF NOT EXISTS public.competitor_analysis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Rakip verileri
  competitors_data jsonb, -- Selenium'dan gelen veriler
  analysis_summary text, -- AI analizi
  market_positioning text,
  competitive_landscape text,
  
  -- Meta
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- İndeksler
CREATE INDEX idx_professional_analysis_client ON public.professional_analysis (client_id);
CREATE INDEX idx_ai_profile_card_client ON public.ai_profile_card (client_id);
CREATE INDEX idx_development_plan_client ON public.development_plan (client_id);
CREATE INDEX idx_client_presentation_client ON public.client_presentation (client_id);
CREATE INDEX idx_competitor_analysis_client ON public.competitor_analysis (client_id);

-- RLS politikaları (güvenlik)
ALTER TABLE public.professional_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_profile_card ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_presentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analysis ENABLE ROW LEVEL SECURITY;

-- Basit politikalar (tüm işlemler için izin)
CREATE POLICY "Enable all operations" ON public.professional_analysis FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.ai_profile_card FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.development_plan FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.client_presentation FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.competitor_analysis FOR ALL USING (true);