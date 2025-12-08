# Design Document

## Overview

ClientBrain, dijital danışmanlık süreçlerini otomatikleştiren, her müşteri için ayrı hafıza tutan ve video analizleri yapan bir AI destekli platformdur. Sistem, OpenAI GPT-4.1-mini ve Whisper modellerini kullanarak düşük maliyetli ve yüksek performanslı bir danışmanlık asistanı sağlar.

Temel özellikler:
- Müşteri bazlı hafıza yönetimi (profil kartları, toplantı özetleri, planlar)
- Video analizi ve skorlama (hook, tempo, mesaj netliği, CTA, görsel kalite)
- Otomatik içerik planı oluşturma (7 günlük)
- Gelişim takibi ve regresyon tespiti
- Sektör bazlı şablon sistemi (funnel, içerik, WhatsApp mesajları)

## Architecture

### Sistem Katmanları

Sistem 3 ana katmandan oluşur:

#### 1. Zeka Katmanı (LLM Layer)
- **Ana Model**: OpenAI GPT-4.1-mini
  - Strateji üretme
  - Video yorumlama
  - Funnel tasarlama
  - İçerik planı çıkarma
  - Müşteri analizi yorumlama
- **Yardımcı Model**: Whisper
  - Video transkript çıkarma

#### 2. Hafıza Katmanı (Memory Layer)
4 ana hafıza tipi:
- Sabit müşteri bilgileri (clients)
- Dinamik toplantı özetleri (client_sessions)
- Strateji & plan kayıtları (client_plans)
- Video skor & hata geçmişi (videos, video_scores)

#### 3. Uygulama Katmanı (Application Layer)
- API endpoints (Next.js API routes)
- Frontend UI (React + Tailwind CSS)
- Veritabanı işlemleri (Supabase/Postgres)

### Teknoloji Stack

**Backend:**
- Next.js 14+ (App Router)
- Supabase (Postgres veritabanı)
- OpenAI API (GPT-4.1-mini, Whisper)

**Frontend:**
- React 18+
- Tailwind CSS
- Shadcn/ui (UI components)
- Recharts (grafikler için)

**Deployment:**
- Vercel (Next.js hosting)
- Supabase (managed Postgres)

## Components and Interfaces

### API Endpoints

#### 1. POST /api/clients/create
Yeni müşteri oluşturur ve ilk profil kartını üretir.

**Request:**
```typescript
{
  name: string;
  sector: string;
  city: string;
  ig_handle: string;
  weekly_content_capacity: number;
  positioning: string;
}
```

**Response:**
```typescript
{
  client_id: string;
  profile_summary: {
    profile_summary: string;
    main_goals: string[];
    main_problems: string[];
    main_opportunities: string[];
  };
  initial_plan: {
    plan_type: 'content_plan';
    content: object;
  };
}
```

**İşlem Akışı:**
1. Müşteri bilgilerini `clients` tablosuna kaydet
2. Sektöre uygun şablonu `sector_templates`'den çek
3. LLM'e şablon + müşteri bilgisi gönder
4. İlk profil kartını `client_profile_summaries`'e kaydet
5. İlk içerik planını `client_plans`'e kaydet

#### 2. POST /api/sessions/create
Toplantı notlarını özetler ve aksiyon maddelerini çıkarır.

**Request:**
```typescript
{
  client_id: string;
  date: string;
  raw_notes: string;
}
```

**Response:**
```typescript
{
  session_id: string;
  summary: string[];
  action_items: string[];
  should_update_profile: boolean;
}
```

**İşlem Akışı:**
1. Ham notları `client_sessions` tablosuna kaydet
2. LLM'e "10 maddelik özet + aksiyon çıkar" prompt'u gönder
3. Özet ve aksiyon maddelerini güncelle
4. Profil güncelleme önerisi sun

#### 3. POST /api/profile/update
Müşteri profil kartını günceller.

**Request:**
```typescript
{
  client_id: string;
}
```

**Response:**
```typescript
{
  profile_summary: string;
  main_goals: string[];
  main_problems: string[];
  main_opportunities: string[];
  updated_at: string;
}
```

**İşlem Akışı:**
1. Son 5 toplantı özetini topla
2. Sabit profil bilgilerini çek
3. Son planları çek
4. Tüm bilgileri birleştir ve LLM'e gönder
5. Yeni profil kartını `client_profile_summaries`'e kaydet

#### 4. POST /api/videos/analyze
Video analizi yapar ve skorlar.

**Request:**
```typescript
{
  client_id: string;
  video_url: string;
}
```

**Response:**
```typescript
{
  video_id: string;
  transcript: string;
  scores: {
    hook_score: number;
    tempo_score: number;
    clarity_score: number;
    cta_score: number;
    visual_score: number;
  };
  main_errors: string[];
  funnel_stage: 'cold' | 'warm' | 'hot';
  strategic_analysis: {
    target_audience_fit: string;
    improvement_vs_previous: string;
    recommendations: string[];
    content_ideas: string[];
  };
}
```

