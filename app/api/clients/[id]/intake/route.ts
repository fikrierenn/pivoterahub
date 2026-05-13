import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      console.error('Error saving intake form:', intakeError);
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
    
  } catch (error: any) {
    console.error('Error processing intake:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      console.error('Error updating intake form:', updateError);
      return NextResponse.json({ error: 'Failed to update intake form' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      intake_form: updatedForm,
      message: 'Müşteri bilgileri başarıyla güncellendi'
    });
    
  } catch (error: any) {
    console.error('Error updating intake:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
