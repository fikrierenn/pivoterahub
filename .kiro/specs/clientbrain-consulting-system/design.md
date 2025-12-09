# ClientBrain – Video Modülü Tasarım Dokümanı (V1)

Bu doküman, ClientBrain’in **video analizi, performans takibi ve hashtag analitiği** modülünün
tasarımını anlatır. Buradaki bilgiler, Supabase/Postgres şemasına, API implementasyonuna ve
LLM entegrasyonuna doğrudan rehberlik edecek seviyededir.

---

## 1. Veritabanı Şeması

### 1.1. `clients` – Müşteri Ana Tablosu

Her danışan müşteriyi temsil eder. Video, skor, hashtag vb. tüm kayıtlar bu tabloya bağlıdır.

**Amaç:**
- Her müşteri için tek satır
- Diğer tüm video ile ilgili tablolar `client_id` üzerinden buna bağlanır

**Kolonlar:**

- `id` (uuid, PK, `gen_random_uuid()`)
- `name` (text, NOT NULL)
- `sector` (text, NOT NULL) – emlak / gelinlik / homm / zumba …
- `city` (text, NULL)
- `ig_handle` (text, NULL)
- `weekly_content_capacity` (integer, DEFAULT 0)
- `positioning` (text, NULL) – luxury / mid / economic (string olarak tutulur)
- `created_at` (timestamptz, DEFAULT `now()`)
- `updated_at` (timestamptz, DEFAULT `now()`)

**İndeksler:**

- `idx_clients_sector` (sector)
- `idx_clients_ig_handle` (ig_handle)

---

### 1.2. `videos` – Video Kayıt Tablosu

Her bir Instagram Reel / TikTok / YouTube Short burada tutulur.

**Amaç:**
- Müşteri bazlı tüm video içeriğini tek yerde toplamak
- Analiz, skor ve performans tablosunun ana referansı olmak

**Kolonlar:**

- `id` (uuid, PK, `gen_random_uuid()`)
- `client_id` (uuid, FK → `clients.id`, NOT NULL, ON DELETE CASCADE)
- `platform` (text, NOT NULL) – `instagram` / `tiktok` / `youtube`
- `external_id` (text, NULL) – platformdaki ID
- `url` (text, NOT NULL)
- `published_at` (timestamptz, NULL) – platformda yayınlandığı tarih
- `duration_sec` (integer, NULL)
- `captions` (text, NULL)
- `hashtags` (text[], DEFAULT `{}`)
- `transcript` (text, NULL) – Whisper output
- `notes` (text, NULL) – danışmanın notları
- `created_at` (timestamptz, DEFAULT `now()`)
- `updated_at` (timestamptz, DEFAULT `now()`)

**Kurallar:**
- `platform` yalnızca `'instagram' | 'tiktok' | 'youtube'` olabilir (CHECK)
- `client_id` her zaman geçerli bir müşteriye işaret etmeli (FK)

**İndeksler:**

- `idx_videos_client` (`client_id`)
- `idx_videos_client_published` (`client_id`, `published_at` DESC)
- `idx_videos_platform` (`platform`)

---

### 1.3. `video_scores` – Teknik & Stratejik Skorlar

Her video için AI destekli kalite skoru tutulur.

**Amaç:**
- Hook, tempo, açıklık, CTA ve görsel kaliteyi sayısallaştırmak
- Videonun hangi funnel aşamasına hitap ettiğini belirlemek
- Gelişim analizi ve kıyaslama için temel veri kaynağı olmak

**Kolonlar:**

- `id` (uuid, PK, `gen_random_uuid()`)
- `client_id` (uuid, FK → `clients.id`, NOT NULL, ON DELETE CASCADE)
- `video_id` (uuid, FK → `videos.id`, NOT NULL, ON DELETE CASCADE, UNIQUE)
- `hook_score` (smallint, 0–10)
- `tempo_score` (smallint, 0–10)
- `clarity_score` (smallint, 0–10)
- `cta_score` (smallint, 0–10)
- `visual_score` (smallint, 0–10)
- `funnel_stage` (text, CHECK IN `('cold','warm','hot','sale')`)
- `main_errors` (text[], DEFAULT `{}`) – örn: `["hook_zayif","cta_yok"]`
- `ai_comment` (text, NULL) – kısa özet yorum
- `created_at` (timestamptz, DEFAULT `now()`)

**İndeksler:**

