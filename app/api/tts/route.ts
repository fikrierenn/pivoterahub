import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { synthesizeSpeech } from '@/lib/tts';
import { enforceRateLimit } from '@/lib/rateLimitGuard';
import { logger } from '@/lib/logger';

const TTSRequestSchema = z.object({
  text: z.string().min(1).max(4096),
  provider: z.enum(['auto', 'elevenlabs', 'openai']).optional(),
  voice: z.string().optional(),
  openaiVoice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional(),
});

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'TTS');
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_JSON', message: 'Geçerli JSON gerekli' } },
      { status: 400 },
    );
  }

  const parsed = TTSRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'VALIDATION_FAILED', issues: parsed.error.issues } },
      { status: 400 },
    );
  }

  try {
    const result = await synthesizeSpeech(parsed.data);
    return new NextResponse(new Uint8Array(result.audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'X-TTS-Provider': result.providerUsed,
        'X-TTS-Char-Count': String(result.charCount),
        'X-TTS-Cost': result.cost.toFixed(6),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'TTS başarısız';
    logger.error('tts endpoint failed', err);
    return NextResponse.json(
      { ok: false, error: { code: 'TTS_FAILED', message } },
      { status: 500 },
    );
  }
}
