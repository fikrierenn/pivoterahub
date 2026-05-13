---
name: frameos-content-optimizer
description: İçerik optimizasyonu — video script rewrite, caption üretimi, hashtag stratejisi, A/B test varyantları, SEO/platform metadata
triggers:
  - "içerik optimize"
  - "script optimize"
  - "caption yaz"
  - "hashtag"
  - "a/b test"
  - "metadata optimize"
  - "seo yaz"
---

## Görev

Video analizi ve transkript çıktısından platform-özel optimize içerik üret: caption, hashtag seti, başlık varyantları, A/B test materyalleri.

---

## Caption Optimizasyonu

### Platform Kurallari

| Platform | Max Karakter | Hook | Hashtag | Emoji |
|---------|-------------|------|---------|-------|
| TikTok | 2200 | İlk 125 (kesmeden önce) | 3–8 | Evet, güçlü |
| Instagram | 2200 | İlk 125 | 5–15 | Orta |
| YouTube | 5000 (description) | İlk 157 (arama) | 3–5 (tag) | Hayır/az |
| LinkedIn | 3000 | İlk 210 | 3–5 | Az |
| Twitter/X | 280 | Tümü | 1–2 | Az |

### Caption Yapısı

```
[Hook cümlesi — dikkat çekici, ilk 125 karakterde değer vaat et]

[Ana içerik — değer, bilgi veya hikaye, 2–3 paragraf]

[CTA — net, platform'a uygun]

[Hashtag bloğu — caption sonunda, #seperated]
```

---

## Hashtag Stratejisi

### Boyut Mix (Instagram için optimal)
```
Mega (>1M post): 2–3 adet — geniş erişim
Large (100K–1M): 3–5 adet — orta rekabet
Medium (10K–100K): 5–7 adet — hedef kitle
Small (<10K): 2–3 adet — niche, yüksek ilgililik
```

### FrameOS İçerik Türüne Göre Hashtag Şablonları

**Video Analiz İçerikleri:**
```
#videoanalysis #contentcreator #socialmediatips #videoproduction
#contentmarketing #videostrategy #digitalmarketing
```

**Reklam/Pazarlama:**
```
#digitalads #metaads #adcopy #marketingtips #performancemarketing
#fbads #contentmarketing #ROI
```

**Türkçe Niche:**
```
#sosyalmedya #dijitalmarketingtr #içeriküreticisi #videomarketing
#reklamcilik #turkishcreator
```

---

## A/B Test Varyantları

### Hook A/B Test
```
Video Transkript: {transcript}

Üret:
A) Merak odaklı hook
B) Sonuç odaklı hook (sayı/istatistik)
C) Empati/problem odaklı hook

Her biri max 3 cümle, platforma uygun.
```

### CTA A/B Test
```
A) Aciliyet: "Bugün uygula — sonuç garanti"
B) Merak: "Ne fark yarattığını gör"
C) Sosyal kanıt: "10.000 kişi kullandı"
D) Düşük taahhüt: "Ücretsiz dene, risk yok"
```

---

## SEO/Discovery Optimizasyonu

### YouTube Başlık Formülleri
```
[Anahtar Kelime] + [Fayda/Sonuç] + [Hedef Kitle]
"Video Analizi ile TikTok Büyüme: İçerik Üreticileri İçin Tam Rehber"

[Sayı] + [Anahtar Kelime] + [Zaman/Kolaylık]
"5 Video Metriği Her İçerik Üreticisi Bilmeli (2024)"

[Soru] + [Cevap Vaadi]
"Videolarınız Neden İzlenmiyor? İşte Gerçek Sebep"
```

### YouTube Description Yapısı
```
[İlk 157 karakter — anahtar kelime + hook, arama snippet]

[Bölüm linkleri — timestamps]
00:00 Giriş
01:30 Problem Tanımı
03:45 Çözüm

[İlgili linkler]

[Hashtag]
```

### TikTok Keşfet Algoritması
- İlk 500 ms: Thumb stop rate kritik
- İzlenme oranı: %70+ = güçlü sinyal
- Yorum sayısı: İzlenme sayısından fazlaysa viral potansiyel
- Kaydetme: En güçlü sinyal (1 kaydet = 100 like değerinde)

---

## GPT-4o Prompt Şablonu

```
Platform: {platform}
Video Transkript: {transcript}
Video Konusu: {topic}
Hedef Kitle: {audience}
Amaç: {awareness|conversion|engagement|education}

Üret:
1. 3 farklı caption varyantı (A/B/C) — platforma uygun uzunluk
2. Her variant için önerilen hashtag seti (boyut mix dahil)
3. Platform başlığı/başlık önerisi (3 varyant)
4. Video description (YouTube için 157 karakter snippet + tam metin)

JSON formatında döndür.
```

---

## Çıktı Formatı

```
## İçerik Paketi — {platform}

### Caption Varyant A (Hook: Merak)
{caption metni}

**Hashtag Seti:**
{mega}: #hashtag1 #hashtag2
{large}: #hashtag3 #hashtag4 #hashtag5
{medium}: #hashtag6 #hashtag7 #hashtag8 #hashtag9
{niche}: #hashtag10 #hashtag11

---

### Caption Varyant B (Hook: Sonuç)
{caption metni}

### Caption Varyant C (Hook: Empati)
{caption metni}

---

### Başlık Önerileri
1. {başlık — anahtar kelime öne}
2. {başlık — sayı formülü}
3. {başlık — soru formatı}

### CTA Test Seti
A) {cta metni}
B) {cta metni}
```

---

## FrameAgent Kullanım Senaryosu

**Ne zaman tetiklenir:** Kullanıcı "optimize et", "iyileştir", "caption", "başlık", "hashtag", "yeniden yaz" gibi kelimeler kullandığında.

**Girdi:** Video transkripti + hedef platform bilgisi (kullanıcıdan ya da analiz bağlamından)

**Ürettiği çıktı (düz metin, markdown formatında):**
```
### Caption Varyantları

**Varyant A — Merak Hook:**
[caption metni] #hashtag1 #hashtag2

**Varyant B — Sonuç Hook:**
[caption metni] #hashtag1 #hashtag3

**Varyant C — Empati Hook:**
[caption metni]

### Başlık Önerileri
1. [anahtar kelime öne çıkan başlık]
2. [sayı formülü başlık]
3. [soru formatı başlık]

### CTA Test Seti
A) [yumuşak cta]
B) [güçlü cta]
```

**Tipik kullanım:** Kullanıcı "bu videonun caption'ını yazar mısın" der → skill, transkriptten ana mesajı çıkarır → 3 varyant üretir → A/B test için hangisini yayınlayacağını sorar.
