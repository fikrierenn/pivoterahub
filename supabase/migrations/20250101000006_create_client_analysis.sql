-- AI Danışman Analizi ve Profil Kartı
CREATE TABLE public.client_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  intake_form_id uuid REFERENCES public.client_intake_forms(id) ON DELETE CASCADE,
  
  -- 1) Profesyonel Analiz (Danışman Gözüyle)
  current_level_assessment text,
  main_bottlenecks text[],
  strategic_mistakes text[],
  strengths text[],
  weaknesses text[],
  realistic_growth_potential text,
  
  -- 2) AI Profil Kartı
  profile_summary text,
  positioning_statement text,
  target_audience_definition text,
  content_strategy text,
  opportunities text[],
  risks text[],
  three_month_roadmap text,
  
  -- 3) Gelişim Planı (İlk 30 + 90 Gün)
  first_30_days_plan jsonb, -- {video_count, categories, tone, themes, performance_targets}
  first_90_days_plan jsonb,
  
  -- 4) İlk Dokunuş Raporu (Müşteriye Sunulacak)
  initial_report text, -- Markdown formatında detaylı rapor
  
  -- Teknik Röntgen
  technical_assessment jsonb, -- {content_quality, consistency, technical_gaps, strategic_gaps}
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_analysis_client ON public.client_analysis (client_id);
CREATE INDEX idx_client_analysis_intake ON public.client_analysis (intake_form_id);

COMMENT ON TABLE public.client_analysis IS 'AI destekli müşteri analizi ve profil kartı';
