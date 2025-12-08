# Implementation Plan

- [ ] 1. Proje kurulumu ve temel yapı
  - Next.js 14 projesi oluştur (App Router)
  - Supabase client kurulumu
  - OpenAI SDK kurulumu
  - Tailwind CSS ve Shadcn/ui kurulumu
  - TypeScript konfigürasyonu
  - Environment variables yapılandırması
  - _Requirements: Tüm sistem_

- [ ] 2. Veritabanı şeması ve seed data
  - [ ] 2.1 Supabase migration dosyaları oluştur
    - clients tablosu
    - client_profile_summaries tablosu
    - client_sessions tablosu
    - client_plans tablosu
    - sector_templates tablosu
    - videos tablosu
    - video_scores tablosu
    - Foreign key ilişkileri ve indexler
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 6.1, 7.1_

  - [ ] 2.2 Sektör şablonları seed data oluştur
    - Emlak sektörü şablonu (funnel, içerik, WhatsApp)
    - Diğer sektör şablonları (gelinlik, homm, zumba)
    - _Requirements: 1.2_

  - [ ]* 2.3 Property test: Sektör şablonu otomatik ataması
    - **Property 2: Sektör şablonu otomatik ataması**
    - **Validates: Requirements 1.2**

- [ ] 3. TypeScript type tanımları ve utilities
  - [ ] 3.1 Core type definitions oluştur
    - Client, ClientProfileSummary, ClientSession types
    - ClientPlan, ContentPlan, FunnelPlan, WhatsAppFlow types
    - SectorTemplate, Video, VideoScore types
    - ProgressAnalytics type
    - API request/response types
    - _Requirements: Tüm sistem_

  - [ ] 3.2 Utility functions oluştur
    - calculateAverageScores fonksiyonu
    - Date formatting utilities
    - Validation helpers
    - _Requirements: 7.2_

  - [ ]* 3.3 Unit test: Ortalama hesaplama fonksiyonu
    - calculateAverageScores için unit test
    - _Requirements: 7.2_

  - [ ]* 3.4 Property test: Gelişim analizi ortalama hesaplama
    - **Property 13: Gelişim analizi ortalama hesaplama**
    - **Validates: Requirements 7.2**

- [ ] 4. Supabase client ve database functions
  - [ ] 4.1 Supabase client wrapper oluştur
    - Server-side client
    - Client-side client
    - Type-safe query helpers
    - _Requirements: Tüm sistem_

  - [ ] 4.2 Client CRUD operations
    - createClient function
    - getClientById function
    - getAllClients function
    - updateClient function
    - _Requirements: 1.1, 8.1_

  - [ ]* 4.3 Property test: Müşteri oluşturma veritabanı kaydı
    - **Property 1: Müşteri oluşturma veritabanı kaydı**
    - **Validates: Requirements 1.1**

  - [ ] 4.4 Profile summary operations
    - createProfileSummary function
    - getProfileSummary function
    - updateProfileSummary function
    - _Requirements: 1.3, 3.4_

  - [ ]* 4.5 Property test: Profil kartı otomatik oluşturma
    - **Property 3: Profil kartı otomatik oluşturma**
    - **Validates: Requirements 1.3**

  - [ ]* 4.6 Property test: Profil güncelleme round-trip
    - **Property 8: Profil güncelleme round-trip**
    - **Validates: Requirements 3.4**

  - [ ] 4.7 Session operations
    - createSession function
    - getSessionsByClientId function
    - getRecentSessions function
    - _Requirements: 2.1, 3.1_

  - [ ]* 4.8 Property test: Toplantı notu veritabanı kaydı
    - **Property 5: Toplantı notu veritabanı kaydı**
    - **Validates: Requirements 2.1**

  - [ ] 4.9 Video operations
    - createVideo function
    - getVideosByClientId function
    - getVideoById function
    - _Requirements: 4.1_

  - [ ] 4.10 Video score operations
    - createVideoScore function
    - getVideoScoresByClientId function
    - getRecentVideoScores function
    - _Requirements: 4.4, 7.1_

