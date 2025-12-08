# ClientBrain – Video Modülü Gereksinimler (V1)

## 1. Genel Bakış

ClientBrain Video Modülü, danışmanlık müşterilerinin sosyal medya video içeriklerini analiz etmek, performans takibi yapmak ve hashtag analitiği sunmak için tasarlanmıştır. Sistem; video analizi, skorlama, performans metrikleri ve hashtag performans takibini tek bir platformda birleştirir.

---

## 2. Fonksiyonel Gereksinimler

### REQ-1: Müşteri Yönetimi
**WHEN** sistem yeni bir müşteri kaydı aldığında,  
**THEN** sistem **SHALL** müşterinin adını, sektörünü, şehrini, Instagram handle'ını, haftalık içerik kapasitesini ve konumlandırmasını (positioning) kaydetmeli.

**Kabul Kriterleri:**
- Müşteri kaydı `clients` tablosuna uuid ile eklenir
- Sektör, şehir ve ig_handle alanları indekslenir
- created_at ve updated_at otomatik atanır

---

### REQ-2: Video Kaydı
**WHEN** sistem yeni bir video analiz talebi aldığında,  
**THEN** sistem **SHALL** videonun platform bilgisini (instagram/tiktok/youtube), URL'ini, yayın tarihini, süresini, caption'ını, hashtag'lerini ve transkriptini kaydetmeli.

**Kabul Kriterleri:**
- Video kaydı `videos` tablosuna eklenir
- client_id foreign key ile clients tablosuna bağlanır
- platform değeri sadece 'instagram', 'tiktok' veya 'youtube' olabilir
- hashtags text[] formatında saklanır
- transcript alanı Whisper çıktısını tutar

---

### REQ-3: Video Skorlama
**WHEN** bir video analiz edildiğinde,  
**THEN** sistem **SHALL** videonun hook, tempo, clarity, CTA ve visual skorlarını (0-10 arası) hesaplamalı ve funnel stage'ini (cold/warm/hot/sale) belirlemelidir.

**Kabul Kriterleri:**
- Her video için maksimum 1 skor kaydı tutulur (video_id UNIQUE)
- Tüm skorlar 0-10 arası smallint değerdir
- funnel_stage sadece 'cold', 'warm', 'hot' veya 'sale' olabilir
- main_errors text[] formatında hata listesi tutar
- ai_comment alanı LLM yorumunu içerir

---

### REQ-4: Performans Metrikleri
**WHEN** bir video için performans verileri sağlandığında,  
**THEN** sistem **SHALL** views, likes, comments, shares ve saves metriklerini kaydetmeli ve engagement_rate'i hesaplamalıdır.

**Kabul Kriterleri:**
- video_stats tablosuna kayıt eklenir
- engagement_rate = (likes + comments + shares + saves) / views
- snapshot_date ile aynı video için birden fazla snapshot tutulabilir
- video_id ve snapshot_date kombinasyonu UNIQUE olmalıdır

---

### REQ-5: Hashtag Performans Takibi
**WHEN** yeni bir video hashtag'leri ile eklendiğinde,  
**THEN** sistem **SHALL** her hashtag için kullanım sayısını, toplam izlenmeyi, ortalama izlenmeyi ve ortalama engagement oranını güncellemelidir.

**Kabul Kriterleri:**
- hashtag_stats tablosunda client_id ve hashtag kombinasyonu UNIQUE
- usage_count her yeni kullanımda +1 artar
- total_views video izlenmeleri ile güncellenir
- avg_views = total_views / usage_count
- last_used_at güncellenir

---

### REQ-6: Video Analiz API
**WHEN** POST /api/video-analysis endpoint'ine istek geldiğinde,  
**THEN** sistem **SHALL** videoyu kaydetmeli, transkript almalı, LLM ile skorlamalı ve tüm ilgili tabloları (videos, video_scores, video_stats, hashtag_stats) güncellemelidir.

**Kabul Kriterleri:**
- Request JSON şeması: client_id, platform, url, duration_sec, captions, hashtags, metrics
- Response JSON şeması: video, scores, stats
- Whisper ile transcript üretilir
- LLM ile skorlar hesaplanır
- hashtag_stats otomatik güncellenir

