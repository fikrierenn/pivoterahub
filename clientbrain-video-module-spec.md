# ClientBrain – Video Modülü Teknik Şartname (V1)

Bu doküman, ClientBrain projesinin **video analizi, performans takibi ve hashtag analitiği** ile ilgili tam teknik tanımını içerir:

- Veritabanı şeması (Postgres / Supabase)
- API uçları (video-analysis & growth-report)
- LLM prompt iskeletleri

Amaç:  
Kiro / Cursor veya herhangi bir geliştirici, bu dosyayı okuyarak **yorum yapmadan** aynı sistemi kurabilsin.

---

## 1. VERİTABANI ŞEMASI (VIDEO MODÜLÜ)

Veritabanı **Postgres / Supabase** üzerinde kurgulanmıştır.  
Tüm ID’ler `uuid`, zaman alanları `timestamptz` olarak tanımlıdır.

### 1.1. `clients` – Müşteri Ana Tablosu

**Ne işe yarar?**

Her danışan müşteriyi temsil eder.  
Video, skor, hashtag, oturum vb. tüm kayıtlar bu tabloya bağlıdır.

- Her satır = 1 müşteri
- Diğer tüm video ile ilgili tablolar `client_id` üzerinden buraya bağlıdır.

**Örnek:**  
“Bursa Nilüfer’de lüks konut satan emlakçı Mert” burada bir kayıt.

**SQL:**

