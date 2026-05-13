# PivoteraHub (ClientBrain) - Development Roadmap

## 📋 İçindekiler
1. [Kritik Eksiklikler ve Acil Düzeltmeler](#kritik-eksiklikler)
2. [V1 - Production Ready (Mutlaka Olmalı)](#v1-production-ready)
3. [V2 - Enhanced Features (Değer Katanlar)](#v2-enhanced-features)
4. [V3 - Market Leader (Rekabet Avantajı)](#v3-market-leader)
5. [Gelir Modeli Önerileri](#gelir-modeli)

---

# 🚨 KRİTİK EKSİKLİKLER VE ACİL DÜZELTMELER

## 1. GÜVENLİK (SECURITY) - KRİTİK ⚠️

### A. Authentication/Authorization YOK
**Problem:** API'ler tamamen açık, herhangi biri kullanabilir

**Çözüm:**
```typescript
// middleware.ts oluşturulmalı
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = { 
  matcher: ["/api/:path*", "/clients/:path*", "/videos/:path*", "/analytics/:path*"] 
};
```

**Action Items:**
- [ ] NextAuth.js veya Supabase Auth entegrasyonu
- [ ] API route'larına authentication middleware ekle
- [ ] User-based client filtering (her kullanıcı sadece kendi müşterilerini görmeli)
- [ ] Supabase Row Level Security (RLS) policies aktif et

**SQL:**
```sql
-- Supabase RLS Policy
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);
```

---

### B. Rate Limiting YOK
**Problem:** Sınırsız OpenAI API çağrısı = maliyet bombası

**Çözüm:**
```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 video/saat
  analytics: true,
});

// API route'ta kullanım:
export async function POST(request: NextRequest) {
  const identifier = request.headers.get("x-user-id") || "anonymous";
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", reset },
      { status: 429 }
    );
  }

  // ... devam et
}
```

**Action Items:**
- [ ] `npm install @upstash/ratelimit @upstash/redis`
- [ ] Upstash Redis hesabı aç
- [ ] Environment variables ekle (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
- [ ] Tüm API route'lara rate limiting ekle
- [ ] User-based ve IP-based rate limiting
- [ ] Dashboard'da kullanıcıya kalan limiti göster

---

### C. Input Validation Zayıf
**Problem:** URL doğrulaması yok, herhangi bir URL indirilebilir

**Çözüm:**
```typescript
// lib/validation/video-url.ts
const ALLOWED_DOMAINS = [
  'instagram.com',
  'www.instagram.com',
  'tiktok.com',
  'www.tiktok.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be'
];

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export function validateVideoUrl(url: string): void {
  try {
    const parsedUrl = new URL(url);
    const isAllowed = ALLOWED_DOMAINS.some(domain => 
      parsedUrl.hostname.endsWith(domain)
    );
    
    if (!isAllowed) {
      throw new Error('Invalid video URL domain');
    }
  } catch (error) {
    throw new Error('Invalid URL format');
  }
}

export function validateVideoSize(buffer: Buffer): void {
  if (buffer.length > MAX_VIDEO_SIZE) {
    throw new Error(`Video too large. Maximum size: ${MAX_VIDEO_SIZE / 1024 / 1024}MB`);
  }
}
```

**Action Items:**
- [ ] URL domain whitelist kontrolü
- [ ] File size limiti (max 100MB)
- [ ] Video duration limiti (max 5 dakika)
- [ ] Malicious content scanning (VirusTotal API)
- [ ] MIME type validation

---

## 2. HATA YÖNETİMİ (ERROR HANDLING) - KRİTİK ⚠️

### A. Custom Error Classes
**Problem:** Generic error messages, debugging zor

**Çözüm:**
```typescript
// lib/errors.ts
export class VideoDownloadError extends Error {
  constructor(message: string, public code: string, public url: string) {
    super(message);
    this.name = 'VideoDownloadError';
  }
}

export class WhisperTranscriptionError extends Error {
  constructor(message: string, public code: string, public videoId: string) {
    super(message);
    this.name = 'WhisperTranscriptionError';
  }
}

export class LLMAnalysisError extends Error {
  constructor(message: string, public code: string, public context: any) {
    super(message);
    this.name = 'LLMAnalysisError';
  }
}

// API route'ta kullanım:
try {
  const videoBuffer = await downloadVideo(url);
} catch (error) {
  if (error instanceof VideoDownloadError) {
    logger.error('Video download failed', {
      url: error.url,
      code: error.code,
      message: error.message
    });
    return NextResponse.json(
      { error: 'Failed to download video', code: error.code },
      { status: 400 }
    );
  }
  throw error;
}
```

**Action Items:**
- [ ] Custom error classes oluştur
- [ ] Error codes standardize et
- [ ] User-friendly error messages
- [ ] Developer-friendly error logs
- [ ] Error tracking (Sentry entegrasyonu)

---

### B. Retry Logic ile Resilience
**Problem:** Whisper veya OpenAI timeout olursa direkt hata

**Çözüm:**
```typescript
// lib/utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry
  } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1;
      
      if (isLastAttempt) {
        throw error;
      }

      // Bazı hatalarda retry yapma (örn: 400 Bad Request)
      if (error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      
      if (onRetry) {
        onRetry(error, attempt + 1);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}

// Kullanım:
const transcript = await retryWithBackoff(
  () => transcribeVideo(videoBuffer, filename),
  {
    maxRetries: 3,
    baseDelay: 2000,
    onRetry: (error, attempt) => {
      logger.warn(`Whisper retry attempt ${attempt}`, { error });
    }
  }
);
```

**Action Items:**
- [ ] Retry logic utility oluştur
- [ ] OpenAI API çağrılarına retry ekle
- [ ] Whisper API çağrılarına retry ekle
- [ ] Database operations'a retry ekle
- [ ] Circuit breaker pattern (opsiyonel)

---

## 3. PERFORMANS & SCALABILITY - ÖNEMLİ 🔥

### A. Video Download Memory Leak Riski
**Problem:** Büyük videolar memory'de tutulur → crash

**Çözüm:**
```typescript
// lib/whisper/transcribe.ts - Streaming version
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

export async function downloadVideoStream(url: string, filePath: string): Promise<void> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new VideoDownloadError(
      `Failed to download: ${response.statusText}`,
      'DOWNLOAD_FAILED',
      url
    );
  }

  if (!response.body) {
    throw new VideoDownloadError('No response body', 'NO_BODY', url);
  }

  const fileStream = createWriteStream(filePath);
  
  // Stream ile indir, memory'ye yükleme
  await pipeline(
    response.body as any,
    fileStream
  );
}

export async function transcribeVideo(url: string, filename: string): Promise<string> {
  const tempDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(tempDir, `${Date.now()}-${filename}`);

  try {
    // Stream ile indir
    await downloadVideoStream(url, tempFilePath);

    // Transcribe
    const transcription = await retryWithBackoff(() =>
      openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: 'tr',
      })
    );

    return transcription.text;
  } finally {
    // Cleanup
    if (fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath);
    }
  }
}
```

**Action Items:**
- [ ] Streaming download implementasyonu
- [ ] Temp file cleanup guarantee (finally block)
- [ ] Disk space monitoring
- [ ] Memory usage monitoring
- [ ] Video size pre-check (HEAD request)

---

### B. Database N+1 Query Problem
**Problem:** Döngü içinde query → yavaş

**Çözüm:**
```typescript
// ❌ YANLIŞ
const videos = await getVideosByClientId(clientId);
const lastVideos = await Promise.all(
  videos.map(async video => {
    const stat = await getVideoStatById(video.id); // N+1 problem!
    const score = await getVideoScoreById(video.id);
    return { video, stat, score };
  })
);

// ✅ DOĞRU - Single query with JOIN
export async function getVideosWithStatsAndScores(
  clientId: string,
  dateFrom: string,
  dateTo: string
) {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      video_stats!inner(
        views,
        likes,
        comments,
        shares,
        saves,
        engagement_rate
      ),
      video_scores!inner(
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
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

**Action Items:**
- [ ] Tüm N+1 query'leri tespit et
- [ ] JOIN ile optimize et
- [ ] Database indexes ekle
- [ ] Query performance monitoring
- [ ] Slow query logging

---

### C. Caching Strategy
**Problem:** Aynı data sürekli fetch ediliyor

**Çözüm:**
```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

// Video transcript cache (değişmez data)
export const getCachedTranscript = unstable_cache(
  async (videoId: string) => {
    const { data } = await supabase
      .from('videos')
      .select('transcript')
      .eq('id', videoId)
      .single();
    return data?.transcript;
  },
  ['video-transcript'],
  { 
    revalidate: 3600 * 24 * 7, // 1 hafta
    tags: ['transcript']
  }
);

// Client profile cache (sık değişmeyen data)
export const getCachedClientProfile = unstable_cache(
  async (clientId: string) => {
    return await getClientProfileSummary(clientId);
  },
  ['client-profile'],
  { 
    revalidate: 3600, // 1 saat
    tags: ['profile']
  }
);

// Cache invalidation
import { revalidateTag } from 'next/cache';

export async function updateClientProfile(clientId: string, data: any) {
  await supabase.from('client_analysis').update(data).eq('client_id', clientId);
  revalidateTag('profile');
}
```

**Redis Caching (Advanced):**
```typescript
// lib/redis-cache.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  // Cache'den kontrol et
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  // Cache'de yoksa fetch et
  const data = await fetcher();
  
  // Cache'e yaz
  await redis.setex(key, ttlSeconds, data);
  
  return data;
}

// Kullanım:
const clientStats = await getCachedData(
  `client:${clientId}:stats`,
  () => getClientStats(clientId),
  3600 // 1 saat
);
```

**Action Items:**
- [ ] Next.js unstable_cache kullan
- [ ] Redis setup (Upstash veya Vercel KV)
- [ ] Cache invalidation stratejisi
- [ ] Cache hit/miss monitoring
- [ ] Cache key naming convention

---

## 4. VERİ TUTARLIĞI (DATA INTEGRITY) - KRİTİK ⚠️

### A. Database Transactions
**Problem:** Video insert başarılı ama score insert fail olursa orphan data

**Çözüm:**
```sql
-- PostgreSQL Function ile Atomic Transaction
CREATE OR REPLACE FUNCTION insert_video_with_scores(
  p_client_id uuid,
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
  p_views bigint,
  p_likes bigint,
  p_comments bigint,
  p_shares bigint,
  p_saves bigint
) RETURNS json AS $$
DECLARE
  v_video_id uuid;
  v_engagement_rate numeric(6,4);
BEGIN
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
  );

  -- Calculate engagement rate
  v_engagement_rate := CASE
    WHEN p_views > 0 THEN
      (p_likes + p_comments + p_shares + p_saves)::numeric / p_views::numeric
    ELSE 0
  END;

  -- Insert stats
  INSERT INTO video_stats (
    client_id, video_id, views, likes, comments, shares, saves, engagement_rate
  ) VALUES (
    p_client_id, v_video_id, p_views, p_likes, p_comments, p_shares, p_saves, v_engagement_rate
  );

  -- Return result
  RETURN json_build_object(
    'video_id', v_video_id,
    'success', true
  );

EXCEPTION WHEN OTHERS THEN
  -- Rollback happens automatically
  RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

```typescript
// TypeScript kullanımı:
export async function insertVideoWithScoresAtomic(data: VideoAnalysisData) {
  const { data: result, error } = await supabase.rpc('insert_video_with_scores', {
    p_client_id: data.client_id,
    p_platform: data.platform,
    p_url: data.url,
    p_published_at: data.published_at,
    p_duration_sec: data.duration_sec,
    p_captions: data.captions,
    p_hashtags: data.hashtags,
    p_transcript: data.transcript,
    p_hook_score: data.scores.hook_score,
    p_tempo_score: data.scores.tempo_score,
    p_clarity_score: data.scores.clarity_score,
    p_cta_score: data.scores.cta_score,
    p_visual_score: data.scores.visual_score,
    p_funnel_stage: data.scores.funnel_stage,
    p_main_errors: data.scores.main_errors,
    p_ai_comment: data.scores.ai_comment,
    p_views: data.stats?.views || 0,
    p_likes: data.stats?.likes || 0,
    p_comments: data.stats?.comments || 0,
    p_shares: data.stats?.shares || 0,
    p_saves: data.stats?.saves || 0,
  });

  if (error) {
    throw new DatabaseError('Failed to insert video with scores', 'TRANSACTION_FAILED', error);
  }

  return result;
}
```

**Action Items:**
- [ ] PostgreSQL functions oluştur
- [ ] Tüm multi-table insert'leri transaction'a çevir
- [ ] Rollback testing
- [ ] Transaction timeout ayarları
- [ ] Deadlock handling

---

### B. Duplicate Prevention
**Problem:** Aynı video birden fazla eklenebilir

**Çözüm:**
```sql
-- Database level constraint
CREATE UNIQUE INDEX uq_videos_url ON videos(url);
CREATE UNIQUE INDEX uq_videos_external_id ON videos(platform, external_id) WHERE external_id IS NOT NULL;
```

```typescript
// Application level check
export async function checkVideoDuplicate(url: string): Promise<string | null> {
  const { data } = await supabase
    .from('videos')
    .select('id')
    .eq('url', url)
    .maybeSingle();

  return data?.id || null;
}

// API route'ta kullanım:
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Check duplicate
  const existingVideoId = await checkVideoDuplicate(body.url);
  if (existingVideoId) {
    return NextResponse.json(
      { 
        error: 'Video already exists',
        video_id: existingVideoId,
        message: 'This video has already been analyzed'
      },
      { status: 409 } // Conflict
    );
  }

  // ... devam et
}
```

**Action Items:**
- [ ] Database unique constraints ekle
- [ ] Application level duplicate check
- [ ] User-friendly duplicate message
- [ ] "Re-analyze" özelliği (aynı video'yu yeniden analiz et)
- [ ] Duplicate detection için hash-based approach (URL normalize)

---

## 5. MONİTORİNG & LOGGING - ÖNEMLİ 🔍

### A. Structured Logging
**Problem:** console.log/console.error sadece → production'da debug edilemiyor

**Çözüm:**
```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'clientbrain-api' },
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    // All logs
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

// Development'ta console'a da yaz
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export { logger };

// Kullanım:
logger.info('Video analysis started', {
  client_id: clientId,
  video_url: url,
  user_id: userId
});

logger.error('Video download failed', {
  client_id: clientId,
  video_url: url,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});

logger.warn('Rate limit approaching', {
  user_id: userId,
  current_usage: 8,
  limit: 10
});
```

**Action Items:**
- [ ] Winston veya Pino logger kurulumu
- [ ] Log levels standardize et (error, warn, info, debug)
- [ ] Structured logging format (JSON)
- [ ] Log rotation (günlük/haftalık dosyalar)
- [ ] Log aggregation (Datadog, LogRocket, Better Stack)

---

### B. Error Tracking (Sentry)
**Problem:** Production hataları kaybolup gidiyor

**Çözüm:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  environment: process.env.NODE_ENV,
  
  beforeSend(event, hint) {
    // PII filtreleme
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});

// API route'ta kullanım:
import * as Sentry from "@sentry/nextjs";

export async function POST(request: NextRequest) {
  try {
    // ... işlemler
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: 'video-analysis',
        client_id: clientId,
      },
      extra: {
        video_url: url,
        request_body: body,
      }
    });
    throw error;
  }
}
```

**Action Items:**
- [ ] Sentry kurulumu
- [ ] Source maps upload (production debugging)
- [ ] PII data filtreleme
- [ ] Error grouping configuration
- [ ] Alert rules (email/Slack)
- [ ] Performance monitoring

---

### C. Metrics & Alerting
**Problem:** Sistemin sağlığını bilmiyoruz

**Çözüm:**
```typescript
// lib/metrics.ts
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, number> = new Map();

  static getInstance() {
    if (!this.instance) {
      this.instance = new MetricsCollector();
    }
    return this.instance;
  }

  increment(metric: string, value: number = 1) {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }

  gauge(metric: string, value: number) {
    this.metrics.set(metric, value);
  }

  async recordTiming(metric: string, fn: () => Promise<any>) {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.gauge(`${metric}.duration_ms`, duration);
      return result;
    } catch (error) {
      this.increment(`${metric}.error`);
      throw error;
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}

// Kullanım:
const metrics = MetricsCollector.getInstance();

// Video analysis başarı/başarısızlık
metrics.increment('video_analysis.success');
metrics.increment('video_analysis.failure');

// API latency
await metrics.recordTiming('openai.whisper', async () => {
  return await transcribeVideo(buffer, filename);
});

// Daily cost tracking
metrics.gauge('openai.daily_cost_usd', 15.50);
```

**Monitoring Dashboard:**
```typescript
// app/api/metrics/route.ts
export async function GET() {
  const metrics = MetricsCollector.getInstance().getMetrics();
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    metrics,
    health: {
      database: await checkDatabaseHealth(),
      openai: await checkOpenAIHealth(),
    }
  });
}
```

**Action Items:**
- [ ] Metrics collection system
- [ ] Daily cost tracking
- [ ] Success/failure rate monitoring
- [ ] API latency tracking
- [ ] Alert rules (Slack/Email):
  - Error rate > 5%
  - Daily cost > $100
  - API latency > 10s
  - Database connection failures

---

## 6. PRODUCTION HAZIRLIĞI - KRİTİK ⚠️

### A. Environment Variables Güvenliği
**Problem:** Development config production'a sızmış

**Çözüm:**
```bash
# .env.development
NODE_ENV=development
NODE_TLS_REJECT_UNAUTHORIZED=0  # SADECE DEVELOPMENT!
LOG_LEVEL=debug

# .env.production
NODE_ENV=production
# TLS verification AÇIK (default)
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
CACHE_ENABLED=true
```

```typescript
// lib/config.ts
export const config = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // TLS reject production'da ASLA kapalı olmamalı
  tlsRejectUnauthorized: process.env.NODE_ENV === 'production',
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    timeout: process.env.OPENAI_TIMEOUT ? parseInt(process.env.OPENAI_TIMEOUT) : 30000,
  },
  
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    videosPerHour: parseInt(process.env.RATE_LIMIT_VIDEOS_PER_HOUR || '10'),
  },
  
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL || '3600'),
  },
};

// Startup validation
export function validateConfig() {
  const required = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  if (config.isProduction && !config.tlsRejectUnauthorized) {
    throw new Error('TLS certificate validation must be enabled in production');
  }
}
```

**Action Items:**
- [ ] Environment-specific .env files
- [ ] Startup config validation
- [ ] Secrets management (Vercel, AWS Secrets Manager)
- [ ] Config documentation
- [ ] Production checklist

---

### B. Health Check Endpoint
**Problem:** Monitoring araçları sistem sağlığını kontrol edemiyor

**Çözüm:**
```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabaseConnection(),
    checkOpenAIConnection(),
    checkRedisConnection(),
