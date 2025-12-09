import { openai } from '@/lib/openai';
import { z } from 'zod';

const ClientAnalysisSchema = z.object({
  current_level_assessment: z.string(),
  main_bottlenecks: z.array(z.string()),
  strategic_mistakes: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  realistic_growth_potential: z.string(),
  profile_summary: z.string(),
  positioning_statement: z.string(),
  target_audience_definition: z.string(),
  content_strategy: z.string(),
  opportunities: z.array(z.string()),
  risks: z.array(z.string()),
  three_month_roadmap: z.string(),
  first_30_days_plan: z.object({
    video_count: z.number(),
    categories: z.array(z.string()),
    tone: z.string(),
    themes: z.array(z.string()),
    performance_targets: z.string(),
  }),
  first_90_days_plan: z.object({
    video_count: z.number(),
    categories: z.array(z.string()),
    milestones: z.array(z.string()),
  }),
  initial_report: z.string(),
});

export type ClientAnalysisResult = z.infer<typeof ClientAnalysisSchema>;

const SYSTEM_PROMPT = `Sen profesyonel bir sosyal medya danışmanısın. Emlak, gelinlik, wellness gibi sektörlerde uzmanlaşmışsın.

Müşteri görüşme formunu analiz edip şunları üreteceksin:
1. Profesyonel analiz (mevcut seviye, darboğazlar, stratejik hatalar, güçlü/zayıf yanlar)
2. AI profil kartı (özet, konumlandırma, hedef kitle, strateji, fırsatlar, riskler)
3. Gelişim planı (30 gün + 90 gün detaylı plan)
4. İlk dokunuş raporu (müşteriye sunulacak profesyonel rapor)

Türkçe, net, uygulanabilir ve motivasyonel bir dil kullan.
JSON formatında yanıt ver.`;

interface ClientIntakeData {
  client_name: string;
  business_name?: string;
  location?: string;
  sector?: string;
  target_audience?: string;
  price_segment?: string;
  social_media_accounts?: any;
  three_month_goals?: string;
  one_year_goals?: string;
  main_challenges?: string;
  previous_agency_experience?: string;
  active_platforms?: string[];
  camera_comfort_level?: string;
  weekly_content_capacity?: number;
  best_performing_video_reason?: string;
  content_production_bottleneck?: string;
  desired_persona?: string;
  competitive_advantage?: string;
  desired_tone?: string;
  daily_time_commitment?: string;
  team_support?: string;
  budget?: string;
  current_followers?: any;
  last_30_days_performance?: string;
  content_frequency?: string;
  video_quality_self_assessment?: string;
  used_hashtags?: string[];
  competitors?: string[];
  self_positioning?: string;
  swot_analysis?: any;
}

export async function analyzeClientIntake(data: ClientIntakeData): Promise<ClientAnalysisResult> {
  try {
    const prompt = `
Müşteri Bilgileri:
${JSON.stringify(data, null, 2)}

Lütfen bu müşteriyi detaylı analiz et ve aşağıdaki formatta JSON döndür:
- current_level_assessment: Mevcut seviye değerlendirmesi (2-3 paragraf)
- main_bottlenecks: Ana darboğazlar (array)
- strategic_mistakes: Stratejik hatalar (array)
- strengths: Güçlü yanlar (array)
- weaknesses: Zayıf yanlar (array)
- realistic_growth_potential: Gerçekçi büyüme potansiyeli (1 paragraf)
- profile_summary: Profil özeti (2 paragraf)
- positioning_statement: Konumlandırma cümlesi (1 cümle)
- target_audience_definition: Hedef kitle tanımı (1 paragraf)
- content_strategy: İçerik stratejisi (2 paragraf)
- opportunities: Fırsatlar (array)
- risks: Riskler (array)
- three_month_roadmap: 3 aylık yol haritası (detaylı)
- first_30_days_plan: İlk 30 gün planı (video_count, categories, tone, themes, performance_targets)
- first_90_days_plan: İlk 90 gün planı (video_count, categories, milestones)
- initial_report: İlk dokunuş raporu (Markdown formatında, müşteriye sunulacak profesyonel rapor)
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    const validated = ClientAnalysisSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error('Error analyzing client intake:', error);
    throw new Error('Failed to analyze client with AI');
  }
}
