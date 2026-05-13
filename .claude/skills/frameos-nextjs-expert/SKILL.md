---
name: frameos-nextjs-expert
description: Next.js 14 App Router pattern'larını FrameOS'ta doğru uygular — server/client boundary, data fetching, loading state, error boundary. Yeni page veya component yazılırken proaktif tetiklenir.
---

# FrameOS Next.js Expert Skill

## Tetikleyiciler (Proaktif)
- Yeni `page.tsx`, `layout.tsx`, `loading.tsx` yazılırken
- `'use client'` direktifi tartışılırken
- Data fetching pattern seçilirken

## Server Component (Default) Ne Zaman

Veri fetch + render → Server Component tercih et:
```typescript
// ✅ Server Component — 'use client' YOK
// src/app/videos/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function VideosPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: videos } = await supabase.from('videos').select('*');

  return <VideoGrid videos={videos ?? []} />;
}
```

## Client Component Ne Zaman

State + event + browser API → Client Component:
```typescript
'use client';
// useState, useEffect, useRef, event handlers
// localStorage, sessionStorage
// Video player, audio element
```

## Loading + Error State Şablonu

Her data-fetch eden route için:
```
src/app/videos/
  page.tsx          # Server component — data fetch
  loading.tsx       # Suspense fallback
  error.tsx         # Error boundary
```

```typescript
// loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );
}

// error.tsx
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="text-center py-12">
      <p className="text-red-600 mb-4">Bir hata oluştu</p>
      <button onClick={reset} className="btn-primary">Tekrar Dene</button>
    </div>
  );
}
```

## localStorage Pattern (MVP)

localStorage'a güvenli erişim:
```typescript
// Okuma
function getFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    logger.warn('localStorage read failed', { key });
    return null;
  }
}

// Yazma
function saveToStorage(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    logger.warn('localStorage write failed', { key });
    return false;
  }
}
```

## Fetch Pattern (Client Component)

```typescript
// API çağrısı — loading/error state ile
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch('/api/endpoint', { method: 'POST', ... });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'İşlem başarısız');
    }
    const result = await res.json();
    setData(result.data);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Hata oluştu');
  } finally {
    setLoading(false);
  }
};
```

## Metadata (SEO)

```typescript
// Server Component'te
export const metadata = {
  title: 'FrameOS — Video Analiz',
  description: 'AI destekli video analiz platformu',
};
```
