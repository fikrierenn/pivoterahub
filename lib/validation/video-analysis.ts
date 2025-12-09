import { z } from 'zod';

export const VideoAnalysisRequestSchema = z.object({
  client_id: z.string().uuid(),
  platform: z.enum(['instagram', 'tiktok', 'youtube']),
  url: z.string().url(),
  external_id: z.string().optional(),
  published_at: z.string().datetime().optional(),
  duration_sec: z.number().int().positive(),
  captions: z.string().optional(),
  hashtags: z.array(z.string()).default([]),
  metrics: z.object({
    views: z.number().int().nonnegative(),
    likes: z.number().int().nonnegative(),
    comments: z.number().int().nonnegative(),
    shares: z.number().int().nonnegative(),
    saves: z.number().int().nonnegative(),
  }).optional(),
});

export type VideoAnalysisRequest = z.infer<typeof VideoAnalysisRequestSchema>;
