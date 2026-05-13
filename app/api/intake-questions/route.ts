import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { enforceRateLimit } from '@/lib/rateLimitGuard';

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'DEFAULT');
  if (limited) return limited;
  try {
    // Varsayılan form şablonunu getir
    const { data, error } = await supabase
      .from('intake_form_templates')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error || !data) {
      // Fallback to minimal template
      const minimalTemplate = await import('@/lib/minimal-intake-template.json');
      return NextResponse.json({
        template: {
          id: 'minimal',
          name: 'Minimal Intake Form',
          description: 'Basic client intake form',
          questions: minimalTemplate.default
        }
      });
    }

    return NextResponse.json({
      template: {
        id: data.id,
        name: data.name,
        description: data.description,
        questions: data.questions
      }
    });
  } catch (error: any) {
    console.error('Error fetching intake questions:', error);
    
    // Fallback to minimal template
    try {
      const minimalTemplate = await import('@/lib/minimal-intake-template.json');
      return NextResponse.json({
        template: {
          id: 'minimal',
          name: 'Minimal Intake Form',
          description: 'Basic client intake form',
          questions: minimalTemplate.default
        }
      });
    } catch (fallbackError) {
      return NextResponse.json({ 
        error: 'Failed to fetch questions',
        message: error?.message || 'Unknown error'
      }, { status: 500 });
    }
  }
}
