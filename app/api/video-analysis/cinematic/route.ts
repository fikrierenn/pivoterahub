import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { analyzeCinematic } from '@/lib/directors/cinematicDirector';
import { createTempDir } from '@/lib/ffmpeg';
import { validateVideoUrl, downloadVideo, InvalidVideoUrlError } from '@/lib/videoDownloader';
import { enforceRateLimit } from '@/lib/rateLimitGuard';
import { logger } from '@/lib/logger';

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

/**
 * Sinematik analiz endpoint.
 * - multipart/form-data: video dosyası upload
 * - application/json: { url: string } yt-dlp ile indir
 *
 * Output: 5 frame extract + GPT-4o-mini Vision analizi (composition, lighting,
 * color_palette, camera_movement, visual_strengths/weaknesses, overall_score).
 */
export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'ANALYZE');
  if (limited) return limited;

  const start = Date.now();
  const contentType = request.headers.get('content-type') || '';

  // Cleanup callback'leri — finally'de hepsi çağrılır
  const cleanups: Array<() => Promise<void>> = [];

  try {
    let videoPath: string;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { ok: false, error: { code: 'NO_FILE', message: 'Video dosyası gerekli' } },
          { status: 400 },
        );
      }
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return NextResponse.json(
          { ok: false, error: { code: 'INVALID_TYPE', message: `Tip ${file.type} desteklenmiyor` } },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { ok: false, error: { code: 'TOO_LARGE', message: `${file.size} byte — max ${MAX_FILE_SIZE}` } },
          { status: 400 },
        );
      }

      const { dir, cleanup } = await createTempDir('cinematic-upload');
      cleanups.push(cleanup);
      videoPath = path.join(dir, file.name || 'video.mp4');
      const buf = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(videoPath, buf);
    } else if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => null);
      if (!body || typeof body.url !== 'string') {
        return NextResponse.json(
          { ok: false, error: { code: 'INVALID_JSON', message: 'url alanı gerekli' } },
          { status: 400 },
        );
      }
      try {
        validateVideoUrl(body.url);
      } catch (err) {
        if (err instanceof InvalidVideoUrlError) {
          return NextResponse.json(
            { ok: false, error: { code: 'INVALID_URL', message: err.message } },
            { status: 400 },
          );
        }
        throw err;
      }
      const download = await downloadVideo(body.url, { maxDurationSec: 60 });
      cleanups.push(download.cleanup);
      videoPath = download.filePath;
    } else {
      return NextResponse.json(
        { ok: false, error: { code: 'UNSUPPORTED_CONTENT_TYPE' } },
        { status: 400 },
      );
    }

    const analysis = await analyzeCinematic(videoPath);

    return NextResponse.json({
      success: true,
      data: analysis,
      duration_ms: Date.now() - start,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sinematik analiz başarısız';
    logger.error('cinematic endpoint failed', err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'CINEMATIC_FAILED', message },
        duration_ms: Date.now() - start,
      },
      { status: 500 },
    );
  } finally {
    for (const c of cleanups) {
      await c().catch(() => undefined);
    }
  }
}
