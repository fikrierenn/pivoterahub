---
name: PivotaraHub-social-media-analyst
description: Sosyal medya içerik analizi — STEPPS viral formülü, Hormozi hook, Cialdini ilkeleri, platform-specific scoring, retention analizi
triggers:
  - "sosyal medya analiz"
  - "tiktok analiz"
  - "instagram reels"
  - "youtube shorts"
  - "viral potansiyel"
  - "içerik skoru"
  - "platform fit"
  - "hook analiz"
  - "retention"
---

## Görev

Video/içerik analizinde kanıtlanmış pazarlama kitaplarından alınan formülleri uygula. GPT-4o Vision çıktısını ve transkripti alarak platform-specific performans skoru üret.

---

## Kaynak Çerçeveler (Kitap Tabanlı)

Bu skill'deki formüller şu kanıtlanmış kaynaklara dayanır:
- **Jonah Berger** — *Contagious: Why Things Catch On* (STEPPS framework)
- **Alex Hormozi** — *$100M Leads* (Hook formula)
- **Robert Cialdini** — *Influence* (7 Principles)
- **Donald Miller** — *Building a StoryBrand* (SB7 framework)
- **Russell Brunson** — *Expert Secrets* (Epiphany Bridge)
- **Ryan Deiss** — Hook-Story-Offer framework

---

## STEPPS Viral Potansiyel Skoru (Jonah Berger)

Her bileşen 0–1 arası puanlanır:

### S — Social Currency (Sosyal Para)
Paylaşmak insanı iyi gösteriyor mu?
```
1.0 — Insider bilgi, herkeste yok
0.8 — Şaşırtıcı gerçek/istatistik
0.7 — Etkileyici sonuç
0.3 — Yaygın, herkesin bildiği bilgi
```

### T — Triggers (Tetikleyiciler)
Günlük hayatta bu içeriği hatırlatacak bağlam var mı?
```
1.0 — Günlük deneyimle bağlantılı (kahve, trafik, sabah)
0.5 — Haftalık bağlam
0.1 — Nadir tetikleyici
```

### E — Emotion (Duygu) — En Kritik
```
Yüksek uyarılma duyguları (PAYLAŞTIRIR):
  Hayranlık (awe): 0.9
  Korku: 0.8
  Sevinç: 0.8
  Şaşırma: 0.8
  Öfke: 0.7 (dikkatli — brand safety riski)

Düşük uyarılma (paylaştırmaz):
  Üzüntü: 0.3
  Tatmin: 0.2
  Memnuniyet: 0.1
```

### P — Public (Aleni)
Başkalarına göründüğünde paylaşım artar:
```
1.0 — Built-in paylaşılabilirlik (challenge, duet)
0.8 — Paylaşım teşvik ediliyor
0.5 — Nötr
0.2 — Özel tüketim
```

### P — Practical Value (Pratik Değer)
Bunu bilen biri daha iyi mi olur?
```
1.0 — Bugün uygulanabilir, net fayda
0.7 — Faydalı ama spesifik değil
0.4 — Genel bilgi
0.1 — Sadece eğlence
```

### S — Stories (Hikaye)
Anlatı yapısı var mı?
```
+0.3 — Setup (bağlam) var
+0.3 — Conflict (problem) var
+0.3 — Resolution (çözüm) var
+0.1 — Karakter (anlatıcı/kahraman) var
```

**STEPPS Toplam:**
```
viral_potential = (social_currency × 0.15) +
                  (triggers × 0.15) +
                  (emotion × 0.25) +
                  (public × 0.15) +
                  (practical × 0.15) +
                  (stories × 0.15)
```
Sonuç 0–1; ×100 = viral skor (0–100)

---

## Hormozi Hook Skoru ($100M Leads)

Hook gücü = Problem × Claim × Proof × CTA

```
Hook_Score = (problem_relevance × 0.30) +
             (claim_specificity × 0.25) +
             (proof_credibility × 0.25) +
             (cta_clarity × 0.20)
```