- [ ] 5. OpenAI entegrasyonu ve LLM service
  - [ ] 5.1 OpenAI client wrapper oluştur
    - GPT-4.1-mini chat completion wrapper
    - Whisper transcription wrapper
    - Retry mekanizması (exponential backoff)
    - Error handling
    - _Requirements: Tüm LLM işlemleri_

  - [ ] 5.2 LLM prompt builder functions
    - buildProfileCreationPrompt
    - buildSessionSummaryPrompt
    - buildVideoAnalysisPrompt
    - buildContentPlanPrompt
    - buildProgressAnalysisPrompt
    - _Requirements: 1.3, 2.2, 4.4, 5.1, 6.3, 7.5_

  - [ ] 5.3 LLM service functions
    - generateProfileSummary function
    - generateSessionSummary function
    - analyzeVideoContent function
    - generateContentPlan function
    - generateProgressCommentary function
    - _Requirements: 1.3, 2.2, 4.4, 5.1, 6.3, 7.5_

  - [ ]* 5.4 Unit test: LLM prompt builders
    - Test prompt template rendering
    - Test variable substitution
    - _Requirements: 1.3, 2.2, 4.4, 5.1, 6.3, 7.5_

- [ ] 6. API Routes - Müşteri yönetimi
  - [ ] 6.1 POST /api/clients/create endpoint
    - Request validation (Zod schema)
    - Müşteri kaydı oluştur
    - Sektör şablonu ata
    - LLM ile profil kartı oluştur
    - İlk plan oluştur
    - Response döndür
    - Error handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 6.2 Property test: Profil kartı yapısal bütünlük
    - **Property 4: Profil kartı yapısal bütünlük**
    - **Validates: Requirements 1.4**

  - [ ] 6.3 GET /api/clients endpoint
    - Tüm müşterileri listele
    - Pagination desteği
    - Son plan tarihi ve video skoru ile birlikte
    - _Requirements: 8.1, 8.2_

  - [ ] 6.4 GET /api/clients/[id] endpoint
    - Müşteri detaylarını getir
    - Profil kartı ile birlikte
    - Son toplantı özeti ile birlikte
    - Son plan ile birlikte
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 6.5 POST /api/profile/update endpoint
    - Son toplantı özetlerini topla
    - Sabit profil bilgilerini çek
    - Son planları çek
    - LLM ile yeni profil oluştur
    - Profil kartını güncelle
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 6.6 Property test: Profil güncelleme son toplantıları kullanma
    - **Property 7: Profil güncelleme son toplantıları kullanma**
    - **Validates: Requirements 3.1**

- [ ] 7. API Routes - Toplantı yönetimi
  - [ ] 7.1 POST /api/sessions/create endpoint
    - Request validation
    - Ham notları kaydet
    - LLM ile özet ve aksiyon çıkar
    - Session kaydını güncelle
    - Profil güncelleme önerisi sun
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 7.2 Property test: Toplantı özeti madde sayısı
    - **Property 6: Toplantı özeti madde sayısı**
    - **Validates: Requirements 2.2**

