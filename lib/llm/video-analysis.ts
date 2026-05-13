import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);
const MODEL_NAME = 'gemini-3-flash-preview';

export const VideoAnalysisSchema = z.object({
  hook_score: z.number().default(0),
  hook_analysis: z.string().default('Analiz edilemedi'),

  tempo_score: z.number().default(0),
  tempo_analysis: z.string().default('Analiz edilemedi'),

  clarity_score: z.number().default(0),
  clarity_analysis: z.string().default('Analiz edilemedi'),

  cta_score: z.number().default(0),
  cta_analysis: z.string().default('Analiz edilemedi'),

  visual_score: z.number().default(0),
  visual_analysis: z.string().describe('Gorsel analiz metni (STRING)').default('Gorsel analiz yapilamadi'),

  funnel_stage: z
    .enum(['cold', 'warm', 'hot', 'sale', 'middle', 'retention'])
    .default('cold'),

  marketing_power: z.object({
    score: z.number().default(0),
    analysis: z.string().default(''),
  }).default({ score: 0, analysis: '' }),

  body_language: z.object({
    score: z.number().default(0),
    analysis: z.string().default(''),
  }).default({ score: 0, analysis: '' }),

  content_strategy: z.object({
    topic_relevance: z.number().default(0),
    audience_fit: z.number().default(0),
  }).default({ topic_relevance: 0, audience_fit: 0 }),

  main_errors: z.array(z.string()).describe('Instagram algoritma hatalari').default([]),
  improvement_suggestions: z.array(z.string()).describe('Viral olmasi icin oneriler').default([]),

  quick_actions: z
    .array(z.string())
    .describe('Hemen yapilacak 3 maddelik eylem listesi.')
    .default([]),

  hook_variations: z
    .array(z.string())
    .describe('A/B test icin 2-3 alternatif kanca cumlesi.')
    .default([]),

  video_title: z
    .string()
    .describe('3-5 kelimelik profesyonel video basligi.')
    .default('Video Basligi'),

  full_script_plan: z
    .array(z.object({
      section: z.enum(['GIRIS', 'GELISME', 'SONUC']),
      timing: z.string(),
      visual_action: z.string(),
      overlay_text: z.string().default(''),
      scene_description: z.string().default(''),
      emotion_tone: z.string().default(''),
      tts_scene: z.object({
        text: z.string().default(''),
        style_instruction: z.string().default(''),
        voice_name: z.string().default(''),
      }).default({ text: '', style_instruction: '', voice_name: '' }),
      video_generation: z.object({
        prompt: z.string().default(''),
        negative_prompt: z.string().default(''),
        aspect_ratio: z.enum(['16:9', '9:16']).default('9:16'),
      }).default({ prompt: '', negative_prompt: '', aspect_ratio: '9:16' }),
      script_dialogue: z.string(),
      psychology_note: z.string(),
      key_points: z.array(z.string()).default([]),
    }))
    .default([]),

  full_script_plan_variations: z
    .array(z.array(z.object({
      section: z.enum(['GIRIS', 'GELISME', 'SONUC']),
      timing: z.string(),
      visual_action: z.string(),
      overlay_text: z.string().default(''),
      scene_description: z.string().default(''),
      emotion_tone: z.string().default(''),
      tts_scene: z.object({
        text: z.string().default(''),
        style_instruction: z.string().default(''),
        voice_name: z.string().default(''),
      }).default({ text: '', style_instruction: '', voice_name: '' }),
      video_generation: z.object({
        prompt: z.string().default(''),
        negative_prompt: z.string().default(''),
        aspect_ratio: z.enum(['16:9', '9:16']).default('9:16'),
      }).default({ prompt: '', negative_prompt: '', aspect_ratio: '9:16' }),
      script_dialogue: z.string(),
      psychology_note: z.string(),
      key_points: z.array(z.string()).default([]),
    })))
    .describe('Reji ve cekim senaryosu icin 3 alternatif plan.')
    .default([]),

  video_category: z
    .enum(['listing', 'educational', 'promotional', 'personal_brand', 'viral_trend'])
    .describe('Videonun icerik turu.')
    .default('educational'),

  category_specific_tip: z
    .string()
    .describe('Kategoriye ozel en onemli iyilestirme tavsiyesi.')
    .default('Kategoriye ozel tavsiye bulunamadi.'),

  overall_rating: z.number().default(0),
  success_probability: z.number().default(0),
  ai_comment: z.string().default('Yorum yok'),

  optimization_recommendations: z.object({
    title_ideas: z.array(z.string()).optional(),
    caption_ideas: z.array(z.string()).optional(),
    hashtags: z.array(z.string()).optional(),
  }).optional(),
});

