-- Migration: Create video_scores table
-- Description: Teknik & Stratejik Skorlar - Her video için AI destekli kalite skoru

CREATE TABLE public.video_scores (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  video_id       uuid        NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  hook_score     smallint    CHECK (hook_score BETWEEN 0 AND 10),
  tempo_score    smallint    CHECK (tempo_score BETWEEN 0 AND 10),
  clarity_score  smallint    CHECK (clarity_score BETWEEN 0 AND 10),
  cta_score      smallint    CHECK (cta_score BETWEEN 0 AND 10),
  visual_score   smallint    CHECK (visual_score BETWEEN 0 AND 10),
  funnel_stage   text        CHECK (funnel_stage IN ('cold','warm','hot','sale')),
  main_errors    text[]      DEFAULT '{}',   -- ["hook_zayif","cta_yok"]
  ai_comment     text,                      -- kısa özet yorum
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_video_scores_video ON public.video_scores (video_id);
CREATE INDEX idx_video_scores_client ON public.video_scores (client_id);
CREATE INDEX idx_video_scores_stage ON public.video_scores (client_id, funnel_stage);

COMMENT ON TABLE public.video_scores IS 'Teknik & Stratejik Skorlar - Her video için AI destekli kalite skoru';
COMMENT ON COLUMN public.video_scores.hook_score IS 'Hook skoru (0-10): İlk 3 saniye dikkat çekme gücü';
COMMENT ON COLUMN public.video_scores.tempo_score IS 'Tempo skoru (0-10): Konuşma hızı ve ritim';
COMMENT ON COLUMN public.video_scores.clarity_score IS 'Mesaj netliği skoru (0-10): Ana mesajın anlaşılırlığı';
COMMENT ON COLUMN public.video_scores.cta_score IS 'CTA skoru (0-10): Harekete geçirme gücü';
COMMENT ON COLUMN public.video_scores.visual_score IS 'Görsel kalite skoru (0-10): Profesyonellik ve estetik';
COMMENT ON COLUMN public.video_scores.funnel_stage IS 'Funnel aşaması: cold, warm, hot, sale';
COMMENT ON COLUMN public.video_scores.main_errors IS 'Ana hatalar: hook_zayif, cta_yok vb.';
COMMENT ON COLUMN public.video_scores.ai_comment IS 'AI tarafından oluşturulan kısa özet yorum';
