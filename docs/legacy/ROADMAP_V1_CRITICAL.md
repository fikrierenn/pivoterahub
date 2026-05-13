# V1 - PRODUCTION READY (Mutlaka Olmalı)

**Süre:** 4-6 hafta  
**Hedef:** Güvenli, stabil, production'a hazır sistem

---

## 🔒 PHASE 1: GÜVENLİK (1-2 hafta)

### 1.1 Authentication & Authorization
**Öncelik:** ⚠️ KRİTİK

**Implementation:**
```bash
npm install next-auth @auth/supabase-adapter
```

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      session.user.id = user.id;
      return session;
    },
  },
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

```typescript
// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/api/video-analysis/:path*",
    "/api/growth-report/:path*",
    "/clients/:path*",
    "/videos/:path*",
  ],
};
```

**Supabase RLS:**
```sql
-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_stats ENABLE ROW LEVEL SECURITY;

-- Policies for clients table
CREATE POLICY "Users see only their clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert only their clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update only their clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for videos table (through clients)
CREATE POLICY "Users see their client videos"
  ON videos FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Repeat for other tables...
```

**Checklist:**
- [ ] NextAuth.js kurulumu
- [ ] Google OAuth setup
- [ ] Email/Password provider (opsiyonel)
- [ ] Middleware oluşturma
- [ ] Supabase RLS policies
- [ ] User ID ile client'ları filtreleme
- [ ] Protected routes test
- [ ] Login/Logout UI
- [ ] Session management

---

### 1.2 Rate Limiting
**Öncelik:** ⚠️ KRİTİK

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const videoAnalysisRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "ratelimit:video-analysis",
});

export const apiRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 h"),
  analytics: true,
  prefix: "ratelimit:api",
});
```

```typescript
// app/api/video-analysis/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const { success, limit, reset, remaining } = await videoAnalysisRateLimit.limit(
    session.user.id
  );

  if (!success) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        limit,
        remaining,
        reset: new Date(reset),
      },
      { 
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        }
      }
    );
  }

  // ... devam
}
```

**Checklist:**
- [ ] Upstash Redis hesabı
- [ ] Environment variables
- [ ] Rate limit middleware
- [ ] User-based limiting
- [ ] IP-based limiting (guest users için)
- [ ] Rate limit headers (X-RateLimit-*)
- [ ] User-friendly error messages
- [ ] Dashboard'da quota gösterme
- [ ] Admin override (opsiyonel)

---

### 1.3 Input Validation & Sanitization
**Öncelik:** ⚠️ KRİTİK

```typescript
// lib/validation/video-url.ts
const ALLOWED_DOMAINS = [
  'instagram.com',
  'www.instagram.com',
  'tiktok.com',
  'www.tiktok.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
];

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DURATION_SEC = 300; // 5 dakika

export class VideoValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'VideoValidationError';
  }
}

export function validateVideoUrl(url: string): void {
  try {
    const parsedUrl = new URL(url);
    const isAllowed = ALLOWED_DOMAINS.some(domain =>
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
    );

    if (!isAllowed) {
      throw new VideoValidationError(
        `Only videos from Instagram, TikTok, and YouTube are allowed`,
        'INVALID_DOMAIN'
      );
    }

    // Protocol check
    if (parsedUrl.protocol !== 'https:') {
      throw new VideoValidationError(
        'Only HTTPS URLs are allowed',
        'INVALID_PROTOCOL'
      );
    }
  } catch (error) {
    if (error instanceof VideoValidationError) throw error;
    throw new VideoValidationError('Invalid URL format', 'INVALID_FORMAT');
  }
}

export async function validateVideoSize(url: string): Promise<void> {
  const response = await fetch(url, { method: 'HEAD' });
  const contentLength = response.headers.get('content-length');

  if (contentLength && parseInt(contentLength) > MAX_VIDEO_SIZE) {
    throw new VideoValidationError(
      `Video size exceeds maximum allowed size of ${MAX_VIDEO_SIZE / 1024 / 1024}MB`,
      'VIDEO_TOO_LARGE'
    );
  }
}

