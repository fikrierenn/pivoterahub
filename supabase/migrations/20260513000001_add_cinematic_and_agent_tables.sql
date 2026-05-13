-- M-01: Sinematik analiz + FrameAgent tabloları
-- FAZ 2: cinematic_score videos tablosuna eklendi (ai_analysis.cinematic mirror)
-- FAZ 3: agent_analyses tablosu hazır

-- 1. videos tablosuna cinematic_score kolonu
--    ai_analysis JSONB'de cinematic alanı zaten var;
--    bu kolon hızlı sorgulama için ayrı tutuluyor.
ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS cinematic_score NUMERIC(4,2) CHECK (cinematic_score >= 0 AND cinematic_score <= 10);

COMMENT ON COLUMN videos.cinematic_score IS
  'GPT-4o-mini Vision sinematik genel skor (0-10). ai_analysis->cinematic->overall_score ile senkron.';

-- 2. agent_analyses tablosu (FAZ 3 — FrameAgent)
CREATE TABLE IF NOT EXISTS agent_analyses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id     UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  mode         TEXT NOT NULL CHECK (mode IN ('auto', 'chat', 'director')),
  prompt       TEXT,
  response     JSONB NOT NULL DEFAULT '{}',
  model_used   TEXT,
  cost         NUMERIC(10, 6),
  duration_ms  INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_analyses_video_id  ON agent_analyses (video_id);
CREATE INDEX IF NOT EXISTS idx_agent_analyses_client_id ON agent_analyses (client_id);
CREATE INDEX IF NOT EXISTS idx_agent_analyses_created_at ON agent_analyses (created_at DESC);

COMMENT ON TABLE agent_analyses IS
  'FrameAgent (FAZ 3) ve Director AI çıktılarının kalıcı kaydı.';

-- 3. RLS — agent_analyses (tek kullanıcı MVP, service role kullanıyor)
ALTER TABLE agent_analyses ENABLE ROW LEVEL SECURITY;

-- Service role bypass (server-side API routes)
CREATE POLICY "service_role_all" ON agent_analyses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
