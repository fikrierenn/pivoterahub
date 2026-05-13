# ClientBrain – Profesyonel Danışmanlık Sistemi Tasarım Dokümanı

## 1. Genel Bakış

Bu doküman, ClientBrain Profesyonel Danışmanlık Sistemi'nin teknik tasarımını, mimarisini ve implementasyon detaylarını açıklar. Sistem, sosyal medya danışmanlığı sürecini 4 aşamalı AI destekli analiz ile otomatikleştirir.

### 1.1 Sistem Mimarisi

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js UI    │────│   API Routes     │────│   Supabase DB   │
│                 │    │                  │    │                 │
│ • Müşteri Mgmt  │    │ • Form API       │    │ • PostgreSQL    │
│ • Form UI       │    │ • Analysis API   │    │ • JSONB Storage │
│ • Rapor UI      │    │ • Report API     │    │ • RLS Security  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────┴────────┐
                       │                 │
                ┌──────▼──────┐   ┌──────▼──────┐
                │   OpenAI    │   │  Selenium   │
                │   GPT-4o    │   │  Scraper    │
                │             │   │             │
                │ • Analysis  │   │ • Instagram │
                │ • Strategy  │   │ • Headless  │
                │ • Reports   │   │ • Chrome    │
                └─────────────┘   └─────────────┘
