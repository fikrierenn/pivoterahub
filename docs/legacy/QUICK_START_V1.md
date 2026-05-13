# ⚡ Quick Start Guide - V1 Implementation

**Bu hafta yapılacaklar** (Day 1-7)

---

## 🎯 WEEK 1 GOALS

- ✅ Authentication (NextAuth.js)
- ✅ Rate Limiting (Upstash)
- ✅ Error Handling (Sentry + Custom Errors)
- ✅ Basic Monitoring

**Success Criteria:** API'ler güvenli ve korunmuş

---

## 📦 DAY 1-2: AUTHENTICATION

### Install Dependencies
```bash
npm install next-auth @auth/supabase-adapter
```

### Environment Variables
`.env.local` dosyasına ekle:
```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>

# Google OAuth (https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Create Auth Config
`app/api/auth/[...nextauth]/route.ts`
```typescript
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

### Create Middleware
`middleware.ts`
```typescript
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

### Add user_id to clients table
```sql
-- supabase/migrations/20250112_add_user_id.sql
ALTER TABLE clients ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Update existing clients (for testing)
UPDATE clients SET user_id = '<your-test-user-id>';

-- Make required
ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;

-- Index
CREATE INDEX idx_clients_user ON clients(user_id);
```

### Enable Supabase RLS
```sql
-- supabase/migrations/20250112_enable_rls.sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see only their clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert only their clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update only their clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete only their clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);
```

### Test Auth
```bash
# Start dev server
npm run dev

# Visit http://localhost:3000
# Click login → should redirect to Google
# After login → check session
```

**✅ Checklist:**
- [ ] NextAuth.js installed
- [ ] Google OAuth configured
- [ ] Middleware created
- [ ] RLS policies enabled
- [ ] Login/logout working
- [ ] Protected routes working

---

## 📦 DAY 3-4: RATE LIMITING

### Setup Upstash Redis
1. Sign up: https://upstash.com
2. Create Redis database
3. Copy credentials

### Install Dependencies
```bash
npm install @upstash/ratelimit @upstash/redis
```

### Environment Variables
```bash
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### Create Rate Limit Utility
`lib/rate-limit.ts`
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const videoAnalysisRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 videos per hour
  analytics: true,
  prefix: "ratelimit:video-analysis",
});

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 h"), // 100 requests per hour
  analytics: true,
  prefix: "ratelimit:api",
});
```

### Apply to API Routes
`app/api/video-analysis/route.ts`
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { videoAnalysisRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // 1. Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2. Check rate limit
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
        },
      }
    );
  }

  // 3. Continue with video analysis
  // ...
}
```

### Test Rate Limiting
```bash
# Make 11 requests in 1 hour
# 11th should return 429
curl -X POST http://localhost:3000/api/video-analysis \
  -H "Cookie: next-auth.session-token=your_token" \
  -d '{"client_id": "..."}'
```

**✅ Checklist:**
- [ ] Upstash Redis setup
- [ ] Rate limit utility created
- [ ] Applied to all API routes
- [ ] Rate limit headers added
- [ ] Testing passed

---

## 📦 DAY 5-6: ERROR HANDLING

### Install Sentry
```bash
npx @sentry/wizard@latest -i nextjs
```

### Environment Variables
```bash
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
```

### Create Custom Errors
`lib/errors/index.ts`
```typescript
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
    super(message, "VIDEO_DOWNLOAD_FAILED", 400);
  }
}

export class WhisperTranscriptionError extends AppError {
  constructor(message: string, public videoId: string) {
    super(message, "WHISPER_FAILED", 500);
  }
}

export class LLMAnalysisError extends AppError {
  constructor(message: string, public context: any) {
    super(message, "LLM_ANALYSIS_FAILED", 500);
  }
}

export class RateLimitError extends AppError {
  constructor(public reset: Date) {
    super("Rate limit exceeded", "RATE_LIMIT_EXCEEDED", 429);
  }
}
```

### Create Error Handler
`lib/errors/handler.ts`
```typescript
import { NextResponse } from "next/server";
import { AppError } from "./index";
import * as Sentry from "@sentry/nextjs";

export function handleError(error: unknown): NextResponse {
  console.error("Error:", error);

  // Send to Sentry
  if (process.env.NODE_ENV === "production" && error instanceof Error) {
    Sentry.captureException(error);
  }

  // Handle known errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  // Zod validation errors
  if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
    return NextResponse.json(
      {
        error: "Validation error",
        code: "VALIDATION_ERROR",
        details: (error as any).errors,
      },
      { status: 400 }
    );
  }

  // Unknown error
  return NextResponse.json(
    {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    },
    { status: 500 }
  );
}
```

### Apply to API Routes
```typescript
import { handleError } from "@/lib/errors/handler";

export async function POST(request: NextRequest) {
  try {
    // ... your code
  } catch (error) {
    return handleError(error);
  }
}
```

### Create Retry Utility
`lib/utils/retry.ts`
```typescript
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) throw error;

      // Don't retry 4xx errors
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries exceeded");
}
```