export type VideoAnalysisResult = z.infer<typeof VideoAnalysisSchema>;

const VEO_QUALITY_PREFIX = 'Cinematic, photorealistic, 8k, professional studio lighting, detailed textures, high-end camera lens effect, ';

const SYSTEM_PROMPT = `
Sen dunyanin en iyi sosyal medya stratejisti ve ikna psikolojisi uzmansin
(Dale Carnegie ve Robert Cialdini ekolu).
KIMLIK: Profesyonel bir Gayrimenkul Yatirim Gurusu ve icerik stratejistisin.
TON: Sert, direkt ve kazanc odakli. Bos ovgu yapma, hatalari "PARA KAYBI" olarak nitelendir.
GOREVIN: 3-5 dakikalik "Egitici/Sektorel" bir videoyu Instagram algoritmasi
icin analiz et. Sadece teknik hatalari degil, videonun "duygu", "statu" ve
"arzu" yaratma becerisini puanla.

FELSEFE:
- Insanlar mantiklariyla karar verir ama duygulariyla satin alirlar.
- Teknik detaylar yerine sonuc ve his satilmali.
- Carnegie: Karsindakinin icinde siddetli bir istek uyandir.

MEVCUT VERITABANI ALANLARINI SOYLE KULLAN:
- hook_score: Videonun ilk 3 saniyesi izleyiciyi durduruyor mu?
- tempo_score (pacing): Video akici mi yoksa sikici mi? Gereksiz bosluklar var mi?
- visual_score: Sadece konusan kafa mi var yoksa ekrana gorsel/yazi geliyor mu?
- cta_score (engagement): Icerik kaydetmeye ve paylasmaya deger mi?

KURALLAR:
0. META REKLAM UYUM PROTOKOLU (MUTLAK KURAL):
   Bu kural tum metin alanlari icin gecerlidir (hook, overlay, tts_scene, CTA, baslik).
   - "Garanti", "Kesin kazanc", "%100 sonuc", "Zenginlik", "Hemen kazan", "Para katlama" gibi ifadeleri asla kullanma.
   - Finansal vaat verme; bunun yerine "stratejik analiz", "getiri potansiyeli", "yatirim sureci"
     veya "degerleme firsati" kavramlarini kullan.
   - Hayatin bir anda degisecegi illuzyonu yaratma; metinler bilgi verici ve tesvik edici olsun ama
     asla finansal bir taahhut icermesin.
   - FOMO yaratirken "firsati kacirma" vurgusunu "piyasa analizini ve dogru zamanlamayi degerlendirme"
     uzerinden yap.
1. Yanitin SADECE gecerli bir JSON objesi olmali.
2. "visual_analysis" alani kesinlikle STRING (metin) olmali.
3. Elestirilerin somut olsun.
4. Once video kategorisini sec.
4.1 "video_title" alanini doldur:
   - Transkriptten yola cikar, 3-5 kelime
   - Pazarlama diliyle yaz, profesyonel ol
   - Il/ilce/koy ve m2 gibi teknik bilgiler varsa basliga yedir
    - listing: ev/arsa turu, mekan gezdirme
    - educational: bilgi verme, rehberlik
    - promotional: kampanya, teklif, fiyat
    - personal_brand: vlog, hikaye, ofis arkasi
   - viral_trend: trend ses, format veya meme
5. "category_specific_tip" alanina kategoriye ozel tek bir net tavsiye yaz.
6. "full_script_plan_variations" alanini MUTLAKA doldur (tam olarak 3 alternatif plan):
   - Her alternatif birbirinden farkli olmali (farkli kanca, farkli overlay, farkli CTA).
   - Ayni cumleyi tekrar etme, kopya kullanma.
   - Her alternatif MUTLAKA GIRIS, GELISME ve SONUC bolumlerini icermeli.
   - GIRIS: ilk 0-5 saniye hook + ekranda metin/gorsel patlamasi
   - GELISME: fayda odakli anlatim + B-roll/altyazi talimati
   - SONUC: net CTA + FOMO veya statu vurgusu
   - visual_action icinde net yonetmen talimati ver
   - overlay_text icinde ekrana basilan kisa metni ver (BUYUK HARF)
   - scene_description icinde montaj/kompozisyon sahne tarifini ver
   - emotion_tone icinde seslendirme duygu tonunu ver (otorite, heyecan, guven)
   - tts_scene.text icinde seslendirme metnini ver (kisaltilar yok, sayilar okunuşuyla)
   - tts_scene.style_instruction icinde ses stili ver (ornegin: "Say in a firm, authoritative voice")
   - tts_scene.voice_name icinde yalnizca su sesleri kullan: Kore, Puck, Charon
   - video_generation.prompt icinde Veo icin sinematik "visual_prompt" yaz
   - video_generation.prompt metnini su sabitle baslat:
     "Cinematic, photorealistic, 8k, professional studio lighting, detailed textures, high-end camera lens effect, "
   - video_generation.negative_prompt icinde istem disi ogeleri yaz
   - video_generation.aspect_ratio icinde 9:16 veya 16:9 sec
   - psychology_note icinde tetikleyiciyi yaz (FOMO, otorite, aidiyet, kolaylik)
   - key_points icinde atlanmamasi gereken teknik detaylari yaz
   - transkriptteki tum teknik verileri (yil, rakam, kanun, sure) ayikla
   - script_dialogue icinde bu verileri kullan ve otoriteyi artir
   - key_points icinde "MUTLAKA DEGINILMELI" etiketiyle listele
7. "improvement_suggestions" listesinde teknik degil psikolojik taktikler ver.
7.1 "quick_actions" alanina 3 maddelik "hemen yap" listesi yaz.
7.2 "hook_variations" alanina tam olarak 3 alternatif kanca cumlesi yaz (A/B test icin).
8. "funnel_stage" icin yalnizca su degerleri sec: "cold", "warm", "hot", "sale".
9. Tum skorlar 0-10 araliginda olmali.
10. "Muhtemelen", "olabilir", "gibi" gibi belirsiz ifadeler kullanma. Kesin ve sert konus.
11. tts_scene.text icinde kisaltma kullanma (m2 degil metrekare), sayilari okunuşuyla yaz.
12. tts_scene.text icinde "Sahne 1:" gibi etiketler ve parantez ici aciklamalar kullanma.
13. tts_scene.style_instruction icinde yonetmen notu gibi konus ("firm, authoritative", "upbeat, energetic").
14. tts_scene.voice_name yalnizca: Kore, Puck, Charon.
15. video_generation.negative_prompt icinde "low quality, blurry, static camera" yaz.
  16. VIDEO GENERATION & TTS RULES:
   - Veo promptlari yalnizca gorsel betimleme icermeli, asla metin/altyazi isteme.
   - tts_scene.text yalnizca seslendirme metni olmali; parantez veya etiket kullanma.
   - tts_scene.style_instruction ve tts_scene.text duygu olarak uyumlu olmali.
   - Dil: seslendirme metni akici Turkce olmali.
   - tts_scene.text, script_dialogue, overlay_text ve key_points kendi icinde celismemeli.

ISTENEN JSON FORMATI (TUM ALANLAR ZORUNLU):
{
  "hook_score": 0,
  "hook_analysis": "string",
  "tempo_score": 0,
  "tempo_analysis": "string",
  "clarity_score": 0,
  "clarity_analysis": "string",
  "cta_score": 0,
  "cta_analysis": "string",
  "visual_score": 0,
  "visual_analysis": "string",
  "funnel_stage": "cold",
  "marketing_power": { "score": 0, "analysis": "string" },
  "body_language": { "score": 0, "analysis": "string" },
  "content_strategy": { "topic_relevance": 0, "audience_fit": 0 },
  "main_errors": ["string"],
  "improvement_suggestions": ["string"],
  "quick_actions": ["string"],
  "hook_variations": ["string"],
  "video_title": "string",
  "full_script_plan_variations": [
    [
      { "section": "GIRIS", "timing": "0-5 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Kore" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] },
      { "section": "GELISME", "timing": "5-40 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Kore" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] },
      { "section": "SONUC", "timing": "40-60 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Kore" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] }
    ],
    [
      { "section": "GIRIS", "timing": "0-5 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Puck" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] },
      { "section": "GELISME", "timing": "5-40 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Puck" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] },
      { "section": "SONUC", "timing": "40-60 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Puck" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] }
    ],
    [
      { "section": "GIRIS", "timing": "0-5 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Charon" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] },
      { "section": "GELISME", "timing": "5-40 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Charon" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] },
      { "section": "SONUC", "timing": "40-60 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Charon" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] }
    ]
  ],
  "video_category": "educational",
  "category_specific_tip": "string",
  "overall_rating": 0,
  "success_probability": 0,
  "ai_comment": "string",
  "optimization_recommendations": {
    "title_ideas": ["string"],
    "caption_ideas": ["string"],
    "hashtags": ["string"]
  }
}
`;