export function validateVideoDuration(durationSec: number): void {
  if (durationSec > MAX_DURATION_SEC) {
    throw new VideoValidationError(
      `Video duration exceeds maximum allowed duration of ${MAX_DURATION_SEC / 60} minutes`,
      'VIDEO_TOO_LONG'
    );
  }
}
```

**Zod Schema Enhancement:**
```typescript
// lib/validation/video-analysis.ts
import { z } from 'zod';

export const VideoAnalysisRequestSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  platform: z.enum(['instagram', 'tiktok', 'youtube']),
  url: z.string().url('Invalid URL').refine(
    (url) => {
      try {
        validateVideoUrl(url);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid video URL domain' }
  ),
  external_id: z.string().max(255).optional(),
  published_at: z.string().datetime().optional(),
  duration_sec: z.number().int().min(1).max(300),
  captions: z.string().max(5000).optional(),
  hashtags: z.array(z.string().max(100)).max(30).default([]),
  metrics: z.object({
    views: z.number().int().min(0),
    likes: z.number().int().min(0),
    comments: z.number().int().min(0),
    shares: z.number().int().min(0),
    saves: z.number().int().min(0),
  }).optional(),
});
```

**Checklist:**
- [ ] URL domain whitelist
- [ ] URL protocol check (only HTTPS)
- [ ] Video size pre-check (HEAD request)
- [ ] Video duration validation
- [ ] Caption length limits
- [ ] Hashtag count limits
- [ ] XSS prevention (sanitize text inputs)
- [ ] SQL injection prevention (parameterized queries)
- [ ] File upload security (MIME type check)

---

## 🛡️ PHASE 2: ERROR HANDLING (1 hafta)

### 2.1 Custom Error Classes
**Öncelik:** ⚠️ KRİTİK

```typescript
// lib/errors/index.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class VideoDownloadError extends AppError {
  constructor(message: string, public url: string) {
    super(message, 'VIDEO_DOWNLOAD_FAILED', 400);
  }
}

export class WhisperTranscriptionError extends AppError {
  constructor(message: string, public videoId: string) {
    super(message, 'WHISPER_FAILED', 500);
  }
}

export class LLMAnalysisError extends AppError {
  constructor(message: string, public context: any) {
    super(message, 'LLM_ANALYSIS_FAILED', 500);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, public operation: string) {
    super(message, 'DATABASE_ERROR', 500);
  }
}

export class RateLimitError extends AppError {
  constructor(public reset: Date) {
    super('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403, true);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400, true);
  }
}
```

**Error Handler Middleware:**
```typescript
// lib/errors/handler.ts
import { NextResponse } from 'next/server';
import { AppError } from './index';
import { logger } from '../logger';
import * as Sentry from '@sentry/nextjs';

export function handleError(error: unknown): NextResponse {
  // Log error
  logger.error('Request error', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    name: error instanceof Error ? error.name : undefined,
  });

  // Send to Sentry (production)
  if (process.env.NODE_ENV === 'production' && error instanceof Error) {
    Sentry.captureException(error);
  }

  // Handle known errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error instanceof ValidationError && { fields: error.fields }),
        ...(error instanceof RateLimitError && { reset: error.reset }),
      },
      { status: error.statusCode }
    );
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
    return NextResponse.json(
      {
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: (error as any).errors,
      },
      { status: 400 }
    );
  }

  // Unknown error (don't expose details)
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}
```

**API Route Usage:**
```typescript
// app/api/video-analysis/route.ts
import { handleError } from '@/lib/errors/handler';

