import { z } from 'zod';
import { generateJson } from '@/lib/llm/gemini';

const ProfessionalAnalysisSchema = z.object({
  current_level_assessment: z.string(),
  main_bottlenecks: z.string(),
  strategic_mistakes: z.string(),
  strengths: z.string(),
  weaknesses: z.string(),
  realistic_growth_potential: z.string(),
});

// §YYÝ 1. Profesyonel Analiz
export interface ProfessionalAnalysis {
  current_level_assessment: string;
  main_bottlenecks: string;
  strategic_mistakes: string;
  strengths: string;
  weaknesses: string;
  realistic_growth_potential: string;
}

const PROFESSIONAL_SYSTEM =
  'Sen 10+ yil deneyimli sosyal medya danismanisin. Musteri analizlerinde keskin ve objektifsin.';

export async function generateProfessionalAnalysis(
  clientData: {
    name: string;
    sector: string;
    location: string;
    goals: string;
    meeting_notes: string;
    competitive_advantage?: string;
  }
): Promise<ProfessionalAnalysis> {
  const prompt = `
Sen deneyimli bir sosyal medya danismanisin. Musteriyi profesyonel gozle analiz et.

MUSTERI BILGILERI:
- Isim/Marka: ${clientData.name}
- Sektor: ${clientData.sector}
- Lokasyon: ${clientData.location}
- Hedefler: ${clientData.goals}
- Rekabet Avantaji: ${clientData.competitive_advantage || 'Belirtilmemis'}

GORUSME NOTLARI:
${clientData.meeting_notes}

DANISMAN GOZUYLE ANALIZ ET ve JSON formatinda dondur:

{
  "current_level_assessment": "Musterinin su anki sosyal medya olgunluk seviyesi analizi (HTML formatinda)",
  "main_bottlenecks": "En buyuk darboazlar ve buyumeyi engelleyen faktorler (HTML formatinda)",
  "strategic_mistakes": "Stratejik hatalar (HTML formatinda)",
  "strengths": "Guclu yanlar ve avantajlar (HTML formatinda)",
  "weaknesses": "Zayif yanlar ve gelisim alanlari (HTML formatinda)",
  "realistic_growth_potential": "3-6 ay icinde gercekci buyume potansiyeli (HTML formatinda)"
}

Her alan icin HTML formatinda icerik olustur:
- Basliklar icin <h3>
- Paragraflar icin <p>
- Onemli noktalar icin <strong>
- Listeler icin <ul><li>
- Kisa, net ve profesyonel dille yaz

SADECE JSON dondur.
`;

  const parsed = await generateJson(PROFESSIONAL_SYSTEM, prompt);
  return ProfessionalAnalysisSchema.parse(parsed);
}

// §YY¸ 2. AI Profil Karti
export interface AIProfileCard {
  strategy: string;
  target_audience: string;
  content_suggestions: string;
  quick_wins: string;
  profile_summary?: string;
  positioning_strategy?: string;
  content_strategy?: string;
  opportunities?: string;
  risks?: string;
  three_month_roadmap?: any;
}

const ProfileCardSchema = z.object({
  profile_summary: z.string().optional(),
  positioning_strategy: z.string().optional(),
  target_audience: z.string(),
  content_strategy: z.string().optional(),
  opportunities: z.string().optional(),
  risks: z.string().optional(),
  three_month_roadmap: z
    .object({
      month1: z.string().optional(),
      month2: z.string().optional(),
      month3: z.string().optional(),
    })
    .optional(),
});

const PROFILE_SYSTEM =
  'Sen AI destekli sosyal medya danismanisin. Profil kartlari olusturmada uzmansin.';

export async function generateAIProfileCard(
  professionalAnalysis: ProfessionalAnalysis,
  clientData: any
): Promise<AIProfileCard> {
  const prompt = `
Profesyonel analiz sonuclarina dayanarak AI danisman gibi profil karti olustur.

PROFESYONEL ANALIZ:
- Mevcut Seviye: ${professionalAnalysis.current_level_assessment}
- Darboazlar: ${professionalAnalysis.main_bottlenecks}
- Guclu Yanlar: ${professionalAnalysis.strengths}
- Zayif Yanlar: ${professionalAnalysis.weaknesses}
- Buyume Potansiyeli: ${professionalAnalysis.realistic_growth_potential}

MUSTERI: ${clientData.name} (${clientData.sector}, ${clientData.location})

JSON formatinda dondur:
{
  "profile_summary": "2-3 cumle, HTML formatinda",
  "positioning_strategy": "HTML formatinda",
  "target_audience": "HTML formatinda",
  "content_strategy": "HTML formatinda",
  "opportunities": "HTML formatinda",
  "risks": "HTML formatinda",
  "three_month_roadmap": {
    "month1": "Ay 1 hedefleri",
    "month2": "Ay 2 hedefleri",
    "month3": "Ay 3 hedefleri"
  }
}

SADECE JSON dondur.
`;

  const parsed = await generateJson(PROFILE_SYSTEM, prompt);
  const validated = ProfileCardSchema.parse(parsed);

  return {
    strategy: validated.positioning_strategy || '',
    target_audience: validated.target_audience || '',
    content_suggestions: validated.content_strategy || '',
    quick_wins: validated.opportunities || '',
    profile_summary: validated.profile_summary || '',
    positioning_strategy: validated.positioning_strategy || '',
    content_strategy: validated.content_strategy || '',
    opportunities: validated.opportunities || '',
    risks: validated.risks || '',
    three_month_roadmap: validated.three_month_roadmap || { month1: '', month2: '', month3: '' },
  };
}
