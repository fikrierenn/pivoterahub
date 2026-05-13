import { NextRequest, NextResponse } from 'next/server';
import { VideoAnalysisFormSchema, VideoAnalysisRequestSchema } from '@/lib/validation/video-analysis';
import { getClientById, getClientProfileSummary } from '@/lib/db/clients';
import { insertVideo } from '@/lib/db/videos';
import { insertVideoScore, getPreviousScores } from '@/lib/db/video-scores';
import { insertVideoStats, calculateEngagementRate } from '@/lib/db/video-stats';
import { updateHashtagStats } from '@/lib/db/hashtag-stats';
import { downloadVideo, transcribeVideo } from '@/lib/whisper/transcribe';
import { analyzeVideo } from '@/lib/llm/video-analysis';
import { supabase } from '@/lib/supabase';
import { enforceRateLimit } from '@/lib/rateLimitGuard';

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'ANALYZE');
  if (limited) return limited;

  try {
    const contentType = request.headers.get('content-type') || '';
    let validatedData: any;
    let videoBuffer: Buffer;
    let filename = `video-${Date.now()}.mp4`;
    let urlForStorage: string;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: 'Video dosyasi bulunamadi' },
          { status: 400 }
        );
      }

      const metricsRaw = formData.get('metrics');
      const hashtagsRaw = formData.get('hashtags');
      const publishedAtRaw = (formData.get('published_at') as string | null) || undefined;
      const publishedAt = publishedAtRaw ? new Date(publishedAtRaw).toISOString() : undefined;

      validatedData = VideoAnalysisFormSchema.parse({
        client_id: formData.get('client_id'),
        platform: formData.get('platform'),
        external_id: formData.get('external_id') || undefined,
        published_at: publishedAt,
        duration_sec: Number(formData.get('duration_sec')),
        captions: formData.get('captions') || undefined,
        hashtags: hashtagsRaw ? JSON.parse(String(hashtagsRaw)) : [],
        metrics: metricsRaw ? JSON.parse(String(metricsRaw)) : undefined,
      });

      const arrayBuffer = await file.arrayBuffer();
      videoBuffer = Buffer.from(arrayBuffer);
      filename = file.name || filename;
      urlForStorage = `local://${filename}`;
    } else {
      const body = await request.json();
      validatedData = VideoAnalysisRequestSchema.parse(body);
      urlForStorage = validatedData.url;

      console.log('Downloading video...');
      videoBuffer = await downloadVideo(validatedData.url);
    }

    const client = await getClientById(validatedData.client_id);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    console.log('Transcribing video with Gemini...');
    const transcript = await transcribeVideo(videoBuffer, filename);
    console.log('Transcription completed');

    const clientProfile = await getClientProfileSummary(validatedData.client_id);
    const previousScores = await getPreviousScores(validatedData.client_id, 5);

    let sectorInstruction = '';
    const clientSector = clientProfile?.sector;

    if (clientSector) {
      const { data: sectorRow } = await supabase
        .from('sectors')
        .select('ai_instruction')
        .eq('name', clientSector)
        .single();

      if (sectorRow?.ai_instruction) {
        sectorInstruction = sectorRow.ai_instruction;
      } else {
        const { data: defaultSector } = await supabase
          .from('sectors')
          .select('ai_instruction')
          .eq('name', 'Genel')
          .single();
        sectorInstruction = defaultSector?.ai_instruction || '';
      }
    }

    const videoBase64 = videoBuffer.toString('base64');
    console.log('Video base64 length:', videoBase64.length);

    console.log('Running AI analysis...');
    const analysisResult = await analyzeVideo({
      client_profile: clientProfile!,
      video_meta: {
        platform: validatedData.platform,
        duration_sec: validatedData.duration_sec,
        captions: validatedData.captions || null,
        hashtags: validatedData.hashtags,
      },
      transcript,
      video_base64: videoBase64,
      previous_scores: previousScores,
    }, {
      sectorInstruction,
      positioning: clientProfile?.positioning,
    });
    console.log('AI analysis completed');

    const video = await insertVideo({
      client_id: validatedData.client_id,
      platform: validatedData.platform,
      external_id: validatedData.external_id || null,
      url: urlForStorage,
      published_at: validatedData.published_at || new Date().toISOString(),
      duration_sec: validatedData.duration_sec,
      captions: validatedData.captions || null,
      hashtags: validatedData.hashtags,
      transcript,
      ai_analysis: analysisResult,
      notes: 'Analysis completed with Gemini transcription',
    });

    if (!video) {
      throw new Error('Failed to insert video');
    }

    const scores = await insertVideoScore({
      client_id: validatedData.client_id,
      video_id: video.id,
      hook_score: analysisResult.hook_score,
      tempo_score: analysisResult.tempo_score,
      clarity_score: analysisResult.clarity_score,
      cta_score: analysisResult.cta_score,
      visual_score: analysisResult.visual_score,
      funnel_stage: analysisResult.funnel_stage,
      main_errors: analysisResult.main_errors,
      ai_comment: analysisResult.ai_comment,
    });

    let stats = null;
    const metricsData = validatedData.metrics;

    if (metricsData && metricsData.views > 0) {
      const engagementRate = calculateEngagementRate(
        metricsData.likes,
        metricsData.comments,
        metricsData.shares || 0,
        metricsData.saves || 0,
        metricsData.views
      );

      stats = await insertVideoStats({
        client_id: validatedData.client_id,
        video_id: video.id,
        snapshot_date: new Date().toISOString().split('T')[0],
        views: metricsData.views,
        likes: metricsData.likes,
        comments: metricsData.comments,
        shares: metricsData.shares || 0,
        saves: metricsData.saves || 0,
        engagement_rate: engagementRate,
      });

      const hashtagsToUpdate = validatedData.hashtags;
      await updateHashtagStats(
        validatedData.client_id,
        hashtagsToUpdate,
        metricsData.views,
        engagementRate
      );
    }

    console.log('Video analysis completed successfully');

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        client_id: video.client_id,
        platform: video.platform,
        url: video.url,
        published_at: video.published_at,
        duration_sec: video.duration_sec,
        captions: video.captions,
        hashtags: video.hashtags,
        transcript: video.transcript,
        ai_analysis: analysisResult,
      },
      scores: {
        hook_score: scores!.hook_score,
        tempo_score: scores!.tempo_score,
        clarity_score: scores!.clarity_score,
        cta_score: scores!.cta_score,
        visual_score: scores!.visual_score,
        funnel_stage: scores!.funnel_stage,
        main_errors: scores!.main_errors,
        ai_comment: scores!.ai_comment,
      },
      analysis_details: {
        improvement_suggestions: analysisResult.improvement_suggestions,
      },
      stats: stats ? {
        views: stats.views,
        likes: stats.likes,
        comments: stats.comments,
        shares: stats.shares,
        saves: stats.saves,
        engagement_rate: stats.engagement_rate,
      } : null
    });

  } catch (error: any) {
    console.error('Video analysis error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
