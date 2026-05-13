import { z } from 'zod';
import { generateJson } from '@/lib/llm/gemini';
import { AIProfileCard } from './professional-analysis';

const DevelopmentPlanSchema = z.object({
  thirty_day_plan: z.string(),
  ninety_day_plan: z.string(),
  goals: z.string(),
  metrics: z.string(),
  first_30_days: z
    .object({
      week1: z.string().optional(),
      week2: z.string().optional(),
      week3: z.string().optional(),
      week4: z.string().optional(),
    })
    .optional(),
  first_90_days: z
    .object({
      month1: z.string().optional(),
      month2: z.string().optional(),
      month3: z.string().optional(),
    })
    .optional(),
  video_frequency: z.string().optional(),
  content_categories: z.array(
    z.object({
      percentage: z.string(),
      description: z.string(),
    })
  ).optional(),
  tone_guidelines: z.string().optional(),
  content_themes: z.array(z.string()).optional(),
  performance_targets: z
    .object({
      day30: z.string().optional(),
      day60: z.string().optional(),
      day90: z.string().optional(),
    })
    .optional(),
});

export interface DevelopmentPlan {
  thirty_day_plan: string;
  ninety_day_plan: string;
  goals: string;
  metrics: string;
  first_30_days?: any;
  first_90_days?: any;
  video_frequency?: string;
  content_categories?: any;
  tone_guidelines?: string;
  content_themes?: any;
  performance_targets?: any;
}

const SYSTEM_PROMPT =
  'Sen sosyal medya gelisim planlari konusunda uzman bir danismansin. Detayli, uygulanabilir planlar yaparsin.';

export async function generateDevelopmentPlan(
  profileCard: AIProfileCard,
  clientData: any
): Promise<DevelopmentPlan> {
  const prompt = `
AI Profil Karti sonuclarina dayanarak detayli gelisim plani olustur.

PROFIL OZETI:
- Profil: ${profileCard.profile_summary}
- Konumlandirma: ${profileCard.positioning_strategy}
- Hedef Kitle: ${profileCard.target_audience}
- Icerik Stratejisi: ${profileCard.content_strategy}

MUSTERI: ${clientData.name} (${clientData.sector})

JSON formatinda dondur:
{
  "thirty_day_plan": "Ilk 30 gunluk detayli plan (HTML)",
  "ninety_day_plan": "Ilk 90 gunluk genel plan (HTML)",
  "goals": "Ana hedefler ve olculebilir kriterler (HTML)",
  "metrics": "Performans metrikleri ve KPI'lar (HTML)",
  "first_30_days": { "week1": "...", "week2": "...", "week3": "...", "week4": "..." },
  "first_90_days": { "month1": "...", "month2": "...", "month3": "..." },
  "video_frequency": "Video sikligi ve yayin plani",
  "content_categories": [
    {"percentage": "40%", "description": "..."},
    {"percentage": "30%", "description": "..."},
    {"percentage": "30%", "description": "..."}
  ],
  "tone_guidelines": "Ton rehberi ve iletisim tarzi",
  "content_themes": ["Tema 1", "Tema 2", "Tema 3"],
  "performance_targets": { "day30": "...", "day60": "...", "day90": "..." }
}

SADECE JSON dondur.
`;

  const parsed = await generateJson(SYSTEM_PROMPT, prompt);
  const validated = DevelopmentPlanSchema.parse(parsed);

  return {
    thirty_day_plan: validated.thirty_day_plan,
    ninety_day_plan: validated.ninety_day_plan,
    goals: validated.goals,
    metrics: validated.metrics,
    first_30_days: validated.first_30_days,
    first_90_days: validated.first_90_days,
    video_frequency: validated.video_frequency,
    content_categories: validated.content_categories,
    tone_guidelines: validated.tone_guidelines,
    content_themes: validated.content_themes,
    performance_targets: validated.performance_targets,
  };
}
