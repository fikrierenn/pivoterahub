---
name: PivotaraHub-video-score-engine
description: Video kalite skorlama — VMAF/FFmpeg metrikler, PySceneDetect tempo analizi, Walter Murch 6 kural, OpenFace duygu, ses kalitesi LUFS/SNR
triggers:
  - "video skor"
  - "video kalite"
  - "editing analiz"
  - "pace analiz"
  - "cinematic kalite"
  - "video değerlendir"
  - "ses kalitesi"
  - "vmaf"
---

## Görev

PivotaraHub'un FFmpeg frame extraction ve GPT-4o Vision çıktısını kullanarak video'nun teknik ve sinematik kalitesini çok boyutlu olarak skorla. Açık kaynak araçlarla desteklenen hibrit analiz yap.

---

## Araç Katmanları

### 1. FFmpeg Tabanlı (Mevcut Pipeline'da)
- LUFS ses normalizasyonu ölçümü
- Frame extraction (0.5fps)
- Video metadata (codec, bitrate, çözünürlük)

### 2. Python Microservice (Gelecekte Entegre)
- **PySceneDetect**: Shot detection, kesim sayısı, tempo
- **VMAF**: Perceptual quality score (Netflix)
- **WhisperX**: Word-level timestamp, konuşma netliği
- **Pyannote**: Konuşmacı değişimi, diyalog analizi
- **Demucs**: Ses/müzik ayrımı, arka plan gürültüsü
- **OpenFace**: Yüz ifadesi, duygu, engagement level

### 3. GPT-4o Vision (Mevcut)
- Sinematik kompozisyon analizi
- Görsel kalite değerlendirmesi
- İçerik anlama ve bağlam

---

## Walter Murch'ün 6 Kesim Kuralı (Sinematik Analiz)

*(In the Blink of an Eye — Oscar ödüllü editör)*

Öncelik sırasıyla değerlendir:

| Öncelik | Kural | Ağırlık | Değerlendirme |
|---------|-------|---------|---------------|
| 1 | **Emotion** | 51% | Kesim duygusal doğrulukta mı? İzleyici ne hissediyor? |
| 2 | **Story** | 23% | Kesim hikayeyi ilerletiyor mu? Anlam katıyor mu? |
| 3 | **Rhythm** | 10% | Zamansal doğruluk — tam doğru anda mı? |
| 4 | **Eye Trace** | 7% | İzleyicinin gözü nerede? Doğal akış var mı? |
| 5 | **Planarity** | 5% | 2D kompozisyon — 180° kuralı ihlali? |
| 6 | **3D Space** | 4% | Uzamsal süreklilik — sıçrama var mı? |

**Sinematik Skor Hesabı:**
```
cinematic = (emotion × 0.51) + (story × 0.23) + (rhythm × 0.10) +
            (eye_trace × 0.07) + (planarity × 0.05) + (3d_space × 0.04)
```

**GPT-4o Vision Promptu (Walter Murch):**
```
Bu video sequence'ini Walter Murch'ün 6 kural çerçevesinde değerlendir.
Frame'ler: {base64_frames}

Her kural için:
1. Emotion (0–10): Kesimler duygusal doğrulukta mı?
2. Story (0–10): Her sahne hikayeyi ilerletiyor mu?
3. Rhythm (0–10): Tempo izleyiciyi taşıyor mu?
4. Eye Trace (0–10): Odak noktaları tutarlı mı?
5. Planarity (0–10): Kompozisyon grammar ihlali var mı?
6. 3D Space (0–10): Uzamsal süreklilik korunuyor mu?

JSON formatında, her kural için puan + 1 cümle gerekçe.
```

---

## VMAF Perceptual Quality (FFmpeg ile)

Netflix'in Emmy ödüllü kalite metriği — referans video vs çıktı karşılaştırması.

**FFmpeg Komutu:**
```bash
ffmpeg -i reference.mp4 -i distorted.mp4 \
  -lavfi "[0:v]setpts=PTS-STARTPTS[ref];[1:v]setpts=PTS-STARTPTS[dist];[dist][ref]libvmaf=log_fmt=json:log_path=vmaf_output.json:n_threads=4" \
  -f null -
```

