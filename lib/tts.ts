// TTS (Text-to-Speech) servisi.
// Provider chain: ElevenLabs (kalite) → OpenAI TTS-1 (ucuz fallback).
// Caller `provider: 'auto' | 'elevenlabs' | 'openai'` ile zorlayabilir.

import OpenAI from 'openai';
import { calculateTTSCost, formatCost } from './utils/costTracking';
import { logger } from './logger';

export type TTSProvider = 'auto' | 'elevenlabs' | 'openai';
export type TTSVoice = string;

export interface TTSRequest {
  text: string;
  provider?: TTSProvider;
  voice?: TTSVoice;
  /** Sadece OpenAI için — alloy, echo, fable, onyx, nova, shimmer */
  openaiVoice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

export interface TTSResult {
  audioBuffer: Buffer;
  contentType: string;
  providerUsed: 'elevenlabs' | 'openai';
  charCount: number;
  cost: number;
}

const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_DEFAULT_VOICE = process.env.ELEVENLABS_VOICE_ID || 'nPczCjzI2devNBz1zQrb';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

const MAX_TEXT_LENGTH = 4096; // OpenAI TTS sınırı, ElevenLabs de bu civarda

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!OPENAI_KEY) return null;
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: OPENAI_KEY });
  return openaiClient;
}

async function ttsElevenLabs(text: string, voice: string): Promise<Buffer> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`ElevenLabs ${response.status}: ${errText.slice(0, 200)}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function ttsOpenAI(text: string, voice: TTSRequest['openaiVoice'] = 'nova'): Promise<Buffer> {
  const openai = getOpenAI();
  if (!openai) throw new Error('OPENAI_API_KEY tanımlı değil');
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: voice ?? 'nova',
    input: text,
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function synthesizeSpeech(req: TTSRequest): Promise<TTSResult> {
  const start = Date.now();
  const text = req.text.trim();
  if (!text) throw new Error('TTS için boş metin');
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`TTS metni ${text.length} karakter — max ${MAX_TEXT_LENGTH} sınırını aşıyor`);
  }

  const provider = req.provider ?? 'auto';
  let audioBuffer: Buffer;
  let providerUsed: 'elevenlabs' | 'openai';

  if (provider === 'openai') {
    audioBuffer = await ttsOpenAI(text, req.openaiVoice);
    providerUsed = 'openai';
  } else if (provider === 'elevenlabs') {
    if (!ELEVENLABS_KEY) throw new Error('ELEVENLABS_API_KEY tanımlı değil');
    audioBuffer = await ttsElevenLabs(text, req.voice ?? ELEVENLABS_DEFAULT_VOICE);
    providerUsed = 'elevenlabs';
  } else {
    // auto: ElevenLabs varsa kalite, yoksa OpenAI
    if (ELEVENLABS_KEY) {
      try {
        audioBuffer = await ttsElevenLabs(text, req.voice ?? ELEVENLABS_DEFAULT_VOICE);
        providerUsed = 'elevenlabs';
      } catch (err) {
        logger.warn('elevenlabs failed, openai fallback', { error: err instanceof Error ? err.message : String(err) });
        audioBuffer = await ttsOpenAI(text, req.openaiVoice);
        providerUsed = 'openai';
      }
    } else {
      audioBuffer = await ttsOpenAI(text, req.openaiVoice);
      providerUsed = 'openai';
    }
  }

  const cost = calculateTTSCost(text.length, providerUsed === 'elevenlabs' ? 'elevenlabs' : 'openai');
  logger.info('tts completed', {
    provider: providerUsed,
    charCount: text.length,
    cost: formatCost(cost.estimatedCost),
    ms: Date.now() - start,
  });

  return {
    audioBuffer,
    contentType: 'audio/mpeg',
    providerUsed,
    charCount: text.length,
    cost: cost.estimatedCost,
  };
}
