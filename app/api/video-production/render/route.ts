import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';
import { enforceRateLimit } from '@/lib/rateLimitGuard';

const DEFAULT_AUDIO_BUCKET = 'video-assets';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

type ScriptStep = {
  section?: string;
  timing?: string;
  tts_scene?: {
    text?: string;
    style_instruction?: string;
    voice_name?: string;
  };
  script_dialogue?: string;
  video_generation?: {
    prompt?: string;
    negative_prompt?: string;
    aspect_ratio?: string;
  };
};

const numberToTurkishAscii = (value: number) => {
  if (!Number.isFinite(value) || value < 0 || value > 999999999) return '';
  const ones = ['sifir', 'bir', 'iki', 'uc', 'dort', 'bes', 'alti', 'yedi', 'sekiz', 'dokuz'];
  const tens = ['', 'on', 'yirmi', 'otuz', 'kirk', 'elli', 'altmis', 'yetmis', 'seksen', 'doksan'];

  const toWords = (num: number) => {
    if (num === 0) return '';
    const parts: string[] = [];
    const hundred = Math.floor(num / 100);
    const ten = Math.floor((num % 100) / 10);
    const one = num % 10;

    if (hundred > 0) {
      if (hundred === 1) {
        parts.push('yuz');
      } else {
        parts.push(ones[hundred], 'yuz');
      }
    }
    if (ten > 0) {
      parts.push(tens[ten]);
    }
    if (one > 0) {
      parts.push(ones[one]);
    }
    return parts.join(' ');
  };

  if (value === 0) return ones[0];
  const million = Math.floor(value / 1000000);
  const thousand = Math.floor((value % 1000000) / 1000);
  const rest = value % 1000;
  const words: string[] = [];

  if (million > 0) {
    if (million === 1) {
      words.push('bir', 'milyon');
    } else {
      words.push(toWords(million), 'milyon');
    }
  }
  if (thousand > 0) {
    if (thousand === 1) {
      words.push('bin');
    } else {
      words.push(toWords(thousand), 'bin');
    }
  }
  const restWords = toWords(rest);
  if (restWords) {
    words.push(restWords);
  }
  return words.join(' ').trim();
};

const parseTiming = (value?: string) => {
  if (!value) return null;
  const match = value.match(/(\d+)\s*-\s*(\d+)/);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  return { start, length: end - start };
};

const sanitizeTTSText = (text: string) => {
  return text
    .replace(/\[.*?\]|\(.*?\)/g, '')
    .replace(/(Sahne \d+:|Hook:|CTA:|Giris:|Giriş:)/gi, '')
    .replace(/\bm2\b/gi, 'metrekare')
    .replace(/\bkm\b/gi, 'kilometre')
    .replace(/\bkg\b/gi, 'kilogram')
    .replace(/\bcm\b/gi, 'santimetre')
    .replace(/\bmm\b/gi, 'milimetre')
    .replace(/₺|TL/gi, 'turk lirasi')
    .replace(/€/g, 'avro')
    .replace(/\bUSD\b|\$/gi, 'dolar')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\d{1,3}([.,]\d{3})+\b/g, (match) => {
      const normalized = Number(match.replace(/[.,]/g, ''));
      return numberToTurkishAscii(normalized) || match;
    })
    .replace(/\b\d+\b/g, (match) => numberToTurkishAscii(Number(match)) || match);
};

const segmentTTSText = (text: string, maxChars = 1200) => {
  if (text.length <= maxChars) return text;
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > maxChars) {
      if (current) {
        chunks.push(current);
        current = sentence;
      } else {
        chunks.push(sentence.slice(0, maxChars));
        current = sentence.slice(maxChars);
      }
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);

  // Tek TTS istegi icin parcalari birlestiriyoruz (kota icin).
  return chunks.join(' ');
};

const estimateSecondsFromText = (text: string) => {
  const words = text.split(/\s+/).filter(Boolean).length;
  const seconds = Math.ceil(words / 2.7);
  return Math.max(2, seconds);
};

const getTtsModels = () => {
  const envModels = process.env.GEMINI_TTS_MODELS;
  if (envModels) {
    return envModels.split(',').map((m) => m.trim()).filter(Boolean);
  }
  return ['gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts'];
};

