# ClientBrain - Dijital Danışmanlık AI Sistemi

ClientBrain, dijital danışmanlık süreçlerini ölçeklenebilir, hafızalı ve video-odaklı bir AI sistemi ile otomatikleştiren bir platformdur. Her müşteri için ayrı hafıza tutan, videoları analiz eden, funnel oluşturan ve danışmanlık süreçlerini sistematik hale getiren kişisel danışmanlık beyni olarak tasarlanmıştır.

## 🎯 Temel Özellikler

### Müşteri Yönetimi
- **Otomatik Profil Kartı**: Her müşteri için AI tarafından oluşturulan ve güncellenen kompakt özet
- **Sektör Şablonları**: Emlak, gelinlik, homm, zumba gibi sektörler için önceden tanımlanmış funnel ve içerik şablonları
- **Toplantı Özetleme**: Ham notlardan otomatik 10 maddelik özet ve aksiyon maddeleri çıkarma

### Video Analizi
- **AI Skorlama**: Hook, tempo, mesaj netliği, CTA ve görsel kalite için 0-10 arası skorlama
- **Whisper Entegrasyonu**: Otomatik video transkript çıkarma
- **Stratejik Öneriler**: Saniye bazlı iyileştirme önerileri ve içerik fikirleri
- **Funnel Eşleştirme**: Videonun hangi funnel aşamasına (soğuk, ılık, sıcak) hitap ettiğini belirleme

### Performans Takibi
- **Video Performans Metrikleri**: İzlenme, beğeni, yorum, paylaşım ve kaydetme sayıları
- **Hashtag Analizi**: Hashtag performans istatistikleri ve strateji önerileri
- **Gelişim Grafikleri**: Zaman içinde video kalitesinin ölçülebilir takibi
- **Regresyon Tespiti**: Kötüleşen alanların otomatik tespiti

### İçerik Planlama
- **7 Günlük Plan**: Müşteri profili ve kapasitesine göre otomatik içerik planı
- **Funnel Stratejisi**: Her içeriğin hangi funnel aşamasına hitap ettiğini belirleme
- **WhatsApp Şablonları**: Sektöre özel hazır mesaj şablonları

## 🏗️ Teknoloji Stack

### Backend
- **Next.js 14+** (App Router)
- **Supabase** (Postgres veritabanı)
- **OpenAI API** (GPT-4.1-mini, Whisper)

### Frontend
- **React 18+**
- **Tailwind CSS**
- **Shadcn/ui** (UI components)
- **Recharts** (Grafikler)

### Deployment
- **Vercel** (Next.js hosting)
- **Supabase** (Managed Postgres)

## 📊 Veritabanı Yapısı

### Ana Tablolar
- `clients` - Müşteri bilgileri
- `client_profile_summaries` - AI tarafından oluşturulan profil kartları
- `client_sessions` - Toplantı notları ve özetleri
- `client_plans` - İçerik planları
- `sector_templates` - Sektör şablonları
- `videos` - Video kayıtları ve transkriptler
- `video_scores` - Video analiz skorları
- `video_stats` - Video performans metrikleri
- `hashtag_stats` - Hashtag performans istatistikleri

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Supabase hesabı
- OpenAI API key

### Adımlar

1. **Repository'yi klonlayın**
```bash
git clone https://github.com/fikrierenn/pivoterahub.git
cd pivoterahub
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Environment variables ayarlayın**
```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin:
```env
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
NODE_ENV=development
```

4. **Veritabanı migration'larını çalıştırın**
```bash
npm run db:migrate
```

5. **Seed data ekleyin (opsiyonel)**
```bash
npm run db:seed
```

6. **Development server'ı başlatın**
```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

## 📁 Proje Yapısı

```
pivoterahub/
├── .kiro/
│   └── specs/
│       └── clientbrain-consulting-system/
│           ├── requirements.md    # Gereksinimler
│           ├── design.md          # Tasarım dokümanı
│           └── tasks.md           # Implementation görevleri
├── app/                           # Next.js App Router
│   ├── api/                       # API routes
│   ├── clients/                   # Müşteri sayfaları
│   ├── videos/                    # Video analiz sayfaları
│   └── analytics/                 # Gelişim grafikleri
├── components/                    # React components
├── lib/                           # Utility functions
│   ├── supabase/                  # Supabase client
│   ├── openai/                    # OpenAI entegrasyonu
│   └── utils/                     # Helper functions
├── types/                         # TypeScript type definitions
└── supabase/
    └── migrations/                # Database migrations
