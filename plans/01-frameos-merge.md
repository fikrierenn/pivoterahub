# Plan 01 — FrameOS × PivotaraHub Birleşimi

**Durum:** Taslak
**Tier:** 3
**Tarih:** 2026-05-13

## Problem

FrameOS'ta çalışan AI özellikleri (Director AI, FrameAgent, Whisper, Cinematic Vision, skill sistemi, auth, rate limiting) PivotaraHub'a taşınarak tek güçlü platform oluşturulacak. PivotaraHub base alınıyor çünkü Supabase DB, Client CRM ve Next.js 16 burada olgun.

## Kapsam

### PivotaraHub'a Gelecekler (FrameOS'tan)

| # | Özellik | Dosyalar | Öncelik |
|---|---------|----------|---------|
| 1 | **Auth sistemi** | authOptions.ts, auth.ts, middleware.ts, login page | ZORUNLU |
| 2 | **Rate limiting** | lib/rateLimit.ts | ZORUNLU |
| 3 | **Logger** | lib/logger.ts | ZORUNLU |
| 4 | **Cost tracking** | lib/utils/costTracking.ts | ZORUNLU |
| 5 | **Director AI** | lib/directorAI.ts, lib/directors/cinematicDirector.ts | YÜK. |
| 6 | **Video preprocessor** | lib/videoPreprocessor.ts (FFmpeg frame extraction) | YÜK. |
| 7 | **OpenAI TTS** | api/tts/route.ts | YÜK. |
| 8 | **Video download** | api/download-video/route.ts (yt-dlp) | YÜK. |
| 9 | **FrameAgent** | lib/frameAgent.ts, lib/skillLoader.ts | YÜK. |
| 10 | **Skill dosyaları** | .claude/skills/*/SKILL.md (6 adet) | YÜK. |
| 11 | **AgentPanel** | components/AgentPanel.tsx | YÜK. |
| 12 | **AutoAnalysisResults** | components/AutoAnalysisResults.tsx | YÜK. |
| 13 | **Video detail entegrasyon** | Director + Agent tab'ları video sayfasına | YÜK. |

### Out-of-scope
- FrameOS JSON file DB → PivotaraHub Supabase kullanacak, JSON dosyası gelmez
- FrameOS UI tasarımı → PivotaraHub sidebar/layout korunur
- FrameOS i18n (next-intl) → PivotaraHub TR-only devam eder
- Gemini transkripsiyon değiştirilmez → Whisper seçeneği eklenebilir ama mevcut Gemini transkripsiyon kalır

## Faz Planı

### FAZ 1 — Temel Altyapı (Auth + Logger + Cost)
Tüm diğer fazların bağımlısı.

1. `npm install next-auth` — PivotaraHub'a ekle
2. `lib/authOptions.ts` — CredentialsProvider, AUTH_EMAIL/AUTH_PASSWORD
3. `lib/auth.ts` — getAuthUser() helper
4. `src/middleware.ts` — next-auth route koruması
5. `app/login/page.tsx` — PivotaraHub UI'a uygun login formu
6. `lib/logger.ts` — structured logger (FrameOS'tan kopyala)
7. `lib/utils/costTracking.ts` — maliyet hesaplama
8. `lib/rateLimit.ts` — in-memory rate limiter
9. `.env.local` güncellemesi — AUTH_EMAIL, AUTH_PASSWORD, NEXTAUTH_SECRET, ANTHROPIC_API_KEY ekle
10. Mevcut tüm API route'lara auth kontrolü ekle

### FAZ 2 — Video AI Özellikleri (Director + FFmpeg)

1. `npm install fluent-ffmpeg @types/fluent-ffmpeg yt-dlp-exec`
2. `lib/videoPreprocessor.ts` — FFmpeg frame extraction (FrameOS'tan)
3. `lib/directors/cinematicDirector.ts` — GPT-4o Vision sinematik analiz
4. `lib/directorAI.ts` — scene_director | script_rewrite | full_rewrite
5. `app/api/director/route.ts` — Director API endpoint
6. `app/api/tts/route.ts` — OpenAI TTS (ElevenLabs'a paralel alternatif)
7. `app/api/download-video/route.ts` — yt-dlp video indirme
8. Mevcut `app/api/video-analysis/route.ts` → sinematik analiz entegre edilir

### FAZ 3 — FrameAgent + Skill Sistemi

1. `lib/skillLoader.ts` — skill yükleyici (FrameOS'tan)
2. `lib/frameAgent.ts` — Claude streaming chat + auto-analysis (Supabase'e adapt)
3. `.claude/skills/` → PivotaraHub'a kopyala (6 domain skill)
4. `app/api/agent/route.ts` — SSE streaming chat
5. `app/api/agent/auto/route.ts` — otomatik analiz tetikleyici
6. `components/AgentPanel.tsx` — chat UI
7. `components/AutoAnalysisResults.tsx` — skor görselleştirme

### FAZ 4 — Video Sayfası Entegrasyonu + Supabase Migration

1. Supabase migration: `videos` tablosuna `cinematic_analysis jsonb` sütunu ekle
2. `app/videos/[id]/page.tsx` → Director mod sekmeleri + Agent panel ekle
3. Auto-analysis: video yüklendikten sonra fire-and-forget FrameAgent tetikle
4. `lib/db/videos.ts` → cinematicAnalysis CRUD ekle

## Supabase Değişiklikleri

```sql
-- Migration: 20260513000001_frameos_merge.sql

ALTER TABLE videos ADD COLUMN IF NOT EXISTS cinematic_analysis jsonb;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS director_notes jsonb;

CREATE TABLE IF NOT EXISTS agent_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  social_score jsonb,
  ad_copy jsonb,
  video_score jsonb,
  platform_advice text,
  raw_text text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_analyses_video ON agent_analyses(video_id);
CREATE INDEX IF NOT EXISTS idx_agent_analyses_client ON agent_analyses(client_id);
```

## .env.local Eklemeleri

```
AUTH_EMAIL=admin@pivoterahub.local
AUTH_PASSWORD=<güçlü şifre>
NEXTAUTH_SECRET=<64 hex char>
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
```

## Riskler

| Risk | Önlem |
|------|-------|
| next-auth + Next.js 16 uyumsuzluğu | next-auth v5 (beta) veya v4 test edilir |
| FFmpeg Windows path sorunu | fluent-ffmpeg path konfigürasyonu |
| Tailwind 4.1 + yeni class'lar | FrameOS component'leri Tailwind 4 syntax'a uyarlanır |
| ANTHROPIC_API_KEY corporate SSL | FrameOS'taki SSL bypass pattern kullanılır |
| Mevcut API route'lar auth kırılır | Her route tek tek test edilir |

## Done Criteria

- [ ] Login sayfası çalışıyor, oturum açılabiliyor
- [ ] Tüm mevcut API route'lar auth korumalı
- [ ] Video sayfasında Director AI sekmeleri çalışıyor
- [ ] FrameAgent chat paneli video sayfasında açılıyor
- [ ] Otomatik analiz video yüklenince tetikleniyor
- [ ] Supabase migration çalışıyor
- [ ] Build hatasız geçiyor (`npm run build`)

## Rollback

- PivotaraHub bağımsız git repo, herhangi bir commit noktasına `git reset --hard` ile dönülebilir
- Supabase migration geri alınamaz (ALTER TABLE) — dikkatli uygula
- `.env.local` backup al

## Adım Sırası

```
Faz 1 → Faz 2 → Faz 3 → Faz 4
```

Her faz sonunda build test + commit.
