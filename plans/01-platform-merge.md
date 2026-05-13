# Plan 01 — Platform Birleşimi (Tam)

**Durum:** Tarihsel — Plan 02 ve 03 ile takip edildi, kısmen tamamlandı
**Tier:** 3
**Tarih:** 2026-05-13

> Bu plan, ikinci bir kod tabanından özelliklerin PivotaraHub'a taşınması için yazıldı. Bugün PivotaraHub bağımsız tek platform olarak ilerliyor; bu dosya tarihsel kayıt olarak tutuluyor.

---

## Problem

Önceki kod tabanında çalışan AI pipeline + 6 fazlı ROADMAP özelliklerinin tamamı PivotaraHub'a taşınarak tek güçlü platform oluşturulacak. PivotaraHub base alınıyor: Supabase DB, Client CRM, Next.js 16 zaten olgun. Model maliyeti minimize edilecek — mümkün olan her yerde ücretsiz/ucuz alternatif.

---

## Model Maliyet Stratejisi (Önce Bu Karar)

### Görev → En Ucuz Uygun Model

| Görev | Eski | Yeni | Tasarruf |
|-------|---------------|-------------------|---------|
| Video transkripsiyon | Whisper $0.006/dk | **Gemini 2.5 Flash FREE tier** | ~%100 |
| JSON skor analizi | Gemini 2.5 Flash $0.075/M | **Gemini 2.5 Flash-Lite $0.10/M** | ~%30 |
| Müşteri analizi | Gemini 2.5 Flash | **Gemini 2.5 Flash FREE tier** (15 RPM) | ~%100 |
| FrameAgent chat | Claude Sonnet $3/$15 | **Claude Haiku 4.5 $1/$5** | ~%67 |
| Director script rewrite | GPT-4o-mini $0.15/$0.60 | **Groq Llama 3.3 70B FREE** → fallback GPT-4o-mini | ~%100 |
| Director sinematik analiz | GPT-4o $2.5/$10 (Vision) | **GPT-4o-mini $0.15/$0.60** (Vision destekli) | ~%94 |
| TTS | OpenAI TTS $15/M char | **Coqui XTTS-v2 self-hosted FREE** → Facebook MMS-TTS FREE → ElevenLabs $0.30/M | ~%100 |
| Keyframe seçimi | 0.5fps random | **Katna (Python, free)** — kalite bazlı | ~%100 |
| Video kalite (ek) | — | **VMAF (FFmpeg built-in, free)** + IQA-PyTorch | ~%100 |
| Yüz/pose analizi | — | **MediaPipe npm (Node.js native, free)** | — |
| Kelime timestamp | — | **WhisperX (free)** — altyazı senkronu | — |
| Speaker diarization | — | **Pyannote 3.1 (free)** — kim konuştu | — |
| İçerik moderasyon | — | **OpenAI Moderation API FREE** | — |
| Virality/hook skoru | LLM prompt | **pyviralcontent + STEPPS formül** (CPU, free) | — |
| Video kalite skoru | GPT-4o Vision | **DOVER-Mobile (Python, free)** | ~%100 |
| Duygu analizi | — | **FER library (Python, free)** | — |
| TR transkripsiyon (kalite) | Gemini | **faster-whisper + sgangireddy/whisper-medium-tr (self-hosted, free)** | ~%100 |

### Maliyet Katmanı

```
TIER 0 — Tamamen Ücretsiz (kendi sunucu veya free API)
  • Gemini 2.5 Flash (15 RPM, günlük 1M token)
  • Groq Llama 3.3 70B (30 RPM, 1k RPD)
  • Cerebras Llama 70B (30 RPM, 1M token/gün)
  • DOVER-Mobile, FER, faster-whisper (Python local)
  • OpenAI Moderation API

TIER 1 — Çok Ucuz (ödeniyor ama minimal)
  • Gemini 2.5 Flash-Lite: $0.10/$0.40 per 1M → JSON skor
  • Claude Haiku 4.5: $1/$5 per 1M → FrameAgent chat
  • GPT-4o-mini: $0.15/$0.60 per 1M → fallback Director

TIER 2 — Gerektiğinde (yüksek kalite)
  • GPT-4o: $2.5/$10 per 1M → sadece sinematik Vision analiz
  • ElevenLabs: $0.30/M char → kaliteli TTS
  • Claude Sonnet 4.6 → karmaşık reasoning gereken nadir durum
```

