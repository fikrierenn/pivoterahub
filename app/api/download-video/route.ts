import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchVideoMetadata, InvalidVideoUrlError } from '@/lib/videoDownloader';
import { enforceRateLimit } from '@/lib/rateLimitGuard';
import { logger } from '@/lib/logger';

/**
 * Video metadata endpoint.
 *
 * Şu an MVP — sadece metadata döndürür (title, duration, uploader, thumbnail).
 * Gerçek dosya indirme akışı: caller `lib/videoDownloader.downloadVideo()` server-side
 * kullanır (sinematik analiz, transkript). Dosyanın client'a stream edilmesi ayrı plan.
 */
const RequestSchema = z.object({
  url: z.string().url(),
});

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'DOWNLOAD');
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_JSON' } },
      { status: 400 },
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'VALIDATION_FAILED', issues: parsed.error.issues } },
      { status: 400 },
    );
  }

  try {
    const metadata = await fetchVideoMetadata(parsed.data.url);
    return NextResponse.json({ success: true, data: metadata });
  } catch (err) {
    if (err instanceof InvalidVideoUrlError) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_URL', message: err.message } },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : 'Metadata alınamadı';
    logger.error('download-video metadata failed', err, { url: parsed.data.url });
    return NextResponse.json(
      { ok: false, error: { code: 'METADATA_FAILED', message } },
      { status: 500 },
    );
  }
}
