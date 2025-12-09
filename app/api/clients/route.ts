import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const ClientSchema = z.object({
  name: z.string().min(1),
  sector: z.string().min(1),
  city: z.string().optional(),
  ig_handle: z.string().optional(),
  weekly_content_capacity: z.number().int().positive().default(3),
  positioning: z.string().optional(),
});

export async function POST(request: NextRequest) {
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
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
