---
name: PivotaraHub-platform-optimizer
description: Platform-specific video optimizasyon rehberi — format dönüşümü, süre kesme, aspect ratio, thumbnail, kapak karesi önerisi
triggers:
  - "platform optimize"
  - "format dönüştür"
  - "aspect ratio"
  - "thumbnail"
  - "kapak karesi"
  - "süre kesme"
  - "video kırp"
---

## Görev

Analiz edilmiş bir videoyu farklı platformlar için optimize etme stratejisi üret. FFmpeg komutları, kesim noktaları, format önerileri ver.

---

## Platform Teknik Gereksinimleri

### TikTok
```
Çözünürlük: 1080×1920 (9:16)
Kare hızı: 24/25/30 FPS
Maksimum süre: 10 dakika (optimal: 15–60s)
Dosya boyutu: max 287.6 MB
Codec: H.264 veya H.265
Ses: AAC, 44.1kHz, stereo
Altyazı: SRT veya yerleşik metin
```

### Instagram Reels
```
Çözünürlük: 1080×1920 (9:16) veya 1080×1350 (4:5)
Kare hızı: 30 FPS
Maksimum süre: 90 saniye
Dosya boyutu: max 650 MB
Codec: H.264
Ses: AAC
```

### YouTube Shorts
```
Çözünürlük: 1080×1920 (9:16)
Kare hızı: 30/60 FPS
Maksimum süre: 60 saniye
Codec: H.264/H.265
Ses: AAC 128kbps+
Thumbnail: 1280×720 (otomatik veya özel)
```

### Meta Ads
```
Feed: 1080×1080 (1:1) veya 1080×1350 (4:5)
Stories/Reels: 1080×1920 (9:16)
Maksimum süre: 15s (stories), 60s (feed optimal)
Dosya boyutu: max 4 GB
Codec: H.264
Min çözünürlük: 600×600
```

### YouTube (Long Form)
```
Çözünürlük: 1920×1080 (16:9) optimal
Kare hızı: 24/30/60 FPS
Codec: H.264 (broad compat) veya VP9
Ses: AAC 192kbps+
Thumbnail: 1280×720, max 2MB, JPG/PNG
```

---

## FFmpeg Dönüşüm Komutları

### 16:9 → 9:16 (Landscape → Portrait)
```bash
# Merkezi kırpma
ffmpeg -i input.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920" -c:a copy output_portrait.mp4

# Blur arka plan ile (letterbox yerine)
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:1[bg];[0:v]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2" \
  output_blur_bg.mp4
```

### Süre Kesme
```bash
# Belirli segmenti kes
ffmpeg -i input.mp4 -ss 00:00:05 -t 00:00:60 -c copy segment.mp4

# Başlangıç ve bitiş zamanı
ffmpeg -i input.mp4 -ss 5 -to 65 output.mp4
```

### Aspect Ratio 1:1
```bash
ffmpeg -i input.mp4 -vf "crop=min(iw\,ih):min(iw\,ih),scale=1080:1080" output_square.mp4
```

### Ses Normalizasyonu
```bash
# -14 LUFS streaming standardı
ffmpeg -i input.mp4 -af "loudnorm=I=-14:TP=-1:LRA=11" output_normalized.mp4
```

---

## Thumbnail/Kapak Karesi Analizi

### İyi Thumbnail Kriterleri
- [ ] Yüz ekspresyonu (varsa): Güçlü, net ifade
- [ ] Kontrast: Arka plan ile ön plan ayrımı net
- [ ] Metin: Max 6 kelime, büyük punt, mobilde okunabilir
- [ ] Renk: Platforma özgü — YouTube: canlı, LinkedIn: profesyonel
- [ ] Kompozisyon: Özne sol veya merkez, sağ boş alan
- [ ] Tıklama değeri: "İzlemek istiyorum" hissi

### Frame Seçim Algoritması

