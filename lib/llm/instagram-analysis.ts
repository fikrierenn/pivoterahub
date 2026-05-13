import { z } from 'zod';
import { generateJson } from '@/lib/llm/gemini';

const InstagramBioAnalysisSchema = z.object({
  bio_effectiveness: z.string(),
  missing_elements: z.string(),
  improvement_suggestions: z.string(),
  target_audience_alignment: z.string(),
  conversion_optimization: z.string(),
  seo_keywords: z.string(),
});

export interface InstagramBioAnalysis {
  bio_effectiveness: string;
  missing_elements: string;
  improvement_suggestions: string;
  target_audience_alignment: string;
  conversion_optimization: string;
  seo_keywords: string;
}

const SYSTEM_PROMPT =
  'Sen Instagram bio analizi konusunda uzman bir sosyal medya danismansin.';

export async function analyzeInstagramBio(
  bio: string,
  clientData: {
    name: string;
    sector: string;
    location: string;
    goals: string;
  }
): Promise<InstagramBioAnalysis> {
  const prompt = `
MUSTERI BILGILERI:
- Isim/Marka: ${clientData.name}
- Sektor: ${clientData.sector}
- Lokasyon: ${clientData.location}
- Hedefler: ${clientData.goals}

MEVCUT INSTAGRAM BIO:
"${bio}"

JSON formatinda dondur:
{
  "bio_effectiveness": "...",
  "missing_elements": "...",
  "improvement_suggestions": "...",
  "target_audience_alignment": "...",
  "conversion_optimization": "...",
  "seo_keywords": "..."
}

Her alan HTML formatinda olabilir. SADECE JSON dondur.
`;

  try {
    const parsed = await generateJson(SYSTEM_PROMPT, prompt);
    return InstagramBioAnalysisSchema.parse(parsed);
  } catch (error) {
    console.error('Error analyzing Instagram bio:', error);
    throw new Error('Instagram bio analizi olusturulurken hata olustu');
  }
}
