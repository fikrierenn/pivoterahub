# ClientBrain – Video Modülü Tasarım Dokümanı (V1)

## 1. Veritabanı Şeması

### 1.1. clients – Müşteri Ana Tablosu
Her danışan müşteriyi temsil eder. Video, skor, hashtag vb. tüm kayıtlar bu tabloya bağlıdır.

**Kolonlar:**
- id (uuid, PK)
- name (text)
- sector (text) – emlak / gelinlik / homm / zumba
- city (text)
- ig_handle (text)
- weekly_content_capacity (integer)
- positioning (text) – luxury / mid / economic
- created_at (timestamptz)
- updated_at (timestamptz)

**İndeksler:**
- idx_clients_sector
- idx_clients_ig_handle

---

### 1.2. videos – Video Kayıt Tablosu
Her bir Instagram Reel / TikTok / YouTube Short burada tutulur.

**Kolonlar:**
- id (uuid, PK)
- client_id (uuid, FK → clients)
- platform (text) – instagram / tiktok / youtube
- external_id (text)
- url (text)
- published_at (timestamptz)
- duration_sec (integer)
- captions (text)
- hashtags (text[])
- transcript (text) – Whisper output
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)

**İndeksler:**
- idx_videos_client
- idx_videos_client_published
- idx_videos_platform

---

### 1.3. video_scores – Teknik & Stratejik Skorlar
Her video için AI destekli kalite skoru tutulur.

**Kolonlar:**
- id (uuid, PK)
- client_id (uuid, FK → clients)
- video_id (uuid, FK → videos, UNIQUE)
- hook_score (smallint, 0-10)
- tempo_score (smallint, 0-10)
- clarity_score (smallint, 0-10)
- cta_score (smallint, 0-10)
- visual_score (smallint, 0-10)
- funnel_stage (text) – cold / warm / hot / sale
- main_errors (text[])
- ai_comment (text)
- created_at (timestamptz)

**İndeksler:**
- uq_video_scores_video (UNIQUE)
- idx_video_scores_client
- idx_video_scores_stage

---

### 1.4. video_stats – Performans Metrikleri
Her videonun izlenme / beğeni / yorum / paylaşım / kaydetme rakamlarını tutar.

**Kolonlar:**
- id (uuid, PK)
- client_id (uuid, FK → clients)
- video_id (uuid, FK → videos)
- snapshot_date (date)
- views (bigint)
- likes (bigint)
- comments (bigint)
- shares (bigint)
- saves (bigint)
- engagement_rate (numeric)
- created_at (timestamptz)

**İndeksler:**
- uq_video_stats_latest (UNIQUE: video_id, snapshot_date)
- idx_video_stats_client
- idx_video_stats_client_date

---

### 1.5. hashtag_stats – Hashtag Performans Tablosu
Müşteri bazlı hashtag performansını özetler.

**Kolonlar:**
- id (uuid, PK)
- client_id (uuid, FK → clients)
- hashtag (text)
- usage_count (integer)
- total_views (bigint)
- avg_views (numeric)
- avg_engagement_rate (numeric)
- last_used_at (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)

**İndeksler:**
- uq_hashtag_client (UNIQUE: client_id, hashtag)
- idx_hashtag_client_usage

---

## 2. API Uçları

### 2.1. POST /api/video-analysis

**Amaç:**
Yeni bir videoyu sisteme eklemek, transkript almak, LLM ile skor + hata + öneri üretmek, DB'ye yazmak.

**Request:**
```json
{
  "client_id": "uuid",
  "platform": "instagram | tiktok | youtube",
  "url": "string",
  "external_id": "string (optional)",
  "published_at": "2025-12-08T12:00:00Z (optional)",
  "duration_sec": 17,
  "captions": "string (optional)",
  "hashtags": ["bursaemlak", "satilikev"],
  "metrics": {
    "views": 1234,
    "likes": 210,
    "comments": 15,
    "shares": 9,
    "saves": 32
  }
}
```

**Response:**
```json
{
  "video": {
    "id": "uuid",
    "client_id": "uuid",
    "platform": "instagram",
    "url": "string",
    "published_at": "2025-12-08T12:00:00Z",
    "duration_sec": 17,
    "captions": "string",
    "hashtags": ["bursaemlak", "satilikev"],
    "transcript": "Whisper transcript text..."
  },
  "scores": {
    "hook_score": 7,
    "tempo_score": 6,
    "clarity_score": 8,
    "cta_score": 5,
    "visual_score": 7,
    "funnel_stage": "warm",
    "main_errors": ["cta_yok", "hook_zayif"],
    "ai_comment": "Hook ortalama ama CTA çok zayıf..."
  },
  "stats": {
    "views": 1234,
    "likes": 210,
    "comments": 15,
    "shares": 9,
    "saves": 32,
    "engagement_rate": 0.078
  }
}
```

---

### 2.2. POST /api/growth-report

**Amaç:**
Belirli bir tarih aralığı için toplam video / izlenme / etkileşim özetini, son X videonun performansını, kategori bazlı performansı, hashtag performansını ve LLM tabanlı özet + aksiyon maddelerini döndürmek.

**Request:**
```json
{
  "client_id": "uuid",
  "date_from": "2025-11-08",
  "date_to": "2025-12-08",
  "limit_last_videos": 10
}
```

