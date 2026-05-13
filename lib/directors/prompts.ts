// Director AI mod-bazlı prompt template'leri.

export const SCENE_DIRECTOR_SYSTEM = `Sen deneyimli bir yönetmen ve sosyal medya stratejistisın. Video'nun mevcut sinematik analizini ve script'ini alarak somut yönetmen notları çıkarırsın.
Yanıtların Türkçe, net madde madde ve uygulanabilir olmalı.`;

export const SCENE_DIRECTOR_USER = (cinematicSummary: string, originalScript: string) => `Sinematik Analiz Özeti:
${cinematicSummary}

Mevcut Script:
${originalScript || '(script yok)'}

Görev: 5-8 madde halinde yönetmen notları çıkar. Her madde: hangi sahne/an, ne değişmeli, neden. JSON formatında:

{
  "notes": [
    { "scene": "0-3s hook", "change": "...", "reason": "..." }
  ],
  "overall_recommendation": "1-2 cümle özet öneri"
}`;

export const SCRIPT_REWRITE_SYSTEM = `Sen viral sosyal medya scriptleri yazan bir copywriter'sın. Mevcut script'i alarak Hormozi hook formülü + STEPPS prensipleri ile güçlendirirsin.
Yanıtların Türkçe, doğal, samimi tonda.`;

export const SCRIPT_REWRITE_USER = (originalScript: string, hookGoal?: string) => `Mevcut Script:
${originalScript}

${hookGoal ? `Hook Hedefi: ${hookGoal}\n` : ''}
Görev: Script'i 3 farklı varyasyonla yeniden yaz. Her varyasyon farklı hook açılışı kullansın (soru / şok / vaad). JSON formatında:

{
  "variations": [
    {
      "hook_style": "soru | sok | vaad",
      "hook": "İlk 3 saniye için kanca cümlesi",
      "body": "Geliştirilmiş gövde",
      "cta": "Güçlü call-to-action"
    }
  ],
  "rationale": "Neden bu varyasyonlar — kısa açıklama"
}`;

export const FULL_REWRITE_SYSTEM = `Sen sosyal medya yönetmenisin. Verilen konu/sektör için sıfırdan video script'i yazarsın.
0-3s güçlü hook, 3-15s ana mesaj, 15-30s sosyal kanıt veya hikaye, 30-45s CTA yapısını kullan.`;

export const FULL_REWRITE_USER = (topic: string, sector: string, targetAudience: string) => `Konu: ${topic}
Sektör: ${sector}
Hedef Kitle: ${targetAudience}

Görev: 30-45 saniyelik bir video için tam script yaz. JSON formatında:

{
  "title": "Video başlığı önerisi",
  "duration_sec": 35,
  "scenes": [
    { "timing": "0-3s", "visual": "...", "dialogue": "...", "overlay_text": "..." }
  ],
  "hashtags": ["..."],
  "thumbnail_suggestion": "..."
}`;
