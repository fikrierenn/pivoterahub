// Sinematik analiz — 5 frame extract + GPT-4o-mini Vision.
// Output: kompozisyon, ışık, renk, kamera hareketi, güçlü/zayıf yönler.

import { z } from 'zod';
import OpenAI from 'openai';
import { extractFrames } from '../videoPreprocessor';
import { calculateCost, formatCost } from '../utils/costTracking';
import { logger } from '../logger';

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY env var tanımlı değil');
    openaiClient = new OpenAI({ apiKey: OPENAI_KEY });
  }
  return openaiClient;
}

export const CinematicAnalysisSchema = z.object({
  composition: z.string().describe('Kompozisyon analizi: rule of thirds, balance, leading lines'),
  lighting: z.string().describe('Işık: doğal/yapay, yön, kontrast, ton'),
  color_palette: z.string().describe('Renk paleti: dominant renkler, sıcak/soğuk, mood'),
  camera_movement: z.string().describe('Kamera hareketi: static, pan, zoom, gimbal, drone'),
  visual_strengths: z.array(z.string()).describe('Görsel güçlü yanlar (madde madde)'),
  visual_weaknesses: z.array(z.string()).describe('İyileştirilebilir noktalar (madde madde)'),
  overall_score: z.number().min(0).max(10).describe('Genel sinematik kalite skoru 0-10'),
});

export type CinematicAnalysis = z.infer<typeof CinematicAnalysisSchema>;

const SYSTEM_PROMPT = `Sen bir sinematografi uzmanısın. Sosyal medya videolarının görsel kalitesini analiz edersin.
Frame'leri inceleyerek kompozisyon, ışık, renk, kamera hareketi gibi sinematik öğeleri değerlendirirsin.
Yanıtlar JSON formatında, Türkçe ve özlü olmalı. Skor 0-10 arası gerçekçi ver.`;

const USER_PROMPT = `Bu 5 frame, bir sosyal medya videosundan alındı. Sinematik analiz yap ve aşağıdaki JSON formatında yanıtla:

{
  "composition": "...",
  "lighting": "...",
  "color_palette": "...",
  "camera_movement": "...",
  "visual_strengths": ["..."],
  "visual_weaknesses": ["..."],
  "overall_score": 7
}`;

export async function analyzeCinematic(videoPath: string): Promise<CinematicAnalysis> {
  const start = Date.now();
  const { base64, cleanup } = await extractFrames(videoPath, { maxFrames: 5 });

  try {
    const openai = getOpenAI();

    const imageContent = base64.map((b64) => ({
      type: 'image_url' as const,
      image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'low' as const },
    }));

    const response = await openai.chat.completions.create({
      model: VISION_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [{ type: 'text', text: USER_PROMPT }, ...imageContent],
        },
      ],
      max_tokens: 1500,
    });

    const inputTokens = response.usage?.prompt_tokens ?? 0;
    const outputTokens = response.usage?.completion_tokens ?? 0;
    const cost = calculateCost(VISION_MODEL, inputTokens, outputTokens);

    logger.info('cinematic analysis completed', {
      model: VISION_MODEL,
      inputTokens,
      outputTokens,
      cost: formatCost(cost.estimatedCost),
      ms: Date.now() - start,
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) throw new Error('Vision API boş yanıt döndü');

    const parsed = JSON.parse(rawContent);
    const validated = CinematicAnalysisSchema.safeParse(parsed);
    if (!validated.success) {
      logger.warn('cinematic analysis validation failed', { errors: validated.error.issues });
      // Fallback: schema default'larıyla parse
      return CinematicAnalysisSchema.parse({
        composition: parsed.composition ?? 'Analiz edilemedi',
        lighting: parsed.lighting ?? 'Analiz edilemedi',
        color_palette: parsed.color_palette ?? 'Analiz edilemedi',
        camera_movement: parsed.camera_movement ?? 'Analiz edilemedi',
        visual_strengths: Array.isArray(parsed.visual_strengths) ? parsed.visual_strengths : [],
        visual_weaknesses: Array.isArray(parsed.visual_weaknesses) ? parsed.visual_weaknesses : [],
        overall_score: typeof parsed.overall_score === 'number' ? parsed.overall_score : 5,
      });
    }

    return validated.data;
  } finally {
    await cleanup();
  }
}