**İşlem Akışı:**
1. Video URL'sini `videos` tablosuna kaydet
2. Whisper API ile transkript çıkar
3. Video meta bilgilerini analiz et (süre, tempo)
4. LLM'e transkript + meta bilgi gönder
5. Skorları ve analizi `video_scores` tablosuna kaydet
6. Stratejik analiz için müşteri profil kartını kullan

#### 5. POST /api/plans/generate
7 günlük içerik planı oluşturur.

**Request:**
```typescript
{
  client_id: string;
}
```

**Response:**
```typescript
{
  plan_id: string;
  plan_type: 'content_plan';
  content: {
    days: Array<{
      day: number;
      content_type: string;
      description: string;
      funnel_stage: string;
    }>;
  };
}
```

**İşlem Akışı:**
1. Müşteri profil kartını çek
2. Son 3 toplantı özetini çek
3. Mevcut planı çek (varsa)
4. Haftalık içerik kapasitesini kontrol et
5. LLM'e bağlam gönder ve plan üret
6. Planı `client_plans` tablosuna kaydet

#### 6. GET /api/analytics/progress
Müşteri gelişim analizini döner.

**Request:**
```typescript
{
  client_id: string;
  video_count?: number; // default: 10
}
```

**Response:**
```typescript
{
  averages: {
    hook_score: number;
    tempo_score: number;
    clarity_score: number;
  };
  trends: {
    improving_areas: string[];
    declining_areas: string[];
    repeated_errors: string[];
  };
  ai_commentary: string;
  chart_data: Array<{
    date: string;
    hook_score: number;
    tempo_score: number;
    clarity_score: number;
  }>;
}
```

**İşlem Akışı:**
1. Son N videonun skorlarını çek
2. Ortalamaları hesapla
3. Trend analizi yap (iyileşen/kötüleşen alanlar)
4. Tekrarlanan hataları tespit et
5. LLM'e analiz sonuçlarını gönder ve yorum al

#### 7. POST /api/videos/stats
Video performans verilerini kaydeder (manuel girdi).

**Request:**
```typescript
{
  video_id: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  external_id?: string;
  published_at?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  is_reel: boolean;
  captions?: string;
  hashtags: string[];
}
```

**Response:**
```typescript
{
  stats_id: string;
  video_id: string;
  hashtags_processed: number;
}
```

**İşlem Akışı:**
1. Video stats kaydını `video_stats` tablosuna ekle
2. Hashtag'leri parse et
3. Her hashtag için `hashtag_stats` tablosunu güncelle (usage_count, total_views, total_engagement)
4. Ortalama değerleri yeniden hesapla

#### 8. GET /api/hashtags/analytics
Müşterinin hashtag performans analizini döner.

**Request:**
```typescript
{
  client_id: string;
  sort_by?: 'usage' | 'performance'; // default: 'performance'
  limit?: number; // default: 20
}
```

**Response:**
```typescript
{
  top_hashtags: Array<{
    hashtag: string;
    usage_count: number;
    avg_views: number;
    avg_engagement_rate: number;
    performance_label: 'excellent' | 'good' | 'average' | 'poor';
  }>;
  recommendations: {
    keep_using: string[];
    stop_using: string[];
    try_new: string[];
  };
  ai_commentary: string;
}
```

**İşlem Akışı:**
1. `hashtag_stats` tablosundan müşterinin tüm hashtag'lerini çek
2. Performansa göre sırala ve etiketle
3. LLM'e hashtag verilerini gönder
4. Strateji önerileri al (kullan, bırak, dene)

#### 9. GET /api/performance/dashboard
Müşterinin genel sosyal medya performans dashboard'unu döner.

**Request:**
```typescript
{
  client_id: string;
  date_range?: {
    start: string;
    end: string;
  }; // default: son 30 gün
}
```

**Response:**
```typescript
{
  summary: {
    total_videos: number;
    avg_views: number;
    avg_engagement_rate: number;
    change_vs_previous: {
      videos: number; // yüzde
      views: number;
      engagement: number;
    };
  };
  by_content_type: Array<{
    content_type: string;
    count: number;
    avg_views: number;
    avg_engagement_rate: number;
  }>;
  top_videos: Array<{
    video_id: string;
    video_url: string;
    views: number;
    engagement_rate: number;
    published_at: string;
  }>;
  ai_insights: string;
  action_items: string[];
}
```