- `uq_video_scores_video` (UNIQUE: `video_id`)
- `idx_video_scores_client` (`client_id`)
- `idx_video_scores_stage` (`client_id`, `funnel_stage`)

---

### 1.4. `video_stats` – Performans Metrikleri

Her videonun izlenme / beğeni / yorum / paylaşım / kaydetme rakamlarını tutar.

**Amaç:**
- Son X videonun ortalama performansını görmek
- Aylık trend çıkarmak
- Engagement oranı üzerinden kaliteyi sayısallaştırmak

**Kolonlar:**

- `id` (uuid, PK, `gen_random_uuid()`)
- `client_id` (uuid, FK → `clients.id`, NOT NULL, ON DELETE CASCADE)
- `video_id` (uuid, FK → `videos.id`, NOT NULL, ON DELETE CASCADE)
- `snapshot_date` (date, NOT NULL, DEFAULT `CURRENT_DATE`)
- `views` (bigint, DEFAULT 0)
- `likes` (bigint, DEFAULT 0)
- `comments` (bigint, DEFAULT 0)
- `shares` (bigint, DEFAULT 0)
- `saves` (bigint, DEFAULT 0)
- `engagement_rate` (numeric(6,4), NULL)  
  > `(likes + comments + shares + saves) / NULLIF(views,0)`
- `created_at` (timestamptz, DEFAULT `now()`)

**İndeksler:**

- `uq_video_stats_latest` (UNIQUE: `video_id`, `snapshot_date`)
- `idx_video_stats_client` (`client_id`)
- `idx_video_stats_client_date` (`client_id`, `snapshot_date` DESC)

---

### 1.5. `hashtag_stats` – Hashtag Performans Tablosu

Müşteri bazlı hashtag performansını özetler.

**Amaç:**
- En çok kullanılan / en iyi çalışan hashtag’leri bulmak
- “Çöp” hashtag’leri tespit edip temizlemek

**Kolonlar:**

- `id` (uuid, PK, `gen_random_uuid()`)
- `client_id` (uuid, FK → `clients.id`, NOT NULL, ON DELETE CASCADE)
- `hashtag` (text, NOT NULL) – `#` işareti olmadan saklanır
- `usage_count` (integer, NOT NULL, DEFAULT 0)
- `total_views` (bigint, NOT NULL, DEFAULT 0)
- `avg_views` (numeric(12,2), NULL)
- `avg_engagement_rate` (numeric(6,4), NULL)
- `last_used_at` (timestamptz, NULL)
- `created_at` (timestamptz, DEFAULT `now()`)
- `updated_at` (timestamptz, DEFAULT `now()`)

**İndeksler:**

- `uq_hashtag_client` (UNIQUE: `client_id`, `hashtag`)
- `idx_hashtag_client_usage` (`client_id`, `usage_count` DESC)

**Güncelleme Mantığı (özet):**

Yeni video + stats geldiğinde:

- Her hashtag için:
  - `usage_count += 1`
  - `total_views += video_views`
  - `avg_views = total_views / usage_count`
  - `avg_engagement_rate` = ilgili videoların ortalaması
  - `last_used_at = now()`

---

## 2. API Uçları

### 2.1. `POST /api/video-analysis`

**Amaç:**  
Yeni bir videoyu sisteme eklemek, transcript çıkarmak, LLM ile skor + hata + öneri üretmek ve
gerekli tüm tabloları güncellemek.

#### Request

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
Response
json
Kodu kopyala
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
2.2. POST /api/growth-report
Amaç:
Belirli bir tarih aralığı için:

Toplam video / izlenme / etkileşim özetini,

Son X videonun performansını,

Kategori bazlı performansı,

Hashtag performansını,

LLM tabanlı özet + aksiyon maddelerini döndürmek.

