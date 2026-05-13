---
name: frameos-openai-expert
description: FrameOS'ta OpenAI API kullanım kurallarını uygular — model seçimi, maliyet takibi, prompt güvenliği, retry stratejisi. Yeni AI çağrısı yazılırken proaktif tetiklenir.
---

# FrameOS OpenAI Expert Skill

## Tetikleyiciler (Proaktif)
- Yeni `openai.chat.completions.create()` veya `openai.audio.*` çağrısı yazılırken
- Yeni AI özelliği tarif edilirken
- Model seçimi tartışılırken

## Uygulanan Kurallar

### 1. Model Seçimi Rehberi

Kullanıcı bir AI görevi tanımladığında, doğru modeli öner:

```
Transkripsiyon → whisper-1 (tek seçenek)
Görsel analiz (frame'ler) → gpt-4o (vision zorunlu)
Uzun metin analiz / rewrite → gpt-4o-mini (maliyet optimize)
Script analiz + yeniden yazma → gpt-4o-mini (yeterli kalite)
TTS → tts-1 (standard yeterli, tts-1-hd gereksiz)
Kısa classification/extraction → gpt-4o-mini
```

### 2. Standart AI Çağrısı Şablonu

Yeni AI çağrısı yazılırken bu yapıyı kullan:

```typescript
import { logger } from '@/lib/logger';
import { calculateCost, formatCost } from '@/lib/utils/costTracking';

const startTime = performance.now();

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',         // Seçilen model
  messages: [...],
  response_format: { type: 'json_object' },  // JSON bekliyorsan
  max_tokens: 2000,              // Her zaman set et
  temperature: 0.7,
});

// Maliyet takibi (ZORUNLU)
const duration = performance.now() - startTime;
const cost = calculateCost(
  'gpt-4o-mini',
  response.usage?.prompt_tokens || 0,      // input ayrı
  response.usage?.completion_tokens || 0   // output ayrı
);

logger.info('AI call completed', {
  model: 'gpt-4o-mini',
  duration: `${duration.toFixed(0)}ms`,
  tokens: response.usage?.total_tokens,
  cost: formatCost(cost.estimatedCost),
});

// JSON parse (güvenli)
let result;
try {
  result = JSON.parse(response.choices[0]?.message?.content || '{}');
} catch (parseError: any) {
  logger.error('AI response parse failed', parseError);
  throw new Error('AI yanıtı parse edilemedi');
}
```

### 3. SSL Bypass Kontrolü

Her OpenAI client oluştururken:
```typescript
const httpsAgent = process.env.NODE_ENV === 'development'
  ? new https.Agent({ rejectUnauthorized: false })
  : undefined;  // Production'da undefined = bypass YOK
```

### 4. Prompt Güvenliği

Kullanıcı inputu prompt'a doğrudan ekleniyorsa:
```typescript
// ❌ YANLIŞ — prompt injection riski
const prompt = `Analiz et: ${userInput}`;

// ✅ DOĞRU — yapılandırılmış giriş
const prompt = `Analiz et:\n${JSON.stringify({ text: userInput.substring(0, 5000) })}`;
```

### 5. Mevcut calculateCost Bug Hatırlatması

`cinematicDirector.ts:213` satırında bug var:
```typescript
// ❌ MEVCUT (yanlış) — total_tokens inputTokens yerine geçiyor
const cost = calculateCost('gpt-4o', tokens);

// ✅ DÜZELTILMIŞ
const cost = calculateCost(
  'gpt-4o',
  response.usage?.prompt_tokens || 0,
  response.usage?.completion_tokens || 0
);
```
Bu fix → TODO G-03.