**Ek Metrikler (aynı komutla):**
```bash
# VMAF + SSIM + PSNR birlikte
libvmaf=log_fmt=json:log_path=output.json:feature=name=ssim|name=psnr
```

**Skor Yorumlama:**
| VMAF Skoru | Kalite | Yorum |
|-----------|--------|-------|
| 95–100 | Mükemmel | Kayıpsız veya algılanamaz kayıp |
| 80–94 | İyi | Yayıncılık standardı |
| 60–79 | Kabul Edilebilir | Web için yeterli |
| 40–59 | Zayıf | Yeniden encode önerilir |
| <40 | Kötü | Büyük kalite sorunu |

---

## PySceneDetect — Tempo Analizi

```bash
# Kurulum (Python microservice)
pip install scenedetect

# CLI kullanımı
scenedetect -i video.mp4 detect-content list-scenes

# Python API
from scenedetect import detect, ContentDetector
scenes = detect('video.mp4', ContentDetector(threshold=27.0))
```

**Tempo Hesabı:**
```python
scene_count = len(scenes)
duration_seconds = get_duration(video)
cuts_per_minute = (scene_count / duration_seconds) * 60
```

**Tempo Kategorizasyonu:**
| Kesim/dk | Kategori | Platform |
|---------|---------|---------|
| >30 | Ultra Hızlı | TikTok hook, reklam |
| 15–30 | Hızlı | TikTok, Reels |
| 8–15 | Orta | YouTube, Instagram |
| 3–8 | Yavaş | LinkedIn, Belgesel |
| <3 | Çok Yavaş | Film, uzun format |

---

## Ses Kalitesi — FFmpeg LUFS Analizi

**LUFS Ölçüm Komutu:**
```bash
ffmpeg -i input.mp4 \
  -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json \
  -f null -
```

**Streaming Standartları:**
```
Hedef LUFS: -14 LUFS (Spotify, YouTube standartı)
Peak: -1 dBTP (True Peak)
LRA: 7–12 LU (Dynamic Range)
```

**Kalite Seviyeleri:**
| SNR | Kategori | Sonuç |
|-----|---------|-------|
| >40 dB | Mükemmel | Stüdyo kalitesi |
| 30–40 dB | İyi | Yayıncılık standartı |
| 20–30 dB | Orta | Web için kabul edilir |
| <20 dB | Kötü | Gürültü problemi |

**Dialog Müzik Dengesi:**
```
Diyalog içerik: Müzik -18 dB altında tutulmalı
B-roll/montaj: Müzik -6 dB civarı
Reklam: Müzik -12 dB — her iki içerik net duyulsun
```

---

## Demucs — Ses/Müzik Ayrımı