**İşlem Akışı:**
1. Tarih aralığındaki tüm video_stats kayıtlarını çek
2. Özet metrikleri hesapla
3. Önceki dönemle karşılaştır
4. İçerik tipi bazında grupla (video_scores'dan funnel_stage kullan)
5. En iyi performans gösteren videoları bul
6. LLM'e tüm verileri gönder ve insight + aksiyon önerileri al



## Data Models

### Database Schema (Supabase/Postgres)

#### clients
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  ig_handle VARCHAR(100),
  weekly_content_capacity INTEGER DEFAULT 3,
  positioning VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### client_profile_summaries
```sql
CREATE TABLE client_profile_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  profile_summary TEXT NOT NULL,
  main_goals TEXT[],
  main_problems TEXT[],
  main_opportunities TEXT[],
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id)
);
```

#### client_sessions
```sql
CREATE TABLE client_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  raw_notes TEXT NOT NULL,
  summary TEXT[],
  action_items TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### client_plans
```sql
CREATE TABLE client_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL, -- 'content_plan', 'funnel', 'whatsapp_flow'
  content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### sector_templates
```sql
CREATE TABLE sector_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sector VARCHAR(100) UNIQUE NOT NULL,
  funnel_template_json JSONB NOT NULL,
  content_template_json JSONB NOT NULL,
  whatsapp_template_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### videos
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  transcript TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### video_scores
```sql
CREATE TABLE video_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  hook_score DECIMAL(3,1) 


## Data Models

### Database Schema (Supabase/Postgres)

#### clients
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  ig_handle VARCHAR(100),
  weekly_content_capacity INTEGER DEFAULT 3,
  positioning VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### client_profile_summaries
```sql
CREATE TABLE client_profile_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  profile_summary TEXT NOT NULL,
  main_goals TEXT[],
  main_problems TEXT[],
  main_opportunities TEXT[],
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id)
);
```

#### client_sessions
```sql
CREATE TABLE client_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  raw_notes TEXT NOT NULL,
  summary TEXT[],
  action_items TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### client_plans
```sql
CREATE TABLE client_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### sector_templates
```sql
CREATE TABLE sector_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sector VARCHAR(100) UNIQUE NOT NULL,
  funnel_template_json JSONB NOT NULL,
  content_template_json JSONB NOT NULL,
  whatsapp_template_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### videos
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  transcript TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### video_scores
```sql
CREATE TABLE video_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  hook_score INTEGER CHECK (hook_score >= 0 AND hook_score <= 10),
  tempo_score INTEGER CHECK (tempo_score >= 0 AND tempo_score <= 10),
  clarity_score INTEGER CHECK (clarity_score >= 0 AND clarity_score <= 10),
  cta_score INTEGER CHECK (cta_score >= 0 AND cta_score <= 10),
  visual_score INTEGER CHECK (visual_score >= 0 AND visual_score <= 10),
  main_errors TEXT[],
  funnel_stage VARCHAR(20),
  strategic_analysis JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(video_id)
);
```

#### video_stats
```sql
CREATE TABLE video_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'instagram', 'tiktok', 'youtube'
  external_id VARCHAR(255), -- Platform-specific video ID
  published_at TIMESTAMP,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  is_reel BOOLEAN DEFAULT false,
  captions TEXT,
  hashtags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(video_id)
);
```

#### hashtag_stats
```sql
CREATE TABLE hashtag_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  hashtag VARCHAR(100) NOT NULL,
  usage_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0, -- likes + comments + shares + saves
  avg_views DECIMAL(10,2),
  avg_engagement_rate DECIMAL(5,4), -- engagement / views
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, hashtag)
);

CREATE INDEX idx_hashtag_stats_client ON hashtag_stats(client_id);
CREATE INDEX idx_hashtag_stats_performance ON hashtag_stats(client_id, avg_views DESC);
```

### TypeScript Types

```typescript
// Client Types
export interface Client {
  id: string;
  name: string;
  sector: string;
  city: string;
  ig_handle: string;
  weekly_content_capacity: number;
  positioning: string;
  status: 'active' | 'passive';
  created_at: string;
  updated_at: string;
}

export interface ClientProfileSummary {
  id: string;
  client_id: string;
  profile_summary: string;
  main_goals: string[];
  main_problems: string[];
  main_opportunities: string[];
  updated_at: string;
}

export interface ClientSession {
  id: string;
  client_id: string;
  date: string;
  raw_notes: string;
  summary: string[];
  action_items: string[];
  created_at: string;
}

export interface ClientPlan {
  id: string;
  client_id: string;
  plan_type: 'content_plan' | 'funnel' | 'whatsapp_flow';
  content: ContentPlan | FunnelPlan | WhatsAppFlow;
  created_at: string;
}

export interface ContentPlan {
  days: Array<{
    day: number;
    content_type: string;
    description: string;
    funnel_stage: 'cold' | 'warm' | 'hot';
  }>;
}

export interface FunnelPlan {
  stages: Array<{
    id: string;
    name: string;
    goal: string;
    content_types: string[];
    primary_cta: string;
  }>;
}

export interface WhatsAppFlow {
  welcome: string;
  book_visit: string;
  follow_up: string;
}

export interface SectorTemplate {
  id: string;
  sector: string;
  funnel_template_json: FunnelPlan;
  content_template_json: {
    categories: Array<{
      id: string;
      label: string;
      examples: string[];
    }>;
  };
  whatsapp_template_json: WhatsAppFlow;
  created_at: string;
}

export interface Video {
  id: string;
  client_id: string;
  video_url: string;
  transcript: string;
  duration_seconds: number;
  created_at: string;
}

export interface VideoScore {
  id: string;
  client_id: string;
  video_id: string;
  hook_score: number;
  tempo_score: number;
  clarity_score: number;
  cta_score: number;
  visual_score: number;
  main_errors: string[];
  funnel_stage: 'cold' | 'warm' | 'hot';
  strategic_analysis: {
    target_audience_fit: string;
    improvement_vs_previous: string;
    recommendations: string[];
    content_ideas: string[];
  };
  created_at: string;
}

