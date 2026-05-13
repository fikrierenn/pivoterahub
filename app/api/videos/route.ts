import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { enforceRateLimit } from '@/lib/rateLimitGuard';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'DEFAULT');
  if (limited) return limited;
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
    .order('published_at', { ascending: false });

  if (error) {
    logger.error('videos fetch error', new Error(error.message));
    return NextResponse.json(
      { error: 'Video listesi alinamadi' },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}

export async function DELETE(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'DEFAULT');
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Video id zorunlu' },
      { status: 400 }
    );
  }

  const { error: scoresError } = await supabase
    .from('video_scores')
    .delete()
    .eq('video_id', id);

  if (scoresError) {
    logger.error('video scores delete error', new Error(scoresError.message));
    return NextResponse.json(
      { error: 'Video skorlarini silme basarisiz' },
      { status: 500 }
    );
  }

  const { error: statsError } = await supabase
    .from('video_stats')
    .delete()
    .eq('video_id', id);

  if (statsError) {
    logger.error('video stats delete error', new Error(statsError.message));
    return NextResponse.json(
      { error: 'Video istatistiklerini silme basarisiz' },
      { status: 500 }
    );
  }

  const { error: videoError } = await supabase
    .from('videos')
    .delete()
    .eq('id', id);

  if (videoError) {
    logger.error('video delete error', new Error(videoError.message));
    return NextResponse.json(
      { error: 'Video silme basarisiz' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
