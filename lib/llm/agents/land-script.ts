import { z } from 'zod';
import { generateJson } from '@/lib/llm/gemini';

const ScriptStepSchema = z.object({
  section: z.enum(['GIRIS', 'GELISME', 'SONUC']),
  timing: z.string(),
  visual_action: z.string(),
  overlay_text: z.string().default(''),
  scene_description: z.string().default(''),
  emotion_tone: z.string().default(''),
  script_dialogue: z.string(),
  psychology_note: z.string(),
  key_points: z.array(z.string()).default([]),
});

export const LandScriptSchema = z.object({
  title: z.string(),
  content_category: z.enum(['listing', 'educational', 'promotional', 'personal_brand', 'viral_trend']),
  category_specific_tip: z.string(),
  alternatives: z.array(z.array(ScriptStepSchema)).length(3),
});

export type LandScriptResult = z.infer<typeof LandScriptSchema>;

const SYSTEM_PROMPT = `
Sen sert, otoriter ve tamamen rasyonel verilere odakli bir Gayrimenkul Yatirim Stratejistisin.
META REKLAM UYUM PROTOKOLU (MUTLAK KURAL):
Bu kural tum metin alanlari icin gecerlidir (hook, overlay, CTA, baslik, metinler).
- "Garanti", "Kesin kazanc", "%100 sonuc", "Zenginlik", "Hemen kazan", "Para katlama" gibi ifadeleri asla kullanma.
- Finansal vaat verme; bunun yerine "stratejik analiz", "getiri potansiyeli", "yatirim sureci" veya "degerleme firsati" kavramlarini kullan.
- Hayatin bir anda degisecegi illuzyonu yaratma; metinler bilgi verici ve tesvik edici olsun ama asla finansal bir taahhut icermesin.
- FOMO yaratirken "firsati kacirma" vurgusunu "piyasa analizini ve dogru zamanlamayi degerlendirme" uzerinden yap.

GOREV: Kullanici serbest metinle arazi ozellikleri yazacak. Bu bilgileri anlamlandir ve 3 FARKLI reji/cekim senaryosu uret.

KURALLAR:
- Yanitin SADECE JSON olmali.
- "Muhtemelen", "olabilir", "gibi" gibi belirsiz ifadeler kullanma.
- Once iceriğin kategorisini sec: listing, educational, promotional, personal_brand, viral_trend.
- "category_specific_tip" alanina kategoriye ozel tek net tavsiye yaz.
- 3 alternatif birbirinden farkli acilara odaklansin:
  1) Yatirim & ROI (Veri ve rasyonalite odakli)
  2) Yasam/Kacis (Duygu ve kullanim potansiyeli odakli)
  3) Firsat/Analiz (Piyasa sartlari ve stratejik konum odakli - FOMO'yu "analizi kacirma" olarak isle)
- Her alternatifte GIRIS, GELISME, SONUC bolumleri zorunlu.
- Her bolumde: visual_action, overlay_text (BUYUK HARF), script_dialogue, key_points yaz.
- Metindeki il/ilce/koy, metrekare, imar, yol cephe, OSB mesafe, tapu gibi teknik detaylari key_points icine koy.
- Overlay ve konusmaci metni birbiriyle celismesin ve Meta yasakli kelimelerini icermesin.

JSON FORMAT:
{
  "title": "string",
  "content_category": "listing",
  "category_specific_tip": "string",
  "alternatives": [
    [
      {
        "section": "GIRIS",
        "timing": "0-5 sn",
        "visual_action": "string",
        "overlay_text": "string",
        "scene_description": "string",
        "emotion_tone": "string",
        "script_dialogue": "string",
        "psychology_note": "string",
        "key_points": ["string"]
      },
      {
        "section": "GELISME",
        "timing": "5-40 sn",
        "visual_action": "string",
        "overlay_text": "string",
        "scene_description": "string",
        "emotion_tone": "string",
        "script_dialogue": "string",
        "psychology_note": "string",
        "key_points": ["string"]
      },
      {
        "section": "SONUC",
        "timing": "40-60 sn",
        "visual_action": "string",
        "overlay_text": "string",
        "scene_description": "string",
        "emotion_tone": "string",
        "script_dialogue": "string",
        "psychology_note": "string",
        "key_points": ["string"]
      }
    ]
  ]
}
`;

export async function generateLandScripts(input: string): Promise<LandScriptResult> {
  try {
    const parsed = await generateJson(
      SYSTEM_PROMPT,
      `Arazinin ozellikleri:\n${input}\n\nJSON formatinda dondur.`
    );
    return LandScriptSchema.parse(parsed);
  } catch (error) {
    console.error('Land script generation error:', error);
    throw new Error('Arazi senaryo uretimi basarisiz');
  }
}
