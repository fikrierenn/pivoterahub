-- Migration: Create videos table
-- Description: Video kayıt tablosu - Her Instagram Reel / TikTok / YouTube Short burada tutulur

CREATE TABLE public.videos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform       text        NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  external_id    text,                 -- platformdaki id (opsiyonel)
  url            text        NOT NULL,
  published_at   timestamptz,          -- platformda yayınlandığı tarih (biliniyorsa)
  duration_sec   integer,              -- saniye
  captions       text,                 -- video açıklaması (caption)
  hashtags       text[]      DEFAULT '{}', -- ["bursaemlak","satilikev"]
  transcript     text,                 -- Whisper output
  notes          text,                 -- danışmanın ekstra notu (opsiyonel)
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_videos_client ON public.videos (client_id);
CREATE INDEX idx_videos_client_published ON public.videos (client_id, published_at DESC);
CREATE INDEX idx_videos_platform ON public.videos (platform);

COMMENT ON TABLE public.videos IS 'Video kayıt tablosu - Her Instagram Reel / TikTok / YouTube Short burada tutulur';
COMMENT ON COLUMN public.videos.platform IS 'Video platformu: instagram, tiktok, youtube';
COMMENT ON COLUMN public.videos.external_id IS 'Platformdaki video ID (opsiyonel)';
COMMENT ON COLUMN public.videos.hashtags IS 'Video hashtag listesi';
COMMENT ON COLUMN public.videos.transcript IS 'Whisper ile oluşturulan video transkripti';
