import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeClientIntake } from '@/lib/llm/client-analysis';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
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

    // Save intake form
    const { data: intakeForm, error: intakeError } = await supabase
      .from('client_intake_forms')
      .insert({
        client_id: clientId,
        ...body,
      })
      .select()
      .single();

    if (intakeError) {
      console.error('Error saving intake form:', intakeError);
      return NextResponse.json({ error: 'Failed to save intake form' }, { status: 500 });
    }

    // Analyze with AI
    const analysisResult = await analyzeClientIntake({
      client_name: client.name,
      ...body,
    });

    // Save analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('client_analysis')
      .insert({
        client_id: clientId,
        intake_form_id: intakeForm.id,
        ...analysisResult,
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Error saving analysis:', analysisError);
    }

    return NextResponse.json({
      intake_form: intakeForm,
      analysis: analysis,
    });
  } catch (error: any) {
    console.error('Error processing intake:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