```

## 🎨 Ekranlar

### 1. Müşteri Listesi
- Tüm müşterileri tablo formatında görüntüleme
- Son plan tarihi ve video skor ortalaması
- Hızlı erişim ve filtreleme

### 2. Müşteri Detay
- AI profil kartı (hedefler, sorunlar, fırsatlar)
- Son 7 günlük içerik planı
- Son toplantı özeti
- Hızlı aksiyonlar (yeni toplantı, video analizi, gelişim raporu)

### 3. Video Analiz
- Video oynatıcı
- Teknik skorlar (hook, tempo, mesaj netliği, CTA, görsel)
- Hata etiketleri ve özet
- İyileştirme önerileri ve içerik fikirleri

### 4. Gelişim Grafikleri
- Zaman serisi grafikleri (hook, tempo, mesaj netliği)
- Hata frekans analizi
- AI yorumu ve trend tespiti

### 5. Performans Dashboard
- Video performans metrikleri
- Hashtag analizi
- İçerik tipi bazında karşılaştırma
- AI insights ve aksiyon önerileri

## 🔑 API Endpoints

### Müşteri Yönetimi
- `POST /api/clients/create` - Yeni müşteri oluştur
- `GET /api/clients` - Müşteri listesi
- `GET /api/clients/[id]` - Müşteri detayları
- `POST /api/profile/update` - Profil kartını güncelle

### Toplantı Yönetimi
- `POST /api/sessions/create` - Yeni toplantı notu ekle

### Video Analizi
- `POST /api/videos/analyze` - Video analizi yap
- `GET /api/videos/[id]` - Video detayları
- `POST /api/videos/stats` - Video performans verilerini kaydet

### İçerik Planlama
- `POST /api/plans/generate` - 7 günlük plan oluştur

### Analitik
- `GET /api/analytics/progress` - Gelişim analizi
- `GET /api/hashtags/analytics` - Hashtag performans analizi
- `GET /api/performance/dashboard` - Genel performans dashboard'u

## 💰 Maliyet Optimizasyonu

1. **LLM Token Kullanımı**
   - Ham geçmiş yerine özetler gönderilir
   - GPT-4.1-mini kullanımı (GPT-4'e göre %90 daha ucuz)
   - Optimize edilmiş prompt'lar

2. **Whisper Kullanımı**
   - Video transkriptleri cache'lenir
   - Tekrar analiz edilmez

3. **Veritabanı**
   - Index'ler ile hızlı sorgular
   - Pagination desteği

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Property-Based Tests
```bash
npm run test:property
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 📝 Spec Driven Development

Bu proje spec-driven development metodolojisi ile geliştirilmiştir:

1. **Requirements** (`.kiro/specs/clientbrain-consulting-system/requirements.md`)
   - EARS formatında acceptance criteria
   - 13 ana gereksinim
   - 65+ acceptance criteria

2. **Design** (`.kiro/specs/clientbrain-consulting-system/design.md`)
   - Mimari tasarım
   - API endpoint detayları
   - Veritabanı şeması
   - 16 correctness property

3. **Tasks** (`.kiro/specs/clientbrain-consulting-system/tasks.md`)
   - 22 ana görev
   - 100+ alt görev
   - Property-based test taskları

## 🔐 Güvenlik

- NextAuth.js ile authentication
- Supabase Row Level Security (RLS)
- API endpoint authentication middleware
- Environment variables ile sensitive data yönetimi

## 🚢 Deployment

### Vercel'e Deploy

1. Vercel hesabınıza giriş yapın
2. Repository'yi import edin
3. Environment variables'ı ekleyin
4. Deploy butonuna tıklayın

### Supabase Production Setup

1. Production database oluşturun
2. Migration'ları çalıştırın
3. Seed data ekleyin
4. RLS policies'i aktif edin

## 📈 Gelecek Özellikler (V2)

- [ ] Otomatik profil güncelleme
- [ ] Multi-user support
- [ ] Video upload (URL yerine direkt yükleme)
- [ ] WhatsApp entegrasyonu
- [ ] Email/SMS bildirimleri
- [ ] PDF rapor çıktısı
- [ ] Mobile app (React Native)
- [ ] Instagram Bio analizi (Selenium)
- [ ] Otomatik platform entegrasyonu

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje özel bir projedir. Tüm hakları saklıdır.

## 👤 İletişim

Fikri Eren - [@fikrierenn](https://github.com/fikrierenn)

Project Link: [https://github.com/fikrierenn/pivoterahub](https://github.com/fikrierenn/pivoterahub)

---

**Not:** Bu proje Kiro IDE ile spec-driven development metodolojisi kullanılarak geliştirilmiştir.
