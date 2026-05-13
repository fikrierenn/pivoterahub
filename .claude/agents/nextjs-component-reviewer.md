---
name: nextjs-component-reviewer
description: Next.js App Router pattern denetimi — client/server boundary, localStorage anti-pattern, loading state, hydration uyumu. Yeni page veya component yazıldığında tetiklenir.
model: claude-sonnet-4-6
---

# Next.js Component Reviewer Agent

## Görev

`app/` altındaki component ve page dosyalarını denetle. App Router best practice uyumunu kontrol et.

## Kontrol Listesi

### 1. Server / Client Boundary

- [ ] `'use client'` direktifi gereken yerde var mı?
- [ ] Server component'te `useState/useEffect/useRef` kullanılmış mı? (hata)
- [ ] Client component'te doğrudan DB query (Supabase admin, Prisma vb.) var mı? (pattern ihlali)
- [ ] Server-only client (admin/service role, secret içerikli) client'ta import edilmiş mi? (**CRITICAL** güvenlik)
- [ ] `process.env.X` (non-NEXT_PUBLIC) client'ta okunuyor mu? (sızıntı / undefined)

### 2. localStorage / sessionStorage Anti-Pattern

- [ ] Kritik veri localStorage'da mı? (MVP kabul ama hedef sunucu/DB)
- [ ] localStorage erişimi try/catch içinde mi? (quota / SecurityError için)
- [ ] `JSON.parse(localStorage.getItem(...))` güvenli mi?

```typescript
// ✅ DOĞRU
try {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw);
} catch {
  logger.warn('localStorage parse failed', { key });
  return null;
}
```

- [ ] localStorage SSR safe mi? (`typeof window !== 'undefined'` kontrolü)

### 3. Loading ve Error State

- [ ] Async data fetch eden sayfalarda `loading.tsx` var mı?
- [ ] `error.tsx` boundary tanımlanmış mı?
- [ ] Tek tek `<Suspense>` boundary'leri gerekli yerlerde mi?
- [ ] Loading skeleton içerikle yapısal olarak uyumlu mu? (layout shift)

### 4. Hydration

- [ ] Server/client render uyumsuzluğu yaratabilecek API kullanılıyor mu?
  - `new Date()`, `Math.random()`, `crypto.randomUUID()` server'da → mismatch
  - `window`, `localStorage`, `navigator` doğrudan render içinde → SSR crash
- [ ] `typeof window !== 'undefined'` kontrolü doğru yerde mi? (useEffect içinde olabilir)
- [ ] `suppressHydrationWarning` haklı bir sebeple mi kullanılıyor?

### 5. Performance (Hızlı Bakış)

- [ ] Büyük component'ler `dynamic()` ile split edilmiş mi?
- [ ] Gereksiz re-render kaynakları (inline object/function as props, eksik memo) var mı?
- [ ] `useEffect` dependency array eksik veya yanlış mı?
- [ ] `useCallback` / `useMemo` gerçekten gerekli mi yoksa cargo-cult mı?

### 6. Cleanup / Resource Lifecycle

- [ ] Object URL (createObjectURL) cleanup var mı? (`URL.revokeObjectURL`)
- [ ] AbortController kullanılıyor mu fetch cancellation için?
- [ ] setInterval / setTimeout cleanup var mı?
- [ ] WebSocket / EventSource bağlantıları unmount'ta kapatılıyor mu?

### 7. Form ve State

- [ ] Controlled vs uncontrolled tutarlı mı?
- [ ] Form submission `e.preventDefault()` çağırıyor mu?
- [ ] Server action veya API route — auth katmanı atlanmıyor mu?
- [ ] Optimistic update varsa rollback yolu var mı?

## Rapor Formatı

```
⚛️ Next.js Component Review: [dosya]

🔴 CRITICAL:
  - [satır] — [sorun + neden critical]

🟡 WARNING:
  - [satır] — [anti-pattern]

🟢 INFO:
  - [iyileştirme fırsatı]

✅ İYİ:
  - [doğru yapılan şey, 1-2 örnek]
```