export async function POST(request: NextRequest) {
  try {
    // ... işlemler
  } catch (error) {
    return handleError(error);
  }
}
```

**Checklist:**
- [ ] Custom error classes
- [ ] Error handler middleware
- [ ] Consistent error format
- [ ] Error logging
- [ ] User-friendly messages
- [ ] Developer-friendly details (dev mode)
- [ ] Error codes documentation

---

### 2.2 Retry Logic
**Öncelik:** 🔥 ÖNEMLİ

```typescript
// lib/utils/retry.ts
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryableErrors?: string[];
  onRetry?: (error: Error, attempt: number) => void;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
    onRetry,
  } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) {
        throw error;
      }

      // Don't retry client errors (4xx)
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      // Check if error is retryable
      const isRetryable = retryableErrors.some(code =>
        error.code === code || error.message?.includes(code)
      );

      if (!isRetryable && error.statusCode !== 500 && error.statusCode !== 503) {
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 1000;
      const delay = exponentialDelay + jitter;

      if (onRetry) {
        onRetry(error, attempt + 1);
      }

      logger.warn('Retrying after error', {
        attempt: attempt + 1,
        maxRetries,
        delay,
        error: error.message,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}
```

**Usage Examples:**
```typescript
// Whisper transcription with retry
const transcript = await retryWithBackoff(
  () => openai.audio.transcriptions.create({
    file: fs.createReadStream(tempFilePath),
    model: 'whisper-1',
    language: 'tr',
  }),
  {
    maxRetries: 3,
    baseDelay: 2000,
    onRetry: (error, attempt) => {
      logger.warn(`Whisper retry attempt ${attempt}`, { error: error.message });
    },
  }
);

// LLM analysis with retry
const analysis = await retryWithBackoff(
  () => analyzeVideo(analysisInput),
  {
    maxRetries: 2,
    baseDelay: 1000,
  }
);

// Database operation with retry
const result = await retryWithBackoff(
  () => supabase.from('videos').insert(videoData),
  {
    maxRetries: 3,
    baseDelay: 500,
  }
);
```

**Checklist:**
- [ ] Retry utility function
- [ ] Exponential backoff
- [ ] Jitter (randomness)
- [ ] Retryable error detection
- [ ] Max retry configuration
- [ ] Retry logging
- [ ] Circuit breaker (opsiyonel)

---

## 🚀 PHASE 3: PERFORMANCE (1-2 hafta)

### 3.1 Streaming Video Download
**Öncelik:** 🔥 ÖNEMLİ

```typescript
// lib/whisper/streaming-transcribe.ts
import { pipeline } from 'stream/promises';
import { createWriteStream, createReadStream } from 'fs';
import { unlink } from 'fs/promises';

export async function downloadVideoStream(
  url: string,
  filePath: string
): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new VideoDownloadError(
      `Failed to download: ${response.statusText}`,
      url
    );
  }

  if (!response.body) {
    throw new VideoDownloadError('No response body', url);
  }

  const fileStream = createWriteStream(filePath);

  try {
    // @ts-ignore - Node.js stream
    await pipeline(response.body, fileStream);
  } catch (error) {
    // Cleanup on error
    await unlink(filePath).catch(() => {});
    throw new VideoDownloadError(
      `Download failed: ${error.message}`,
      url
    );
  }
}

