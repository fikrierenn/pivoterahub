// Multi-provider AI cost tracking
// Prices per 1 token (converted from per-1M or per-1K published rates)

interface ModelPricing {
  input: number;   // $ per token
  output: number;  // $ per token
  free?: boolean;  // true = free tier, log $0
}

const PRICING: Record<string, ModelPricing> = {
  // ─── Gemini ────────────────────────────────────────────────
  'gemini-2.5-flash': {
    input: 0.075 / 1_000_000,
    output: 0.30 / 1_000_000,
    free: true, // Free tier: 15 RPM, 1M token/day
  },
  'gemini-2.5-flash-lite': {
    input: 0.10 / 1_000_000,
    output: 0.40 / 1_000_000,
  },
  'gemini-3-flash-preview': {
    input: 0.075 / 1_000_000,
    output: 0.30 / 1_000_000,
    free: true,
  },

  // ─── OpenAI ────────────────────────────────────────────────
  'gpt-4o': {
    input: 2.50 / 1_000_000,
    output: 10.00 / 1_000_000,
  },
  'gpt-4o-mini': {
    input: 0.15 / 1_000_000,
    output: 0.60 / 1_000_000,
  },
  'tts-1': {
    input: 15.00 / 1_000_000, // per character
    output: 0,
  },
  'whisper-1': {
    input: 0.006 / 60, // per second
    output: 0,
  },

  // ─── Claude / Anthropic ────────────────────────────────────
  'claude-haiku-4-5-20251001': {
    input: 1.00 / 1_000_000,
    output: 5.00 / 1_000_000,
  },
  'claude-sonnet-4-6': {
    input: 3.00 / 1_000_000,
    output: 15.00 / 1_000_000,
  },
  'claude-opus-4-7': {
    input: 15.00 / 1_000_000,
    output: 75.00 / 1_000_000,
  },

  // ─── Groq (Llama) — Free Tier ──────────────────────────────
  'llama-3.3-70b-versatile': {
    input: 0,
    output: 0,
    free: true, // 30 RPM, 1k RPD free
  },
  'llama-3.1-8b-instant': {
    input: 0,
    output: 0,
    free: true,
  },

  // ─── Cerebras — Free Tier ──────────────────────────────────
  'cerebras-llama-70b': {
    input: 0,
    output: 0,
    free: true, // 1M token/day free
  },

  // ─── ElevenLabs ────────────────────────────────────────────
  'elevenlabs-turbo': {
    input: 0.30 / 1_000_000, // per character
    output: 0,
  },

  // ─── Minimax ───────────────────────────────────────────────
  'minimax-speech-02-hd': {
    input: 15.00 / 1_000_000,
    output: 0,
  },
  'minimax-speech-02-turbo': {
    input: 8.00 / 1_000_000,
    output: 0,
  },
  'minimax-music-01': {
    input: 0.05 / 60, // per second of music
    output: 0,
  },
  'minimax-video-01': {
    input: 0.15, // flat rate per 6s clip
    output: 0,
  },

  // ─── Google Veo ────────────────────────────────────────────
  'veo-2': {
    input: 0.35 / 60, // per second (estimate)
    output: 0,
  },
};

export interface CostEstimate {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  isFree: boolean;
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens = 0,
): CostEstimate {
  const pricing = PRICING[model] ?? PRICING['gpt-4o-mini'];
  const isFree = pricing.free === true;

  return {
    model,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCost: isFree ? 0 : inputTokens * pricing.input + outputTokens * pricing.output,
    isFree,
  };
}

export function calculateTTSCost(
  charCount: number,
  provider: 'openai' | 'elevenlabs' | 'minimax-hd' | 'minimax-turbo' | 'free' = 'openai',
): CostEstimate {
  const modelMap: Record<string, string> = {
    openai: 'tts-1',
    elevenlabs: 'elevenlabs-turbo',
    'minimax-hd': 'minimax-speech-02-hd',
    'minimax-turbo': 'minimax-speech-02-turbo',
    free: 'llama-3.1-8b-instant', // MMS-TTS-TR placeholder
  };
  return calculateCost(modelMap[provider] ?? 'tts-1', charCount, 0);
}

export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00 (free)';
  if (cost < 0.001) return `$${(cost * 1000).toFixed(3)}m`;
  return `$${cost.toFixed(4)}`;
}
