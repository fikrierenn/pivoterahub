import { z } from 'zod';
import { generateJson } from '@/lib/llm/gemini';

const CompetitorAnalysisSchema = z.object({
  swot_analysis: z.string(),
  competitive_positioning: z.string(),
  market_opportunities: z.string(),
  differentiation_strategy: z.string(),
});

export interface CompetitorAnalysis {
  swot_analysis: string;
  competitive_positioning: string;
  market_opportunities: string;
  differentiation_strategy: string;
}

export interface CompetitorProfile {
  username: string;
  full_name?: string;
  followers: number;
  following: number;
  posts: number;
  bio: string;
  is_verified: boolean;
  is_private: boolean;
  engagement_rate?: number;
  category?: string;
  avg_likes?: number;
  avg_comments?: number;
  posting_frequency?: string;
  content_types?: {
    video_ratio: number;
    photo_ratio: number;
  };
  recent_posts?: {
    avg_likes: number;
    avg_comments: number;
    posting_frequency: string;
    content_types: {
      video_ratio: number;
      photo_ratio: number;
    };
    recent_posts_count: number;
    engagement_rate: number;
  };
}

const SYSTEM_PROMPT =
  'Sen rakip analizi ve SWOT analizi konusunda uzman bir sosyal medya stratejistisin.';

export async function analyzeCompetitors(
  clientProfile: CompetitorProfile,
  competitors: CompetitorProfile[],
  clientData: {
    name: string;
    sector: string;
    location: string;
    goals: string;
  }
): Promise<CompetitorAnalysis> {
  const prompt = `
MUSTERI PROFILI:
- Isim: ${clientData.name}
- Sektor: ${clientData.sector}
- Lokasyon: ${clientData.location}
- Hedefler: ${clientData.goals}

MUSTERI INSTAGRAM:
- Username: @${clientProfile.username}
- Takipci: ${clientProfile.followers.toLocaleString()}
- Gonderi: ${clientProfile.posts.toLocaleString()}
- Bio: "${clientProfile.bio}"
- Dogrulanmis: ${clientProfile.is_verified ? 'Evet' : 'Hayir'}
- Engagement Rate: ${clientProfile.engagement_rate || 'Hesaplanmadi'}%

RAKIPLER:
${competitors.map((comp, index) => `
${index + 1}. @${comp.username} (${comp.full_name || 'Isim yok'})
   Takipci: ${comp.followers.toLocaleString()} | Gonderi: ${comp.posts.toLocaleString()}
   Dogrulanmis: ${comp.is_verified ? 'Evet' : 'Hayir'} | Kategori: ${comp.category || 'Bilinmiyor'}
   Ortalama Begeni: ${comp.avg_likes?.toLocaleString() || 'Bilinmiyor'} | Yorum: ${comp.avg_comments?.toLocaleString() || 'Bilinmiyor'}
   Engagement Rate: ${comp.engagement_rate || 'Bilinmiyor'}%
   Paylasim Sikligi: ${comp.posting_frequency || 'Bilinmiyor'}
   Icerik: ${comp.content_types ? `Video %${comp.content_types.video_ratio}, Fotograf %${comp.content_types.photo_ratio}` : 'Bilinmiyor'}
   Bio: "${comp.bio}"
`).join('')}

JSON formatinda dondur:
{
  "swot_analysis": "SWOT analizi (HTML)",
  "competitive_positioning": "Rekabet konumlandirma analizi (HTML)",
  "market_opportunities": "Pazar firsatlari (HTML)",
  "differentiation_strategy": "Farklilasma stratejisi (HTML)"
}

SADECE JSON dondur.
`;

  const parsed = await generateJson(SYSTEM_PROMPT, prompt);
  return CompetitorAnalysisSchema.parse(parsed);
}