export async function transcribeVideoOptimized(
  url: string,
  filename: string
): Promise<string> {
  const tempDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(tempDir, `${Date.now()}-${filename}`);

  try {
    // Validate URL
    validateVideoUrl(url);

    // Check size before download
    await validateVideoSize(url);

    // Download with streaming
    await downloadVideoStream(url, tempFilePath);

    // Transcribe with retry
    const transcription = await retryWithBackoff(
      () => openai.audio.transcriptions.create({
        file: createReadStream(tempFilePath),
        model: 'whisper-1',
        language: 'tr',
      }),
      {
        maxRetries: 3,
        baseDelay: 2000,
      }
    );

    return transcription.text;
  } finally {
    // Always cleanup temp file
    if (fs.existsSync(tempFilePath)) {
      await unlink(tempFilePath).catch(error => {
        logger.error('Failed to cleanup temp file', {
          filePath: tempFilePath,
          error: error.message,
        });
      });
    }
  }
}
```

**Checklist:**
- [ ] Streaming download implementation
- [ ] Memory usage monitoring
- [ ] Temp file cleanup guarantee
- [ ] Disk space checks
- [ ] Concurrent download limits
- [ ] Download progress tracking (opsiyonel)

---

### 3.2 Database Query Optimization
**Öncelik:** 🔥 ÖNEMLİ

**JOIN Queries:**
```typescript
// lib/db/videos.ts - Optimized
export async function getVideosWithStatsAndScores(
  clientId: string,
  dateFrom: string,
  dateTo: string,
  limit: number = 10
) {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      id,
      url,
      platform,
      published_at,
      duration_sec,
      captions,
      hashtags,
      transcript,
      video_stats!inner (
        views,
        likes,
        comments,
        shares,
        saves,
        engagement_rate,
        snapshot_date
      ),
      video_scores!inner (
        hook_score,
        tempo_score,
        clarity_score,
        cta_score,
        visual_score,
        funnel_stage,
        main_errors,
        ai_comment
      )
    `)
    .eq('client_id', clientId)
    .gte('published_at', dateFrom)
    .lte('published_at', dateTo)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw new DatabaseError('Failed to fetch videos', 'SELECT');
  return data;
}
```

**Database Indexes:**
```sql
-- Migration: add_performance_indexes.sql

-- Videos table indexes
CREATE INDEX IF NOT EXISTS idx_videos_client_published 
  ON videos(client_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_videos_platform 
  ON videos(platform);

CREATE INDEX IF NOT EXISTS idx_videos_url_hash 
  ON videos(md5(url)); -- For duplicate detection

-- Full-text search on transcript (Turkish)
CREATE INDEX IF NOT EXISTS idx_videos_transcript_search 
  ON videos USING gin(to_tsvector('turkish', transcript));

-- Video stats indexes
CREATE INDEX IF NOT EXISTS idx_video_stats_video_snapshot 
  ON video_stats(video_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_video_stats_engagement 
  ON video_stats(client_id, engagement_rate DESC);

-- Video scores indexes
CREATE INDEX IF NOT EXISTS idx_video_scores_video 
  ON video_scores(video_id);

CREATE INDEX IF NOT EXISTS idx_video_scores_combined_score 
  ON video_scores(
    client_id,
    ((hook_score + tempo_score + clarity_score + cta_score + visual_score) / 5) DESC
  );

CREATE INDEX IF NOT EXISTS idx_video_scores_funnel 
  ON video_scores(client_id, funnel_stage);

-- Hashtag stats indexes
CREATE INDEX IF NOT EXISTS idx_hashtag_stats_client_usage 
  ON hashtag_stats(client_id, usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_hashtag_stats_client_engagement 
  ON hashtag_stats(client_id, avg_engagement_rate DESC);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_videos_client_platform_published 
  ON videos(client_id, platform, published_at DESC);
```

**Checklist:**
- [ ] N+1 query'leri tespit et ve düzelt
- [ ] JOIN kullan, multiple query'leri azalt
- [ ] Database indexes ekle
- [ ] EXPLAIN ANALYZE ile query performance test
- [ ] Slow query logging aktif et
- [ ] Connection pooling ayarları
- [ ] Query result caching

---

### 3.3 Caching Strategy
**Öncelik:** 🔥 ÖNEMLİ

```bash
npm install @upstash/redis
```

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';
import { unstable_cache } from 'next/cache';

const redis = Redis.fromEnv();

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  // Try cache first
  const cached = await redis.get<T>(key);
  if (cached !== null) {
    logger.debug('Cache hit', { key });
    return cached;
  }

  // Cache miss - fetch data
  logger.debug('Cache miss', { key });
  const data = await fetcher();

  // Store in cache
  await redis.setex(key, ttlSeconds, data);

  return data;
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
    logger.info('Cache invalidated', { pattern, count: keys.length });
  }
}
```

**Usage Examples:**
```typescript
// Cache video transcript (never changes)
export async function getVideoTranscript(videoId: string): Promise<string | null> {
  return getCachedData(
    `video:${videoId}:transcript`,
    async () => {
      const { data } = await supabase
        .from('videos')
        .select('transcript')
        .eq('id', videoId)
        .single();
      return data?.transcript || null;
    },
    3600 * 24 * 7 // 1 week
  );
}

// Cache client profile (changes infrequently)
export async function getClientProfile(clientId: string) {
  return getCachedData(
    `client:${clientId}:profile`,
    async () => {
      return await getClientProfileSummary(clientId);
    },
    3600 // 1 hour
  );
}

// Cache growth report (expensive calculation)
export async function getCachedGrowthReport(
  clientId: string,
  dateFrom: string,
  dateTo: string
) {
  const cacheKey = `growth-report:${clientId}:${dateFrom}:${dateTo}`;
  return getCachedData(
    cacheKey,
    async () => {
      return await generateGrowthReport(clientId, dateFrom, dateTo);
    },
    1800 // 30 minutes
  );
}