### .env.local Değişkenleri (Model Config)

```env
# Gemini
GEMINI_API_KEY=...
GEMINI_ANALYSIS_MODEL=gemini-2.5-flash-lite      # JSON skor — Tier 1
GEMINI_TRANSCRIBE_MODEL=gemini-2.5-flash          # Transkript — Free tier
GEMINI_FREE_MODEL=gemini-2.5-flash                # Genel analiz — Free tier

# OpenAI (sadece Vision + TTS fallback)
OPENAI_API_KEY=...
OPENAI_VISION_MODEL=gpt-4o-mini                   # Sinematik Vision (ucuz)
OPENAI_DIRECTOR_MODEL=gpt-4o-mini                 # Director script

# Claude (FrameAgent)
ANTHROPIC_API_KEY=...
CLAUDE_AGENT_MODEL=claude-haiku-4-5-20251001      # Chat — Tier 1 ucuz
CLAUDE_AGENT_COMPLEX_MODEL=claude-sonnet-4-6      # Karmaşık analiz — nadiren

# Groq (Ücretsiz LLM)
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile               # Director fallback — Free

# ElevenLabs (kaliteli TTS)
ELEVENLABS_API_KEY=...

# Python Microservice
ANALYSIS_SERVICE_URL=http://localhost:8001        # DOVER, FER, faster-whisper
```

---

## Faz Planı

### FAZ 1 — Temel Altyapı (Auth + Model Config) — ÖNCELİK

1. `npm install next-auth` (v4)
2. `lib/authOptions.ts` — CredentialsProvider
3. `lib/auth.ts` — getAuthUser()
4. `middleware.ts` — next-auth route koruması
5. `app/login/page.tsx` — PivotaraHub UI'a uygun
6. `lib/logger.ts` — structured logger
7. `lib/utils/costTracking.ts` — Gemini + OpenAI + Claude + Groq maliyet
8. `lib/rateLimit.ts` — in-memory rate limiter
9. `.env.local` — AUTH_EMAIL, AUTH_PASSWORD, NEXTAUTH_SECRET, ANTHROPIC_API_KEY, GROQ_API_KEY
10. Tüm mevcut API route'lara auth + rate limit ekle
11. `lib/llm/gemini.ts` → GEMINI_ANALYSIS_MODEL env var (Flash-Lite geçişi)

### FAZ 2 — Video AI (Director + FFmpeg)

