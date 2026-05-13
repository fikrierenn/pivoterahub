import { generateJsonWithPartsTranscribe } from '@/lib/llm/gemini';

export async function transcribeVideo(videoBuffer: Buffer, filename: string): Promise<string> {
  try {
    const base64 = videoBuffer.toString('base64');
    const mimeType = filename.toLowerCase().endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream';

    const parsed = await generateJsonWithPartsTranscribe(
      'Sen bir transkripsiyon motorusun. Sadece verilen video/audio icin dogru transkripti JSON olarak dondur.',
      'JSON formatinda dondur: {"transcript": "..."}',
      [
        {
          inlineData: {
            data: base64,
            mimeType,
          },
        },
      ]
    );

    if (!parsed || typeof parsed.transcript !== 'string') {
      throw new Error('Invalid transcription response');
    }

    return parsed.transcript;
  } catch (error) {
    const err = error as { message?: string; status?: number; statusText?: string; errorDetails?: unknown; cause?: unknown };
    console.error('Error transcribing video:', {
      message: err?.message,
      status: err?.status,
      statusText: err?.statusText,
      errorDetails: err?.errorDetails,
      cause: err?.cause,
    });
    throw new Error('Failed to transcribe video');
  }
}

export async function downloadVideo(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error downloading video:', error);
    throw new Error('Failed to download video from URL');
  }
}