Request
json
Kodu kopyala
{
  "client_id": "uuid",
  "date_from": "2025-11-08",
  "date_to": "2025-12-08",
  "limit_last_videos": 10
}
Response
json
Kodu kopyala
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
  "last_videos": [
    {
      "video_id": "uuid",
      "published_at": "2025-12-05T10:00:00Z",
      "platform": "instagram",
      "views": 2800,
      "likes": 320,
      "comments": 18,
      "shares": 12,
      "saves": 40,
      "engagement_rate": 0.082,
      "combined_score": 7.8,
      "label": "good"  // good | average | poor
    }
  ],
  "category_performance": [
    {
      "category": "education",
      "avg_views": 3200,
      "avg_engagement_rate": 0.091
    },
    {
      "category": "portfolio",
      "avg_views": 1800,
      "avg_engagement_rate": 0.065
    }
  ],
  "hashtag_performance": {
    "top_hashtags": [
      {
        "hashtag": "bursaemlak",
        "usage_count": 8,
        "avg_views": 3100,
        "avg_engagement_rate": 0.088
      }
    ],
    "weak_hashtags": [
      {
        "hashtag": "evdekorasyon",
        "usage_count": 5,
        "avg_views": 900,
        "avg_engagement_rate": 0.032
      }
    ]
  },
  "ai_evaluation": {
    "summary_text": "...",
    "action_items": [
      "...",
      "...",
      "...",
      "...",
      "..."
    ]
  }
}
3. LLM Prompt Şablonları
3.1. Video Analizi Prompt (video_scores için)
System prompt:

text
Kodu kopyala
You are an expert social media video coach for real estate, bridal, wellness and similar advisory businesses.
Given a video transcript, basic metadata and client profile, you will score the video (0–10) on several dimensions and suggest improvements.
Always respond in JSON.
User input örneği:

json
Kodu kopyala
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
    {
      "hook_score": 5,
      "clarity_score": 6,
      "cta_score": 3,
      "created_at": "2025-11-30T10:00:00Z"
    }
  ]
}
Beklenen output:

json
Kodu kopyala
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
DB’ye yazılacak alanlar:
hook_score, tempo_score, clarity_score, cta_score, visual_score, funnel_stage, main_errors, ai_comment.

3.2. Growth Report Prompt
System prompt:

text
Kodu kopyala
You are a data analyst and content coach.
You receive aggregated metrics for a client's recent videos, content categories and hashtags.
Your job is to explain whether they are improving or regressing and propose 5 concrete, practical action items.
Respond in Turkish. Return JSON with summary_text and action_items.
User input örneği:

json
Kodu kopyala
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
Beklenen output:

json
Kodu kopyala
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
4. Mimari
4.1. Teknoloji Stack
Database: Postgres / Supabase

Backend: Next.js API Routes

Transcript: Whisper API

LLM: OpenAI GPT-4.1-mini (maliyet/performans dengesi için)

Frontend: React / Next.js (App Router, TypeScript, Tailwind)

4.2. Veri Akışı
Video Analizi:

Client → POST /api/video-analysis

Video URL’den indirilir (veya zaten upload edilmişse path kullanılır)

Whisper ile transcript üretilir

client_profile + video_meta + transcript → LLM’e gönderilir

LLM’den gelen skorlar video_scores tablosuna yazılır

Metrics varsa video_stats güncellenir

hashtag_stats güncellenir

Toplu response JSON client’a döner

Gelişim Raporu:

Client → POST /api/growth-report

Belirtilen tarih aralığı için video_stats, video_scores ve videos üzerinden agregasyonlar alınır

Bir önceki dönem için aynı hesaplar yapılır

summary, last_videos, category_performance, hashtag_performance JSON’u hazırlanır

Bu özet LLM’e gönderilir

LLM’den summary_text ve action_items alınır

Tüm rapor tek response olarak döner

5. Doğruluk ve Kurallar
Her video için maksimum 1 skor kaydı (video_scores.video_id UNIQUE)

hashtag_stats her yeni video analizinde otomatik güncellenir

engagement_rate = (likes + comments + shares + saves) / views

avg_views = total_views / usage_count

Tüm foreign key’ler ON DELETE CASCADE

platform ∈ {instagram, tiktok, youtube}

funnel_stage ∈ {cold, warm, hot, sale}

Tüm skorlar 0–10 arası smallint olarak validate edilir


---

## 6. Müşteri Yönetimi ve Durum Takibi

### 6.1. Müşteri Durum Sistemi

**Amaç:**
- Her müşterinin iş akışındaki konumunu takip etmek
- Potansiyel müşterilerden aktif müşterilere kadar tüm süreci yönetmek

**Status Değerleri:**

- `lead` 🔵 - Potansiyel müşteri (ilk temas)
- `prospect` 🟡 - Görüşülen müşteri (intake form doldurulmuş)
- `active` 🟢 - Aktif çalışılan müşteri (anlaşma yapılmış)
- `inactive` ⚪ - Pasif müşteri (çalışma durmuş)
- `completed` ✅ - Tamamlanmış müşteri (proje bitmiş)