const generateGeminiTts = async (
  apiKey: string,
  text: string,
  styleInstruction: string,
  voiceName: string
) => {
  const models = getTtsModels();
  let lastError = 'Gemini TTS hatasi';

  for (const model of models) {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${styleInstruction}: \"${text}\"` }],
            },
          ],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName || 'Kore',
                },
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      lastError = errorText || `Gemini TTS hatasi (${model})`;
      if (response.status === 429 || response.status === 404 || response.status === 403) {
        continue;
      }
      break;
    }

    const result = await response.json();
    const audioData = result?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      lastError = 'TTS cikti bulunamadi.';
      continue;
    }

    return Buffer.from(audioData, 'base64');
  }

  throw new Error(lastError);
};

const getVeoModels = () => {
  const envModels = process.env.GEMINI_VEO_MODELS;
  if (envModels) {
    return envModels.split(',').map((m) => m.trim()).filter(Boolean);
  }
  return ['veo-3.1-generate-preview', 'veo-3.1-fast-generate-preview'];
};

const startVeoGeneration = async (
  apiKey: string,
  prompt: string,
  negativePrompt: string,
  aspectRatio: string
) => {
  const models = getVeoModels();
  let lastError = 'Veo baslatilamadi';
  const ai = new GoogleGenAI({ apiKey });

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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastError = `${message} (model ${model})`;
      if (message.includes('403') || message.includes('404') || message.includes('429')) {
        continue;
      }
      break;
    }
  }

  throw new Error(lastError);
};

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, 'ANALYZE');
  if (limited) return limited;

  const { videoId } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;
  const audioBucket = process.env.SUPABASE_AUDIO_BUCKET || DEFAULT_AUDIO_BUCKET;

  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY tanimli degil.' }, { status: 500 });
  }

  if (!videoId || typeof videoId !== 'string') {
    return NextResponse.json({ error: 'Video id gerekli.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('videos')
      .select('id, ai_analysis')
      .eq('id', videoId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Video bulunamadi.' }, { status: 404 });
    }

    const analysis = data.ai_analysis as {
      full_script_plan?: ScriptStep[];
    };

    const steps = Array.isArray(analysis?.full_script_plan) ? analysis.full_script_plan : [];

    const narrationChunks = steps
      .map((step) => {
        const tts = step.tts_scene || {};
        return tts.text || step.script_dialogue || '';
      })
      .filter((text) => text && text.trim().length > 0);

    const narrationText = segmentTTSText(sanitizeTTSText(narrationChunks.join('\n\n')));
    const audioUrls: string[] = [];
    const audioTimeline: Array<{
      section: string;
      start: number;
      length: number;
      text: string;
    }> = [];

    let cursor = 0;
    for (const step of steps) {
      const tts = step.tts_scene || {};
      const rawText = tts.text || step.script_dialogue || '';
      const cleaned = sanitizeTTSText(rawText);
      if (!cleaned) continue;
      const timing = parseTiming(step.timing);
      const length = timing ? timing.length : estimateSecondsFromText(cleaned);
      const start = timing ? timing.start : cursor;
      cursor = timing ? timing.start + timing.length : cursor + length;

      audioTimeline.push({
        section: step.section || 'BOLUM',
        start,
        length,
        text: cleaned,
      });
    }

    if (narrationText) {
      const primaryTts = steps.find((step) => step.tts_scene?.style_instruction || step.tts_scene?.voice_name)?.tts_scene || {};

      const audioBuffer = await generateGeminiTts(
        apiKey,
        narrationText,
        primaryTts.style_instruction || 'Speak with a firm, authoritative tone',
        primaryTts.voice_name || 'Kore'
      );

      const filePath = `${videoId}/tts-full.wav`;
      const { error: uploadError } = await supabase.storage
        .from(audioBucket)
        .upload(filePath, audioBuffer, {
          contentType: 'audio/wav',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Ses yuklenemedi: ${uploadError.message}`);
      }

      const { data: publicData } = supabase.storage
        .from(audioBucket)
        .getPublicUrl(filePath);

      audioUrls.push(publicData.publicUrl);
    }

    const primaryPrompt = steps.map((step) => step.video_generation?.prompt).filter(Boolean).join(' | ');
    const negativePrompt = steps.find((step) => step.video_generation?.negative_prompt)?.video_generation?.negative_prompt;
    const aspectRatio = steps.find((step) => step.video_generation?.aspect_ratio)?.video_generation?.aspect_ratio || '9:16';

    const operationName = await startVeoGeneration(
      apiKey,
      primaryPrompt || 'Cinematic real estate montage, drone sweep, modern property',
      negativePrompt || 'low quality, blurry, static camera',
      aspectRatio
    );

    return NextResponse.json({
      success: true,
      renderId: operationName,
      audioUrls,
      audioTimeline,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Render baslatilamadi.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