1. `npm install fluent-ffmpeg yt-dlp-exec`
2. `lib/videoPreprocessor.ts` — FFmpeg frame extraction
3. `lib/directors/cinematicDirector.ts` — GPT-4o-mini Vision sinematik analiz
4. `lib/directorAI.ts` — scene_director | script_rewrite | full_rewrite
5. `app/api/director/route.ts`
6. `app/api/tts/route.ts` — OpenAI TTS-1 (ElevenLabs'a alternatif)
7. `app/api/download-video/route.ts` — yt-dlp (YouTube, Instagram, TikTok)
8. Director için Groq free → fallback GPT-4o-mini entegre et
9. Mevcut `video-analysis/route.ts` → sinematik analiz entegre

### FAZ 3 — FrameAgent + Skill Sistemi

1. `lib/skillLoader.ts` — SKILL.md yükleyici
2. `lib/frameAgent.ts` — Claude Haiku 4.5 (Sonnet yerine) SSE chat + auto-analysis
3. `.claude/skills/` → uygulama koduna skill bağlantısı
4. `app/api/agent/route.ts` — SSE chat
5. `app/api/agent/auto/route.ts` — otomatik analiz
6. `components/AgentPanel.tsx`
7. `components/AutoAnalysisResults.tsx`

### FAZ 4 — Sosyal Medya & Reklam Zekası (önceki Faz 3'ten)

1. `lib/socialMediaScorer.ts` — STEPPS + Hormozi + Cialdini formülleri (LLM-free, hesaplamalı)
2. `lib/viralityPredictor.ts` — viral-predictor LLM prompt + pyviralcontent entegrasyonu
3. `lib/contentModeration.ts` — OpenAI Moderation API (ÜCRETSİZ) + Clarifai NSFW
4. `lib/adCopyGenerator.ts` — 5 şablon (30/60/90sn + gayrimenkul + fitness)
5. API route'ları: `/api/social-score`, `/api/moderate`, `/api/ad-copy`
6. Auto-analysis pipeline'a moderation ekle (her video için)
7. Supabase migration: `social_scores`, `ad_copies` tabloları

### FAZ 5 — Python Microservice (önceki Faz 2'den + Eksik Araçlar)

```
services/video-analysis/
  main.py          # FastAPI app (port 8001)
  routers/
    quality.py     # DOVER-Mobile + IQA-PyTorch (MUSIQ/NIMA/BRISQUE) + VMAF (FFmpeg)
    shots.py       # TransNetV2 (shot boundaries) + Katna (kalite keyframe)
    emotion.py     # FER library (hızlı) + DeepFace (Docker, yaş/cinsiyet de çıkarır)
    transcribe.py  # faster-whisper (TR model) + WhisperX (kelime timestamp) + Pyannote (kim konuştu)
    ocr.py         # PaddleOCR (ekran metni + timestamp)
    audio.py       # FFmpeg LUFS + Demucs (ses/müzik ayrımı)
    virality.py    # pyviralcontent + harbarex/tiktok-virality ViViT classifier
  requirements.txt
  Dockerfile
```

**Not:** MediaPipe'ı Python'a koyma — `@mediapipe/tasks-vision` npm paketi ile Next.js'te native çalışır, subprocess yok.

Next.js → Python iletişim:
```typescript
// lib/analysisService.ts
const ANALYSIS_API = process.env.ANALYSIS_SERVICE_URL ?? 'http://localhost:8001';
```

Duygu timeline + shot boundary frontend görselleştirmesi (Recharts — zaten kurulu).

**Eklenen araçlar (PivotaraHub araştırmasından düşmüşler):**
- **WhisperX** — kelime bazlı timestamp → altyazı senkronizasyonu, hook zamanı tespiti
- **Pyannote 3.1** — kim ne zaman konuştu → multi-speaker videolar için kritik
- **IQA-PyTorch** — 20+ kalite metriği (MUSIQ, NIMA, BRISQUE) → DOVER'a ek sinyal
- **Netflix/VMAF** — FFmpeg'e entegre, şu an kullanılabilir, sıfır kurulum
- **Katna** — 0.5fps random frame yerine kalite bazlı seçim → GPT-4o Vision'a daha iyi frame
- **DeepFace** — Docker REST API, 7 duygu + yaş/cinsiyet → FER'den zengin çıktı
- **harbarex/tiktok-virality** — ViViT binary classifier → TikTok viral probability

### FAZ 6 — Minimax & Ses Genişletme (önceki Faz 4'ten)

1. `lib/minimax.ts` — TTS + voice clone + music
2. `app/api/tts-minimax/route.ts`
3. `app/api/voice-clone/route.ts`
4. `app/api/music-gen/route.ts`
5. TTS fallback zinciri: **Coqui XTTS-v2** (self-hosted, TR native, %100 ücretsiz) → Facebook MMS-TTS (free API) → Minimax → ElevenLabs → OpenAI TTS
6. `lib/audioSeparation.ts` — Demucs (FAZ 5 microservice üzerinden)

**Coqui XTTS-v2 neden:** 35k⭐, 6 saniye ses örneğiyle voice clone yapıyor, Türkçe native, kendi sunucunda çalışıyor → sıfır maliyet.

### FAZ 7 — MediaPipe Node.js Native Entegrasyon

Python subprocess olmadan çalışır, Next.js API route'larına doğrudan eklenir:

```typescript
// npm install @mediapipe/tasks-vision
// lib/mediapipe.ts
import { FaceLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision';

// Her video frame'i için:
// → 478 yüz landmark → göz teması, gülümseme, kaş analizi
// → Vücut pose → jest, el hareketleri, duruş
// → Engagement scoring: yüze bakma süresi, ifade yoğunluğu
```

Kullanım: video frame'lerini FFmpeg ile extract et → MediaPipe ile analiz → JSON timeline.

### FAZ 8 — İleri Özellikler (GPU Gerekli / Araştırma)

| Araç | Kapasite | Karar Noktası |
|------|---------|---------------|
| **VideoLLaMA3-7B** | GPT-4o Vision'ı replace et | GPU VPS → maliyet analizi |
| **Qwen3-VL** (Alibaba) | OpenAI-compatible, ucuz vision | vLLM ile CPU'da da çalışabilir |
| **Meta SAM2** | Video boyunca nesne/ürün takibi | GPU gerekli, ürün tanıtım videoları için |
| **color-matcher** | Referans film renk grade transferi | CPU'da çalışır, anında eklenebilir |
| **EmotiEffLib** | Duygu + engagement ONNX | DeepFace alternatifi, daha hafif |

### FAZ 7 — Supabase Entegrasyonu (Tüm Yeni Tablolar)

```sql
-- Migration: 20260513000001_PivotaraHub_merge.sql

-- Video analiz genişletme
ALTER TABLE videos ADD COLUMN IF NOT EXISTS cinematic_analysis jsonb;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS director_notes jsonb;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS dover_score jsonb;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS emotion_timeline jsonb;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS ocr_results jsonb;

-- FrameAgent analiz sonuçları
CREATE TABLE IF NOT EXISTS agent_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  social_score jsonb,
  ad_copy jsonb,
  video_score jsonb,
  platform_advice text,
  created_at timestamptz DEFAULT now()
);

-- Sosyal skor + moderasyon
CREATE TABLE IF NOT EXISTS social_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  stepps_score jsonb,
  virality_score numeric(5,2),
  moderation_result jsonb,
  platform_fit jsonb,
  created_at timestamptz DEFAULT now()
);

-- Reklam metinleri
CREATE TABLE IF NOT EXISTS ad_copies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id),
  variants jsonb,  -- [{type, text, platform, duration_sec}]
  created_at timestamptz DEFAULT now()
);
```

---

## Faz Sırası ve Bağımlılıklar

```
FAZ 1 (Auth + Config)     ← BLOCKER — diğerleri bu olmadan production'a alınamaz
  ↓
FAZ 2 (Director + FFmpeg) ← FAZ 1 tamamlanmalı
  ↓
FAZ 3 (FrameAgent)        ← FAZ 1 tamamlanmalı, FAZ 2 paralel yürüyebilir
  ↓
FAZ 4 (Sosyal Zeka)       ← FAZ 3 sonrası (Agent + skill entegrasyonu)
  ↓
FAZ 5 (Python Service)    ← Bağımsız, herhangi bir fazda başlanabilir
  ↓
FAZ 6 (Minimax/Ses)       ← Bağımsız, low priority
  ↓
FAZ 7 (DB Migration)      ← Her fazda kademeli uygulanır
```

---

## Tahmini Maliyet (100 video/ay)

### Mevcut PivotaraHub (Gemini ağırlıklı)
~$20-40/ay

### Birleşim Sonrası (optimize model seçimi)
| Servis | Kullanım | Maliyet |
|--------|---------|---------|
| Gemini (free tier) | Transkripsiyon, müşteri analizi | $0 |
| Gemini Flash-Lite | JSON skorlama | ~$3 |
| Groq free | Director script | $0 |
| Claude Haiku 4.5 | FrameAgent chat | ~$5 |
| GPT-4o-mini | Sinematik Vision | ~$3 |
| Python microservice | DOVER, FER, Whisper | $0 (local) / ~$10 (VPS) |
| **Toplam** | | **~$11-21/ay** |

### vs PivotaraHub orijinal model seçimi
~$50-80/ay → **%65-75 tasarruf**

---

## Riskler

| Risk | Önlem |
|------|-------|
| next-auth v4 + Next.js 16 | v5 beta da denenebilir |
| Groq rate limit aşımı | GPT-4o-mini fallback otomatik |
| Gemini free tier (15 RPM) dolması | Paid tier'a sorunsuz geçiş |
| Python microservice Windows kurulum | Docker kullan |
| DOVER-Mobile GPU yoksa yavaş | CPU 1.4s/video — kabul edilebilir |

## Done Criteria

- [ ] Login çalışıyor
- [ ] Tüm API route'lar auth korumalı
- [ ] Director AI 3 mod çalışıyor
- [ ] FrameAgent Haiku 4.5 ile chat çalışıyor
- [ ] Auto-analysis (sosyal skor + moderasyon) tetikleniyor
- [ ] Python microservice /quality endpoint çalışıyor
- [ ] `npm run build` hatasız
- [ ] Maliyet < $25/ay (100 video)
