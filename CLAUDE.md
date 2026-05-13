# PivotaraHub — Claude Çalışma Rehberi

## 1. Platform Kimliği

**PivotaraHub**, içerik üreticileri ve küçük işletmeler için AI destekli dijital danışmanlık otomasyon platformudur.
Müşteri yönetimi (CRM), video içerik analizi, rakip araştırması, gelişim planlaması ve içerik stratejisi üretir.

**Vizyon:** MVP (CRM + video analiz) → FrameAgent entegrasyonu → Director AI → Video üretim → Çok kullanıcılı SaaS

## 2. Stack

| Katman | Teknoloji |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript 5.9, Tailwind CSS 4.1, React 19 |
| Backend | Next.js API Routes (server-side) |
| Database | Supabase (PostgreSQL + RLS + Storage) |
| Auth | next-auth v4 (CredentialsProvider — tek kullanıcı MVP) |
| AI (Analiz) | Google Gemini 2.5 Flash (video analiz, JSON mod) |
| AI (Transkripsiyon) | Gemini 3 Flash Preview (video/ses) |
| AI (Agent/Chat) | Claude claude-sonnet-4-6 (FrameAgent) |
| AI (Director) | OpenAI GPT-4o / GPT-4o-mini |
| Video Üretim | Gemini Veo + ElevenLabs TTS + Shotstack |
| Scraping | Python (Selenium, Instaloader) via subprocess |
| Validasyon | Zod 4 |
| Grafikler | Recharts 3.5 |

## 3. Değişmez Kurallar (Kırılmaz)

1. **Hiçbir API key client-side'a ASLA gitmez** — Gemini, OpenAI, Anthropic, ElevenLabs hepsi sadece server API routes
2. **Her API route auth kontrolü yapar** — auth yoksa 401 döner
3. **Supabase service role key client'a gitmez** — sadece server-side
4. **Her AI çağrısı maliyet logu atar** — `costTracking.ts` kullanımı zorunlu (Gemini + OpenAI + Claude)
5. **Temp dosyalar `finally` bloğunda silinir** — cleanup asla atlanmaz
6. **`any` tip kullanımı yasak** — strict TypeScript
7. **AI çıktısı Zod ile validate edilir** — raw parse kabul edilmez

## 4. AI Pipeline Akışı

```
Müşteri Video Yükle / URL gir
  ├── Gemini Transcribe Model (transkript)
  ├── Gemini Vision (hook/tempo/clarity/cta/visual skor, funnel stage)
  └── GPT-4o Vision (sinematik analiz — FAZ 2)
→ Supabase'e kaydet (videos + video_scores tablosu)
→ /videos/[id]
  ├── /api/director (scene_director | script_rewrite | full_rewrite) — FAZ 2
  ├── /api/agent (FrameAgent SSE chat) — FAZ 3
  └── /api/agent/auto (otomatik analiz) — FAZ 3

Müşteri Profili:
  ├── /api/clients/[id]/analyze (Gemini profil analizi)
  ├── /api/clients/[id]/bio-analysis (Instagram bio)
  └── /api/clients/[id]/competitor-analysis (Python scraper → Gemini)
```

## 5. Dizin Yapısı

```
app/               # Next.js App Router (pages + API routes)
  api/
    clients/       # Müşteri CRUD + analiz
    videos/        # Video CRUD
    video-analysis/  # Gemini video skor + transkript
    video-production/  # Veo + ElevenLabs + Shotstack
    director/      # GPT-4o Director AI — FAZ 2
    agent/         # FrameAgent SSE chat — FAZ 3
    tts/           # OpenAI TTS — FAZ 2
    download-video/  # yt-dlp indirme — FAZ 2
  clients/         # Müşteri sayfaları
  videos/          # Video sayfaları

lib/
  llm/
    gemini.ts      # Gemini API soyutlama
    video-analysis.ts  # Video skor modeli
    client-analysis.ts # Müşteri profil analizi
    agents/        # Domain-specific Gemini agent'ları
  directors/
    cinematicDirector.ts  # GPT-4o Vision — FAZ 2
  db/              # Supabase işlemleri (her tablo için ayrı dosya)
  scraping/        # Python subprocess orchestration
  video-production/  # Veo polling engine
  validation/      # Zod şemaları
  frameAgent.ts    # Claude FrameAgent — FAZ 3
  skillLoader.ts   # SKILL.md yükleyici — FAZ 3
  directorAI.ts    # Director AI modları — FAZ 2
  auth.ts          # getAuthUser helper
  authOptions.ts   # next-auth config
  rateLimit.ts     # In-memory rate limiter
  logger.ts        # Structured logger
  utils/
    costTracking.ts  # Çok-model maliyet takibi

components/        # React bileşenleri
  AgentPanel.tsx   # FrameAgent chat UI — FAZ 3
  AutoAnalysisResults.tsx  # Skor görselleştirme — FAZ 3

.claude/
  rules/           # Kural dosyaları (her zaman aktif)
  agents/          # Proje agent'ları
  skills/          # Domain skill'leri
  commands/        # Slash komutlar
  hooks/           # Otomasyon hook'ları

supabase/
  migrations/      # DB şema değişiklikleri

plans/             # Tier 3 iş planları
docs/journal/      # Günlük oturum notları
TODO.md            # Aktif sprint + backlog
```

## 6. Mevcut Teknik Borçlar (Kritik)

- ❌ Auth yok — tüm API route'lar korumasız (G-01)
- ❌ Rate limiting yok (G-02)
- ❌ Sidebar'da hardcoded sayılar (12 clients, 48 videos) — gerçek Supabase sorgusu yapılmalı
- ❌ Director AI henüz yok — FAZ 2 planlandı
- ❌ FrameAgent henüz yok — FAZ 3 planlandı
- ❌ `GEMINI_API_KEY` var ama `ANTHROPIC_API_KEY` yok
- ❌ Python scraper kırılgan — error handling zayıf

## 7. Kural Dosyaları İndeksi

| Dosya | Konu |
|---|---|
| `architecture.md` | Modül yapısı, API standartları |
| `security-principles.md` | Auth, key koruması, rate limiting |
| `nextjs-conventions.md` | App Router, component pattern |
| `ai-conventions.md` | Gemini + OpenAI + Claude kullanım kuralları |
| `session-protocol.md` | Oturum başı/sonu ritüeli |
| `plan-first.md` | Tier 1/2/3 karar sistemi |
| `commit-discipline.md` | Git stratejisi, 15 dosya eşiği |

## 8. Çalışma Prensibi

- **İşleri subagent + skill ile yap** — manuel okuma/yazma ikincil
- **Tier 3 iş → plan yaz, onay al, sonra impl. et**
- **Her oturum sonu → `session-handoff` skill**
- **15+ uncommitted dosya → `commit-splitter` agent**
- **Auth eklenmeden yeni AI feature ekleme** (kural 2)