export interface VideoStats {
  id: string;
  client_id: string;
  video_id: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  external_id?: string;
  published_at?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  is_reel: boolean;
  captions?: string;
  hashtags: string[];
  created_at: string;
  updated_at: string;
}

export interface HashtagStats {
  id: string;
  client_id: string;
  hashtag: string;
  usage_count: number;
  total_views: number;
  total_engagement: number;
  avg_views: number;
  avg_engagement_rate: number;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

// Analytics Types
export interface ProgressAnalytics {
  averages: {
    hook_score: number;
    tempo_score: number;
    clarity_score: number;
    cta_score: number;
    visual_score: number;
  };
  trends: {
    improving_areas: string[];
    declining_areas: string[];
    repeated_errors: string[];
  };
  ai_commentary: string;
  chart_data: Array<{
    date: string;
    hook_score: number;
    tempo_score: number;
    clarity_score: number;
    cta_score: number;
    visual_score: number;
  }>;
}
```

### LLM Prompt Templates

#### Müşteri Profil Kartı Oluşturma
```typescript
const PROFILE_CREATION_PROMPT = `
Sen bir dijital danışmanlık asistanısın. Yeni bir müşteri için profil kartı oluşturacaksın.

Müşteri Bilgileri:
- Ad: {name}
- Sektör: {sector}
- Şehir: {city}
- Instagram: {ig_handle}
- Haftalık İçerik Kapasitesi: {weekly_content_capacity}
- Pozisyonlama: {positioning}

Sektör Şablonu:
{sector_template}

Lütfen aşağıdaki formatta bir profil kartı oluştur:

1. Profil Özeti (500-800 token, kompakt ve öz)
2. Ana Hedefler (3-5 madde)
3. Ana Sorunlar (3-5 madde)
4. Ana Fırsatlar (3-5 madde)

JSON formatında döndür:
{
  "profile_summary": "...",
  "main_goals": ["...", "..."],
  "main_problems": ["...", "..."],
  "main_opportunities": ["...", "..."]
}
`;
```

#### Toplantı Özeti Oluşturma
```typescript
const SESSION_SUMMARY_PROMPT = `
Sen bir dijital danışmanlık asistanısın. Toplantı notlarını özetleyeceksin.

Ham Notlar:
{raw_notes}

Müşteri Profil Kartı:
{profile_summary}

Lütfen aşağıdaki formatta özetle:

1. 10 maddelik özet (her madde net ve aksiyon odaklı)
2. Yapılacaklar listesi (3-7 madde)

JSON formatında döndür:
{
  "summary": ["...", "...", ...],
  "action_items": ["...", "...", ...]
}
`;
```

#### Video Analizi
```typescript
const VIDEO_ANALYSIS_PROMPT = `
Sen bir video içerik analisti ve dijital danışmanlık asistanısın. Bir videoyu analiz edeceksin.

Video Transkript:
{transcript}

Video Meta Bilgileri:
- Süre: {duration} saniye
- Müşteri Sektörü: {sector}
- Müşteri Pozisyonlaması: {positioning}

Müşteri Profil Kartı:
{profile_summary}

Lütfen aşağıdaki kriterlere göre 0-10 arası skorla ve analiz et:

1. Hook Skoru (İlk 3 saniye dikkat çekme gücü)
2. Tempo Skoru (Konuşma hızı ve ritim)
3. Mesaj Netliği Skoru (Ana mesajın anlaşılırlığı)
4. CTA Skoru (Harekete geçirme gücü)
5. Görsel Kalite Skoru (Profesyonellik ve estetik)

Ayrıca:
- Ana hataları etiketle (hook_zayıf, monoton_ses, cok_uzun, cta_yok, vb.)
- Hangi funnel aşamasına hitap ediyor? (cold/warm/hot)
- Hedef kitleye uygunluk değerlendirmesi
- Önceki videolara göre gelişim durumu
- Saniye bazlı iyileştirme önerileri (3-5 madde)
- Bu videodan türetilebilecek içerik fikirleri (3 madde)

JSON formatında döndür:
{
  "scores": {
    "hook_score": 0-10,
    "tempo_score": 0-10,
    "clarity_score": 0-10,
    "cta_score": 0-10,
    "visual_score": 0-10
  },
  "main_errors": ["...", "..."],
  "funnel_stage": "cold|warm|hot",
  "strategic_analysis": {
    "target_audience_fit": "...",
    "improvement_vs_previous": "...",
    "recommendations": ["...", "...", "..."],
    "content_ideas": ["...", "...", "..."]
  }
}
`;
```

#### İçerik Planı Oluşturma
```typescript
const CONTENT_PLAN_PROMPT = `
Sen bir dijital danışmanlık asistanısın. 7 günlük içerik planı oluşturacaksın.

Müşteri Profil Kartı:
{profile_summary}

Son Toplantı Özetleri:
{recent_sessions}

Mevcut Plan (varsa):
{current_plan}

Haftalık İçerik Kapasitesi: {weekly_content_capacity}

Sektör İçerik Şablonu:
{content_template}

Funnel Şablonu:
{funnel_template}

Lütfen 7 günlük bir içerik planı oluştur. Her gün için:
- İçerik tipi
- Kısa açıklama (1-2 cümle)
- Hangi funnel aşamasına hitap ediyor

Haftalık kapasite: {weekly_content_capacity} video
Diğer günler için içerik hazırlığı, planlama veya analiz öner.

JSON formatında döndür:
{
  "days": [
    {
      "day": 1,
      "content_type": "...",
      "description": "...",
      "funnel_stage": "cold|warm|hot"
    },
    ...
  ]
}
`;
```

#### Gelişim Analizi Yorumu
```typescript
const PROGRESS_ANALYSIS_PROMPT = `
Sen bir dijital danışmanlık asistanısın. Müşterinin video performans gelişimini yorumlayacaksın.

Analiz Verileri:
- Hook Ortalaması: {hook_avg}
- Tempo Ortalaması: {tempo_avg}
- Mesaj Netliği Ortalaması: {clarity_avg}
- CTA Ortalaması: {cta_avg}
- Görsel Kalite Ortalaması: {visual_avg}

İyileşen Alanlar: {improving_areas}
Kötüleşen Alanlar: {declining_areas}
Tekrarlanan Hatalar: {repeated_errors}

Müşteri Profil Kartı:
{profile_summary}

Lütfen 2-3 cümlelik bir gelişim yorumu yaz. Somut ve aksiyon odaklı ol.
Örnek: "Hook tarafında belirgin gelişme var (7.2 → 8.5), ancak mesaj netliği son 3 videoda düşüşte. CTA kullanımı güçlenmiş."

Sadece yorum metnini döndür, JSON formatında değil.
`;
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN danışman yeni müşteri bilgilerini girdiğinde THEN ClientBrain Sistemi SHALL müşteri kaydını veritabanına eklemeli
  Thoughts: Bu tüm müşteriler için geçerli bir kural. Rastgele müşteri bilgileri oluşturup, sisteme gönderip, veritabanında var olup olmadığını kontrol edebiliriz.
  Testable: yes - property

1.2 WHEN müşteri kaydı oluşturulduğunda THEN ClientBrain Sistemi SHALL müşterinin sektörüne uygun şablonu otomatik olarak müşteriye atamalı
  Thoughts: Bu tüm sektörler için geçerli bir kural. Rastgele bir sektör seçip, müşteri oluşturup, doğru şablonun atandığını kontrol edebiliriz.
  Testable: yes - property

1.3 WHEN sektör şablonu atandığında THEN ClientBrain Sistemi SHALL LLM kullanarak müşteri için ilk Müşteri Profil Kartı oluşturmalı
  Thoughts: Bu tüm müşteriler için geçerli. Müşteri oluşturulduğunda profil kartının da oluşturulduğunu kontrol edebiliriz.
  Testable: yes - property

1.4 WHEN Müşteri Profil Kartı oluşturulduğunda THEN ClientBrain Sistemi SHALL profil özetini, ana hedefleri, ana sorunları ve ana fırsatları içermeli
  Thoughts: Bu tüm profil kartları için geçerli bir yapısal kural. Rastgele profil kartı oluşturup, gerekli alanların dolu olduğunu kontrol edebiliriz.
  Testable: yes - property

2.1 WHEN danışman ham toplantı notlarını girdiğinde THEN ClientBrain Sistemi SHALL notları veritabanına kaydetmeli
  Thoughts: Bu tüm toplantı notları için geçerli. Rastgele notlar oluşturup, veritabanında var olup olmadığını kontrol edebiliriz.
  Testable: yes - property

2.2 WHEN ham notlar kaydedildiğinde THEN ClientBrain Sistemi SHALL LLM kullanarak notlardan 10 maddelik yapılandırılmış özet oluşturmalı
  Thoughts: Bu tüm toplantı notları için geçerli. Özet oluşturulduğunda 10 madde olup olmadığını kontrol edebiliriz.
  Testable: yes - property

3.1 WHEN danışman profil güncelleme talebinde bulunduğunda THEN ClientBrain Sistemi SHALL müşterinin son toplantı özetlerini toplamalı
  Thoughts: Bu tüm müşteriler için geçerli. Profil güncellendiğinde son toplantıların kullanıldığını kontrol edebiliriz.
  Testable: yes - property

3.4 WHEN yeni profil özeti oluşturulduğunda THEN ClientBrain Sistemi SHALL mevcut Müşteri Profil Kartını yeni özetle güncellemelidir
  Thoughts: Bu bir round-trip property. Profil güncellendiğinde eski profil üzerine yazılmalı.
  Testable: yes - property

4.2 WHEN video kaydedildiğinde THEN ClientBrain Sistemi SHALL Whisper modelini kullanarak videodan transkript çıkarmalı
  Thoughts: Bu tüm videolar için geçerli. Video eklendiğinde transkript alanının dolu olduğunu kontrol edebiliriz.
  Testable: yes - property

4.4 WHEN video parametreleri analiz edildiğinde THEN ClientBrain Sistemi SHALL LLM kullanarak skorlar (0-10 arası) oluşturmalı
  Thoughts: Bu tüm videolar için geçerli. Skorların 0-10 aralığında olduğunu kontrol edebiliriz.
  Testable: yes - property

4.5 WHEN skorlar oluşturulduğunda THEN ClientBrain Sistemi SHALL videonun ana hatalarını etiketlemeli
  Thoughts: Bu tüm videolar için geçerli. Hata etiketlerinin var olduğunu kontrol edebiliriz.
  Testable: yes - property

6.3 WHEN kapasite belirlendikten sonra THEN ClientBrain Sistemi SHALL LLM kullanarak 7 günlük içerik planı oluşturmalı
  Thoughts: Bu tüm müşteriler için geçerli. Plan oluşturulduğunda 7 gün olduğunu kontrol edebiliriz.
  Testable: yes - property

7.2 WHEN skorlar toplandığında THEN ClientBrain Sistemi SHALL hook ortalamasını, tempo ortalamasını ve mesaj netliği ortalamasını hesaplamalı
  Thoughts: Bu matematiksel bir hesaplama. Rastgele skorlar oluşturup, ortalamanın doğru hesaplandığını kontrol edebiliriz.
  Testable: yes - property

8.2 WHEN müşteri listesi görüntülendiğinde THEN ClientBrain Sistemi SHALL her müşteri için gerekli bilgileri göstermeli
  Thoughts: Bu UI rendering testi. Rastgele müşteri listesi oluşturup, render edilen HTML'de gerekli alanların olduğunu kontrol edebiliriz.
  Testable: yes - property

9.1 WHEN danışman müşteri detay ekranını açtığında THEN ClientBrain Sistemi SHALL müşterinin Müşteri Profil Kartını göstermeli
  Thoughts: Bu UI rendering testi. Müşteri detay sayfasının profil kartı içerdiğini kontrol edebiliriz.
  Testable: yes - property

10.2 WHEN video görüntülendiğinde THEN ClientBrain Sistemi SHALL skorlar sekmesinde tüm teknik skorları göstermeli
  Thoughts: Bu UI rendering testi. Video analiz sayfasının tüm skorları içerdiğini kontrol edebiliriz.
  Testable: yes - property

### Property Reflection

Yukarıdaki prework analizini gözden geçirdiğimizde, bazı özellikler birleştirilebilir:

- Property 1.1, 2.1, 4.1 (veritabanına kaydetme) benzer mantıkta ama farklı tablolar için. Ayrı tutulmalı.
- Property 4.4 ve 4.5 (skorlama ve hata etiketleme) aynı video analizi sürecinin parçası ama farklı çıktılar. Ayrı tutulmalı.
- Property 8.2, 9.1, 10.2 (UI rendering) benzer ama farklı ekranlar için. Ayrı tutulmalı.

Gereksiz özellik tespit edilmedi. Her özellik benzersiz bir doğrulama değeri sağlıyor.

### Correctness Properties

Property 1: Müşteri oluşturma veritabanı kaydı
*For any* geçerli müşteri bilgisi (ad, sektör, şehir, Instagram, kapasite, pozisyonlama), müşteri oluşturma API'si çağrıldığında, veritabanında aynı bilgilere sahip bir müşteri kaydı oluşturulmalıdır
**Validates: Requirements 1.1**

Property 2: Sektör şablonu otomatik ataması
*For any* geçerli sektör adı, müşteri oluşturulduğunda, o sektöre ait şablon (funnel, içerik, WhatsApp) müşteriye otomatik olarak atanmalıdır
**Validates: Requirements 1.2**

Property 3: Profil kartı otomatik oluşturma
*For any* yeni müşteri, müşteri oluşturulduğunda, client_profile_summaries tablosunda ilgili müşteri için bir profil kartı kaydı oluşturulmalıdır
**Validates: Requirements 1.3**

Property 4: Profil kartı yapısal bütünlük
*For any* profil kartı, profile_summary, main_goals, main_problems ve main_opportunities alanları boş olmamalıdır
**Validates: Requirements 1.4**

Property 5: Toplantı notu veritabanı kaydı
*For any* geçerli toplantı notu (client_id, date, raw_notes), toplantı oluşturma API'si çağrıldığında, veritabanında bir client_sessions kaydı oluşturulmalıdır
**Validates: Requirements 2.1**

Property 6: Toplantı özeti madde sayısı
*For any* toplantı notu, özet oluşturulduğunda, summary alanı 10 madde içermelidir
**Validates: Requirements 2.2**

Property 7: Profil güncelleme son toplantıları kullanma
*For any* müşteri, profil güncellendiğinde, sistemin son toplantı özetlerini (en az son 3 toplantı) kullanması gerekmektedir
**Validates: Requirements 3.1**

Property 8: Profil güncelleme round-trip
*For any* müşteri, profil güncellendiğinde, client_profile_summaries tablosundaki updated_at alanı güncellenmelidir
**Validates: Requirements 3.4**

Property 9: Video transkript oluşturma
*For any* video URL'si, video analizi yapıldığında, videos tablosunda transcript alanı dolu olmalıdır
**Validates: Requirements 4.2**

Property 10: Video skorları aralık kontrolü
*For any* video analizi, oluşturulan tüm skorlar (hook_score, tempo_score, clarity_score, cta_score, visual_score) 0-10 aralığında olmalıdır
**Validates: Requirements 4.4**

Property 11: Video hata etiketleri varlığı
*For any* video analizi, main_errors alanı en az bir hata etiketi içermelidir (video mükemmel değilse)
**Validates: Requirements 4.5**

Property 12: İçerik planı gün sayısı
*For any* içerik planı, plan oluşturulduğunda, content.days dizisi tam olarak 7 eleman içermelidir
**Validates: Requirements 6.3**

Property 13: Gelişim analizi ortalama hesaplama
*For any* video skoru listesi, ortalama hesaplaması matematiksel olarak doğru olmalıdır (toplam / adet)
**Validates: Requirements 7.2**

Property 14: Müşteri listesi render bütünlüğü
*For any* müşteri listesi, render edilen HTML her müşteri için ad, sektör, şehir, son plan tarihi, son video skoru ve durum bilgilerini içermelidir
**Validates: Requirements 8.2**

Property 15: Müşteri detay profil kartı varlığı
*For any* müşteri detay sayfası, render edilen HTML profil özeti, hedefler, sorunlar ve fırsatlar bölümlerini içermelidir
**Validates: Requirements 9.1**

Property 16: Video analiz skorları render bütünlüğü
*For any* video analiz sayfası, render edilen HTML tüm 5 skoru (hook, tempo, clarity, CTA, visual) içermelidir
**Validates: Requirements 10.2**

## Error Handling

### API Error Responses

Tüm API endpoint'leri standart hata formatı kullanır:

```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  status: number;
}
```

### Error Codes

**Client Errors (4xx):**
- `CLIENT_NOT_FOUND` (404): Müşteri bulunamadı
- `INVALID_INPUT` (400): Geçersiz girdi parametreleri
- `MISSING_REQUIRED_FIELD` (400): Zorunlu alan eksik
- `SECTOR_TEMPLATE_NOT_FOUND` (404): Sektör şablonu bulunamadı
- `VIDEO_NOT_FOUND` (404): Video bulunamadı
- `SESSION_NOT_FOUND` (404): Toplantı bulunamadı

**Server Errors (5xx):**
- `LLM_API_ERROR` (500): OpenAI API hatası
- `WHISPER_API_ERROR` (500): Whisper API hatası
- `DATABASE_ERROR` (500): Veritabanı hatası
- `INTERNAL_SERVER_ERROR` (500): Genel sunucu hatası

### Error Handling Strategies

#### 1. LLM API Hataları
- Retry mekanizması (3 deneme, exponential backoff)
- Rate limit kontrolü
- Fallback: Kullanıcıya "AI servisi geçici olarak kullanılamıyor" mesajı

```typescript
async function callLLMWithRetry(prompt: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await openai.chat.completions.create({...});
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

#### 2. Whisper API Hataları
- Video URL geçerliliği kontrolü
- Desteklenen format kontrolü
- Timeout (max 5 dakika)
- Fallback: Manuel transkript girişi seçeneği

#### 3. Veritabanı Hataları
- Transaction kullanımı (atomik işlemler)
- Foreign key constraint hataları için anlamlı mesajlar
- Connection pool yönetimi

#### 4. Validation Errors
- Zod kullanarak input validation
- Frontend'de de aynı validation kuralları
- Kullanıcı dostu hata mesajları (Türkçe)

```typescript
import { z } from 'zod';

const CreateClientSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalı'),
  sector: z.string().min(1, 'Sektör seçilmeli'),
  city: z.string().optional(),
  ig_handle: z.string().optional(),
  weekly_content_capacity: z.number().min(1).max(14),
  positioning: z.string().min(1, 'Pozisyonlama seçilmeli'),
});
```

## Testing Strategy

### Unit Testing

**Framework:** Vitest

**Test Coverage:**
- API route handlers
- Database query functions
- LLM prompt builders
- Utility functions (ortalama hesaplama, vb.)

**Example Unit Tests:**
```typescript
describe('calculateAverageScores', () => {
  it('should calculate correct averages for video scores', () => {
    const scores = [
      { hook_score: 8, tempo_score: 7, clarity_score: 9 },
      { hook_score: 6, tempo_score: 8, clarity_score: 7 },
    ];
    const result = calculateAverageScores(scores);
    expect(result.hook_score).toBe(7);
    expect(result.tempo_score).toBe(7.5);
    expect(result.clarity_score).toBe(8);
  });
});
```

### Property-Based Testing

**Framework:** fast-check (JavaScript/TypeScript property-based testing library)

**Configuration:** Her property-based test minimum 100 iterasyon çalıştırılacak

**Property Test Examples:**

```typescript
import fc from 'fast-check';