*(Meta'nın açık kaynak source separation modeli)*

```bash
# Kurulum
pip install demucs

# Kullanım (4-stem: drums, bass, vocals, other)
demucs --two-stems vocals input.mp4
# Çıktı: vocals.wav + no_vocals.wav

# 6-stem (piyano ve gitar dahil)
demucs -n htdemucs_6s input.mp4
```

**PivotaraHub Kullanım Senaryosu:**
- Background noise tespiti: `no_vocals.wav` analizi
- Müzik hakları kontrolü: hangi müzik var?
- Ses netliği skoru: `vocals.wav` kalitesi ölçümü

---

## OpenFace — Yüz İfadesi Analizi

*(CMU, 5K+ GitHub star)*

**18 Action Unit (AU) Tespiti:**
```
AU1: İç kaş kaldırma (merak, endişe)
AU2: Dış kaş kaldırma
AU4: Kaş çatma (yoğunlaşma, ciddiyet)
AU6+12: Gerçek gülümseme (Duchenne smile)
AU25: Dudak açılma (konuşma aktifliği)
AU45: Göz kırpma
```

**Engagement Skoru (Kamera Karşısı Performans):**
```
engagement = (smile_intensity × 0.3) +
             (eye_contact × 0.3) +
             (expression_variety × 0.2) +
             (head_movement × 0.2)
```

---

## 10 Boyutlu Teknik Skor

| # | Boyut | Araç | Ağırlık |
|---|-------|------|---------|
| 1 | Görsel Netlik | GPT-4o Vision / VMAF | 15% |
| 2 | Sinematik Kompozisyon | GPT-4o + Walter Murch | 15% |
| 3 | Aydınlatma | GPT-4o Vision | 10% |
| 4 | Ses Kalitesi (LUFS/SNR) | FFmpeg loudnorm | 15% |
| 5 | Editing Temposu | PySceneDetect | 10% |
| 6 | Duygu/Yüz Performansı | OpenFace / GPT-4o | 10% |
| 7 | Renk Tutarlılığı | GPT-4o Vision | 8% |
| 8 | Kamera Stabilitesi | GPT-4o Vision | 7% |
| 9 | Ses-Görüntü Senkronu | FFmpeg + WhisperX | 5% |
| 10 | Grafik/Altyazı | GPT-4o Vision | 5% |

---

## Node.js Entegrasyon Mimarisi

```
Next.js API Route (/api/video-score)
    ↓
src/lib/videoQualityScorer.ts
    ↓
[Paralel çalışır]
├── FFmpeg: LUFS, metadata, frame extraction
├── GPT-4o Vision: Sinematik analiz + Walter Murch
└── Python Microservice (opsiyonel, gelecekte):
    ├── PySceneDetect → cuts_per_minute
    ├── VMAF → quality_score
    ├── Demucs → audio_separation
    └── OpenFace → face_engagement
    ↓
Birleşik JSON skor raporu
```

---

## Rapor Formatı

```
## Video Kalite Raporu

**Genel Teknik Skor:** {total}/100
**Walter Murch Sinematik:** {n}/100
**Ses Kalitesi:** {LUFS değeri}, {kategori}

### Teknik Metrikler
| Boyut | Puan | Sorun |
|-------|------|-------|
| Görsel Netlik | {n}/10 | |
| Ses (LUFS) | {n}/10 | {mevcut} → hedef -14 LUFS |
| Tempo | {n}/10 | {cuts/dk} → {kategori} |
...

### Walter Murch Analizi
- Emotion: {n}/10 — {gerekçe}
- Story: {n}/10 — {gerekçe}
- Rhythm: {n}/10 — {gerekçe}

### Kritik Sorunlar
- {sorun}: {timestamp}s'de tespit

### Öneriler
1. {en kritik iyileştirme}
2. {ikinci öncelik}
```

---

## FrameAgent Kullanım Senaryosu

**Ne zaman tetiklenir:** Auto-analysis setinde her video için otomatik; kullanıcı "puan", "skor", "kalite", "kurgu", "ses", "teknik" gibi kelimeler kullandığında chat modunda.

**Girdi:** Sinematik analiz (sahne sayısı, kesim hızı, ses kalitesi notları) + transkript (tempo referansı için)

**Çıktı formatı (JSON — `videoScore` alanı):**
```json
{
  "videoScore": {
    "dimensions": {
      "visual_clarity": 7,
      "audio_quality": 6,
      "edit_tempo": 8,
      "hook_strength": 5,
      "storytelling": 7,
      "cta_clarity": 6,
      "platform_fit": 8,
      "emotional_impact": 6,
      "information_density": 7,
      "retention_potential": 6
    },
    "weighted_total": 68,
    "grade": "C",
    "walter_murch": {
      "emotion": 7,
      "story": 6,
      "rhythm": 8
    },
    "critical_issues": [
      "Hook zayıf: İlk 3s'de hareket veya merak yok",
      "Ses normalize edilmemiş: -23 LUFS, hedef -14"
    ],
    "top_improvements": [
      "İlk 3s'yi kes veya yeniden çek",
      "Ses seviyesini normalize et"
    ]
  }
}
```

**Örnek akış:**
- Input: 45 saniyelik ürün tanıtım videosu, 8 sahne, düz anlatım
- Output: `edit_tempo: 5` (sahne başına 5.6s — yavaş), `hook_strength: 3` (intro "Merhaba değerli izleyiciler" ile başlıyor — kötü), öneri: ilk 8 saniyeyi sil
