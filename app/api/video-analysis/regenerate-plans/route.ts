import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeVideo } from '@/lib/llm/video-analysis';
import { enforceRateLimit } from '@/lib/rateLimitGuard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase ortam degiskenleri eksik.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, 'ANALYZE');
  if (limited) return limited;

  try {
    const body = await req.json();
    const videoId = body?.videoId as string | undefined;
    if (!videoId) {
      return NextResponse.json({ error: 'videoId gerekli.' }, { status: 400 });
    }

    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, client_id, platform, duration_sec, captions, hashtags, transcript, ai_analysis')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video bulunamadi.' }, { status: 404 });
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, sector, city, positioning, weekly_content_capacity')
      .eq('id', video.client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Musteri bulunamadi.' }, { status: 404 });
    }

    let sectorInstruction = '';
    if (client.sector) {
      const { data: sectorRow } = await supabase
        .from('sectors')
        .select('ai_instruction')
        .eq('name', client.sector)
        .single();

      if (sectorRow?.ai_instruction) {
        sectorInstruction = sectorRow.ai_instruction;
      }
    }

    const analysis = await analyzeVideo(
      {
        client_profile: {
          name: client.name,
          sector: client.sector,
          city: client.city,
          positioning: client.positioning,
          weekly_capacity: client.weekly_content_capacity,
        },
        video_meta: {
          platform: video.platform,
          duration_sec: video.duration_sec || 0,
          hashtags: video.hashtags || [],
          captions: video.captions,
        },
        transcript: video.transcript || '',
        previous_scores: [],
      },
      {
        sectorInstruction,
        positioning: client.positioning,
      }
    );

    const merged = {
      ...(video.ai_analysis || {}),
      ...analysis,
    };

    const { error: updateError } = await supabase
      .from('videos')
      .update({ ai_analysis: merged, updated_at: new Date().toISOString() })
      .eq('id', videoId);

    if (updateError) {
      return NextResponse.json({ error: 'Analiz kaydedilemedi.' }, { status: 500 });
    }

    return NextResponse.json({ analysis: merged });
  } catch (err) {
    console.error('Plan regen hatasi:', err);
    return NextResponse.json({ error: 'Alternatifler uretilemedi.' }, { status: 500 });
  }
}
