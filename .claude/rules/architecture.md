# PivotaraHub — Mimari Kurallar

## 1. Katman Ayrımı (Kırılmaz)

```
Client (Browser)
  ↓ fetch
API Routes (Next.js server-side)  ← Tüm AI çağrıları BURADAN yapılır
  ↓
Supabase DB / Gemini / OpenAI / Claude / ElevenLabs / Python scraper
```

- Client hiçbir zaman doğrudan AI provider'a veya Supabase Admin'e çağrı yapmaz
- Her AI işlemi `/api/` route üzerinden geçer
- `supabase` (service role) sadece API routes içinde kullanılır

## 2. lib/ Yapısı

```
lib/
  llm/           # AI analiz modülleri (Gemini ağırlıklı)
  directors/     # GPT-4o Vision director modelleri
  db/            # Supabase tablo operasyonları (tablo başına 1 dosya)
  scraping/      # Python subprocess orchestration
  video-production/  # Veo + Shotstack polling
  validation/    # Zod şemaları (AI çıktısı için)
  utils/         # costTracking, helpers
```

Modüller birbirini import etmez. Paylaşılan kod → `lib/` köküne gider.

## 3. API Route Standartları

Her route şu yapıya uyar:

```typescript
export async function POST(request: NextRequest) {
  // 1. Auth kontrolü (ZORUNLU)
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Rate limit
  // 3. Input validasyonu (Zod)
  // 4. İş mantığı (try/catch)
  // 5. Hata formatı standart
}

// Standart hata formatı:
{ ok: false, error: { code: "CLIENT_NOT_FOUND", message: "..." } }

// Standart başarı formatı:
{ success: true, data: { ... } }
```

## 4. Veri Akışı Kuralları

- **AI sonuçları:** JSONB formatında Supabase'e kaydedilir
- **Temp dosyalar:** `os.tmpdir()` kullanılır, `finally` bloğunda silinir
- **AI çıktısı:** Zod şeması ile parse edilmeden önce validate edilir
- **Supabase:** `lib/supabase.ts` — service role singleton, sadece server

## 5. AI Provider Soyutlama

| Provider | Soyutlama | Görev |
|---|---|---|
| Gemini | `lib/llm/gemini.ts` | Video analiz, transkript, müşteri analizi |
| OpenAI | `lib/directors/cinematicDirector.ts` | GPT-4o Vision sinematik analiz |
| Claude | `lib/frameAgent.ts` | Chat asistanı, auto-analysis |
| ElevenLabs | `lib/video-production/` | TTS |

Her provider doğrudan `fetch` veya SDK ile çağrılmaz, her zaman soyutlama dosyasından.

## 6. Supabase Tablo → Dosya Eşlemesi

| Tablo | lib/db/ dosyası |
|---|---|
| clients | clients.ts |
| videos | videos.ts |
| video_scores | video-scores.ts |
| video_stats | video-stats.ts |
| hashtag_stats | hashtag-stats.ts |
| bio_analysis | bio-analysis.ts |
| competitor_analysis | competitor-analysis.ts |
| agent_analyses | agent-analyses.ts (FAZ 3) |

## 7. Yasaklar

- ❌ `any` tip kullanımı
- ❌ AI çıktısını Zod olmadan parse etme
- ❌ Client component içinde iş kuralı
- ❌ 400 satırı aşan dosyalar → bölünmeli
- ❌ `console.log` production'da → logger kullan
- ❌ Provider'a raw fetch → soyutlama dosyası kullan
- ❌ Supabase'e `user_id` filtresi olmadan SELECT (tüm kullanıcı verisi gelir)
