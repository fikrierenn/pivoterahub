import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateLandScripts } from '@/lib/llm/agents/land-script';

const RequestSchema = z.object({
  input: z.string().min(10),
});

export async function POST(req: NextRequest) {
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
