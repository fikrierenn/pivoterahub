type PollResult = {
  status: 'processing' | 'done' | 'failed';
  url?: string;
  error?: string;
};

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export async function fetchVeoStatus(renderId: string, apiKey: string): Promise<PollResult> {
  const response = await fetch(`${GEMINI_API_BASE}/operations/${renderId}?key=${apiKey}`);
  const result = await response.json();

  if (!response.ok) {
    return {
      status: 'failed',
      error: result?.error?.message || 'Veo durum bilgisi alinamadi.',
    };
  }

  if (!result?.done) {
    return { status: 'processing' };
  }

  const videoUri = result?.response?.generatedVideos?.[0]?.uri;
  return {
    status: videoUri ? 'done' : 'failed',
    url: videoUri,
    error: result?.error?.message,
  };
}
