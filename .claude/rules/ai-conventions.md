# PivotaraHub — AI Konvansiyonları (Çok-Model)

## 1. Model Seçim Tablosu

| Görev | Model | Provider | Neden |
|---|---|---|---|
| Video transkripsiyon | `gemini-3-flash-preview` | Gemini | Video input desteği |
| Video skor analizi | `gemini-2.5-flash` | Gemini | JSON mod, hızlı |
| Müşteri profil analizi | `gemini-2.5-flash` | Gemini | JSON mod |
| Sinematik görsel analiz | `gpt-4o` | OpenAI | Vision gerekli |
| Director AI (script) | `gpt-4o-mini` | OpenAI | Yeterli kalite, ucuz |
| FrameAgent chat | `claude-sonnet-4-6` | Anthropic | Reasoning + streaming |
| TTS (hız öncelik) | `tts-1` | OpenAI | Hızlı render |
| TTS (kalite öncelik) | ElevenLabs | ElevenLabs | Doğal ses |
| Video üretim | Gemini Veo | Google | Tek seçenek |

## 2. Gemini Kullanım Kuralları

Tüm Gemini çağrıları `lib/llm/gemini.ts` üzerinden:

```typescript
// JSON analiz:
const model = getGeminiAnalysisModel(systemInstruction);
const result = await model.generateJson(prompt);

// Transkripsiyon (video/ses):
const model = getGeminiTranscribeModel();
const result = await model.generateJsonWithPartsTranscribe(prompt, videoParts);
```

- `responseMimeType: 'application/json'` zorunlu JSON yanıtlar için
- Her Gemini çıktısı Zod ile validate edilir
- `GEMINI_ANALYSIS_MODEL` env var ile model değiştirilebilir (A/B test)

## 3. Maliyet Takip Zorunluluğu

Her AI çağrısından sonra maliyet loglanır:

```typescript
import { calculateCost, formatCost } from '@/lib/utils/costTracking';

// OpenAI / Claude:
const cost = calculateCost('gpt-4o', inputTokens, outputTokens);
logger.info('AI call', { cost: formatCost(cost.estimatedCost) });

// Gemini: token bilgisi response.usageMetadata içinde
const { promptTokenCount, candidatesTokenCount } = response.usageMetadata;
```

## 4. Zod Validasyon Zorunluluğu

AI çıktısını parse etmeden önce:

```typescript
import { z } from 'zod';

const VideoScoreSchema = z.object({
  hook_score: z.number().min(0).max(10),
  tempo_score: z.number().min(0).max(10),
  // ...
}).passthrough(); // bilinmeyen alanları at

const parsed = VideoScoreSchema.safeParse(rawJson);
if (!parsed.success) {
  logger.warn('AI output validation failed', { errors: parsed.error.issues });
  // fallback değer döndür veya throw
}
```

## 5. SSL Bypass (Corporate Network)

```typescript
// Sadece development'ta:
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_ENV === 'development' ? '0' : undefined;
```

Production'da bypass kesinlikle kapatılır.

## 6. Retry Stratejisi

```typescript
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const status = (error as { status?: number }).status;
      if (status === 429) await sleep(10000);
      if (attempt === maxRetries) throw error;
      await sleep(3000 * attempt);
    }
  }
  throw new Error('Max retries exceeded');
}
```

## 7. Prompt Güvenliği

- Kullanıcı inputu prompt'a doğrudan eklenmez — sanitize
- Transcript → max 8000 char (truncate with warning)
- JSON response isteklerinde `responseMimeType: 'application/json'` kullan
- AI çıktısını her zaman try/catch + Zod içinde parse et

## 8. FrameAgent Skill Seçimi

Kullanıcı sorusu + video bağlamı → `selectSkills(context, allSkills, 3)` → max 3 skill → system prompt.
Her skill max 2000 char truncate. Toplam system prompt < 8000 token.