### Use Retry in Whisper
`lib/whisper/transcribe.ts`
```typescript
import { retryWithBackoff } from "@/lib/utils/retry";

export async function transcribeVideo(buffer: Buffer, filename: string): Promise<string> {
  return retryWithBackoff(
    async () => {
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-1",
        language: "tr",
      });
      return transcription.text;
    },
    {
      maxRetries: 3,
      baseDelay: 2000,
    }
  );
}
```

**✅ Checklist:**
- [ ] Sentry installed
- [ ] Custom error classes
- [ ] Error handler middleware
- [ ] Retry utility
- [ ] Applied to all API routes
- [ ] Testing passed

---

## 📦 DAY 7: LOGGING & MONITORING

### Install Winston
```bash
npm install winston
```

### Create Logger
`lib/logger.ts`
```typescript
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "clientbrain-api" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
  );
}
```

### Use Logger
```typescript
import { logger } from "@/lib/logger";

// Info
logger.info("Video analysis started", {
  client_id: clientId,
  video_url: url,
});

// Warning
logger.warn("Rate limit approaching", {
  user_id: userId,
  current: 8,
  limit: 10,
});

// Error
logger.error("Video download failed", {
  error: error.message,
  stack: error.stack,
  url: videoUrl,
});
```

### Create Health Check
`app/api/health/route.ts`
```typescript
export async function GET() {
  try {
    // Check database
    const { error: dbError } = await supabase.from("clients").select("count").limit(1);

    // Check OpenAI
    let openaiOk = true;
    try {
      await openai.models.list();
    } catch {
      openaiOk = false;
    }

    const status = !dbError && openaiOk ? "healthy" : "unhealthy";

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database: !dbError,
        openai: openaiOk,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
      },
      { status: 500 }
    );
  }
}
```

**✅ Checklist:**
- [ ] Winston installed
- [ ] Logger created
- [ ] Logging added to all API routes
- [ ] Health check endpoint
- [ ] Testing passed

---

## 🧪 TESTING CHECKLIST

### Manual Testing
```bash
# 1. Authentication
- [ ] Can login with Google
- [ ] Can logout
- [ ] Protected routes redirect to login
- [ ] Logged in user can access dashboard

# 2. Rate Limiting
- [ ] 10 video analysis requests work
- [ ] 11th returns 429
- [ ] Rate limit headers present
- [ ] After 1 hour, reset works

# 3. Error Handling
- [ ] Invalid video URL → 400 error with code
- [ ] Invalid client_id → 404 error
- [ ] Network timeout → retry → eventually fail gracefully
- [ ] Errors appear in Sentry dashboard

# 4. Logging
- [ ] Logs written to files
- [ ] Console logs in development
- [ ] No logs in production console (only files)

# 5. Health Check
- [ ] /api/health returns 200 when healthy
- [ ] Shows database and OpenAI status
```

---

## 📊 WEEK 1 METRICS

End of week review:

```bash
# Check errors in logs
grep "ERROR" logs/error.log | wc -l
# Target: < 10

# Check Sentry
# Visit Sentry dashboard
# Target: 0 unhandled errors

# Check Upstash
# Visit Upstash dashboard
# Verify rate limit analytics

# Load test
ab -n 100 -c 10 http://localhost:3000/api/health
# Target: 100% success rate
```

---

## 🚀 NEXT WEEK (Week 2)

### Performance & Data Integrity
- [ ] Streaming video download
- [ ] Database transactions
- [ ] Query optimization
- [ ] Caching with Redis
- [ ] Duplicate prevention

---

## 📚 RESOURCES

### Documentation
- NextAuth.js: https://next-auth.js.org
- Upstash: https://docs.upstash.com
- Sentry: https://docs.sentry.io/platforms/javascript/guides/nextjs
- Winston: https://github.com/winstonjs/winston

### Tools
- Postman: API testing
- Insomnia: Alternative API client
- pgAdmin: PostgreSQL management
- Sentry Dashboard: Error tracking

---

## ❓ TROUBLESHOOTING

### Issue: "Unauthorized" even after login
**Solution:** Check session in API route
```typescript
const session = await getServerSession(authOptions);
console.log("Session:", session); // Debug
```

### Issue: Rate limit not working
**Solution:** Verify Upstash credentials
```bash
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
```

### Issue: Sentry not capturing errors
**Solution:** Check Sentry DSN
```bash
echo $NEXT_PUBLIC_SENTRY_DSN
# Manually test
Sentry.captureMessage("Test error");
```

### Issue: Logs not writing to files
**Solution:** Create logs directory
```bash
mkdir -p logs
chmod 755 logs
```

---

## 🎉 WEEK 1 COMPLETION

Congratulations! Week 1 tamamlandı.

**Achieved:**
- ✅ Secure authentication
- ✅ Rate limiting
- ✅ Professional error handling
- ✅ Structured logging
- ✅ Health monitoring

**API'ler artık:**
- 🔒 Güvenli
- 🚦 Rate limited
- 🛡️ Error handled
- 📊 Monitored

**Next:** Week 2 - Performance & Data Integrity

---

**Questions?** Check `MASTER_ROADMAP.md` for overall plan.