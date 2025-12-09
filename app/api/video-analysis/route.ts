import { NextRequest, NextResponse } from 'next/server';
import { VideoAnalysisRequestSchema } from '@/lib/validation/video-analysis';
import { getClientById, getClientProfileSummary } from '@/lib/db/clients';
import { insertVideo } from '@/lib/db/videos';
import { insertVideoScore } from '@/lib/db/video-scores';
import { insertVideoStats, calculateEngagementRate } from '@/lib/db/video-stats';
import { updateHashtagStats } from '@/lib/db/hashtag-stats';
import { getPreviousScores } from '@/lib/db/video-scores';
import { downloadVideo, transcribeVideo } from '@/lib/whisper/transcribe';
import { analyzeVideo } from '@/lib/llm/video-analysis';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validatedData = VideoAnalysisRequestSchema.parse(body);

    // Check if client exists
    const client = await getClientById(validatedData.client_id);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Download video
    const videoBuffer = await downloadVideo(validatedData.url);
    const filename = `video-${Date.now()}.mp4`;

    // Transcribe with Whisper
    const transcript = await transcribeVideo(videoBuffer, filename);

    // Get client profile and previous scores for LLM
    const clientProfile = await getClientProfileSummary(validatedData.client_id);
    const previousScores = await getPreviousScores(validatedData.client_id, 5);

    // Analyze video with LLM
    const analysisResult = await analyzeVideo({
      client_profile: clientProfile!,
      video_meta: {
        platform: validatedData.platform,
        duration_sec: validatedData.duration_sec,
        captions: validatedData.captions || null,
        hashtags: validatedData.hashtags,
      },
      transcript,
      previous_scores: previousScores,
    });

    // Insert video
    const video = await insertVideo({
      client_id: validatedData.client_id,
      platform: validatedData.platform,
      external_id: validatedData.external_id || null,
      url: validatedData.url,
      published_at: validatedData.published_at || new Date().toISOString(),
      duration_sec: validatedData.duration_sec,
      captions: validatedData.captions || null,
      hashtags: validatedData.hashtags,
      transcript,
      notes: null,
    });

    if (!video) {
      throw new Error('Failed to insert video');
    }

    // Insert video scores
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

    // Insert video stats if metrics provided
    let stats = null;
    if (validatedData.metrics) {
      const engagementRate = calculateEngagementRate(
        validatedData.metrics.likes,
        validatedData.metrics.comments,
        validatedData.metrics.shares,
        validatedData.metrics.saves,
        validatedData.metrics.views
      );

      stats = await insertVideoStats({
        client_id: validatedData.client_id,
        video_id: video.id,
        snapshot_date: new Date().toISOString().split('T')[0],
        views: validatedData.metrics.views,
        likes: validatedData.metrics.likes,
        comments: validatedData.metrics.comments,
        shares: validatedData.metrics.shares,
        saves: validatedData.metrics.saves,
        engagement_rate: engagementRate,
      });

      // Update hashtag stats
      await updateHashtagStats(
        validatedData.client_id,
        validatedData.hashtags,
        validatedData.metrics.views,
        engagementRate
      );
    }

    // Return response
    return NextResponse.json({
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
      stats: stats ? {
        views: stats.views,
        likes: stats.likes,
        comments: stats.comments,
        shares: stats.shares,
        saves: stats.saves,
        engagement_rate: stats.engagement_rate,
      } : null,
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