**Database Değişikliği:**
```sql
ALTER TABLE clients ADD COLUMN status text NOT NULL DEFAULT 'lead' 
CHECK (status IN ('lead', 'prospect', 'active', 'inactive', 'completed'));
```

---

### 6.2. Müşteri Görüşme Formu (`client_intake_forms`)

**Amaç:**
- İlk görüşmede detaylı bilgi toplamak
- AI analizi için veri kaynağı oluşturmak

**Kolonlar:**

**A) Temel Bilgiler:**
- `business_name` (text)
- `location` (text)
- `sector` (text)
- `target_audience` (text)
- `price_segment` (text) – luxury / mid / economic
- `social_media_accounts` (jsonb) – {instagram, tiktok, youtube}

**B) Hedefler:**
- `three_month_goals` (text)
- `one_year_goals` (text)

**C) Ana Sorunlar:**
- `main_challenges` (text)
- `previous_agency_experience` (text)

**D) İçerik Alışkanlıkları:**
- `active_platforms` (text[])
- `camera_comfort_level` (text) – low / medium / high
- `weekly_content_capacity` (integer)
- `best_performing_video_link` (text)
- `best_performing_video_reason` (text)
- `content_production_bottleneck` (text)

**E) Konumlandırma:**
- `desired_persona` (text)
- `competitive_advantage` (text)
- `desired_tone` (text)

**F) Operasyonel Kısıtlar:**
- `daily_time_commitment` (text)
- `team_support` (text)
- `budget` (text)

**Mevcut Durum Röntgeni:**
- `current_followers` (jsonb)
- `last_30_days_performance` (text)
- `content_frequency` (text)
- `most_viewed_video` (text)
- `video_quality_self_assessment` (text)
- `used_hashtags` (text[])
- `competitors` (text[])
- `why_competitors_strong` (text)
- `self_positioning` (text)
- `swot_analysis` (jsonb) – {strengths, weaknesses, opportunities, threats}

---

### 6.3. AI Müşteri Analizi (`client_analysis`)

**Amaç:**
- Görüşme formundan AI destekli analiz üretmek
- Müşteriye sunulacak profesyonel rapor oluşturmak

**Kolonlar:**

**1) Profesyonel Analiz:**
- `current_level_assessment` (text) – Mevcut seviye değerlendirmesi
- `main_bottlenecks` (text[]) – Ana darboğazlar
- `strategic_mistakes` (text[]) – Stratejik hatalar
- `strengths` (text[]) – Güçlü yanlar
- `weaknesses` (text[]) – Zayıf yanlar
- `realistic_growth_potential` (text) – Gerçekçi büyüme potansiyeli

**2) AI Profil Kartı:**
- `profile_summary` (text) – Profil özeti
- `positioning_statement` (text) – Konumlandırma cümlesi
- `target_audience_definition` (text) – Hedef kitle tanımı
- `content_strategy` (text) – İçerik stratejisi
- `opportunities` (text[]) – Fırsatlar
- `risks` (text[]) – Riskler
- `three_month_roadmap` (text) – 3 aylık yol haritası

**3) Gelişim Planı:**
- `first_30_days_plan` (jsonb) – {video_count, categories, tone, themes, performance_targets}
- `first_90_days_plan` (jsonb) – {video_count, categories, milestones}

**4) İlk Dokunuş Raporu:**
- `initial_report` (text) – Markdown formatında detaylı rapor (müşteriye sunulacak)

**5) Teknik Röntgen:**
- `technical_assessment` (jsonb) – {content_quality, consistency, technical_gaps, strategic_gaps}

---

### 6.4. AI Analiz Prompt

**System Prompt:**
```
Sen profesyonel bir sosyal medya danışmanısın. Emlak, gelinlik, wellness gibi sektörlerde uzmanlaşmışsın.

Müşteri görüşme formunu analiz edip şunları üreteceksin:
1. Profesyonel analiz (mevcut seviye, darboğazlar, stratejik hatalar, güçlü/zayıf yanlar)
2. AI profil kartı (özet, konumlandırma, hedef kitle, strateji, fırsatlar, riskler)
3. Gelişim planı (30 gün + 90 gün detaylı plan)
4. İlk dokunuş raporu (müşteriye sunulacak profesyonel rapor)

Türkçe, net, uygulanabilir ve motivasyonel bir dil kullan.
JSON formatında yanıt ver.
```