**Claim spesifiklik örnekleri:**
- "daha iyi yapacak" → 0.2 (vague)
- "X'i çözer" → 0.5 (orta)
- "30 günde %40 daha az hata" → 0.9 (spesifik)

**Value Stacking (Fayda Katmanlama):**
```
Özellik → Avantaj → Fayda → Hayal Sonucu
Optimal: 3–4 katman, 30 saniyede
```

---

## Cialdini 7 İlkesi Skoru (Influence)

Her ilke 0–1 arası:

| İlke | Göstergeler |
|------|------------|
| Karşılıklılık | Önce değer veriyor mu? |
| Taahhüt | Küçük adımdan büyüğe yönlendiriyor mu? |
| Sosyal Kanıt | Sayı, referans, "X kişi" ifadesi |
| Otorite | Deneyim, sertifika, sonuç gösterimi |
| Sevgi | İzleyiciyle benzerlik, empati |
| Kıtlık | "Sınırlı süre/adet", aciliyet |
| Birlik | "Biz" dili, ortak kimlik |

```
influence_score = (reciprocity × 0.15) + (commitment × 0.15) +
                  (social_proof × 0.20) + (authority × 0.15) +
                  (liking × 0.15) + (scarcity × 0.12) +
                  (unity × 0.08)
```

---

## SB7 StoryBrand Çerçevesi (Donald Miller)

7 element — her biri için 0 veya 1:

1. **Karakter** — Kimden bahsediyoruz? Avatar net mi?
2. **Problem** — Dış problem (görünür) + iç problem (his)
3. **Rehber** — Sen bu problemi çözmüş birisin, yetki var
4. **Plan** — Adımlar net, kolay anlaşılır
5. **Çağrı** — Net CTA (pasif değil, aktif)
6. **Başarısızlık** — Hareketsizliğin bedeli gösteriliyor mu?
7. **Başarı** — Hayal edilen sonuç canlandırılıyor mu?

```
narrative_score = (toplam_mevcut_element / 7) × 100
Minimum kabul: 5/7 (%70)
```

---

## Pattern Interrupt ve Open Loop

### Pattern Interrupt Skoru
```
Visual interrupts: hızlı kesim, renk flash, zoom in/out
Audio interrupts: ses efekti, müzik değişimi, ani sessizlik

Optimal frekans: 3–5 saniyede bir interrupt
interrupt_score = min(interrupt_count / (duration_seconds / 4), 1.0)
```

### Open Loop Skoru
```
Döngü açılır (0:00): soru/problem ortaya konur
Döngü kapanır (ideal: video'nun son %15–30'u)
open_loop_ratio = close_time / total_duration → 0.70–0.85 ideal
```

---

## 10 Boyutlu Ağırlıklı Skor

| # | Boyut | Ağırlık | Kaynak |
|---|-------|---------|--------|
| 1 | Hook Gücü (Hormozi) | 20% | $100M Leads |
| 2 | Viral Potansiyel (STEPPS) | 15% | Contagious |
| 3 | Hikaye Bütünlüğü (SB7) | 10% | StoryBrand |
| 4 | İkna Gücü (Cialdini) | 10% | Influence |
| 5 | Görsel Kalite | 10% | Platform standartları |
| 6 | Ses Kalitesi | 8% | Teknik standartlar |
| 7 | Düzenleme Temposu | 8% | Pattern interrupt |
| 8 | CTA Netliği | 8% | Hook-Story-Offer |
| 9 | Platform Uyumu | 6% | Platform kuralları |
| 10 | Marka Güvenliği | 5% | Kırmızı bayrak |

---

## Platform Kuralları

### TikTok
- Format: 9:16 dikey | Süre: 15–60s optimal
- Hook: İlk 1.5s'de hareket veya ses tetikleyici
- Trend sesi: +5 puan bonus
- Yorum tetikleyici: "Siz ne düşünüyorsunuz?" = güçlü sinyal
- Caption: 150 karakter, 3–5 hashtag

