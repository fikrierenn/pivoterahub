import { openai } from '@/lib/openai';
import { z } from 'zod';

// Video analysis response schema
const VideoAnalysisSchema = z.object({
  hook_score: z.number().min(0).max(10),
  tempo_score: z.number().min(0).max(10),
  clarity_score: z.number().min(0).max(10),
  cta_score: z.number().min(0).max(10),
  visual_score: z.number().min(0).max(10),
  funnel_stage: z.enum(['cold', 'warm', 'hot', 'sale']),
  main_errors: z.array(z.string()),
  ai_comment: z.string(),
  improvement_suggestions: z.array(z.string()),
});

export type VideoAnalysisResult = z.infer<typeof VideoAnalysisSchema>;

const SYSTEM_PROMPT = `You are an expert social media video coach for real estate, bridal, wellness and similar advisory businesses.
Given a video transcript, basic metadata and client profile, you will score the video (0–10) on several dimensions and suggest improvements.
Always respond in JSON.`;

interface VideoAnalysisInput {
  client_profile: {
    name: string;
    sector: string;
    city: string | null;
    positioning: string | null;
    weekly_capacity: number;
  };
  video_meta: {
    platform: string;
    duration_sec: number;
    captions: string | null;
    hashtags: string[];
  };
  transcript: string;
  previous_scores: Array<{
    hook_score: number;
    clarity_score: number;
    cta_score: number;
    created_at: string;
  }>;
}

export function formatVideoAnalysisInput(input: VideoAnalysisInput): string {
  return JSON.stringify(input, null, 2);
}

export async function analyzeVideo(input: VideoAnalysisInput): Promise<VideoAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: formatVideoAnalysisInput(input) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    const validated = VideoAnalysisSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error('Error analyzing video with LLM:', error);
    throw new Error('Failed to analyze video with AI');
  }
}
