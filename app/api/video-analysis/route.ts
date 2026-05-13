import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { VideoAnalysisFormSchema, VideoAnalysisRequestSchema, VideoAnalysisRequest, VideoAnalysisFormRequest } from '@/lib/validation/video-analysis';
import { getClientById, getClientProfileSummary } from '@/lib/db/clients';
import { insertVideo } from '@/lib/db/videos';
import { insertVideoScore, getPreviousScores } from '@/lib/db/video-scores';
import { insertVideoStats, calculateEngagementRate } from '@/lib/db/video-stats';
import { updateHashtagStats } from '@/lib/db/hashtag-stats';
import { downloadVideo, transcribeVideo } from '@/lib/whisper/transcribe';
import { analyzeVideo } from '@/lib/llm/video-analysis';
import { analyzeCinematic } from '@/lib/directors/cinematicDirector';
import { createTempDir } from '@/lib/ffmpeg';
import { supabase } from '@/lib/supabase';
import { enforceRateLimit } from '@/lib/rateLimitGuard';
import { logger } from '@/lib/logger';
import { parseFormData } from '@/lib/utils/parseFormData';

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'ANALYZE');
  if (limited) return limited;

  let tempCleanup: (() => Promise<void>) | null = null;

  try {
    const contentType = request.headers.get('content-type') || '';
    let validatedData: VideoAnalysisRequest | VideoAnalysisFormRequest;
    let videoBuffer: Buffer;
    let filename = `video-${Date.now()}.mp4`;
    let urlForStorage: string;

    if (contentType.includes('multipart/form-data')) {
      let parsed: Awaited<ReturnType<typeof parseFormData>>;
      try {
        parsed = await parseFormData(request);
      } catch (parseErr) {
        const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
        logger.error('FormData parse failed', parseErr instanceof Error ? parseErr : new Error(msg));
        return NextResponse.json(
          { error: `Dosya parse hatası: ${msg}` },
          { status: 400 }
        );
      }

      if (!parsed.file) {
        return NextResponse.json({ error: 'Video dosyası bulunamadı' }, { status: 400 });
      }

      const { fields } = parsed;
      const publishedAtRaw = fields.published_at || undefined;
      const publishedAt = publishedAtRaw ? new Date(publishedAtRaw).toISOString() : undefined;

      validatedData = VideoAnalysisFormSchema.parse({
        client_id: fields.client_id,
        platform: fields.platform,
        external_id: fields.external_id || undefined,
        published_at: publishedAt,
        duration_sec: Number(fields.duration_sec),
        captions: fields.captions || undefined,
        hashtags: fields.hashtags ? JSON.parse(fields.hashtags) : [],
        metrics: fields.metrics ? JSON.parse(fields.metrics) : undefined,
      });

      videoBuffer = parsed.file.buffer;
      filename = parsed.file.filename || filename;
      urlForStorage = `local://${filename}`;
    } else {
      const body = await request.json();
      validatedData = VideoAnalysisRequestSchema.parse(body);
      urlForStorage = (validatedData as VideoAnalysisRequest).url;

      logger.info('downloading video from url');
      try {
        videoBuffer = await downloadVideo((validatedData as VideoAnalysisRequest).url);
      } catch (downloadErr) {
        logger.error('Video download failed', downloadErr instanceof Error ? downloadErr : new Error(String(downloadErr)));
        const isSocialMedia = /instagram\.com|tiktok\.com|youtube\.com|youtu\.be|twitter\.com|x\.com/.test(urlForStorage);
        return NextResponse.json(
          {
            error: isSocialMedia
              ? 'Instagram/TikTok URL\'lerinden video indirilemez. Videoyu cihazınıza indirip dosya olarak yükleyin.'
              : 'Video URL\'sinden indirilemedi. Dosya olarak yüklemeyi deneyin.',
          },
          { status: 400 }
        );
      }
    }

    const client = await getClientById(validatedData.client_id);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Sinematik analiz için videoBuffer'ı temp dosyaya yaz
    const { dir, cleanup } = await createTempDir('video-analysis');
    tempCleanup = cleanup;
    const tempVideoPath = path.join(dir, filename);
    await fs.writeFile(tempVideoPath, videoBuffer);

    // Transkript + sinematik analiz paralel
    logger.info('video analysis starting parallel tasks');
    const [transcriptResult, cinematicResult] = await Promise.allSettled([
      transcribeVideo(videoBuffer, filename),
      analyzeCinematic(tempVideoPath),
    ]);

    if (transcriptResult.status === 'rejected') {
      throw new Error(`Transkript alınamadı: ${transcriptResult.reason instanceof Error ? transcriptResult.reason.message : String(transcriptResult.reason)}`);
    }
    const transcript = transcriptResult.value;

    const cinematic = cinematicResult.status === 'fulfilled' ? cinematicResult.value : null;
    if (cinematicResult.status === 'rejected') {
      logger.warn('cinematic analysis skipped (partial failure)', {
        error: cinematicResult.reason instanceof Error ? cinematicResult.reason.message : String(cinematicResult.reason),
      });
    }

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

    logger.info('running gemini video analysis');
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
    // Sinematik sonucu ai_analysis'e ekle
    const mergedAnalysis = cinematic ? { ...analysisResult, cinematic } : analysisResult;

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
      ai_analysis: mergedAnalysis,
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

    logger.info('video analysis completed successfully');

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
        ai_analysis: mergedAnalysis,
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
      cinematic: cinematic ?? null,
      stats: stats ? {
        views: stats.views,
        likes: stats.likes,
        comments: stats.comments,
        shares: stats.shares,
        saves: stats.saves,
        engagement_rate: stats.engagement_rate,
      } : null,
    });

  } catch (error: unknown) {
    const err = error as { name?: string; message?: string; errors?: unknown };
    logger.error('video analysis error', error instanceof Error ? error : new Error(String(error)));

    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Geçersiz form verisi', details: err.errors },
        { status: 400 }
      );
    }

    const msg = err.message ?? '';
    const is503 = msg.includes('503') || msg.includes('Service Unavailable') || msg.includes('high demand');
    const knownPrefixes = ['Transkript alınamadı', 'Failed to insert video'];
    const isKnown = knownPrefixes.some(p => msg.startsWith(p));

    const userMsg = is503
      ? 'AI modeli şu an aşırı yüklü (503). 1-2 dakika bekleyip tekrar deneyin.'
      : isKnown ? msg : 'Video analizi tamamlanamadı. Lütfen tekrar deneyin.';

    return NextResponse.json({ error: userMsg }, { status: is503 ? 503 : 500 });
  } finally {
    if (tempCleanup) await tempCleanup().catch(() => undefined);
  }
}
