import { z } from 'zod';
import { generateJson } from '@/lib/llm/gemini';

const BioAnalysisSchema = z.object({
  personality_profile: z.string(),
  target_audience: z.string(),
  content_opportunities: z.string(),
  positioning_strategy: z.string(),
  growth_potential: z.string(),
  action_plan: z.string(),
});

interface ClientBioAnalysis {
  personality_profile: string;
  target_audience: string;
  content_opportunities: string;
  positioning_strategy: string;
  growth_potential: string;
  action_plan: string;
}

const SYSTEM_PROMPT =
  'Sen deneyimli bir sosyal medya stratejisti ve musteri analistisin. Sadece objektif analiz yaparsin.';

export async function analyzeClientBio(
  clientData: {
    name: string;
    sector: string;
    location: string;
    goals: string;
    meeting_notes: string;
    competitive_advantage?: string;
  }
): Promise<ClientBioAnalysis> {
  const prompt = `
MUSTERI BILGILERI:
- Isim/Marka: ${clientData.name}
- Sektor: ${clientData.sector}
- Lokasyon: ${clientData.location}
- Hedefler: ${clientData.goals}
- Rekabet Avantaji: ${clientData.competitive_advantage || 'Belirtilmemis'}

GORUSME NOTLARI:
${clientData.meeting_notes}

Sadece objektif analiz yap. Strateji onermesi verme.
JSON formatinda dondur:
{
  "personality_profile": "...",
  "target_audience": "...",
  "content_opportunities": "...",
  "positioning_strategy": "...",
  "growth_potential": "...",
  "action_plan": "..."
}
`;

  try {
    const parsed = await generateJson(SYSTEM_PROMPT, prompt);
    return BioAnalysisSchema.parse(parsed);
  } catch (error) {
    console.error('Error analyzing client bio:', error);
    throw new Error('Musteri bio analizi yapilirken hata olustu');
  }
}
