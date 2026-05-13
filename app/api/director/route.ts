import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runDirector, type DirectorMode } from '@/lib/directorAI';
import { enforceRateLimit } from '@/lib/rateLimitGuard';
import { logger } from '@/lib/logger';

const DirectorRequestSchema = z.object({
  mode: z.enum(['scene_director', 'script_rewrite', 'full_rewrite']),
  // scene_director
  cinematicSummary: z.string().optional(),
  // scene_director + script_rewrite
  originalScript: z.string().optional(),
  // script_rewrite
  hookGoal: z.string().optional(),
  // full_rewrite
  topic: z.string().optional(),
  sector: z.string().optional(),
  targetAudience: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'DIRECTOR');
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

  const parsed = DirectorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Eksik veya hatalı parametre',
          issues: parsed.error.issues,
        },
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const start = Date.now();

  // Mode'a göre minimum input kontrolü
  if (input.mode === 'scene_director' && !input.cinematicSummary && !input.originalScript) {
    return NextResponse.json(
      { ok: false, error: { code: 'MISSING_INPUT', message: 'scene_director için cinematicSummary veya originalScript gerekli' } },
      { status: 400 },
    );
  }
  if (input.mode === 'script_rewrite' && !input.originalScript) {
    return NextResponse.json(
      { ok: false, error: { code: 'MISSING_INPUT', message: 'script_rewrite için originalScript gerekli' } },
      { status: 400 },
    );
  }
  if (input.mode === 'full_rewrite' && (!input.topic || !input.sector)) {
    return NextResponse.json(
      { ok: false, error: { code: 'MISSING_INPUT', message: 'full_rewrite için topic ve sector gerekli' } },
      { status: 400 },
    );
  }

  try {
    const result = await runDirector({
      mode: input.mode as DirectorMode,
      cinematicSummary: input.cinematicSummary,
      originalScript: input.originalScript,
      hookGoal: input.hookGoal,
      topic: input.topic,
      sector: input.sector,
      targetAudience: input.targetAudience,
    });

    return NextResponse.json({
      success: true,
      data: result.result,
      modelUsed: result.modelUsed,
      cost: result.cost,
      duration_ms: Date.now() - start,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Director AI çağrısı başarısız';
    logger.error('director endpoint failed', err, { mode: input.mode });
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'DIRECTOR_FAILED', message },
        duration_ms: Date.now() - start,
      },
      { status: 500 },
    );
  }
}
