-- Migration: Create hashtag_stats table
-- Description: Hashtag Performans Tablosu - Müşteri bazlı hashtag performansını özetler

CREATE TABLE public.hashtag_stats (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  hashtag             text        NOT NULL,
  usage_count         integer     NOT NULL DEFAULT 0,      -- kaç videoda kullanılmış
  total_views         bigint      NOT NULL DEFAULT 0,
  avg_views           numeric(12,2),
  avg_engagement_rate numeric(6,4),
  last_used_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_hashtag_client ON public.hashtag_stats (client_id, hashtag);
CREATE INDEX idx_hashtag_client_usage ON public.hashtag_stats (client_id, usage_count DESC);

COMMENT ON TABLE public.hashtag_stats IS 'Hashtag Performans Tablosu - Müşteri bazlı hashtag performansını özetler';
COMMENT ON COLUMN public.hashtag_stats.usage_count IS 'Kaç videoda kullanılmış';
COMMENT ON COLUMN public.hashtag_stats.total_views IS 'Toplam izlenme sayısı';
COMMENT ON COLUMN public.hashtag_stats.avg_views IS 'Ortalama izlenme sayısı';
COMMENT ON COLUMN public.hashtag_stats.avg_engagement_rate IS 'Ortalama etkileşim oranı';
COMMENT ON COLUMN public.hashtag_stats.last_used_at IS 'Son kullanım tarihi';
