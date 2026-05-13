import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { enforceRateLimit } from '@/lib/rateLimitGuard';

export async function GET(req: NextRequest) {
  const limited = await enforceRateLimit(req, 'DEFAULT');
  if (limited) return limited;

  const apiKey = process.env.GEMINI_API_KEY;
  const renderId = req.nextUrl.searchParams.get('renderId');
  const videoId = req.nextUrl.searchParams.get('videoId');
  const fallbackAttempted = req.nextUrl.searchParams.get('fallback') === '1';

  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY tanimli degil.' }, { status: 500 });
  }

  if (!renderId) {
    return NextResponse.json({ error: 'renderId gerekli.' }, { status: 400 });
  }

  const startVeoWithModels = async (
    prompt: string,
    negativePrompt: string,
    aspectRatio: string,
    models: string[]
  ) => {
    const ai = new GoogleGenAI({ apiKey });
    let lastError = 'Veo baslatilamadi';

    for (const model of models) {
      try {
        const operation = await ai.models.generateVideos({
          model,
          prompt,
          config: {
            aspectRatio: aspectRatio || '9:16',
            durationSeconds: 8,
            negativePrompt: negativePrompt || 'low quality, blurry, static camera',
          },
        });
        if (operation?.name) {
          return operation.name;
        }
        lastError = `Operation ID alinmadi (model ${model})`;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = `${msg} (model ${model})`;
        if (msg.includes('403') || msg.includes('404') || msg.includes('429')) {
          continue;
        }
        break;
      }
    }

    throw new Error(lastError);
  };

  try {
    const ai = new GoogleGenAI({ apiKey });
    const operation = await ai.operations.getVideosOperation({
      operation: { name: renderId },
    });
    const done = Boolean(operation?.done);
    const video = operation?.response?.generatedVideos?.[0]?.video;
    let publicUrl: string | null = null;

    let downloadError: string | null = null;
    let uploadErrorMsg: string | null = null;
    let storagePath: string | null = null;

    if (done && operation?.error?.message && videoId && !fallbackAttempted) {
      const { data: videoData } = await supabase
        .from('videos')
        .select('ai_analysis')
        .eq('id', videoId)
        .single();
      const steps = Array.isArray(videoData?.ai_analysis?.full_script_plan)
        ? videoData.ai_analysis.full_script_plan
        : [];
      const primaryPrompt = steps.map((step: any) => step?.video_generation?.prompt).filter(Boolean).join(' | ');
      const negativePrompt = steps.find((step: any) => step?.video_generation?.negative_prompt)?.video_generation?.negative_prompt;
      const aspectRatio = steps.find((step: any) => step?.video_generation?.aspect_ratio)?.video_generation?.aspect_ratio || '9:16';

      try {
        const newRenderId = await startVeoWithModels(
          primaryPrompt || 'Cinematic real estate montage, drone sweep, modern property',
          negativePrompt || 'low quality, blurry, static camera',
          aspectRatio,
          ['veo-3.1-fast-generate-preview']
        );
        return NextResponse.json({
          status: 'processing',
          url: null,
          error: null,
          fallbackUsed: true,
          newRenderId,
          raw: operation,
        });
      } catch (err) {
        return NextResponse.json({
          status: 'failed',
          url: null,
          error: err instanceof Error ? err.message : 'Fallback baslatilamadi.',
          fallbackUsed: true,
          raw: operation,
        });
      }
    }

    if (done && video && videoId) {
      const tmpFile = path.join(os.tmpdir(), `veo-${videoId}.mp4`);
      try {
        // @google/genai SDK 'files' alanı runtime'da tanımlı ama tipler eksik —
        // SDK güncellenince düz çağrıya geçilecek.
        await (ai as unknown as { files: { download: (args: { file: unknown; downloadPath: string }) => Promise<void> } }).files.download({
          file: video,
          downloadPath: tmpFile,
        });

        const buffer = fs.readFileSync(tmpFile);
        const uploadPath = `${videoId}/veo-output.mp4`;
        storagePath = uploadPath;
        const { error: uploadError } = await supabase.storage
          .from('video-assets')
          .upload(uploadPath, buffer, {
            contentType: 'video/mp4',
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from('video-assets')
            .getPublicUrl(uploadPath);
          publicUrl = publicData.publicUrl;
        } else {
          uploadErrorMsg = uploadError.message;
        }
      } catch (err) {
        downloadError = err instanceof Error ? err.message : String(err);
      } finally {
        try {
          fs.unlinkSync(tmpFile);
        } catch {
          // ignore cleanup errors
        }
      }
    }

    return NextResponse.json({
      status: done ? 'done' : 'processing',
      url: publicUrl,
      error: operation?.error?.message,
      downloadError,
      uploadError: uploadErrorMsg,
      storagePath,
      fallbackUsed: false,
      raw: operation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Render durumu alinamadi.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
