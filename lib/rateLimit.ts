// In-memory rate limiter — tek-instance MVP için yeterli.
// Production'da Redis/Upstash'e taşınmalı (multi-instance için).

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periyodik temizlik — bellek sızıntısı önlemi.
const CLEANUP_INTERVAL_MS = 60_000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer || typeof window !== 'undefined') return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, CLEANUP_INTERVAL_MS);
  // Node.js'te process exit'i bloklamasın
  if (typeof cleanupTimer === 'object' && cleanupTimer !== null && 'unref' in cleanupTimer) {
    (cleanupTimer as { unref: () => void }).unref();
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

/**
 * Sliding-window olmayan basit fixed-window limiter.
 * @param key Benzersiz anahtar (örn: `userId:endpoint` veya `ip:endpoint`)
 * @param limit Pencerede izin verilen istek sayısı
 * @param windowMs Pencere uzunluğu (ms)
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  ensureCleanup();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

// Yaygın preset'ler — endpoint başına çağırırken aynı sabitleri kullan.
export const RATE_LIMITS = {
  ANALYZE: { limit: 5, windowMs: 60 * 60 * 1000 },     // 5/saat — pahalı AI
  DIRECTOR: { limit: 20, windowMs: 60 * 60 * 1000 },   // 20/saat
  TTS: { limit: 50, windowMs: 60 * 60 * 1000 },        // 50/saat
  DOWNLOAD: { limit: 10, windowMs: 60 * 60 * 1000 },   // 10/saat
  AGENT_CHAT: { limit: 60, windowMs: 60 * 60 * 1000 }, // 60/saat — chat akıcı kalmalı
  DEFAULT: { limit: 100, windowMs: 60 * 60 * 1000 },
} as const;