**Response:**
```json
{
  "summary": {
    "total_videos": 14,
    "total_views": 35640,
    "avg_views_per_video": 2545.7,
    "avg_engagement_rate": 0.084,
    "change_vs_previous_period": {
      "videos_percent": 0.40,
      "avg_views_percent": -0.25,
      "engagement_rate_percent": -0.05
    }
  },
  "last_videos": [...],
  "category_performance": [...],
  "hashtag_performance": {
    "top_hashtags": [...],
    "weak_hashtags": [...]
  },
  "ai_evaluation": {
    "summary_text": "...",
    "action_items": [...]
  }
}
```

---

## 3. LLM Prompt Şablonları

### 3.1. Video Analizi Prompt (video_scores için)

**System prompt:**
```
You are an expert social media video coach for real estate, bridal, wellness and similar advisory businesses.
Given a video transcript, basic metadata and client profile, you will score the video (0–10) on several dimensions and suggest improvements.
Always respond in JSON.
```

**User input:**
```json
{
  "client_profile": { "... compact profile_summary json ..." },
  "video_meta": {
    "platform": "instagram",
    "duration_sec": 19,
    "captions": "Nilüfer'de 3+1 daire turu. Fiyat tahmininiz nedir?",
    "hashtags": ["bursaemlak","satilikev"]
  },
  "transcript": "Whisper transcript buraya gelecek...",
  "previous_scores": [
    { "hook_score": 5, "clarity_score": 6, "cta_score": 3, "created_at": "2025-11-30T10:00:00Z" }
  ]
}
```

**Beklenen output:**
```json
{
  "hook_score": 7,
  "tempo_score": 6,
  "clarity_score": 8,
  "cta_score": 5,
  "visual_score": 7,
  "funnel_stage": "warm",
  "main_errors": ["cta_yok", "hook_zayif"],
  "ai_comment": "Hook bu videoda önceki videolara göre daha iyi...",
  "improvement_suggestions": [
    "İlk 3 saniyede 'Bursa'da ev alacaksan bu 3 hatayı yapma' gibi net bir cümle ile başla.",
    "Videonun sonuna tek cümlelik net CTA koy.",
    "Çekim sırasında kamerayı hafif yukarıdan konumlandırarak daha profesyonel görünüm oluştur."
  ]
}
```

**DB'ye yazılacak alanlar:** hook_score, tempo_score, clarity_score, cta_score, visual_score, funnel_stage, main_errors, ai_comment

---

### 3.2. Growth Report Prompt

**System prompt:**
```
You are a data analyst and content coach.
You receive aggregated metrics for a client's recent videos, content categories and hashtags.
Your job is to explain whether they are improving or regressing and propose 5 concrete, practical action items.
Respond in Turkish. Return JSON with summary_text and action_items.
```

**User input:**
```json
{
  "period": {
    "date_from": "2025-11-08",
    "date_to": "2025-12-08"
  },
  "current_period": { "... summary numbers ..." },
  "previous_period": { "... summary numbers ..." },
  "last_videos": [ "... simplified metrics + combined_score ..." ],
  "category_performance": [ "... education vs portfolio vs trust ..." ],
  "hashtag_performance": {
    "top_hashtags": [ "... good ones ..." ],
    "weak_hashtags": [ "... bad ones ..." ]
  }
}
```

**Beklenen output:**
```json
{
  "summary_text": "Son 30 günde video sayın artmış, ancak ortalama izlenme ve etkileşim oranı düşmüş. Eğitim içerikleri güçlü, portföy videoları zayıf kalmış. Hashtag kullanımında 2 güçlü etiketi düzensiz kullanıyorsun.",
  "action_items": [
    "Önümüzdeki 2 hafta boyunca haftalık maksimum 3 video hedefle; her videoyu yayınlamadan önce hook ve CTA'yı gözden geçir.",
    "Eğitim içeriklerini korurken, portföy videolarını 15 saniye altına çek.",
    "Her videoda #bursaemlak ve #satilikev hashtag'lerini standart olarak kullan.",
    "Performansı zayıf olan #evdekorasyon hashtag'ini bırak ve yerine bölge odaklı hashtag'ler dene.",
    "Ay sonunda tekrar growth raporu oluştur ve özellikle portföy videolarının avg_views değerini kıyasla."
  ]
}
```

---

## 4. Mimari

### 4.1. Teknoloji Stack
- **Database:** Postgres / Supabase
- **Backend:** Next.js API Routes
- **Transcript:** Whisper API
- **LLM:** OpenAI GPT-4 / GPT-3.5-turbo
- **Frontend:** React / Next.js

### 4.2. Veri Akışı

**Video Analizi:**
1. Client → POST /api/video-analysis
2. Video URL'den indirme
3. Whisper ile transcript
4. LLM ile skorlama
5. DB'ye kayıt (videos, video_scores, video_stats)
6. hashtag_stats güncelleme
7. Response döndürme

**Gelişim Raporu:**
1. Client → POST /api/growth-report
2. DB'den metrik toplama
3. Önceki dönem karşılaştırması
4. LLM ile değerlendirme
5. Response döndürme

---

## 5. Doğruluk Özellikleri

- Her video için maksimum 1 skor kaydı (video_scores.video_id UNIQUE)
- Hashtag güncelleme: Yeni video eklendiğinde hashtag_stats otomatik güncellenir
- engagement_rate = (likes + comments + shares + saves) / views
- avg_views = total_views / usage_count
- Tüm foreign key'ler ON DELETE CASCADE
- Platform değerleri: instagram, tiktok, youtube
- Funnel stage değerleri: cold, warm, hot, sale
- Skorlar: 0-10 arası smallint