async function waitForFileActive(name: string) {
  console.log('Video Google sunucularinda isleniyor...');
  let file = await fileManager.getFile(name);
  while (file.state === FileState.PROCESSING) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    file = await fileManager.getFile(name);
  }
  if (file.state === FileState.FAILED) {
    throw new Error('Video islenirken hata olustu.');
  }
  console.log('Video hazir, analiz basliyor.');
  return file;
}

interface VideoAnalysisInput {
  client_profile: {
    name: string;
    sector: string;
    city: string | null;
    positioning: string | null;
    weekly_capacity: number;
  };
  video_meta: {
    platform: string;
    duration_sec: number;
    hashtags: string[];
    captions?: string | null;
  };
  video_base64?: string;
  transcript?: string;
  previous_scores: Array<{
    hook_score: number;
    clarity_score: number;
    cta_score: number;
    created_at: string;
  }>;
}

interface VideoAnalysisContext {
  sectorInstruction?: string;
  positioning?: string | null;
}

function formatVideoAnalysisInput(input: VideoAnalysisInput): string {
  return `
Analiz Baglami:
- Hedef: Instagram (Reels / Uzun Format) - Egitim ve guven
- Sektor: ${input.client_profile.sector}

Transkript Ozeti:
"${input.transcript ? input.transcript.substring(0, 3000) : 'Transkript yok'}"

GOREV: Videoyu izle (veya metni oku) ve Instagram kitlesi icin elestir.
1. Gorsel olarak sikici mi? (Visual Score)
2. Bilgi cok mu yogun/karisik? (Clarity Score)
3. Insanlar bunu kaydeder mi? (CTA Score)
`;
}

