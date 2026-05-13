# PivotaraHub — Next.js 16 Konvansiyonları

## 1. App Router Kuralları

```
app/
  layout.tsx          # Root layout (server component)
  page.tsx            # Ana sayfa
  api/
    [endpoint]/
      route.ts        # API route (server-side)
  [feature]/
    page.tsx          # Sayfa
    loading.tsx       # Suspense
    error.tsx         # Error boundary
```

## 2. Server vs Client Component

**Server Component (default):**
- Supabase sorguları
- Veri fetch

**Client Component (`'use client'`):**
- useState, useEffect, useRef
- Event listener'lar
- Browser API'leri

**Yasaklar:**
- Client component içinde `supabase` (service role) import etme
- Client component içinde `process.env` (NEXT_PUBLIC_ hariç)

## 3. API Route Yapısı

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  // 1. Auth (ZORUNLU)
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Rate limit
  const rl = checkRateLimit(auth.user.id, 'video-analysis');
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit' }, { status: 429 });

  try {
    // 3. Zod validasyon
    // 4. İş mantığı
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('...', error as Error);
    return NextResponse.json(
      { ok: false, error: { code: 'ERROR_CODE', message: '...' } },
      { status: 500 },
    );
  }
}

export const maxDuration = 300; // Uzun AI işlemleri için
```

## 4. TypeScript Kuralları

- `any` yasak → `unknown` veya proper type
- Props interface tanımı zorunlu
- API response tipleri `src/types/` veya inline interface

## 5. Tailwind 4.1 Kuralları

- Inline style yasak → Tailwind class kullan
- Dark mode: `dark:` prefix
- Mevcut tasarım: slate-900 sidebar, dark gradient, turkuaz/mor aksanlar

## 6. Import Sırası

```typescript
// 1. React / Next.js
import { useState } from 'react';
// 2. Third-party
import { z } from 'zod';
// 3. Internal (@ alias)
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
```