PivotaraHub'ta thumbnail seçimi için GPT-4o'ya sor:
```
Aşağıdaki frame'lerden thumbnail için en iyi 3'ünü seç.
Kriterler:
1. Yüz net ve ekspresyonlu mu?
2. Komp iyi mi?
3. Hareket blur'u yok mu?
4. İçeriği temsil ediyor mu?

Her frame için puan ver (0–10) ve gerekçe yaz.
```

---

## Çoklu Platform Strateji

```
Kaynak Video (1920×1080, 10 dakika)
    │
    ├── YouTube (tam, 16:9) — SEO odaklı, description + chapter
    ├── YouTube Shorts (en iyi 60s, 9:16) — hook + değer + CTA
    ├── TikTok (ilk 15–45s, 9:16) — en güçlü hook ile başla
    ├── Instagram Reels (60–90s, 9:16 veya 4:5) — estetik odaklı
    ├── LinkedIn (30–60s, 16:9 veya 1:1) — profesyonel değer
    └── Meta Ads (15s highlight, 1:1) — CTA odaklı
```

---

## Optimizasyon Raporu Formatı

```
## Platform Optimizasyon Raporu

**Kaynak Video:** {süre}s, {resolution}, {aspectRatio}

### Gerekli Dönüşümler

| Platform | Mevcut Uyum | Yapılacak |
|---------|------------|---------|
| TikTok | ❌ 16:9 format | Crop → 9:16, süre kıs |
| Instagram | ⚠️ Çok uzun | 90s'ye kırp |
| YouTube Shorts | ✅ Uygun | Thumbnail ekle |
| Meta Ads | ❌ 1:1 gerekli | Kare crop + ses norm |

### Kesim Önerileri

**En İyi 60s Segment:** {başlangıç}s – {bitiş}s
Gerekçe: En güçlü hook + değer yoğunluğu + CTA bu bölümde

**Thumbnail Adayları:**
1. {timestamp}s — {açıklama}
2. {timestamp}s — {açıklama}

### FFmpeg Komutları
\`\`\`bash
# TikTok versiyonu
{komut}

# Instagram versiyonu
{komut}
\`\`\`
```

---

## FrameAgent Kullanım Senaryosu

**Ne zaman tetiklenir:** Kullanıcı "tiktok", "instagram", "youtube", "reels", "shorts", "format", "kırp", "boyut" gibi kelimeler kullandığında.

**Girdi:** Video süresi + mevcut format + hedef platform (kullanıcı belirtirse) veya tüm platformlar için genel analiz

**Ürettiği çıktı (düz metin, markdown formatında):**
```
### Platform Uyumluluk Matrisi

| Platform | Süre Uyum | Format | Aksiyon |
|----------|-----------|--------|---------|
| TikTok | ✅ 45s ideal | 9:16 gerekli | Crop yeterli |
| Instagram Reels | ✅ | 9:16 gerekli | Ses normalizasyonu |
| YouTube Shorts | ⚠️ 45s biraz uzun | 9:16 | 30s'ye kes |
| LinkedIn | ❌ 45s çok kısa | 16:9 veya 1:1 | Farklı versiyon gerek |

### En İyi 60s Segment
**[12s – 57s]** — En güçlü hook + değer yoğunluğu bu bölgede

### Thumbnail Adayları
1. [23s] — Duygusal zirve anı
2. [38s] — Ürün/sonuç net görünüyor

### FFmpeg Komutları
```bash
# TikTok 9:16 crop
ffmpeg -i input.mp4 -vf "crop=ih*9/16:ih:(iw-ih*9/16)/2:0" -t 45 tiktok.mp4
```
```

**Tipik kullanım:** Kullanıcı "bu videoyu TikTok için nasıl düzenlemeliyim" der → video süresi + sinematik analiz bağlamından zaten bilgi var → platform spesifik kesim önerisi + FFmpeg komutu üretir.