```sql
CREATE TABLE public.clients (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text        NOT NULL,
  sector                  text        NOT NULL, -- emlak / gelinlik / homm / zumba ...
  city                    text,
  ig_handle               text,
  weekly_content_capacity integer     DEFAULT 0,
  positioning             text,       -- luxury / mid / economic / vb.
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_sector ON public.clients (sector);
CREATE INDEX idx_clients_ig_handle ON public.clients (ig_handle);

1.2. videos – Video Kayıt Tablosu

Ne işe yarar?

Her bir Instagram Reel / TikTok / YouTube Short burada tutulur.

    Video’nun hangi müşteriye ait olduğu (client_id)

    Hangi platformda olduğu

    URL, caption, hashtag listesi

    Yayın tarihi, süresi

    Whisper sonrası transcript (metin)

Gelişim analizi, hashtag analizi, skorlar hep bu tablo üzerinden bağlanır.

SQL:

CREATE TABLE public.videos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform       text        NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  external_id    text,                 -- platformdaki id (opsiyonel)
  url            text        NOT NULL,
  published_at   timestamptz,          -- platformda yayınlandığı tarih (biliniyorsa)
  duration_sec   integer,              -- saniye
  captions       text,                 -- video açıklaması (caption)
  hashtags       text[]      DEFAULT '{}', -- ["bursaemlak","satilikev"]
  transcript     text,                 -- Whisper output
  notes          text,                 -- danışmanın ekstra notu (opsiyonel)
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_videos_client ON public.videos (client_id);
CREATE INDEX idx_videos_client_published ON public.videos (client_id, published_at DESC);
CREATE INDEX idx_videos_platform ON public.videos (platform);

1.3. video_scores – Teknik & Stratejik Skorlar

Ne işe yarar?

Her video için AI destekli kalite skoru tutulur:

    Hook, tempo, mesaj açıklığı, CTA, görsel kalite (0–10)

    Hangi funnel stage’e hitap ettiği (cold / warm / hot / sale)

    Tekrarlayan hatalar (ör: hook_zayif, cta_yok)

    Kısa AI yorumu

Gelişim analizinde kullanacağımız asıl veri burasıdır.

Kurallar:

    Her video için en fazla 1 skor kaydı (unique index)

    Skorlar LLM’den gelir; bu tablo LLM çıktısının normalize edilmiş hali.

SQL:

CREATE TABLE public.video_scores (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  video_id       uuid        NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  hook_score     smallint    CHECK (hook_score BETWEEN 0 AND 10),
  tempo_score    smallint    CHECK (tempo_score BETWEEN 0 AND 10),
  clarity_score  smallint    CHECK (clarity_score BETWEEN 0 AND 10),
  cta_score      smallint    CHECK (cta_score BETWEEN 0 AND 10),
  visual_score   smallint    CHECK (visual_score BETWEEN 0 AND 10),
  funnel_stage   text        CHECK (funnel_stage IN ('cold','warm','hot','sale')),
  main_errors    text[]      DEFAULT '{}',   -- ["hook_zayif","cta_yok"]
  ai_comment     text,                      -- kısa özet yorum
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_video_scores_video ON public.video_scores (video_id);
CREATE INDEX idx_video_scores_client ON public.video_scores (client_id);
CREATE INDEX idx_video_scores_stage ON public.video_scores (client_id, funnel_stage);

1.4. video_stats – Performans Metrikleri

Ne işe yarar?

Her videonun izlenme / beğeni / yorum / paylaşım / kaydetme gibi rakamlarını tutar.
Bu veriler:

    Platform API’lerinden

    Ya da manuel input’tan

gelecek.

Bu tablo sayesinde:

    Son 10 videonun ortalaması

    Aylık toplam izlenme

    Video bazlı engagement oranı

hesaplanır.

Not:
snapshot_date ile ileride aynı video için birden fazla “günlük snapshot” tutulabilir. Başlangıçta günde 1 kayıt yeterli.

SQL:

CREATE TABLE public.video_stats (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  video_id            uuid        NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  snapshot_date       date        NOT NULL DEFAULT CURRENT_DATE, -- ileride çoklu snapshot’a izin verir
  views               bigint      DEFAULT 0,
  likes               bigint      DEFAULT 0,
  comments            bigint      DEFAULT 0,
  shares              bigint      DEFAULT 0,
  saves               bigint      DEFAULT 0,
  engagement_rate     numeric(6,4),        -- (likes+comments+shares+saves)/views
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_video_stats_latest ON public.video_stats (video_id, snapshot_date);
CREATE INDEX idx_video_stats_client ON public.video_stats (client_id);
CREATE INDEX idx_video_stats_client_date ON public.video_stats (client_id, snapshot_date DESC);

1.5. hashtag_stats – Hashtag Performans Tablosu

Ne işe yarar?

Müşteri bazlı hashtag performansını özetler:

    Kaç videoda kullanılmış (usage_count)

    Toplam izlenme (total_views)

    Ortalama izlenme (avg_views)

    Ortalama engagement oranı (avg_engagement_rate)

    Son ne zaman kullanılmış (last_used_at)

Böylece “çöp hashtag’ler” ve “gizli güçlü hashtag’ler” ortaya çıkar.

SQL:

CREATE TABLE public.hashtag_stats (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  hashtag             text        NOT NULL,
  usage_count         integer     NOT NULL DEFAULT 0,      -- kaç videoda kullanılmış
  total_views         bigint      NOT NULL DEFAULT 0,
  avg_views           numeric(12,2),
  avg_engagement_rate numeric(6,4),
  last_used_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_hashtag_client ON public.hashtag_stats (client_id, hashtag);
CREATE INDEX idx_hashtag_client_usage ON public.hashtag_stats (client_id, usage_count DESC);

Güncelleme Mantığı (psödo):

Yeni bir video analizi sonrası:

    video_stats içinden views ve engagement_rate çekilir.

    videos.hashtags içindeki her hashtag için:

        Kayıt yoksa INSERT

        Varsa:

            usage_count += 1

            total_views += video_views

            avg_views = total_views / usage_count

            avg_engagement_rate = ilgili videoların ortalaması

            last_used_at = now()

2. API UÇLARI

Bu bölüm, video modülü için zorunlu iki ana API’yi tanımlar:

    /api/video-analysis

    /api/growth-report

2.1. POST /api/video-analysis

Amaç:

    Yeni bir videoyu sisteme eklemek

    Transkript (Whisper) almak

    LLM ile skor + hata + öneri üretmek

    DB’ye:

        videos

        video_scores

        video_stats

        hashtag_stats
        yazmak / güncellemek

2.1.1. Request JSON Şeması

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

    metrics opsiyonel, yoksa video_stats daha sonra da doldurulabilir.

2.1.2. Response JSON Şeması

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
    "ai_comment": "Hook ortalama ama CTA çok zayıf. Son 3 saniyeye net çağrı ekle."
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

2.1.3. Örnek Request

POST /api/video-analysis

{
  "client_id": "7b6a7c5e-9f3e-4bd9-9c8a-1c2d3e4f5a6b",
  "platform": "instagram",
  "url": "https://www.instagram.com/reel/ABC123/",
  "external_id": "ABC123",
  "published_at": "2025-12-08T12:00:00Z",
  "duration_sec": 19,
  "captions": "Nilüfer'de 3+1 daire turu. Fiyat tahmininiz nedir?",
  "hashtags": ["bursaemlak", "nilufer", "satilikev"],
  "metrics": {
    "views": 2450,
    "likes": 310,
    "comments": 22,
    "shares": 14,
    "saves": 45
  }
}

2.2. POST /api/growth-report

Amaç:

Belirli bir tarih aralığı için:

    Toplam video / izlenme / etkileşim özetini

    Son X videonun performansını

    Kategori bazlı performansı

    Hashtag performansını

    LLM tabanlı özet + aksiyon maddelerini

tek bir JSON’da döndürmek.
2.2.1. Request JSON Şeması

{
  "client_id": "uuid",
  "date_from": "2025-11-08",
  "date_to": "2025-12-08",
  "limit_last_videos": 10
}

2.2.2. Response JSON Şeması

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
      "label": "good"   // good | average | poor
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
    "summary_text": "Son 30 günde video sayını %40 artırmışsın, ancak ortalama izlenme %25 düşmüş. Bu, nicelik artarken kalite kaybı yaşadığını gösteriyor...",
    "action_items": [
      "Haftalık 3 video ile sınırlayıp, her videonun hook'unu tek tek test et.",
      "Performansı zayıf olan #evdekorasyon hashtag'ini bırak, #bursaemlak ve #satilikev'i standartlaştır.",
      "Eğitim içeriklerini haftada en az 2'ye çıkar; portföy videolarında daha kısa format dene."
    ]
  }
}

3. LLM PROMPT İSKELETLERİ

Bu bölüm AI tarafını tanımlar. Prompt’lar örnek iskelettir; içerik Türkçe/İngilizce karışık olabilir, modeller için problem değildir.
3.1. Video Analizi Prompt (video_scores için)

System prompt:

    You are an expert social media video coach for real estate, bridal, wellness and similar advisory businesses.
    Given a video transcript, basic metadata and client profile, you will score the video (0–10) on several dimensions and suggest improvements.
    Always respond in JSON.

User input (örnek):

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

Beklenen output formatı:

{
  "hook_score": 7,
  "tempo_score": 6,
  "clarity_score": 8,
  "cta_score": 5,
  "visual_score": 7,
  "funnel_stage": "warm",
  "main_errors": ["cta_yok", "hook_zayif"],
  "ai_comment": "Hook bu videoda önceki videolara göre daha iyi, ancak sonunda net bir CTA yok. Son 3 saniyeye 'Detaylar için DM/WhatsApp yaz' gibi bir çağrı eklemelisin.",
  "improvement_suggestions": [
    "İlk 3 saniyede 'Bursa'da ev alacaksan bu 3 hatayı yapma' gibi net bir cümle ile başla.",
    "Videonun sonuna tek cümlelik net CTA koy.",
    "Çekim sırasında kamerayı hafif yukarıdan konumlandırarak daha profesyonel görünüm oluştur."
  ]
}

DB’ye yazılacak alanlar: hook_score, tempo_score, clarity_score, cta_score, visual_score, funnel_stage, main_errors, ai_comment.
3.2. Growth Report Prompt

System prompt:

    You are a data analyst and content coach.
    You receive aggregated metrics for a client's recent videos, content categories and hashtags.
    Your job is to explain whether they are improving or regressing and propose 5 concrete, practical action items.
    Respond in Turkish. Return JSON with summary_text and action_items.

User input (örnek özet JSON):

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

Beklenen JSON output:

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