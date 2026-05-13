import { z } from 'zod';
import { generateJson } from '@/lib/llm/gemini';
import { ProfessionalAnalysis, AIProfileCard } from './professional-analysis';
import { DevelopmentPlan } from './development-plan';

const PresentationSchema = z.object({
  executive_summary: z.string(),
  current_situation_analysis: z.string(),
  strategic_recommendations: z.string(),
  action_plan: z.string(),
  expected_results: z.string(),
  investment_required: z.string(),
});

export interface ClientPresentation {
  executive_summary: string;
  recommendations: string;
  expected_results: string;
  investment_required: string;
  current_situation_analysis?: string;
  strategic_recommendations?: string;
  action_plan?: string;
  presentation_html?: string;
  presentation_pdf_url?: string;
}

const SYSTEM_PROMPT =
  'Sen musteri sunumlari konusunda uzman bir danismansin. Profesyonel, ikna edici ve guven verici raporlar yazarsin.';

export async function generateClientPresentation(
  professionalAnalysis: ProfessionalAnalysis,
  profileCard: AIProfileCard,
  developmentPlan: DevelopmentPlan,
  clientData: any
): Promise<ClientPresentation> {
  const prompt = `
TUM analiz sonuclarina dayanarak musteriye sunulacak profesyonel rapor olustur.

MUSTERI: ${clientData.name}
SEKTOR: ${clientData.sector}
LOKASYON: ${clientData.location}

ANALIZ:
- Mevcut Seviye: ${professionalAnalysis.current_level_assessment}
- Darboazlar: ${professionalAnalysis.main_bottlenecks}
- Guclu Yanlar: ${professionalAnalysis.strengths}
- Buyume Potansiyeli: ${professionalAnalysis.realistic_growth_potential}

PROFIL KARTI:
- Konumlandirma: ${profileCard.positioning_strategy}
- Hedef Kitle: ${profileCard.target_audience}
- Firsatlar: ${profileCard.opportunities}

JSON formatinda dondur:
{
  "executive_summary": "Yonetici ozeti (HTML)",
  "current_situation_analysis": "Mevcut durum analizi (HTML)",
  "strategic_recommendations": "Stratejik oneriler (HTML)",
  "action_plan": "Aksiyon plani (HTML)",
  "expected_results": "Beklenen sonuclar (HTML)",
  "investment_required": "Gerekli yatirim ve kaynak ihtiyaclari (HTML)"
}

Musteriye hitap eden profesyonel dille yaz. SADECE JSON dondur.
`;

  const parsed = await generateJson(SYSTEM_PROMPT, prompt);
  const validated = PresentationSchema.parse(parsed);

  return {
    executive_summary: validated.executive_summary,
    recommendations: validated.strategic_recommendations,
    expected_results: validated.expected_results,
    investment_required: validated.investment_required,
    current_situation_analysis: validated.current_situation_analysis,
    strategic_recommendations: validated.strategic_recommendations,
    action_plan: validated.action_plan,
    presentation_html: generatePresentationHTML(validated, clientData),
    presentation_pdf_url: undefined,
  };
}

function generatePresentationHTML(content: any, clientData: any): string {
  const sections = {
    executive_summary: content.executive_summary || '',
    current_situation: content.current_situation_analysis || '',
    strategic_recommendations: content.strategic_recommendations || '',
    action_plan: content.action_plan || '',
    expected_results: content.expected_results || '',
  };

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sosyal Medya Analiz Raporu - ${clientData.name}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .section { background: white; padding: 25px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .section h2 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .highlight { background: #f8f9ff; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
        .footer { text-align: center; color: #666; margin-top: 30px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Sosyal Medya Analiz Raporu</h1>
        <h2>${clientData.name}</h2>
        <p>${clientData.sector} - ${clientData.location}</p>
        <p><small>Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}</small></p>
    </div>

    <div class="section">
        <h2>Yonetici Ozeti</h2>
        <div class="highlight">
            ${sections.executive_summary.replace(/\n/g, '<br>')}
        </div>
    </div>

    <div class="section">
        <h2>Mevcut Durum Analizi</h2>
        ${sections.current_situation.replace(/\n/g, '<br>')}
    </div>

    <div class="section">
        <h2>Stratejik Oneriler</h2>
        ${sections.strategic_recommendations.replace(/\n/g, '<br>')}
    </div>

    <div class="section">
        <h2>Aksiyon Plani</h2>
        ${sections.action_plan.replace(/\n/g, '<br>')}
    </div>

    <div class="section">
        <h2>Beklenen Sonuclar</h2>
        <div class="highlight">
            ${sections.expected_results.replace(/\n/g, '<br>')}
        </div>
    </div>

    <div class="footer">
        <p><strong>ClientBrain</strong> - Sosyal Medya Danismanligi</p>
        <p><small>Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde olusturulmustur.</small></p>
    </div>
</body>
</html>
  `;
}
