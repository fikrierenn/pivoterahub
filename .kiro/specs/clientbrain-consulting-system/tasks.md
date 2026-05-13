# ClientBrain – Profesyonel Danışmanlık Sistemi Görevler (V2)

> Odak: 4 Aşamalı AI Analiz Sistemi + Selenium Rakip Analizi + Dinamik Form Sistemi

---

## 1. Veritabanı ve Altyapı Kurulumu

- [x] 1.1 Supabase projesi oluştur ve yapılandır
- [x] 1.2 Temel migration dosyalarını oluştur
  - `clients` tablosu (status kolonu ile)
  - `intake_form_templates` tablosu
  - `client_intake_forms` tablosu
- [x] 1.3 Profesyonel analiz sistemi migration'ı oluştur
  - `professional_analysis` tablosu
  - `ai_profile_card` tablosu  
  - `development_plan` tablosu
  - `client_presentation` tablosu
  - `competitor_analysis` tablosu
- [ ] 1.4 Migration dosyalarını production'da çalıştır
- [x] 1.5 Next.js Supabase client yapılandırması (SSL fix ile)
- [x] 1.6 Environment variables ayarla
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`  
  - `OPENAI_API_KEY`
- [x] 1.7 Minimal intake form template'ini yükle

---

## 2. Dinamik Form Sistemi

- [x] 2.1 Intake questions API oluştur (`/api/intake-questions`)
  - Template'den soruları getir
  - JSONB parsing ve response formatting
- [x] 2.2 Dinamik form component'i oluştur (`IntakeForm.tsx`)
  - Kategori bazlı rendering
  - Soru tiplerini destekle: text, textarea, select, multiselect, number, json
  - Real-time validation
- [x] 2.3 Form submission API oluştur (`/api/clients/[id]/intake`)
  - JSONB formatında cevapları kaydet
  - client_intake_forms tablosuna insert
- [x] 2.4 Minimal form template'i hazırla
  - Temel bilgiler (business_name, sector, location)
  - Hedefler (main_goals)
  - Rakipler (competitors, competitive_advantage)
  - Notlar (meeting_notes)
- [ ] 2.5 Form template yönetimi UI'ı oluştur
  - Template listesi (`/settings/questions`)
  - Template düzenleme sayfası
  - Yeni template oluşturma

---

## 3. AI Analiz Modülleri

### 3.1 🟦 Profesyonel Analiz Modülü
- [x] 3.1.1 `generateProfessionalAnalysis` fonksiyonu oluştur
  - GPT-4o ile danışman perspektifinde analiz
  - 6 kategori: mevcut seviye, darboğazlar, hatalar, güçlü/zayıf yanlar, potansiyel
  - Objektif ve keskin değerlendirme
- [x] 3.1.2 Professional analysis veri modeli
  - TypeScript interface tanımları
  - Supabase insert/upsert logic

### 3.2 🟩 AI Profil Kartı Modülü  
- [x] 3.2.1 `generateAIProfileCard` fonksiyonu oluştur
  - Profesyonel analiz sonuçlarını kullan
  - 7 bileşen: profil özeti, konumlandırma, hedef kitle, içerik stratejisi, fırsatlar, riskler, 3 aylık roadmap
  - AI danışman gibi strateji üretimi
- [x] 3.2.2 Profile card veri modeli ve parsing
  - JSONB roadmap parsing
  - TypeScript interface'ler

### 3.3 🟧 Gelişim Planı Modülü
- [x] 3.3.1 `generateDevelopmentPlan` fonksiyonu oluştur
  - 30 günlük haftalık plan
  - 90 günlük aylık plan
  - Video sıklığı, içerik kategorileri, ton rehberi
  - Performans hedefleri
- [x] 3.3.2 Development plan veri modeli
  - JSONB formatında detaylı planlar
  - Parsing fonksiyonları

### 3.4 🟥 Müşteri Sunumu Modülü
- [x] 3.4.1 `generateClientPresentation` fonksiyonu oluştur
  - Tüm analiz sonuçlarını birleştir
  - 5 bölüm: özet, durum analizi, öneriler, aksiyon planı, beklenen sonuçlar
  - Müşteriye hitap eden profesyonel ton
- [x] 3.4.2 HTML rapor template'i oluştur
  - Responsive tasarım
  - Print-friendly CSS
  - Branding ve görsel düzen

---

## 4. Selenium Rakip Analizi

- [x] 4.1 Instagram scraper modülü oluştur (`InstagramScraper`)
  - Selenium WebDriver konfigürasyonu
  - Headless Chrome setup
  - Profile scraping: followers, bio, posts, verification
- [x] 4.2 Competitor analysis AI modülü
  - Scraping verilerini analiz et
  - Market positioning, content strategy, audience analysis
  - Objektif gözlemler (strateji önerisi yok)
- [x] 4.3 Scraper helper fonksiyonları
  - `scrapeCompetitors` batch processing
  - Rate limiting (2 saniye bekleme)
  - Error handling ve retry logic
- [ ] 4.4 Selenium dependencies kurulumu
  - Chrome/Chromium binary
  - Production environment setup
- [ ] 4.5 Competitor analysis UI komponenti
  - Rakip listesi görüntüleme
  - Analiz sonuçları tablosu
  - Refresh butonu

---

## 5. Komple Analiz API

- [x] 5.1 Complete analysis endpoint oluştur (`/api/clients/[id]/complete-analysis`)
  - 4 aşamalı sıralı işlem
  - Her aşama önceki aşamanın çıktısını kullanır
  - Rakip analizi paralel arka planda
- [x] 5.2 Error handling ve progress tracking
  - Hangi aşamada hata olduğunu belirt
  - Partial success durumları
  - Timeout yönetimi (60 saniye)
- [ ] 5.3 Progress API endpoint'i
  - Real-time progress tracking
  - WebSocket veya polling ile UI update
- [ ] 5.4 Analysis caching ve retry logic
  - Başarısız aşamaları tekrar çalıştır
  - Completed analysis'leri cache'le

---

## 6. UI/UX Geliştirmeleri

### 6.1 Müşteri Yönetimi
- [x] 6.1.1 Müşteri listesi sayfası (`/clients`)
  - Status filtreleme
  - Müşteri kartları
  - Yeni müşteri ekleme
- [x] 6.1.2 Müşteri detay sayfası (`/clients/[id]`)
  - Temel bilgiler
  - Analiz durumu
  - Action butonları
- [x] 6.1.3 Yeni müşteri formu (`/clients/new`)
  - Validation
  - Status seçimi
  - Form submission

### 6.2 Analiz Arayüzleri
- [ ] 6.2.1 Analiz overview sayfası (`/clients/[id]/analysis`)
  - 4 aşama tab'ları
  - Progress göstergesi
  - "Analiz Başlat" butonu
- [ ] 6.2.2 Profesyonel analiz görüntüleme
  - 6 kategori kartları
  - Expandable sections
  - Export butonu
- [ ] 6.2.3 Profil kartı görüntüleme
  - Özet kartı
  - 3 aylık roadmap timeline
  - Visual indicators
- [ ] 6.2.4 Gelişim planı görüntüleme
  - 30/90 gün tab'ları
  - Checklist formatı
  - Progress tracking
- [ ] 6.2.5 Müşteri sunumu görüntüleme
  - HTML preview
  - PDF export butonu
  - Paylaşım linki

### 6.3 Form ve Etkileşimler
- [x] 6.3.1 Dinamik intake form UI
  - Kategori bazlı bölümler
  - Field validation
  - Auto-save functionality
- [ ] 6.3.2 Loading states ve feedback
  - Skeleton loaders
  - Progress bars
  - Success/error messages
- [ ] 6.3.3 Responsive tasarım
  - Mobile optimization
  - Tablet layout
  - Desktop full-screen

---

## 7. Testing ve Kalite

### 7.1 Unit Tests
- [ ] 7.1.1 AI analiz fonksiyonları testleri
  - Mock OpenAI responses
  - Input validation
  - Output parsing
- [ ] 7.1.2 Selenium scraper testleri
  - Mock Instagram responses
  - Error handling
  - Rate limiting
- [ ] 7.1.3 API endpoint testleri
  - Request/response validation
  - Database operations
  - Error scenarios

### 7.2 Integration Tests
- [ ] 7.2.1 End-to-end analiz akışı
  - Form submission → Complete analysis → Results
  - Database state verification
  - UI interaction tests
- [ ] 7.2.2 Performance tests
  - API response times
  - Concurrent request handling
  - Memory usage monitoring

### 7.3 Manual Testing
- [ ] 7.3.1 User journey testing
  - Müşteri ekleme → Form doldurma → Analiz → Rapor
  - Edge cases ve error scenarios
  - Cross-browser compatibility
- [ ] 7.3.2 Content quality testing
  - AI analiz kalitesi
  - Türkçe dil kalitesi
  - Rapor formatı ve içerik

---

## 8. Deployment ve Production

### 8.1 Production Setup
- [ ] 8.1.1 Supabase production migration'ları
  - Tüm migration'ları çalıştır
  - Production data seeding
  - Backup stratejisi
- [ ] 8.1.2 Vercel deployment konfigürasyonu
  - Environment variables
  - Build optimization
  - Edge functions setup
- [ ] 8.1.3 Selenium production setup
  - Chrome binary installation
  - Memory ve CPU limits
  - Error monitoring

### 8.2 Monitoring ve Maintenance
- [ ] 8.2.1 Application monitoring
  - Error tracking (Sentry)
  - Performance monitoring
  - API usage analytics
- [ ] 8.2.2 Database monitoring
  - Query performance
  - Storage usage
  - Connection pooling
- [ ] 8.2.3 AI service monitoring
  - OpenAI API usage
  - Response time tracking
  - Cost monitoring

### 8.3 Security ve Compliance
- [ ] 8.3.1 Security audit
  - API security review
  - Data encryption verification
  - Access control testing
- [ ] 8.3.2 GDPR compliance
  - Data retention policies
  - User consent management
  - Data export/deletion

---

## 9. Gelecek Geliştirmeler

### 9.1 Kısa Vadeli (1-2 ay)
- [ ] 9.1.1 PDF export functionality
- [ ] 9.1.2 Email rapor gönderimi
- [ ] 9.1.3 Bulk analysis (çoklu müşteri)
- [ ] 9.1.4 Template yönetimi UI

### 9.2 Orta Vadeli (3-6 ay)
- [ ] 9.2.1 Video analiz entegrasyonu
- [ ] 9.2.2 Hashtag performans takibi
- [ ] 9.2.3 Automated follow-up sistemi
- [ ] 9.2.4 Client portal (müşteri erişimi)

### 9.3 Uzun Vadeli (6+ ay)
- [ ] 9.3.1 Multi-platform scraping (TikTok, YouTube)
- [ ] 9.3.2 Advanced AI models (fine-tuning)
- [ ] 9.3.3 White-label çözüm
- [ ] 9.3.4 API marketplace entegrasyonu

---

**Mevcut Durum:** Temel altyapı ve AI modülleri tamamlandı. Selenium kurulumu ve UI geliştirmeleri devam ediyor.

**Öncelik:** Migration'ları production'da çalıştır → UI tamamla → Testing → Deployment