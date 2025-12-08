-- Migration: Create video_stats table
-- Description: Performans Metrikleri - Her videonun izlenme, beğeni, yorum vb. rakamları

CREATE TABLE public.video_stats (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  video_id            uuid        NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  snapshot_date       date        NOT NULL DEFAULT CURRENT_DATE, -- ileride çoklu snapshot'a izin verir
  views               bigint      DEFAULT 0,
  likes               bigint      DEFAULT 0,
  comments            bigint      DEFAULT 0,
  shares              bigint      DEFAULT 0,
  saves               bigint      DEFAULT 0,
  engagement_rate     numeric(6,4),        -- (likes+comments+shares+saves)/views
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_video_stats_latest ON public.video_stats (video_id, snapshot_date);
CREATE INDEX idx_video_stats_client ON public.video_stats (client_id);
CREATE INDEX idx_video_stats_client_date ON public.video_stats (client_id, snapshot_date DESC);

COMMENT ON TABLE public.video_stats IS 'Performans Metrikleri - Her videonun izlenme, beğeni, yorum vb. rakamları';
COMMENT ON COLUMN public.video_stats.snapshot_date IS 'Snapshot tarihi - ileride çoklu snapshot için kullanılabilir';
COMMENT ON COLUMN public.video_stats.engagement_rate IS 'Etkileşim oranı: (likes+comments+shares+saves)/views';
