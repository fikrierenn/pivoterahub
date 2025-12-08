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

