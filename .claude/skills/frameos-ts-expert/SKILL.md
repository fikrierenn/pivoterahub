---
name: frameos-ts-expert
description: TypeScript/React kod kalitesi — type safety, interface tasarımı, React pattern'ları, async/await, error boundary, hook kuralları
triggers:
  - "typescript"
  - "type hata"
  - "interface tasarım"
  - "react hook"
  - "async hata"
  - "ts analiz"
  - "type safety"
---

## Görev

FrameOS TypeScript/React kodunu analiz et. Type safety açıklarını bul, anti-pattern'ları düzelt, App Router idiomlarına uyumu kontrol et.

---

## TypeScript Kuralları

### Tip Güvenliği

```typescript
// ❌ YASAK
const data = response as any;
const id = req.params.id as string; // doğrulanmadan cast

// ✅ DOĞRU
import { z } from 'zod';
const schema = z.object({ id: z.string().uuid() });
const { id } = schema.parse(req.params);
```

```typescript
// ❌ Non-null assertion abuse
const user = getUser()!;

// ✅ Explicit guard
const user = getUser();
if (!user) throw new Error('User not found');
```

### Interface vs Type

```typescript
// Interface: Nesneler ve genişletilebilir yapılar için
interface VideoAnalysis {
  id: string;
  transcript: string;
  scenes: SceneAnalysis[];
  createdAt: Date;
}

// Type: Union'lar, intersection'lar, utility types için
type Platform = 'tiktok' | 'instagram' | 'youtube' | 'meta-ads';
type VideoWithScore = VideoAnalysis & { socialScore: number };
type PartialVideo = Partial<VideoAnalysis>;
```

### Enum Yerine Const Object

```typescript
// ❌ KÖTÜ — enum compile artifact üretir
enum Platform { TikTok = 'tiktok', Instagram = 'instagram' }

// ✅ İYİ — tree-shakeable
const PLATFORM = {
  TIKTOK: 'tiktok',
  INSTAGRAM: 'instagram',
} as const;
type Platform = typeof PLATFORM[keyof typeof PLATFORM];
```

---

## React Anti-Pattern'ları

### useEffect Bağımlılık Hataları

```tsx
// ❌ KÖTÜ — eksik dependency
useEffect(() => {
  fetchVideo(videoId);
}, []); // videoId eksik!

// ✅ DOĞRU
useEffect(() => {
  fetchVideo(videoId);
}, [videoId]);

// Veya — sadece mount'ta çalışması için bilinçli:
// eslint-disable-next-line react-hooks/exhaustive-deps
```

### State Güncellemesi Yarış Koşulu

```tsx
// ❌ KÖTÜ — stale closure
const [count, setCount] = useState(0);
setCount(count + 1); // eski değer kullanılabilir

// ✅ DOĞRU — functional update
setCount(prev => prev + 1);
```

### Gereksiz Re-render

```tsx
// ❌ KÖTÜ — her render'da yeni obje
<Component style={{ margin: 8 }} handler={() => doSomething()} />

// ✅ DOĞRU
const style = useMemo(() => ({ margin: 8 }), []);
const handler = useCallback(() => doSomething(), []);
```

### Key Prop Anti-Pattern

```tsx
// ❌ KÖTÜ — index as key (reorder sorunları)
{videos.map((v, i) => <VideoCard key={i} video={v} />)}

// ✅ DOĞRU
{videos.map(v => <VideoCard key={v.id} video={v} />)}
```

---

## Next.js App Router Kuralları

### Server vs Client Component

```tsx
// Server Component — default, async olabilir
// src/app/videos/[id]/page.tsx
async function VideoPage({ params }: { params: { id: string } }) {
  const video = await getVideoFromDB(params.id); // doğrudan DB çağrısı OK
  return <VideoClient initialData={video} />;
}

// Client Component — 'use client' gerekli
// src/components/VideoPlayer.tsx
'use client';
function VideoPlayer({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false); // useState OK
  return ...;
}
```

### API Route Tip Güvenliği

```typescript
// ✅ FrameOS standardı
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RequestSchema = z.object({
  videoId: z.string().uuid(),
  platform: z.enum(['tiktok', 'instagram', 'youtube', 'meta-ads']),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const { videoId, platform } = parsed.data;
  // ...
}
```

---

## Async/Await Kuralları

```typescript
// ❌ KÖTÜ — floating promise
async function handleUpload() {
  processVideo(file); // await yok!
}

// ✅ DOĞRU
async function handleUpload() {
  await processVideo(file);
}

// ❌ KÖTÜ — try/catch'siz async
const data = await fetchData(); // unhandled rejection

// ✅ DOĞRU
try {
  const data = await fetchData();
} catch (error) {
  logger.error('fetchData failed', { error });
  throw error; // ya re-throw ya da handle et
}
```

---

## Custom Hook Standartları

```typescript
// ✅ FrameOS hook template
function useVideoAnalysis(videoId: string) {
  const [data, setData] = useState<VideoAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false; // cleanup için
    
    async function load() {
      try {
        setLoading(true);
        const result = await fetchAnalysis(videoId);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    
    load();
    return () => { cancelled = true; }; // cleanup
  }, [videoId]);

  return { data, loading, error };
}
```

---

## Analiz Çıktı Formatı

```
## TypeScript/React Analizi — {dosya}

### CRITICAL (derleme hatası veya runtime crash riski)
- L{satır}: {sorun}
  Düzeltme: {kod}

### WARNING (tip güvenliği veya performans)
- L{satır}: {sorun}
  Düzeltme: {kod}

### INFO (en iyi pratik)
- L{satır}: {öneri}

**Tip Güvenlik Skoru:** {n}/10
**React Pattern Skoru:** {n}/10
```
