# ClientBrain Consulting System – Requirements Specification (V1)

## 1. Overview

ClientBrain, dijital danışmanlık süreçlerini ölçeklenebilir hale getirmek için tasarlanmış bir “kişisel müşteri yönetim beyni”dir. Sistem; video analizi, hashtag analitiği, müşteri hafızası, funnel yönetimi, içerik planlama ve AI yorumlama katmanlarını tek bir platformda birleştirir.

## 2. Core Objectives

- Her müşteri için ayrı hafıza, ayrı funnel ve ayrı analiz alanı yönetmek  
- Video içeriklerini teknik + stratejik açıdan analiz etmek  
- Müşterinin gelişimini metriklerle takip etmek  
- Sosyal medya bio analizini otomatik yapmak  
- 7 günlük içerik planı üretmek  
- WhatsApp dönüş akışlarını otomatik oluşturmak  
- Müşteriyi “tek bakışta” özetleyen bir profil kartı çıkarmak  
- Danışmanın iş yükünü %70 azaltmak

## 3. System Modules

### 3.1 Client Memory Module
- Sabit bilgiler (sektör, şehir, kapasite, persona)
- Dinamik bilgiler (hedef, sorun, fırsat)
- AI tarafından üretilen kompakt profil özeti
- Yeni bilgi geldiğinde profilin otomatik güncellenmesi

### 3.2 Meeting Summary Module
- Ham not → AI özet (10 madde)
- Olası aksiyon maddeleri
- Toplantı geçmişinin hafızaya eklenmesi

### 3.3 Video Analysis Module
- Whisper transkript
- Görsel analiz: tempo, clarity, visual score
- AI skorlaması: hook_score, tempo_score, clarity_score, cta_score, visual_score
- Ana hatalar: hook_zayif, cta_yok, cok_uzun vb.
- Stratejik funnel stage belirleme (cold / warm / hot)
- Öneri üretimi (saniye bazlı)

### 3.4 Growth Analytics Module
- Son 10 video performansı
- Aylık video sayısı trendi
- Ortalama izlenme, engagement, saves
- Gelişim/g erileme tespiti
- Hata tekrar oranları
- AI yorum + aksiyon listesi

### 3.5 Hashtag Analytics Module
- hashtag_stats tablosu
- Kullanım sayısı, toplam izlenme, avg_views
- Çöp hashtag tespiti
- Güçlü hashtag önerileri
- Hashtag kombinasyon önerileri

### 3.6 Bio Analysis Module (Selenium)
- IG/TikTok/YouTube bio scraping
- AI ile:
  - clarity score
  - target audience
  - value points
  - eksikler
  - yeni bio önerileri

### 3.7 Content Planning Module
- 7 günlük içerik planı
- Her gün için:
  - kategori
  - başlık
  - hook önerisi
  - CTA önerisi
- Planlar client_plans tablosunda saklanır

### 3.8 Funnel Engine
- 4 stage funnel:
  - Cold → Warm → Hot → Sale
- Her stage için içerik şablonları
- Primary CTA önerileri

### 3.9 WhatsApp Conversion Flow
- Hoşgeldin mesajı
- Randevu mesajı
- Takip mesajı
- AI tarafından kişiye göre yeniden üretilebilir

## 4. Database Requirements

### 4.1 Tables (Mandatory)
- clients  
- client_profile_summaries  
- client_sessions  
- client_plans  
- sector_templates  
- videos  
- video_scores  
- video_stats  
- hashtag_stats  
- client_intake_form  

### 4.2 Data integrity rules
- client_id foreign key bağlantıları zorunlu
- her video_id → tekil skor kaydı
- her video hashtags → hashtag_stats tablosuna işlenir

## 5. APIs

### /api/create-client
- intake_form alır
- sektör şablonlarını ekler
- profil summary üretir
- kayıt oluşturur

### /api/new-session
- ham not → özet + aksiyon
- hafızaya eklenir
- profil update tetiklenebilir

### /api/video-analysis
- transkript
- skorlar
- hatalar
- öneriler
- DB kaydı

### /api/generate-plan
- 7 günlük içerik planı oluşturur
- DB’ye kaydedilir

### /api/growth-report
- Son 10 + son 30 gün metriklerini toplar
- AI yorum + aksiyon döner

## 6. Non-Functional Requirements

### Performance
- Video analizi < 20 saniye (server-side)
- Profil güncelleme < 5 saniye

### Cost optimization
- Sadece özetler modele gönderilir
- Mini modeller kullanılır
- Video transkript Whisper ile yapılır

### Security
- Her müşteri verisi ayrı saklanır
- API access token zorunlu
- Rate limit uygulanır

## 7. Deliverables
- Data model  
- API endpoints  
- UI ekranları  
- Gelişim dashboard  
- Video analiz pipeline  
- Hashtag analiz sistemi  
- Bio scraping modülü  

