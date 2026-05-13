import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { enforceRateLimit } from '@/lib/rateLimitGuard';
import { logger } from '@/lib/logger';

const ClientSchema = z.object({
  name: z.string().min(1),
  sector: z.string().min(1),
  city: z.string().optional(),
  ig_handle: z.string().optional(),
  weekly_content_capacity: z.number().int().positive().default(3),
  positioning: z.string().optional(),
  status: z.enum(['lead', 'prospect', 'active', 'inactive', 'completed']).default('lead'),
});

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'DEFAULT');
  if (limited) return limited;

  try {
    const body = await request.json();
    const validatedData = ClientSchema.parse(body);

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: validatedData.name,
        sector: validatedData.sector,
        city: validatedData.city || null,
        ig_handle: validatedData.ig_handle || null,
        weekly_content_capacity: validatedData.weekly_content_capacity,
        positioning: validatedData.positioning || null,
        status: validatedData.status,
      })
      .select()
      .single();

    if (error) {
      logger.error('client create db error', new Error(error.message));
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string; errors?: unknown };
    logger.error('client create error', error instanceof Error ? error : new Error(String(error)));

    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: err.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'DEFAULT');
  if (limited) return limited;

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('clients fetch error', new Error(error.message));
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: unknown) {
    logger.error('clients list error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
