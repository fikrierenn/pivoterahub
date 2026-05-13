# PivotaraHub — Güvenlik Prensipleri

## Kural 1 — API Auth Zorunlu

Her `/api/` route'u auth kontrolü ile başlar:

```typescript
const auth = await getAuthUser(request);
if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

Auth implement edilmeden yeni AI feature eklenmez.

## Kural 2 — API Key İzolasyonu

Şu key'lerin hiçbiri client-side'a GİTMEZ:
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `ELEVENLABS_API_KEY`
- `SHOTSTACK_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

`NEXT_PUBLIC_` prefix'i bu key'lere ASLA eklenmez.

## Kural 3 — Supabase Service Role Koruması

```typescript
// ❌ YANLIŞ — tüm müşterilerin verisi gelir
await supabase.from('clients').select('*');

// ✅ DOĞRU — tek kullanıcı MVP, ama yine de scope sınırlı
await supabase.from('clients').select('*').eq('id', clientId);
```

## Kural 4 — Rate Limiting

| Endpoint | Limit |
|---|---|
| `/api/video-analysis` | 10 istek / saat |
| `/api/clients/[id]/analyze` | 20 istek / saat |
| `/api/agent` | 30 istek / saat |
| `/api/agent/auto` | 10 istek / saat |
| `/api/tts` | 50 istek / saat |
| `/api/download-video` | 10 istek / saat |

## Kural 5 — Dosya Validasyonu

Her upload'da:
- MIME type kontrolü (sadece `video/*`)
- Dosya boyutu (max 100MB)
- Uzantı whitelist: `mp4, mov, avi, mkv, webm`

## Kural 6 — Python Subprocess Güvenliği

- `competitor-scraper.ts` kullanıcı inputunu shell'e doğrudan geçmez
- Argümanlar array olarak geçilir (`spawn(['python', script, arg1])`)
- Timeout: max 60 saniye
- Output: JSON parse try/catch içinde

## Kural 7 — Hata Mesajı Sızıntısı

- `error.message` doğrudan kullanıcıya gösterilmez
- Server-side: `logger.error()` ile logla
- Client-side: genel mesaj döndür

## Kural 8 — Temp Dosya Güvenliği

- `os.tmpdir()` altında, proje dizininde değil
- Unique: `${prefix}-${Date.now()}-${crypto.randomUUID()}`
- `finally` bloğunda mutlaka silinir

## Kural 9 — Zod Validasyonu

Her AI çıktısı Zod şeması ile parse edilir:

```typescript
const schema = z.object({ hook_score: z.number().min(0).max(10), ... });
const result = schema.safeParse(rawAiOutput);
if (!result.success) throw new Error('AI çıktısı beklenen formatta değil');
```

## Kural 10 — Secret Yönetimi

- `.env.local` → `.gitignore`'da
- Başlangıçta validate:

```typescript
if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is required');
```