- [ ] 8. API Routes - Video analizi
  - [ ] 8.1 POST /api/videos/analyze endpoint
    - Request validation
    - Video kaydı oluştur
    - Whisper ile transkript çıkar
    - Video meta bilgilerini analiz et
    - LLM ile skorlama ve analiz
    - Video score kaydı oluştur
    - Stratejik analiz ekle
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 8.2 Property test: Video transkript oluşturma
    - **Property 9: Video transkript oluşturma**
    - **Validates: Requirements 4.2**

  - [ ]* 8.3 Property test: Video skorları aralık kontrolü
    - **Property 10: Video skorları aralık kontrolü**
    - **Validates: Requirements 4.4**

  - [ ]* 8.4 Property test: Video hata etiketleri varlığı
    - **Property 11: Video hata etiketleri varlığı**
    - **Validates: Requirements 4.5**

  - [ ] 8.5 GET /api/videos/[id] endpoint
    - Video detaylarını getir
    - Skorlar ile birlikte
    - Stratejik analiz ile birlikte
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 9. API Routes - İçerik planı ve analitik
  - [ ] 9.1 POST /api/plans/generate endpoint
    - Request validation
    - Müşteri profil kartını çek
    - Son toplantı özetlerini çek
    - Mevcut planı çek
    - Haftalık kapasiteyi kontrol et
    - LLM ile 7 günlük plan oluştur
    - Plan kaydı oluştur
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 9.2 Property test: İçerik planı gün sayısı
    - **Property 12: İçerik planı gün sayısı**
    - **Validates: Requirements 6.3**

  - [ ] 9.3 GET /api/analytics/progress endpoint
    - Son N videonun skorlarını çek
    - Ortalamaları hesapla
    - Trend analizi yap
    - Tekrarlanan hataları tespit et
    - LLM ile yorum oluştur
    - Grafik datası hazırla
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 10. Checkpoint - Backend API testleri
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. UI Components - Temel bileşenler
  - [ ] 11.1 Layout components
    - AppLayout (header, sidebar, main content)
    - Header component (logo, user menu)
    - Navigation component
    - _Requirements: 8.1, 9.1, 10.1_

  - [ ] 11.2 Shadcn/ui components kurulumu
    - Button, Input, Card, Table
    - Dialog, Tabs, Select
    - Badge, Alert
    - _Requirements: Tüm UI_

  - [ ] 11.3 Reusable UI components
    - LoadingSpinner
    - ErrorMessage
    - EmptyState
    - ConfirmDialog
    - _Requirements: Tüm UI_

- [ ] 12. UI Pages - Müşteri listesi
  - [ ] 12.1 Müşteri listesi sayfası (/clients)
    - Tablo ile müşteri listesi
    - Kolonlar: ad, sektör, şehir, son plan tarihi, son video skoru, durum
    - Satıra tıklayınca detay sayfasına git
    - "Yeni Müşteri" butonu
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 12.2 Property test: Müşteri listesi render bütünlüğü
    - **Property 14: Müşteri listesi render bütünlüğü**
    - **Validates: Requirements 8.2**

  - [ ] 12.3 Yeni müşteri modal/form
    - Form alanları: ad, sektör, şehir, Instagram, kapasite, pozisyonlama
    - Validation
    - API çağrısı
    - Success/error handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 13. UI Pages - Müşteri detay
  - [ ] 13.1 Müşteri detay sayfası (/clients/[id])
    - 2 kolonlu layout
    - Sol: Profil kartı, 7 günlük plan, son toplantı özeti
    - Sağ: Müşteri bilgileri, hızlı aksiyonlar
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 13.2 Property test: Müşteri detay profil kartı varlığı
    - **Property 15: Müşteri detay profil kartı varlığı**
    - **Validates: Requirements 9.1**

  - [ ] 13.3 Profil kartı component
    - Profil özeti göster
    - Hedefler, sorunlar, fırsatlar listele
    - "Profil Kartını Güncelle" butonu
    - _Requirements: 9.1, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 13.4 İçerik planı component
    - 7 günlük plan tablosu
    - Gün, içerik tipi, açıklama kolonları
    - "Yeni Plan Üret" butonu
    - _Requirements: 9.2, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 13.5 Toplantı özeti component
    - Madde madde liste
    - Aksiyon maddeleri vurgulanmış
    - _Requirements: 9.3_

  - [ ] 13.6 Hızlı aksiyonlar component
    - "Yeni Toplantı Notu Ekle" butonu
    - "Yeni Video Analizi Yap" butonu
    - "Gelişim Raporu Oluştur" butonu
    - _Requirements: 9.5_

  - [ ] 13.7 Yeni toplantı notu modal/form
    - Tarih seçici
    - Ham not textarea
    - API çağrısı
    - Success/error handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 14. UI Pages - Video analizi
  - [ ] 14.1 Video analiz sayfası (/videos/[id])
    - Video player (iframe/embed)
    - Video meta bilgileri
    - Sekmeli yapı: Skorlar, Hatalar & Özet, Öneriler
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 14.2 Property test: Video analiz skorları render bütünlüğü
    - **Property 16: Video analiz skorları render bütünlüğü**
    - **Validates: Requirements 10.2**

  - [ ] 14.3 Skorlar tab component
    - 5 skor göster (hook, tempo, clarity, CTA, visual)
    - Progress bar veya gauge chart
    - _Requirements: 10.2_

  - [ ] 14.4 Hatalar & Özet tab component
    - Hata etiketleri (badges)
    - Kısa metinsel özet
    - _Requirements: 10.3_

  - [ ] 14.5 Öneriler tab component
    - Saniye bazlı öneriler listesi
    - Türetilebilecek içerik fikirleri
    - _Requirements: 10.4_

  - [ ] 14.6 Yeni video analizi modal/form
    - Video URL input
    - API çağrısı
    - Loading state (transkript çıkarma uzun sürebilir)
    - Success/error handling
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 15. UI Pages - Gelişim grafikleri
  - [ ] 15.1 Gelişim grafiği sayfası (/analytics/[clientId])
    - Tarih aralığı seçici
    - Çizgi grafikler (Recharts)
    - Bar chart (hata frekansları)
    - AI yorumu bölümü
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 15.2 Skor grafikleri component
    - Hook skoru zaman serisi
    - Tempo skoru zaman serisi
    - Mesaj netliği skoru zaman serisi
    - CTA skoru zaman serisi
    - _Requirements: 7.6_

  - [ ] 15.3 Hata frekansı chart component
    - Bar chart ile hata etiketlerinin frekansı
    - _Requirements: 7.3_

  - [ ] 15.4 AI yorumu component
    - LLM'den gelen yorum metni
    - İyileşen/kötüleşen alanlar vurgulanmış
    - _Requirements: 7.5_