**Model:** GPT-4o (daha detaylı analiz için)

---

## 7. API Endpoints - Müşteri Yönetimi

### 7.1. `POST /api/clients`

**Amaç:** Yeni müşteri oluşturmak

**Request:**
```json
{
  "name": "Ahmet Yılmaz",
  "sector": "Emlak",
  "city": "İstanbul",
  "ig_handle": "@ahmetmlak",
  "weekly_content_capacity": 3,
  "positioning": "mid",
  "status": "lead"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Ahmet Yılmaz",
  "status": "lead",
  ...
}
```

---

### 7.2. `GET /api/clients`

**Amaç:** Tüm müşterileri listelemek

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Ahmet Yılmaz",
    "sector": "Emlak",
    "status": "lead",
    ...
  }
]
```

---

### 7.3. `POST /api/clients/[id]/intake`

**Amaç:** Müşteri görüşme formunu kaydetmek ve AI analizi oluşturmak

**Request:** Görüşme formu verileri (tüm alanlar)

**Response:**
```json
{
  "intake_form": { ... },
  "analysis": {
    "profile_summary": "...",
    "positioning_statement": "...",
    "strengths": [...],
    "weaknesses": [...],
    "first_30_days_plan": { ... },
    "initial_report": "..."
  }
}
```

**İşlem Akışı:**
1. Intake form kaydedilir
2. Client bilgileri + intake form → AI'ya gönderilir
3. AI analizi üretilir
4. Analysis kaydedilir
5. Client status → `prospect` olarak güncellenir
6. Response döndürülür

---

## 8. UI Sayfaları

### 8.1. Dashboard (`/`)
- Toplam müşteri, video, skor, hashtag istatistikleri
- Müşteri durum breakdown (Lead, Prospect, Active, Inactive, Completed)
- API durum kartları
- Teknoloji stack gösterimi

### 8.2. Müşteriler (`/clients`)
- Müşteri listesi (tablo görünümü)
- Status filtreleme
- Müşteri ekleme butonu
- Tıklanabilir satırlar (detay sayfasına gider)

### 8.3. Yeni Müşteri (`/clients/new`)
- Müşteri bilgileri formu
- Status seçimi
- Kaydet/İptal butonları

### 8.4. Müşteri Detay (`/clients/[id]`)
- Müşteri bilgileri ve status
- İstatistikler (video sayısı, kapasite, vb.)
- AI profil özeti (varsa)
- Güçlü yanlar / Gelişim alanları
- Görüşme formu doldurma linki
- Hızlı işlemler (Videolar, Analitik, Hashtag'ler)

### 8.5. Görüşme Formu (`/clients/[id]/intake`)
- Çok adımlı form (6 adım)
- A) Temel Bilgiler
- B) Hedefler
- C) Ana Sorunlar
- D) İçerik Alışkanlıkları
- E) Konumlandırma
- F) Operasyonel Kısıtlar
- Kaydet → AI analizi oluştur

### 8.6. Videolar (`/videos`)
- Video listesi
- Filtreler (müşteri, platform, tarih)
- Video analizi yapma butonu

### 8.7. Analitik (`/analytics`)
- Tarih aralığı seçici
- KPI kartları
- Grafikler (placeholder)

### 8.8. Hashtag'ler (`/hashtags`)
- Müşteri filtresi
- En iyi hashtag'ler
- Zayıf hashtag'ler
- Tüm hashtag'ler tablosu

### 8.9. Ayarlar (`/settings`)
- API yapılandırması
- Model ayarları
- Sistem bilgisi

---

## 9. Veri Akışı - Müşteri Yönetimi

### 9.1. Yeni Müşteri Ekleme
```
User → /clients/new → Form doldur → POST /api/clients → 
Database (clients) → Response → /clients (liste)
```

### 9.2. Görüşme Formu ve AI Analizi
```
User → /clients/[id] → "Görüşme Formu Doldur" → 
/clients/[id]/intake → Form doldur → 
POST /api/clients/[id]/intake → 
1. Save intake_form
2. Call AI (GPT-4o)
3. Save analysis
4. Update client.status = 'prospect'
→ Response → /clients/[id] (detay sayfası)
```

### 9.3. Müşteri Detay Görüntüleme
```
User → /clients → Click row → /clients/[id] →
Fetch: client + intake_form + analysis + video_count →
Render: Profile card + Stats + Analysis
```