---

### REQ-7: Gelişim Raporu API
**WHEN** POST /api/growth-report endpoint'ine tarih aralığı ile istek geldiğinde,  
**THEN** sistem **SHALL** toplam video sayısını, ortalama izlenmeyi, engagement oranını, son videoların performansını, kategori performansını, hashtag performansını ve LLM tabanlı değerlendirmeyi döndürmelidir.

**Kabul Kriterleri:**
- Request JSON şeması: client_id, date_from, date_to, limit_last_videos
- Response JSON şeması: summary, last_videos, category_performance, hashtag_performance, ai_evaluation
- Önceki dönem ile karşılaştırma (change_vs_previous_period)
- Top ve weak hashtag listeleri
- AI summary_text ve action_items (Türkçe)

---

### REQ-8: LLM Video Analizi
**WHEN** bir video skorlanması gerektiğinde,  
**THEN** sistem **SHALL** client profili, video meta verileri, transcript ve önceki skorları LLM'e göndermeli ve JSON formatında skor, hata listesi ve yorum almalıdır.

**Kabul Kriterleri:**
- System prompt: "You are an expert social media video coach..."
- Input: client_profile, video_meta, transcript, previous_scores
- Output: hook_score, tempo_score, clarity_score, cta_score, visual_score, funnel_stage, main_errors, ai_comment, improvement_suggestions
- JSON formatında yanıt

---

### REQ-9: LLM Gelişim Değerlendirmesi
**WHEN** gelişim raporu oluşturulduğunda,  
**THEN** sistem **SHALL** toplam metrikleri, video performanslarını, kategori ve hashtag analizlerini LLM'e göndermeli ve Türkçe özet + aksiyon maddeleri almalıdır.

**Kabul Kriterleri:**
- System prompt: "You are a data analyst and content coach..."
- Input: period, current_period, previous_period, last_videos, category_performance, hashtag_performance
- Output: summary_text (Türkçe), action_items (5 madde, Türkçe)
- JSON formatında yanıt

---

## 3. Teknik Gereksinimler

### REQ-10: Veritabanı
**WHEN** sistem kurulduğunda,  
**THEN** sistem **SHALL** Postgres/Supabase üzerinde clients, videos, video_scores, video_stats ve hashtag_stats tablolarını oluşturmalıdır.

**Kabul Kriterleri:**
- Tüm ID'ler uuid (gen_random_uuid())
- Tüm zaman alanları timestamptz
- Foreign key'ler ON DELETE CASCADE
- Gerekli indeksler oluşturulur

---

### REQ-11: Veri Bütünlüğü
**WHEN** herhangi bir veri işlemi yapıldığında,  
**THEN** sistem **SHALL** foreign key bağlantılarını, UNIQUE constraint'leri ve CHECK constraint'leri uygulamalıdır.

**Kabul Kriterleri:**
- video_scores.video_id UNIQUE
- video_stats (video_id, snapshot_date) UNIQUE
- hashtag_stats (client_id, hashtag) UNIQUE
- platform CHECK (platform IN ('instagram', 'tiktok', 'youtube'))
- funnel_stage CHECK (funnel_stage IN ('cold','warm','hot','sale'))
- Skorlar CHECK (score BETWEEN 0 AND 10)

---

## 4. Performans Gereksinimleri

### REQ-12: API Yanıt Süresi
**WHEN** API endpoint'lerine istek geldiğinde,  
**THEN** sistem **SHALL** video-analysis için 20 saniye, growth-report için 10 saniye içinde yanıt vermelidir.

**Kabul Kriterleri:**
- /api/video-analysis < 20 saniye
- /api/growth-report < 10 saniye
- Timeout durumunda uygun hata mesajı

---

## 5. Güvenlik Gereksinimleri

### REQ-13: Veri Güvenliği
**WHEN** API istekleri yapıldığında,  
**THEN** sistem **SHALL** authentication token kontrolü yapmalı ve her müşteri verisi izole edilmelidir.

**Kabul Kriterleri:**
- API access token zorunlu
- client_id bazlı veri izolasyonu
- Rate limiting uygulanır
