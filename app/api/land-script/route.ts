import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateLandScripts } from '@/lib/llm/agents/land-script';
import { enforceRateLimit } from '@/lib/rateLimitGuard';

const RequestSchema = z.object({
  input: z.string().min(10),
});

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, 'ANALYZE');
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = RequestSchema.parse(body);
    const result = await generateLandScripts(parsed.input);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Arazi senaryo uretimi basarisiz';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