- [ ] 16. Video performans ve hashtag yönetimi
  - [ ] 16.1 video_stats ve hashtag_stats tablolarını migration'a ekle
    - video_stats tablosu (views, likes, comments, shares, saves, hashtags)
    - hashtag_stats tablosu (usage_count, avg_views, avg_engagement_rate)
    - Index'ler ekle
    - _Requirements: 11.1, 11.3, 12.1_

  - [ ] 16.2 Video stats operations
    - createVideoStats function
    - updateVideoStats function
    - getVideoStatsByVideoId function
    - _Requirements: 11.1_

  - [ ] 16.3 Hashtag parsing ve stats güncelleme
    - parseHashtags utility function
    - updateHashtagStats function (usage_count, totals, averages)
    - getHashtagStatsByClient function
    - _Requirements: 11.3, 11.4, 12.1, 12.2_

  - [ ] 16.4 POST /api/videos/stats endpoint
    - Request validation
    - Video stats kaydet
    - Hashtag'leri parse et ve stats güncelle
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 16.5 GET /api/hashtags/analytics endpoint
    - Hashtag istatistiklerini topla
    - Performansa göre sırala ve etiketle
    - LLM ile strateji önerileri oluştur
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 16.6 GET /api/performance/dashboard endpoint
    - Tarih aralığındaki video stats'leri topla
    - Özet metrikleri hesapla
    - Önceki dönemle karşılaştır
    - İçerik tipi bazında grupla
    - LLM ile insight ve aksiyon önerileri al
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ] 17. UI Pages - Performans dashboard
  - [ ] 17.1 Video performans girişi modal/form
    - Platform seçici (Instagram, TikTok, YouTube)
    - Metrik inputları (views, likes, comments, shares, saves)
    - Hashtag input (virgülle ayrılmış)
    - Caption textarea
    - API çağrısı
    - _Requirements: 11.1, 11.3_

  - [ ] 17.2 Performans dashboard sayfası (/performance/[clientId])
    - Tarih aralığı seçici
    - Özet KPI kartları (toplam video, ortalama izlenme, etkileşim oranı)
    - Değişim yüzdeleri (önceki döneme göre)
    - İçerik tipi bazında performans grafikleri
    - En iyi videolar listesi
    - AI insights bölümü
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ] 17.3 Hashtag analizi component
    - En sık kullanılan hashtag'ler tablosu
    - En iyi performans gösteren hashtag'ler
    - Kullanımı bırakılması gereken hashtag'ler
    - Yeni hashtag önerileri
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 17.4 Video performans listesi component
    - Tüm videoları performans metriklerine göre sıralama
    - Filtreleme (platform, tarih aralığı)
    - Her video için: thumbnail, metrikler, hashtag'ler
    - _Requirements: 11.5_

