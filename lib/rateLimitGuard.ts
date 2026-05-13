// Rate limit guard — API route başında 2 satırla rate limit kontrolü.
//
// Kullanım:
//   const limited = await enforceRateLimit(request, 'ANALYZE');
//   if (limited) return limited;
//
// Anahtar: user.id varsa user-başı, yoksa ip-başı. Middleware auth'u garanti
// ettiği için user.id genellikle mevcut, ama defense-in-depth ile ip fallback.

import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from './rateLimit';
import { getAuthUser } from './auth';
import { logger } from './logger';

type Preset = keyof typeof RATE_LIMITS;

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function enforceRateLimit(
  request: NextRequest,
  preset: Preset = 'DEFAULT',
): Promise<NextResponse | null> {
  const user = await getAuthUser();
  const identity = user?.id ?? `ip:${clientIp(request)}`;
  const key = `${identity}:${request.nextUrl.pathname}`;
  const { limit, windowMs } = RATE_LIMITS[preset];

  const result = checkRateLimit(key, limit, windowMs);

  if (!result.ok) {
    logger.warn('Rate limit exceeded', {
      identity,
      path: request.nextUrl.pathname,
      preset,
      resetAt: new Date(result.resetAt).toISOString(),
    });

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.',
          resetAt: result.resetAt,
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetAt),
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  return null;
}