describe('Property Tests', () => {
  it('Property 1: Müşteri oluşturma veritabanı kaydı', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }),
          sector: fc.constantFrom('emlak', 'gelinlik', 'homm', 'zumba'),
          city: fc.string({ minLength: 2, maxLength: 50 }),
          ig_handle: fc.string({ minLength: 3, maxLength: 30 }),
          weekly_content_capacity: fc.integer({ min: 1, max: 14 }),
          positioning: fc.constantFrom('lüks', 'aile', 'ekonomik', 'yatırımcı'),
        }),
        async (clientData) => {
          // **Feature: clientbrain-consulting-system, Property 1: Müşteri oluşturma veritabanı kaydı**
          const response = await createClient(clientData);
          const dbRecord = await getClientById(response.client_id);
          
          expect(dbRecord.name).toBe(clientData.name);
          expect(dbRecord.sector).toBe(clientData.sector);
          expect(dbRecord.city).toBe(clientData.city);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10: Video skorları aralık kontrolü', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          client_id: fc.uuid(),
          video_url: fc.webUrl(),
          transcript: fc.lorem({ maxCount: 500 }),
        }),
        async (videoData) => {
          // **Feature: clientbrain-consulting-system, Property 10: Video skorları aralık kontrolü**
          const analysis = await analyzeVideo(videoData);
          
          expect(analysis.scores.hook_score).toBeGreaterThanOrEqual(0);
          expect(analysis.scores.hook_score).toBeLessThanOrEqual(10);
          expect(analysis.scores.tempo_score).toBeGreaterThanOrEqual(0);
          expect(analysis.scores.tempo_score).toBeLessThanOrEqual(10);
          expect(analysis.scores.clarity_score).toBeGreaterThanOrEqual(0);
          expect(analysis.scores.clarity_score).toBeLessThanOrEqual(10);
          expect(analysis.scores.cta_score).toBeGreaterThanOrEqual(0);
          expect(analysis.scores.cta_score).toBeLessThanOrEqual(10);
          expect(analysis.scores.visual_score).toBeGreaterThanOrEqual(0);
          expect(analysis.scores.visual_score).toBeLessThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Scope:**
- API endpoint'lerin end-to-end testi
- Veritabanı işlemlerinin doğruluğu
- LLM entegrasyonları (mock kullanarak)

**Example:**
```typescript
describe('POST /api/clients/create', () => {
  it('should create client with profile and plan', async () => {
    const clientData = {
      name: 'Test Müşteri',
      sector: 'emlak',
      city: 'İstanbul',
      ig_handle: 'test_ig',
      weekly_content_capacity: 3,
      positioning: 'lüks',
    };
    
    const response = await fetch('/api/clients/create', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.client_id).toBeDefined();
    expect(data.profile_summary).toBeDefined();
    expect(data.initial_plan).toBeDefined();
  });
});
```

### E2E Testing (Optional for V1)

**Framework:** Playwright

**Scope:**
- Kritik kullanıcı akışları
- Müşteri oluşturma → Video analizi → Gelişim raporu

## Performance Considerations

### Maliyet Optimizasyonu

1. **LLM Token Kullanımı:**
   - Profil güncellemelerinde ham geçmiş değil, özetler gönderilir
   - GPT-4.1-mini kullanımı (GPT-4'e göre %90 daha ucuz)
   - Prompt'lar optimize edilmiş (gereksiz context yok)

2. **Whisper Kullanımı:**
   - Video transkriptleri cache'lenir
   - Aynı video tekrar analiz edilirse transkript yeniden çıkarılmaz

3. **Veritabanı:**
   - Index'ler: client_id, video_id, created_at
   - Pagination (müşteri listesi, video listesi)

### Caching Strategy

```typescript
// Redis veya in-memory cache
const CACHE_TTL = {
  SECTOR_TEMPLATES: 24 * 60 * 60, // 24 saat
  CLIENT_PROFILE: 60 * 60, // 1 saat
  VIDEO_TRANSCRIPT: 7 * 24 * 60 * 60, // 7 gün
};
```

### Rate Limiting

```typescript
// API rate limits
const RATE_LIMITS = {
  VIDEO_ANALYSIS: '10 per hour per client',
  PROFILE_UPDATE: '5 per hour per client',
  PLAN_GENERATION: '20 per day per client',
};
```

## Security Considerations

### Authentication & Authorization

- Next-Auth.js kullanımı
- Sadece danışman (Fikri) erişebilir (V1 için tek kullanıcı)
- Session-based authentication

### Data Protection

- Supabase Row Level Security (RLS) policies
- API endpoint'lerde authentication middleware
- Sensitive data encryption (Instagram handles, vb.)

### API Key Management

- OpenAI API key environment variable'da
- Supabase credentials environment variable'da
- .env.local dosyası .gitignore'da

## Deployment

### Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# App
NODE_ENV=development|production
```

### Vercel Deployment

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

### Database Migrations

Supabase migrations klasörü:
```
supabase/
  migrations/
    20240101000000_initial_schema.sql
    20240102000000_add_indexes.sql
```

## Future Enhancements (Post-V1)

1. **Otomatik Profil Güncelleme:** Toplantı sonrası otomatik tetikleme
2. **Multi-user Support:** Birden fazla danışman
3. **Video Upload:** URL yerine direkt video yükleme
4. **Gelişmiş Analytics:** Daha detaylı grafikler ve raporlar
5. **WhatsApp Entegrasyonu:** Otomatik mesaj gönderimi
6. **Notification System:** Email/SMS bildirimleri
7. **Export Features:** PDF rapor çıktısı
8. **Mobile App:** React Native ile mobil uygulama