```

## 2. Veri Modeli

### 2.1 Ana Tablolar

#### clients
```sql
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sector text NOT NULL,
  city text,
  ig_handle text,
  weekly_content_capacity integer DEFAULT 3,
  positioning text DEFAULT 'mid',
  status text DEFAULT 'lead' CHECK (status IN ('lead', 'prospect', 'active', 'inactive', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### intake_form_templates
```sql
CREATE TABLE intake_form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  questions jsonb NOT NULL, -- Dinamik soru yapısı
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

#### client_intake_forms
```sql
CREATE TABLE client_intake_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  template_id uuid REFERENCES intake_form_templates(id),
  answers jsonb NOT NULL, -- Esnek cevap yapısı
  created_at timestamptz DEFAULT now()
);
```

### 2.2 Analiz Tabloları

#### professional_analysis (🟦)
```sql
CREATE TABLE professional_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  current_level_assessment text,
  main_bottlenecks text,
  strategic_mistakes text,
  strengths text,
  weaknesses text,
  realistic_growth_potential text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### ai_profile_card (🟩)
```sql
CREATE TABLE ai_profile_card (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  profile_summary text,
  positioning_strategy text,
  target_audience text,
  content_strategy text,
  opportunities text,
  risks text,
  three_month_roadmap jsonb, -- {month1: "", month2: "", month3: ""}
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### development_plan (🟧)
```sql
CREATE TABLE development_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  first_30_days jsonb, -- {week1: "", week2: "", week3: "", week4: ""}
  first_90_days jsonb, -- {month1: "", month2: "", month3: ""}
  video_frequency text,
  content_categories jsonb, -- [{percentage: "", description: ""}]
  tone_guidelines text,
  content_themes jsonb, -- ["theme1", "theme2", ...]
  performance_targets jsonb, -- {day30: "", day60: "", day90: ""}
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### client_presentation (🟥)
```sql
CREATE TABLE client_presentation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  executive_summary text,
  current_situation_analysis text,
  strategic_recommendations text,
  action_plan text,
  expected_results text,
  presentation_html text, -- Hazır HTML raporu
  presentation_pdf_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### competitor_analysis
```sql
CREATE TABLE competitor_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  competitors_data jsonb, -- Selenium scraping sonuçları
  analysis_summary text,
  market_positioning text,
  competitive_landscape text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## 3. API Tasarımı

### 3.1 Ana Endpoint'ler

#### POST /api/clients/[id]/complete-analysis
**Amaç:** 4 aşamalı komple analiz çalıştırır

**Request:**
```json
{} // Body boş, client_id URL'den alınır
```

**Response:**
```json
{
  "success": true,
  "professional_analysis": {...},
  "profile_card": {...},
  "development_plan": {...},
  "presentation": {...},
  "message": "Tüm analizler başarıyla tamamlandı"
}
```

**İşlem Akışı:**
1. Müşteri ve form verilerini al
2. 🟦 Profesyonel Analiz çalıştır
3. 🟩 AI Profil Kartı oluştur
4. 🟧 Gelişim Planı hazırla
5. 🟥 Müşteri Sunumu oluştur
6. (Paralel) Rakip analizi başlat

#### GET /api/intake-questions
**Amaç:** Dinamik form sorularını getirir

**Response:**
```json
[
  {
    "category": "temel_bilgiler",
    "category_label": "📋 Temel Bilgiler",
    "questions": [
      {
        "key": "business_name",
        "text": "İş/Marka adı nedir?",
        "type": "text",
        "required": true,
        "placeholder": "Örn: Bursa Lüks Emlak"
      }
    ]
  }
]
```

#### POST /api/clients/[id]/intake
**Amaç:** Görüşme formu cevaplarını kaydeder

**Request:**
```json
{
  "answers": {
    "business_name": "Bursa Lüks Emlak",
    "sector": "Emlak",
    "location": "Bursa",
    "main_goals": "3 ayda takipçiyi 10K'ya çıkarmak",
    "competitors": "@ahmetmlak\n@bursaevleri",
    "meeting_notes": "Çok heyecanlı, hızlı büyümek istiyor..."
  }
}
```

## 4. AI Entegrasyonu

### 4.1 OpenAI GPT-4o Kullanımı

#### Profesyonel Analiz Prompt'u
```typescript
const prompt = `
Sen deneyimli bir sosyal medya danışmanısın. Müşteriyi profesyonel gözle analiz et.

MÜŞTERİ BİLGİLERİ:
- İsim/Marka: ${clientData.name}
- Sektör: ${clientData.sector}
- Lokasyon: ${clientData.location}
- Hedefler: ${clientData.goals}

GÖRÜŞME NOTLARI:
${clientData.meeting_notes}

DANIŞMAN GÖZÜYLE ANALİZ ET:
1. MEVCUT SEVİYE DEĞERLENDİRMESİ: ...
2. ANA DARBOĞAZLAR: ...
3. STRATEJİK HATALAR: ...
4. GÜÇLÜ YANLAR: ...
5. ZAYIF YANLAR: ...
6. GERÇEKÇİ BÜYÜME POTANSİYELİ: ...
`;
```

#### Model Parametreleri
- **Model:** gpt-4o
- **Temperature:** 0.3-0.7 (analiz tipine göre)
- **Max Tokens:** 2000-3500
- **System Role:** Uzman danışman persona

### 4.2 Selenium Instagram Scraper

#### Scraper Özellikleri
```typescript
class InstagramScraper {
  // Headless Chrome konfigürasyonu
  private async initialize() {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
  }

  // Profil verilerini çeker
  async scrapeProfile(username: string): Promise<InstagramProfile> {
    // followers, following, posts, bio, verification status
  }
}
```

#### Çekilen Veriler
- Takipçi sayısı
- Takip edilen sayısı
- Post sayısı
- Bio metni
- Doğrulama durumu
- Hesap gizliliği
- Son 6 post (temel bilgiler)

## 5. UI/UX Tasarımı

### 5.1 Sayfa Yapısı

#### Müşteri Listesi (/clients)
- Durum filtreleme (Lead, Prospect, Active, etc.)
- Arama ve sıralama
- Yeni müşteri ekleme butonu
- Müşteri kartları (durum, sektör, son aktivite)

#### Müşteri Detayı (/clients/[id])
- Müşteri bilgileri özeti
- Analiz durumu göstergesi
- "Görüşme Formu Doldur" butonu
- "Komple Analiz Başlat" butonu
- Analiz sonuçları tabları

#### Görüşme Formu (/clients/[id]/intake)
- Dinamik form rendering
- Kategori bazlı bölümler
- Real-time validasyon
- Progress göstergesi
- Otomatik kaydetme

#### Analiz Sonuçları (/clients/[id]/analysis)
- 4 aşama tab'ları (🟦🟩🟧🟥)
- HTML rapor preview
- PDF indirme butonu
- Paylaşım linki
- Yeniden analiz butonu

### 5.2 Component Yapısı

```
components/
├── clients/
│   ├── ClientList.tsx
│   ├── ClientCard.tsx
│   ├── ClientForm.tsx
│   └── ClientDetail.tsx
├── intake/
│   ├── IntakeForm.tsx
│   ├── DynamicField.tsx
│   └── FormProgress.tsx
├── analysis/
│   ├── AnalysisOverview.tsx
│   ├── ProfessionalAnalysis.tsx
│   ├── ProfileCard.tsx
│   ├── DevelopmentPlan.tsx
│   └── ClientPresentation.tsx
└── common/
    ├── LoadingSpinner.tsx
    ├── ErrorBoundary.tsx
    └── StatusBadge.tsx
```

## 6. Güvenlik ve Performans

### 6.1 Güvenlik Önlemleri

#### Supabase RLS Politikaları
```sql
-- Basit politika (tüm işlemler için izin)
CREATE POLICY "Enable all operations" ON public.clients FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.professional_analysis FOR ALL USING (true);
-- Diğer tablolar için aynı...
```

#### API Güvenliği
- Environment variable'larda API key'ler
- Rate limiting (dakikada 10 analiz)
- Input validasyon (Zod schema)
- CORS konfigürasyonu

### 6.2 Performans Optimizasyonları

#### Veritabanı
- Foreign key indeksleri
- client_id bazlı indeksler
- JSONB GIN indeksleri (arama için)
- Connection pooling

#### API
- Paralel işlemler (rakip analizi arka planda)
- Caching (form şablonları)
- Streaming responses (uzun analizler için)
- Timeout yönetimi

#### Frontend
- React Query (cache yönetimi)
- Lazy loading (büyük raporlar)
- Progressive loading (analiz aşamaları)
- Error boundaries

## 7. Deployment ve Monitoring

### 7.1 Deployment Stratejisi
- Vercel deployment (Next.js)
- Supabase hosted database
- Environment variable yönetimi
- Migration script'leri

### 7.2 Monitoring
- Supabase dashboard (DB metrikleri)
- Vercel analytics (API performance)
- Console logging (hata takibi)
- User feedback sistemi

## 8. Gelecek Geliştirmeler

### 8.1 Kısa Vadeli (1-2 ay)
- PDF rapor export
- Email ile rapor gönderimi
- Bulk analiz (çoklu müşteri)
- Template yönetimi UI

### 8.2 Orta Vadeli (3-6 ay)
- Video analiz entegrasyonu
- Hashtag performans takibi
- Automated follow-up sistemi
- Client portal (müşteri erişimi)

### 8.3 Uzun Vadeli (6+ ay)
- Multi-platform scraping (TikTok, YouTube)
- Advanced AI models (fine-tuning)
- White-label çözüm
- API marketplace entegrasyonu

---

Bu tasarım dokümanı, sistemin teknik implementasyonu için gerekli tüm detayları içermektedir. Her bileşen modüler olarak tasarlanmış ve gelecek geliştirmelere açık bir yapıda planlanmıştır.