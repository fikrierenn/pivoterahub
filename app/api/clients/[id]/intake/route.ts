import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { enforceRateLimit } from '@/lib/rateLimitGuard';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await enforceRateLimit(request, 'DEFAULT');
  if (limited) return limited;

  try {
    const { id } = await params;
    const clientId = id;
    const body = await request.json();

    // Get client info
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Save intake form (JSONB format) - UPSERT to handle updates
    const { data: intakeForm, error: intakeError } = await supabase
      .from('client_intake_forms')
      .upsert({
        client_id: clientId,
        answers: body.answers || body, // Support both formats
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (intakeError) {
      logger.error('intake save error', new Error(intakeError.message));
      return NextResponse.json({ error: 'Failed to save intake form' }, { status: 500 });
    }

    // Müşteri durumunu 'prospect' yap (görüşme formu dolduruldu)
    await supabase
      .from('clients')
      .update({ status: 'prospect' })
      .eq('id', clientId);

    return NextResponse.json({
      success: true,
      intake_form: intakeForm,
      message: 'Görüşme formu başarıyla kaydedildi'
    });
    
  } catch (error: unknown) {
    logger.error('intake post error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await enforceRateLimit(request, 'DEFAULT');
  if (limited) return limited;

  try {
    const { id } = await params;
    const clientId = id;
    const body = await request.json();

    // Get existing intake form
    const { data: existingForm } = await supabase
      .from('client_intake_forms')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (!existingForm) {
      return NextResponse.json({ error: 'Intake form not found' }, { status: 404 });
    }

    // Update intake form
    const { data: updatedForm, error: updateError } = await supabase
      .from('client_intake_forms')
      .update({
        answers: body.answers,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .select()
      .single();

    if (updateError) {
      logger.error('intake update error', new Error(updateError.message));
      return NextResponse.json({ error: 'Failed to update intake form' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      intake_form: updatedForm,
      message: 'Müşteri bilgileri başarıyla güncellendi'
    });
    
  } catch (error: unknown) {
    logger.error('intake put error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
