-- Müşteri İlk Görüşme Formu
CREATE TABLE public.client_intake_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- A) Temel Bilgiler
  business_name text,
  location text,
  sector text,
  target_audience text,
  price_segment text, -- luxury / mid / economic
  social_media_accounts jsonb, -- {instagram, tiktok, youtube}
  
  -- B) Hedefler
  three_month_goals text,
  one_year_goals text,
  
  -- C) Ana Sorunlar
  main_challenges text,
  previous_agency_experience text,
  
  -- D) İçerik Alışkanlıkları
  active_platforms text[],
  camera_comfort_level text, -- low / medium / high
  weekly_content_capacity integer,
  best_performing_video_link text,
  best_performing_video_reason text,
  content_production_bottleneck text,
  
  -- E) Konumlandırma
  desired_persona text,
  competitive_advantage text,
  desired_tone text,
  
  -- F) Operasyonel Kısıtlar
  daily_time_commitment text,
  team_support text,
  budget text,
  
  -- Mevcut Durum Röntgeni
  current_followers jsonb, -- {instagram, tiktok, youtube}
  last_30_days_performance text,
  content_frequency text,
  most_viewed_video text,
  video_quality_self_assessment text,
  used_hashtags text[],
  competitors text[],
  why_competitors_strong text,
  self_positioning text,
  swot_analysis jsonb, -- {strengths, weaknesses, opportunities, threats}
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_intake_forms_client ON public.client_intake_forms (client_id);

COMMENT ON TABLE public.client_intake_forms IS 'Müşteri ilk görüşme formu - detaylı bilgi toplama';
