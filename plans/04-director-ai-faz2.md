# Plan 04 — Director AI + FFmpeg + yt-dlp (FAZ 2)

**Durum:** Onaylı (kullanıcı "sıradan yap" otorize etti)
**Tier:** 3
**Tarih:** 2026-05-13

---

## Problem

PivotaraHub'da şu an video analizi Gemini Flash video upload üzerinden tek aşamalı. Eksikler:

1. **Sinematik analiz yok** — kompozisyon, ışık, renk, hareket, zoom/pan örüntüleri analiz edilmiyor. Vision modeli (GPT-4o veya Gemini) ile 5 frame örnekleminde mantıklı.
2. **Script rewrite yok** — kullanıcının video'sunun script'i AI ile yeniden yazılmıyor (hook güçlendirme, CTA ekleme).
3. **Director AI orkestratörü yok** — kullanıcı "scene_director | script_rewrite | full_rewrite" modlarından birini seçemiyor.
4. **TTS endpoint yok** — script rewrite sonrası seslendirme akışı kapalı.
5. **Video URL'den indirme yok** — YouTube/Instagram/TikTok URL'sinden video çekme. Şu an sadece dosya upload var.

---

## Kapsam — Bugünlük Slice (Plan 04A)

Bugün **scaffold + minimal akış**:

### 4A.1 — Altyapı (1 commit)
- `npm install fluent-ffmpeg yt-dlp-exec` + `@types/fluent-ffmpeg` (devDep)
- `lib/ffmpeg.ts` — fluent-ffmpeg singleton + temp dir helper

### 4A.2 — Frame Extraction (1 commit)
- `lib/videoPreprocessor.ts` — `extractFrames(videoPath, opts) → string[]`
  - 0.5 fps sampling (60s video → max 30 frame), `sampleEvenly(frames, 5)` ile 5 frame'e indir
  - Temp dosyalar `os.tmpdir()` altında, `finally` ile cleanup
  - Maliyet kontrolü: max 5 frame, max 30s video (uzun olursa hata)

### 4A.3 — Cinematic Director (1 commit)
- `lib/directors/cinematicDirector.ts` — `analyzeCinematic(videoPath) → CinematicAnalysis`
  - 5 frame extract, base64'e çevir, GPT-4o-mini Vision'a gönder (vision destekli, ucuz)
  - Output: `{ composition, lighting, color_palette, camera_movement, visual_strengths, visual_weaknesses }`
  - Zod schema ile validate
  - `costTracking` ile maliyet logla

### 4A.4 — Director AI Orkestratörü (1 commit)
- `lib/directorAI.ts` — `runDirector(mode, input) → DirectorOutput`
  - 3 mode: `scene_director` (sinematik yorum) | `script_rewrite` (mevcut script'i güçlendir) | `full_rewrite` (sıfırdan yeni script)
  - Model fallback zinciri: Groq Llama 3.3 70B (free) → GPT-4o-mini → Claude Haiku
  - Her mode için ayrı prompt template (`lib/directors/prompts.ts`)

### 4A.5 — Director API Endpoint (1 commit)
- `app/api/director/route.ts` POST
  - `enforceRateLimit('DIRECTOR')` (20/saat preset)
  - Auth middleware koruyor zaten
  - Input: `{ videoId, mode, originalScript? }`
  - Output: standart `{ success, data, partial_failures?, duration_ms }`

---

## Out-of-Scope (Plan 04B/C ileride)

- `app/api/tts/route.ts` — TTS seslendirme (ElevenLabs/OpenAI) — Plan 04B
- `app/api/download-video/route.ts` — yt-dlp URL download — Plan 04C
- Mevcut `video-analysis/route.ts`'e sinematik analiz entegrasyonu — Plan 04D
- UI tarafı (Director paneli, mode seçici) — UI ayrı planı

---

## Riskler

| Risk | Önlem |
|------|-------|
| FFmpeg sistem-genel binary gerektirir | `fluent-ffmpeg` Vercel'de çalışmaz — production deploy stratejisi ayrı plan (local dev OK). README'ye not. |
| GPT-4o-mini Vision base64 maliyeti yüksek | Max 5 frame, ~100-500KB/frame, payload <2MB. `costTracking` ile her çağrı log. |
| yt-dlp Vercel'de yok | Plan 04C'de external service (Bright Data, scraper API) opsiyonu değerlendir. |
| Groq free tier rate limit | 30 RPM / 1K RPD — director chat dakikada >30 sıklıkta yok, sorun değil. Fallback chain var. |

---

## Done Criteria (Plan 04A için)

- [ ] `npx tsc --noEmit` → 0 hata
- [ ] `lib/ffmpeg.ts`, `lib/videoPreprocessor.ts`, `lib/directors/cinematicDirector.ts`, `lib/directorAI.ts`, `app/api/director/route.ts` dosyaları yazıldı
- [ ] Her dosya 300 satır altı (yumuşak hedef)
- [ ] Her LLM çağrısı `costTracking` log atıyor
- [ ] Director endpoint rate limit'li (`DIRECTOR` preset)
- [ ] Standart response shape (success, data, partial_failures, duration_ms)
- [ ] TODO.md ve memory güncel

---

## Adımlar

1. npm install + ffmpeg.ts (helper)
2. videoPreprocessor.ts (frame extract)
3. cinematicDirector.ts (vision analiz)
4. prompts.ts (3 mod template)
5. directorAI.ts (orkestratör + fallback chain)
6. /api/director/route.ts
7. tsc + commit her adım sonrası
8. README.md kısa not: "FFmpeg sistem bağımlılığı gerekli (local dev). Vercel deploy ayrı plan."

---

## Rollback

Her adım ayrı commit → biri sorun yaratırsa `git revert <hash>`.
npm install paketleri geri almak için `npm uninstall fluent-ffmpeg yt-dlp-exec @types/fluent-ffmpeg`.