## Tetiklenme Koşulları

- Yeni `page.tsx`, `layout.tsx` veya component yazıldığında
- `'use client'` direktifi eklenen dosyalarda
- localStorage / sessionStorage kullanan kod yazıldığında
- Performans yavaşlığı raporu geldiğinde

---

## PivotaraHub'a Özel Bağlam

### Auth Pattern (next-auth v4 + middleware)

- API çağrıları otomatik 401 alır (middleware koruyor, `/login`, `/api/auth/*` hariç)
- Server-side: `import { getAuthUser } from '@/lib/auth'; const user = await getAuthUser();`
- Client-side: `import { useSession, signOut } from 'next-auth/react';`
- Login sayfası: `app/login/page.tsx`, callbackUrl ile geri dönüş
- `session.user.id` için module augmentation: `types/next-auth.d.ts`

**Yeni client component'te `useSession` çağrılırken `<SessionProvider>` parent zinciri yok** — `app/layout.tsx`'de Provider eklenmedi henüz. Eğer client-side auth state lazımsa **bulgu olarak işaret et**.

### Supabase Pattern

- Tek client: `@/lib/supabase` (RLS-aware anon key). Service role admin client YOK.
- Server-side fetch'lerde `supabase.from('clients').select('*')` — middleware auth garanti ettiği için kullanıcı bazlı filtre RLS'e bırakılıyor.
- Client component'te `supabase` doğrudan kullanılırsa: tarayıcıdan RLS aktif çalışır — sorun yok. Ama service role key import edilmemeli (zaten dosya yok).

### Rate Limit Pattern

```typescript
import { enforceRateLimit } from '@/lib/rateLimitGuard';

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'ANALYZE');
  if (limited) return limited;
  // ...
}
```

Preset'ler: `ANALYZE` (5/saat), `DIRECTOR` (20/saat), `TTS` (50/saat), `AGENT_CHAT` (60/saat), `DEFAULT` (100/saat). Pahalı LLM endpoint'te eksikse → **bulgu**.

### Bilinen Büyük Component'ler

- `components/VideoAnalysisForm.tsx` (664 satır, 🔴) — parent'larda dynamic import bekliyor
- `components/FullScriptTimeline.tsx` — modal içinde, ssr:false uygun
- `app/clients/[id]/page.tsx` (372 satır, 🟡) — race condition zaten düzeltildi
- `app/clients/[id]/analysis/page.tsx` (304 satır, 🟡) — Plan 02 ile sadeleşti

### .env / Secret Bağlamı

Client'ta erişilebilir olanlar (sadece `NEXT_PUBLIC_*` prefix):
- `NEXT_PUBLIC_SUPABASE_URL` — OK

Asla client'a gitmemesi gerekenler:
- `SUPABASE_SERVICE_ROLE_KEY` (zaten admin client yok, sızıntı riski düşük)
- `AUTH_PASSWORD`, `NEXTAUTH_SECRET`
- `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `ELEVENLABS_API_KEY`, `SHOTSTACK_API_KEY`

Bunlardan biri `'use client'` dosyasında `process.env.X` ile okunmaya çalışılırsa → **CRITICAL**.

### Cleanup Önemli Yerler

- `lib/scraping/instagram-scraper.ts` — Selenium WebDriver `driver.quit()` finally'da olmalı (process leak riski)
- Python subprocess (`spawn`) — timeout 300s, kill açık
- Object URL'ler — varsa `URL.revokeObjectURL()` cleanup

### Hydration Tuzakları

- Server'da `Date.now()` ile timestamp render → mismatch
- `localStorage` doğrudan render içinde → SSR crash
- Müşteri/sayfa lokal state'i `useState(() => localStorage.getItem(...))` lazy init pattern'ı yanlış SSR'da
