// Director AI orkestratörü.
// 3 mod: scene_director | script_rewrite | full_rewrite.
// Model fallback zinciri: Groq Llama 3.3 70B (free) → GPT-4o-mini → Claude Haiku.

import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { calculateCost, formatCost } from './utils/costTracking';
import { logger } from './logger';
import {
  SCENE_DIRECTOR_SYSTEM,
  SCENE_DIRECTOR_USER,
  SCRIPT_REWRITE_SYSTEM,
  SCRIPT_REWRITE_USER,
  FULL_REWRITE_SYSTEM,
  FULL_REWRITE_USER,
} from './directors/prompts';

export type DirectorMode = 'scene_director' | 'script_rewrite' | 'full_rewrite';

export interface DirectorInput {
  mode: DirectorMode;
  /** scene_director için */
  cinematicSummary?: string;
  /** scene_director ve script_rewrite için */
  originalScript?: string;
  /** script_rewrite için */
  hookGoal?: string;
  /** full_rewrite için */
  topic?: string;
  sector?: string;
  targetAudience?: string;
}

export interface DirectorOutput {
  mode: DirectorMode;
  result: unknown;
  modelUsed: string;
  cost: number;
  durationMs: number;
}

const GROQ_KEY = process.env.GROQ_API_KEY || '';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const OPENAI_MODEL = process.env.OPENAI_DIRECTOR_MODEL || 'gpt-4o-mini';

let groqClient: Groq | null = null;
let openaiClient: OpenAI | null = null;

function getGroq(): Groq | null {
  if (!GROQ_KEY) return null;
  if (!groqClient) groqClient = new Groq({ apiKey: GROQ_KEY });
  return groqClient;
}

function getOpenAI(): OpenAI | null {
  if (!OPENAI_KEY) return null;
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: OPENAI_KEY });
  return openaiClient;
}

function buildMessages(input: DirectorInput): { system: string; user: string } {
  switch (input.mode) {
    case 'scene_director':
      return {
        system: SCENE_DIRECTOR_SYSTEM,
        user: SCENE_DIRECTOR_USER(input.cinematicSummary ?? '', input.originalScript ?? ''),
      };
    case 'script_rewrite':
      return {
        system: SCRIPT_REWRITE_SYSTEM,
        user: SCRIPT_REWRITE_USER(input.originalScript ?? '', input.hookGoal),
      };
    case 'full_rewrite':
      return {
        system: FULL_REWRITE_SYSTEM,
        user: FULL_REWRITE_USER(
          input.topic ?? '',
          input.sector ?? '',
          input.targetAudience ?? '',
        ),
      };
  }
}

interface ProviderResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
}

async function tryGroq(system: string, user: string): Promise<ProviderResult | null> {
  const groq = getGroq();
  if (!groq) return null;
  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 2000,
    });
    const text = response.choices[0]?.message?.content ?? '';
    return {
      text,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      modelUsed: GROQ_MODEL,
    };
  } catch (err) {
    logger.warn('groq failed, fallback OpenAI', { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

async function tryOpenAI(system: string, user: string): Promise<ProviderResult | null> {
  const openai = getOpenAI();
  if (!openai) return null;
  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: 2000,
  });
  const text = response.choices[0]?.message?.content ?? '';
  return {
    text,
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
    modelUsed: OPENAI_MODEL,
  };
}

/**
 * Director AI çağrısı — Groq (free) → OpenAI fallback chain.
 */
export async function runDirector(input: DirectorInput): Promise<DirectorOutput> {
  const start = Date.now();
  const { system, user } = buildMessages(input);

  let provider = await tryGroq(system, user);
  if (!provider) {
    provider = await tryOpenAI(system, user);
  }
  if (!provider) {
    throw new Error('Hiçbir AI provider yapılandırılmamış — GROQ_API_KEY veya OPENAI_API_KEY gerekli');
  }

  let result: unknown;
  try {
    result = JSON.parse(provider.text);
  } catch (err) {
    logger.warn('director output JSON parse hatası', { text: provider.text.slice(0, 200) });
    throw new Error('Director AI JSON parse başarısız');
  }

  const cost = calculateCost(provider.modelUsed, provider.inputTokens, provider.outputTokens);
  const durationMs = Date.now() - start;

  logger.info('director call completed', {
    mode: input.mode,
    model: provider.modelUsed,
    inputTokens: provider.inputTokens,
    outputTokens: provider.outputTokens,
    cost: formatCost(cost.estimatedCost),
    durationMs,
  });

  return {
    mode: input.mode,
    result,
    modelUsed: provider.modelUsed,
    cost: cost.estimatedCost,
    durationMs,
  };
}