// Invalidate cache when client updated
export async function updateClient(clientId: string, data: any) {
  await supabase.from('clients').update(data).eq('id', clientId);
  await invalidateCache(`client:${clientId}:*`);
}
```

**Next.js Server Component Caching:**
```typescript
// app/clients/[id]/page.tsx
import { unstable_cache } from 'next/cache';

const getClientData = unstable_cache(
  async (clientId: string) => {
    return await getClientById(clientId);
  },
  ['client-data'],
  {
    revalidate: 3600,
    tags: ['client'],
  }
);

export default async function ClientPage({ params }: { params: { id: string } }) {
  const client = await getClientData(params.id);
  // ...
}
```

**Checklist:**
- [ ] Redis setup (Upstash or Vercel KV)
- [ ] Cache key naming convention
- [ ] TTL strategy (per data type)
- [ ] Cache invalidation
- [ ] Cache hit/miss monitoring
- [ ] Cache size monitoring
- [ ] Next.js cache configuration

---

## 💾 PHASE 4: DATA INTEGRITY (1 hafta)

### 4.1 Database Transactions
**Öncelik:** ⚠️ KRİTİK

```sql
-- supabase/migrations/20250112_atomic_video_insert.sql

CREATE OR REPLACE FUNCTION insert_video_with_related_data(
  p_client_id uuid,
  p_user_id uuid,
  p_platform text,
  p_url text,
  p_published_at timestamptz,
  p_duration_sec integer,
  p_captions text,
  p_hashtags text[],
  p_transcript text,
  p_hook_score smallint,
  p_tempo_score smallint,
  p_clarity_score smallint,
  p_cta_score smallint,
  p_visual_score smallint,
  p_funnel_stage text,
  p_main_errors text[],
  p_ai_comment text,
  p_views bigint DEFAULT 0,
  p_likes bigint DEFAULT 0,
  p_comments bigint DEFAULT 0,
  p_shares bigint DEFAULT 0,
  p_saves bigint DEFAULT 0
) RETURNS json AS $$
DECLARE
  v_video_id uuid;
  v_score_id uuid;
  v_stats_id uuid;
  v_engagement_rate numeric(6,4);
BEGIN
  -- Authorization check
  IF NOT EXISTS (
    SELECT 1 FROM clients WHERE id = p_client_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Client not found or unauthorized';
  END IF;

  -- Duplicate check
  IF EXISTS (SELECT 1 FROM videos WHERE url = p_url) THEN
    RAISE EXCEPTION 'Video with this URL already exists';
  END IF;

  -- Insert video
  INSERT INTO videos (
    client_id, platform, url, published_at, duration_sec,
    captions, hashtags, transcript
  ) VALUES (
    p_client_id, p_platform, p_url, p_published_at, p_duration_sec,
    p_captions, p_hashtags, p_transcript
  ) RETURNING id INTO v_video_id;

  -- Insert scores
  INSERT INTO video_scores (
    client_id, video_id, hook_score, tempo_score, clarity_score,
    cta_score, visual_score, funnel_stage, main_errors, ai_comment
  ) VALUES (
    p_client_id, v_video_id, p_hook_score, p_tempo_score, p_clarity_score,
    p_cta_score, p_visual_score, p_funnel_stage, p_main_errors, p_ai_comment
  ) RETURNING id INTO v_score_id;

  -- Calculate engagement rate
  IF p_views > 0 THEN
    v_engagement_rate := (p_likes + p_comments + p_shares + p_saves)::numeric / p_views::numeric;
  ELSE
    v_engagement_rate := 0;
  END IF;

  -- Insert stats (if provided)
  IF p_views > 0 THEN
    INSERT INTO video_stats (
      client_id, video_id, views, likes, comments, shares, saves, engagement_rate
    ) VALUES (
      p_client_id, v_video_id, p_views, p_likes, p_comments, p_shares, p_saves, v_engagement_rate
    ) RETURNING id INTO v_stats_id;
  END IF;

  -- Update hashtag stats
  PERFORM update_hashtag_stats_for_video(p_client_id, v_video_id, p_hasht