### Instagram Reels
- Format: 9:16 veya 4:5 | Süre: 15–90s
- Kapak karesi kritik — grid profili
- Kaydetme: En güçlü sinyal (1 kaydet = 100 like değerinde)
- Hashtag: 5–15, niche + broad mix

### YouTube Shorts
- Format: 9:16, min 1080×1920 | Süre: max 60s
- Thumbnail: Yüz ifadesi önemli (otomatik kare)
- End screen: Son 5s harekete geçirme

### Meta Ads
- Format: 1:1 veya 4:5 (feed), 9:16 (stories)
- **%85 sessiz izleniyor → altyazı ZORUNLU**
- Süre: <15s stories, <30s feed optimal
- İlk 3s'de değer önerisi

---

## Rapor Formatı

```
## Sosyal Medya Analizi — {platform}

**Toplam Skor:** {total}/100 ({A/B/C/D/F})

### Güç Göstergeleri
- STEPPS Viral: {n}/100 — {en güçlü/zayıf element}
- Hormozi Hook: {n}/100 — {hook tipi}
- SB7 Hikaye: {n}/7 element mevcut
- Cialdini: {en güçlü 2 ilke}

### Platform Uyumu: {uygun/sorunlu}
{varsa format/süre/ratio sorunları}

### Öncelikli İyileştirmeler (max 3)
1. {en düşük boyut}: {spesifik öneri}
2. ...

### Tahmini Performans: {düşük/orta/yüksek} engagement

### A/B Test Önerisi
Hook A (mevcut): {mevcut açılış}
Hook B (Hormozi): {Problem + Claim + Sayı formatında alternatif}
```

---

## Skor Derecelendirmesi

| Toplam | Grade | Yorum |
|--------|-------|-------|
| 85–100 | A | Viral potansiyelli, yayınlamaya hazır |
| 70–84 | B | İyi, küçük optimizasyon önerilir |
| 55–69 | C | Orta, önerilen değişiklikler yapılmalı |
| 40–54 | D | Zayıf, büyük revizyon gerekli |
| 0–39 | F | Yayınlanmamalı |

---

## Açık Kaynak Entegrasyon Notları

Bu skill'i güçlendirecek araçlar (Python microservice olarak çalışabilir):
- **WhisperX**: Kelime bazlı timestamp → hook timing analizi
- **Pyannote**: Konuşmacı değişimi tespiti → ritim analizi
- **PySceneDetect**: Kesim hızı ölçümü → tempo skoru
- **OpenFace**: Yüz ifadesi analizi → duygu tespiti (varsa yüz)

---

## FrameAgent Kullanım Senaryosu

**Ne zaman tetiklenir:** Video analizi tamamlandıktan sonra otomatik olarak (auto-analysis seti); kullanıcı "viral", "tiktok", "sosyal medya", "hook", "skor", "reach" gibi kelimeler kullandığında chat modunda.

**Girdi:** Video transkripti + sinematik analiz özeti (sahneler, tempo, duygusal ton)

**Çıktı formatı (JSON — `socialScore` alanı):**
```json
{
  "socialScore": {
    "stepps_viral": 72,
    "hormozi_hook": 65,
    "cialdini_influence": 58,
    "sb7_narrative": 71,
    "overall": 67,
    "grade": "C",
    "strengths": ["Güçlü merak kancası", "Net CTA"],
    "weaknesses": ["İlk 3s yavaş başlıyor", "Sosyal kanıt eksik"]
  },
  "platformAdvice": "TikTok için ilk 1.5s'de hareket veya sürpriz ekle. Instagram Reels için altyazı zorunlu (sessiz izleme %60). YouTube Shorts için thumbnail kelimesi transkripte girmeli."
}
```

**Örnek akış:**
- Input: `"Bu sabah uyandım ve şunu fark ettim: evinizdeki bu 3 şey sizi hasta ediyor..."` (transkript ilk 30s)
- Output: `hormozi_hook: 78` (merak döngüsü güçlü), `stepps_viral: 65` (pratik değer var ama duygusal yük düşük)