- [ ] 18. Checkpoint - Performans özellikleri testi
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Error handling ve validation
  - [ ] 19.1 API error handling middleware
    - Standart error response formatı
    - Error logging
    - _Requirements: Tüm API_

  - [ ] 19.2 Frontend error boundaries
    - React error boundary component
    - Fallback UI
    - _Requirements: Tüm UI_

  - [ ] 19.3 Form validation
    - Zod schemas
    - Frontend validation
    - Error messages (Türkçe)
    - _Requirements: 1.1, 2.1, 4.1, 6.1, 11.1_

  - [ ]* 19.4 Integration test: API error responses
    - Test 404, 400, 500 error scenarios
    - _Requirements: Tüm API_

- [ ] 20. Authentication (basit versiyon)
  - [ ] 20.1 NextAuth.js kurulumu
    - Credentials provider (tek kullanıcı için)
    - Session management
    - _Requirements: Güvenlik_

  - [ ] 20.2 Protected routes
    - Middleware ile route protection
    - Login sayfası
    - _Requirements: Güvenlik_

- [ ] 21. Deployment hazırlığı
  - [ ] 21.1 Environment variables kontrolü
    - .env.example dosyası
    - Vercel environment variables
    - _Requirements: Deployment_

  - [ ] 21.2 Supabase production setup
    - Production database
    - Migrations çalıştır
    - Seed data ekle
    - _Requirements: Deployment_

  - [ ] 21.3 Build ve deploy
    - Next.js build test
    - Vercel'e deploy
    - Production test
    - _Requirements: Deployment_

- [ ] 22. Final Checkpoint - Tüm sistem testi
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Error handling ve validation
  - [ ] 17.1 API error handling middleware
    - Standart error response formatı
    - Error logging
    - _Requirements: Tüm API_

  - [ ] 17.2 Frontend error boundaries
    - React error boundary component
    - Fallback UI
    - _Requirements: Tüm UI_

  - [ ] 17.3 Form validation
    - Zod schemas
    - Frontend validation
    - Error messages (Türkçe)
    - _Requirements: 1.1, 2.1, 4.1, 6.1_

  - [ ]* 17.4 Integration test: API error responses
    - Test 404, 400, 500 error scenarios
    - _Requirements: Tüm API_

- [ ] 18. Authentication (basit versiyon)
  - [ ] 18.1 NextAuth.js kurulumu
    - Credentials provider (tek kullanıcı için)
    - Session management
    - _Requirements: Güvenlik_

  - [ ] 18.2 Protected routes
    - Middleware ile route protection
    - Login sayfası
    - _Requirements: Güvenlik_

- [ ] 19. Deployment hazırlığı
  - [ ] 19.1 Environment variables kontrolü
    - .env.example dosyası
    - Vercel environment variables
    - _Requirements: Deployment_

  - [ ] 19.2 Supabase production setup
    - Production database
    - Migrations çalıştır
    - Seed data ekle
    - _Requirements: Deployment_

  - [ ] 19.3 Build ve deploy
    - Next.js build test
    - Vercel'e deploy
    - Production test
    - _Requirements: Deployment_

- [ ] 20. Final Checkpoint - Tüm sistem testi
  - Ensure all tests pass, ask the user if questions arise.
