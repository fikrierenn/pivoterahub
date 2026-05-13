import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest
) {
  const id = request.nextUrl.pathname.split('/').pop();

  if (!id || id === 'undefined') {
    return NextResponse.json(
      { error: 'Video id gecersiz' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('videos')
    .select(`
      id,
      client_id,
      platform,
      url,
      published_at,
      duration_sec,
      captions,
      hashtags,
      transcript,
      ai_analysis,
      video_scores (
        hook_score,
        tempo_score,
        clarity_score,
        cta_score,
        visual_score,
        funnel_stage,
        main_errors,
        ai_comment
      ),
      video_stats (
        views,
        likes,
        comments,
        shares,
        saves,
        engagement_rate
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching video detail:', error);
    return NextResponse.json(
      { error: 'Video detayi alinamadi' },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Video bulunamadi' },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
