import { z } from 'zod';
import { generateJson } from '@/lib/llm/gemini';

export const RealEstateContentSchema = z.object({
  selected_strategy: z.enum([
    'yatirim_firsati',
    'luks_konut',
    'acil_satis',
    'bolge_analizi',
  ]),
  video_overlays: z.object({
    hook: z.string(),
    value_prop: z.string(),
    cta: z.string(),
  }),
  instagram_caption: z.string(),
  dm_reply: z.string(),
  strategy_note: z.string(),
});

export type RealEstateContent = z.infer<typeof RealEstateContentSchema>;

export const STRATEGY_TEMPLATES = {
  yatirim_firsati: {
    name: 'Yatirim & Prim Potansiyeli',
    focus: 'Rakamlar, ROI, gelecek vizyonu',
    tone: 'Analitik, otoriter',
  },
  luks_konut: {
    name: 'Luks Yasam & Prestij',
    focus: 'Konfor, statu, ozel detaylar',
    tone: 'Sofistike, seckin',
  },
  acil_satis: {
    name: 'Acil Firsat / Kelepir',
    focus: 'Fiyat avantaji, hizli karar, FOMO',
    tone: 'Aciliyet hissettiren, direkt',
  },
  bolge_analizi: {
    name: 'Bolge Uzmanligi / Egitim',
    focus: 'Guven insasi, bilgi paylasimi',
    tone: 'Egitici, danisman',
  },
} as const;

const SYSTEM_PROMPT =
  'Sen Edirne ve Trakya bolgesinde (Karaagac, Havsa, Kesan) uzmanlasmis bir Gayrimenkul Yatirim Stratejistisin. ' +
  'Tonun otoriter, net ve rakamlarla konusan bir uzmandir. Asla yalvaran satici dili kullanma. ' +
  'Firsat ve kitlik (scarcity) vurgusu yap. Cikti olarak sadece gecerli bir JSON objesi dondur. ' +
  'Asagidaki strateji sablonlarini kullan ve girilen ham metne en uygun olani sec. ' +
  'Secimini JSON icindeki selected_strategy alaninda bu anahtarlarla belirt: ' +
  'yatirim_firsati, luks_konut, acil_satis, bolge_analizi. ' +
  'Sablonlar: ' +
  JSON.stringify(STRATEGY_TEMPLATES);

export async function generateRealEstateContent(input: string): Promise<RealEstateContent> {
  try {
    const parsed = await generateJson(
      SYSTEM_PROMPT,
      `Ham notlar:\n${input}\n\nJSON formatinda dondur.`
    );
    return RealEstateContentSchema.parse(parsed);
  } catch (error) {
    console.error('Real estate content generation error:', error);
    throw new Error('Emlak yatirim asistani icerigi uretilemedi');
  }
}
