import { z } from 'zod';

export const GrowthReportRequestSchema = z.object({
  client_id: z.string().uuid(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  limit_last_videos: z.number().int().positive().default(10),
});

export type GrowthReportRequest = z.infer<typeof GrowthReportRequestSchema>;