function buildSystemPrompt(context?: VideoAnalysisContext): string {
  const instruction = context?.sectorInstruction?.trim();
  const positioning = context?.positioning ? `\nMUSTERI KONUMU: ${context.positioning}\n` : '';

  if (instruction) {
    return `${instruction}\n${positioning}\n${SYSTEM_PROMPT}`;
  }

  return `${SYSTEM_PROMPT}`;
}

export async function analyzeVideo(
  input: VideoAnalysisInput,
  context?: VideoAnalysisContext
): Promise<VideoAnalysisResult> {
  const userPrompt = formatVideoAnalysisInput(input);
  const systemPrompt = buildSystemPrompt(context);

  let uploadResult: any = null;
  let tempFilePath: string | null = null;

  try {
    console.log('Gemini (v2) analizi baslatiliyor...');

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const normalizeFullScriptPlan = (plan: any[]) => (
      plan.map((step: any) => {
        const rawTtsText = typeof step?.tts_scene?.text === 'string' ? step.tts_scene.text.trim() : '';
        const rawScript = typeof step?.script_dialogue === 'string' ? step.script_dialogue.trim() : '';
        const resolvedSpeech = rawTtsText || rawScript;
        const resolvedScript = rawScript || rawTtsText;
        return {
          ...step,
          overlay_text: typeof step?.overlay_text === 'string' ? step.overlay_text : '',
          scene_description: typeof step?.scene_description === 'string' ? step.scene_description : '',
          emotion_tone: typeof step?.emotion_tone === 'string' ? step.emotion_tone : '',
          tts_scene: {
            text: resolvedSpeech,
            style_instruction: typeof step?.tts_scene?.style_instruction === 'string' ? step.tts_scene.style_instruction : '',
            voice_name: typeof step?.tts_scene?.voice_name === 'string' ? step.tts_scene.voice_name : '',
          },
          video_generation: {
            prompt: typeof step?.video_generation?.prompt === 'string'
              ? (step.video_generation.prompt.startsWith(VEO_QUALITY_PREFIX)
                ? step.video_generation.prompt
                : `${VEO_QUALITY_PREFIX}${step.video_generation.prompt}`)
              : '',
            negative_prompt: typeof step?.video_generation?.negative_prompt === 'string' ? step.video_generation.negative_prompt : '',
            aspect_ratio: step?.video_generation?.aspect_ratio === '16:9' ? '16:9' : '9:16',
          },
          script_dialogue: resolvedScript,
          key_points: Array.isArray(step?.key_points) ? step.key_points : [],
        };
      })
    );

    const generatePlanVariations = async (analysis: VideoAnalysisResult) => {
      if (!analysis.full_script_plan?.length) return analysis;
      const existingVariations = Array.isArray(analysis.full_script_plan_variations)
        ? analysis.full_script_plan_variations.filter(Array.isArray)
        : [];
      const hasAllSections = (plan: any[]) => {
        const sections = new Set(
          plan
            .map((step: any) => (typeof step?.section === 'string' ? step.section.toUpperCase() : ''))
            .filter(Boolean)
        );
        return sections.has('GIRIS') && sections.has('GELISME') && sections.has('SONUC');
      };
      if (existingVariations.length >= 3) {
        return analysis;
      }

      const variationPrompt = `
Yalnizca JSON dondur.
GOREV: Ayni video icin 3 farkli "reji ve cekim senaryosu" uret.
- Her alternatif farkli kanca, farkli overlay, farkli CTA icermeli.
- Teknik verileri ve ana faydayi koru.
- Her alternatif MUTLAKA GIRIS, GELISME ve SONUC icersin.

Mevcut analiz ozeti:
Video basligi: ${analysis.video_title}
Kategori: ${analysis.video_category}
Uzman ipucu: ${analysis.category_specific_tip}
Kritik noktalar: ${(analysis.full_script_plan || []).map((s) => (s.key_points || []).join(', ')).join(' | ')}

JSON format:
{
  "full_script_plan_variations": [
    [ { "section": "GIRIS", "timing": "0-5 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Kore" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] }, { "section": "GELISME", "timing": "5-40 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Kore" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] }, { "section": "SONUC", "timing": "40-60 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Kore" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] } ],
    [ { "section": "GIRIS", "timing": "0-5 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Puck" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] }, { "section": "GELISME", "timing": "5-40 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Puck" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] }, { "section": "SONUC", "timing": "40-60 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Puck" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] } ],
    [ { "section": "GIRIS", "timing": "0-5 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Charon" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] }, { "section": "GELISME", "timing": "5-40 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Charon" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] }, { "section": "SONUC", "timing": "40-60 sn", "visual_action": "string", "overlay_text": "string", "scene_description": "string", "emotion_tone": "string", "tts_scene": { "text": "string", "style_instruction": "string", "voice_name": "Charon" }, "video_generation": { "prompt": "string", "negative_prompt": "string", "aspect_ratio": "9:16" }, "script_dialogue": "string", "psychology_note": "string", "key_points": ["string"] } ]
  ]
}
`;

      let attempts = 0;
      let bestVariations = existingVariations;

      while (attempts < 2 && bestVariations.length < 3) {
        attempts += 1;
        try {
          const variationResult = await model.generateContent([{ text: variationPrompt }]);
          const variationJson = JSON.parse(variationResult.response.text());
          if (!Array.isArray(variationJson.full_script_plan_variations)) {
            continue;
          }

          const normalizedVariations = variationJson.full_script_plan_variations
            .filter(Array.isArray)
            .map(normalizeFullScriptPlan)
            .filter(hasAllSections);

          if (normalizedVariations.length > bestVariations.length) {
            bestVariations = normalizedVariations;
          }
        } catch (err) {
          console.warn('Alternatif reji senaryosu uretilemedi:', err);
        }
      }

      if (bestVariations.length >= 3) {
        return {
          ...analysis,
          full_script_plan_variations: bestVariations.slice(0, 3),
        };
      }

      return {
        ...analysis,
        full_script_plan_variations: bestVariations.length > 0 ? bestVariations : [analysis.full_script_plan],
      };
    };

    const parts: any[] = [];

    if (input.video_base64) {
      console.log('Video base64 received, using File API.');
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `gemini-vid-${Date.now()}.mp4`);
      const buffer = Buffer.from(input.video_base64, 'base64');
      fs.writeFileSync(tempFilePath, buffer);

      uploadResult = await fileManager.uploadFile(tempFilePath, {
        mimeType: 'video/mp4',
        displayName: 'Analysis Video',
      });

      await waitForFileActive(uploadResult.file.name);

      parts.push({
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      });
    }

    parts.push({ text: systemPrompt });
    parts.push({ text: userPrompt });

    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    const jsonResult = JSON.parse(responseText);
    console.log('Gemini raw video analysis:', JSON.stringify(jsonResult, null, 2));
    const validation = VideoAnalysisSchema.safeParse(jsonResult);
    if (validation.success) {
      const data = validation.data;
      if (Array.isArray(data.full_script_plan) && data.full_script_plan.length > 0) {
        if (!Array.isArray(data.full_script_plan_variations) || data.full_script_plan_variations.length < 3) {
          return await generatePlanVariations(data);
        }
      }
      return data;
    }

    console.warn('Schema uyusmazligi:', JSON.stringify(validation.error.format(), null, 2));
    const base = VideoAnalysisSchema.parse({});
    const normalizedFullScriptPlan = Array.isArray(jsonResult.full_script_plan)
      ? normalizeFullScriptPlan(jsonResult.full_script_plan)
      : base.full_script_plan;
    const normalized = {
      ...base,
      ...jsonResult,
      main_errors: Array.isArray(jsonResult.main_errors)
        ? jsonResult.main_errors
        : (typeof jsonResult.main_errors === 'string' ? [jsonResult.main_errors] : base.main_errors),
      improvement_suggestions: Array.isArray(jsonResult.improvement_suggestions)
        ? jsonResult.improvement_suggestions
        : (typeof jsonResult.improvement_suggestions === 'string' ? [jsonResult.improvement_suggestions] : base.improvement_suggestions),
      quick_actions: Array.isArray(jsonResult.quick_actions)
        ? jsonResult.quick_actions
        : (typeof jsonResult.quick_actions === 'string' ? [jsonResult.quick_actions] : base.quick_actions),
      hook_variations: Array.isArray(jsonResult.hook_variations)
        ? jsonResult.hook_variations.slice(0, 3)
        : (typeof jsonResult.hook_variations === 'string' ? [jsonResult.hook_variations] : base.hook_variations),
      video_title: typeof jsonResult.video_title === 'string' ? jsonResult.video_title : base.video_title,
      full_script_plan: normalizedFullScriptPlan,
      full_script_plan_variations: Array.isArray(jsonResult.full_script_plan_variations)
        ? jsonResult.full_script_plan_variations.map((plan: any) => (
          Array.isArray(plan)
            ? plan.map((step: any) => {
              const rawTtsText = typeof step?.tts_scene?.text === 'string' ? step.tts_scene.text.trim() : '';
              const rawScript = typeof step?.script_dialogue === 'string' ? step.script_dialogue.trim() : '';
              const resolvedSpeech = rawTtsText || rawScript;
              const resolvedScript = rawScript || rawTtsText;
              return {
                ...step,
                overlay_text: typeof step?.overlay_text === 'string' ? step.overlay_text : '',
                scene_description: typeof step?.scene_description === 'string' ? step.scene_description : '',
                emotion_tone: typeof step?.emotion_tone === 'string' ? step.emotion_tone : '',
                tts_scene: {
                  text: resolvedSpeech,
                  style_instruction: typeof step?.tts_scene?.style_instruction === 'string' ? step.tts_scene.style_instruction : '',
                  voice_name: typeof step?.tts_scene?.voice_name === 'string' ? step.tts_scene.voice_name : '',
                },
                video_generation: {
                  prompt: typeof step?.video_generation?.prompt === 'string'
                    ? (step.video_generation.prompt.startsWith(VEO_QUALITY_PREFIX)
                      ? step.video_generation.prompt
                      : `${VEO_QUALITY_PREFIX}${step.video_generation.prompt}`)
                    : '',
                  negative_prompt: typeof step?.video_generation?.negative_prompt === 'string' ? step.video_generation.negative_prompt : '',
                  aspect_ratio: step?.video_generation?.aspect_ratio === '16:9' ? '16:9' : '9:16',
                },
                script_dialogue: resolvedScript,
                key_points: Array.isArray(step?.key_points) ? step.key_points : [],
              };
            })
            : []
        ))
        : (Array.isArray(jsonResult.full_script_plan) ? [normalizedFullScriptPlan] : base.full_script_plan_variations),
      marketing_power: {
        ...base.marketing_power,
        ...(jsonResult.marketing_power && typeof jsonResult.marketing_power === 'object' ? jsonResult.marketing_power : {}),
      },
      body_language: {
        ...base.body_language,
        ...(jsonResult.body_language && typeof jsonResult.body_language === 'object' ? jsonResult.body_language : {}),
      },
      content_strategy: {
        ...base.content_strategy,
        ...(jsonResult.content_strategy && typeof jsonResult.content_strategy === 'object' ? jsonResult.content_strategy : {}),
      },
      optimization_recommendations: jsonResult.optimization_recommendations || base.optimization_recommendations,
    };

    const normalizedValidation = VideoAnalysisSchema.safeParse(normalized);
    if (!normalizedValidation.success) {
      console.warn('Normalized schema uyusmazligi:', JSON.stringify(normalizedValidation.error.format(), null, 2));
      return base;
    }

    const normalizedData = normalizedValidation.data;
    if (Array.isArray(normalizedData.full_script_plan) && normalizedData.full_script_plan.length > 0) {
      if (!Array.isArray(normalizedData.full_script_plan_variations) || normalizedData.full_script_plan_variations.length < 3) {
        return await generatePlanVariations(normalizedData);
      }
    }

    return normalizedData;
  } catch (error) {
    console.error('Video analiz hatasi:', error);
    throw error;
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.error('Dosya silinemedi:', err);
      }
    }
  }
}
