import { openai } from '@/lib/openai';
import { z } from 'zod';

// Growth report response schema
const GrowthReportSchema = z.object({
  summary_text: z.string(),
  action_items: z.array(z.string()).min(1).max(5),
});

export type GrowthReportResult = z.infer<typeof GrowthReportSchema>;

const SYSTEM_PROMPT = `You are a data analyst and content coach.
You receive aggregated metrics for a client's recent videos, content categories and hashtags.
Your job is to explain whether they are improving or regressing and propose 5 concrete, practical action items.
Respond in Turkish. Return JSON with summary_text and action_items.`;

interface GrowthReportInput {
  period: {
    date_from: string;
    date_to: string;
  };
  current_period: {
    total_videos: number;
    total_views: number;
    avg_views_per_video: number;
    avg_engagement_rate: number;
  };
  previous_period: {
    total_videos: number;
    total_views: number;
    avg_views_per_video: number;
    avg_engagement_rate: number;
  };
  last_videos: Array<{
    video_id: string;
    published_at: string;
    platform: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    engagement_rate: number;
    combined_score: number;
    label: string;
  }>;
  category_performance?: Array<{
    category: string;
    avg_views: number;
    avg_engagement_rate: number;
  }>;
  hashtag_performance: {
    top_hashtags: Array<{
      hashtag: string;
      usage_count: number;
      avg_views: number;
      avg_engagement_rate: number;
    }>;
    weak_hashtags: Array<{
      hashtag: string;
      usage_count: number;
      avg_views: number;
      avg_engagement_rate: number;
    }>;
  };
}

export function formatGrowthReportInput(input: GrowthReportInput): string {
  return JSON.stringify(input, null, 2);
}

export async function generateGrowthReport(input: GrowthReportInput): Promise<GrowthReportResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: formatGrowthReportInput(input) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    const validated = GrowthReportSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error('Error generating growth report with LLM:', error);
    throw new Error('Failed to generate growth report with AI');
  }
}
