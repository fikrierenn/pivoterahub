# ClientBrain – Profesyonel Danışmanlık Sistemi Gereksinimler (V2)

## 1. Genel Bakış

ClientBrain Profesyonel Danışmanlık Sistemi, sosyal medya danışmanlığı sürecini otomatikleştiren kapsamlı bir platformdur. Sistem; minimal görüşme formu, AI destekli profesyonel analiz, rakip analizi, gelişim planı ve müşteri sunumu oluşturmayı tek bir akışta birleştirir. 

**Ana Bileşenler:**
- 🟦 Profesyonel Analiz (Danışman gözüyle değerlendirme)
- 🟩 AI Profil Kartı (Otomatik strateji üretimi)
- 🟧 Gelişim Planı (30+90 günlük roadmap)
- 🟥 Müşteri Sunumu (Hazır rapor formatı)

---

## 2. Fonksiyonel Gereksinimler

### REQ-1: Müşteri Yönetimi
**WHEN** sistem yeni bir müşteri kaydı aldığında,  
**THEN** sistem **SHALL** müşterinin adını, sektörünü, şehrini, Instagram handle'ını, haftalık içerik kapasitesini, konumlandırmasını ve durumunu (status) kaydetmeli.

**Kabul Kriterleri:**
- Müşteri kaydı `clients` tablosuna uuid ile eklenir
- Status alanı: lead, prospect, active, inactive, completed
- Sektör, şehir ve ig_handle alanları indekslenir
- created_at ve updated_at otomatik atanır

---

### REQ-2: Minimal Görüşme Formu
**WHEN** müşteri için görüşme formu doldurulduğunda,  
**THEN** sistem **SHALL** temel bilgileri, hedefleri, rakip bilgilerini ve görüşme notlarını JSONB formatında kaydetmeli.

**Kabul Kriterleri:**
- Form verileri `client_intake_forms` tablosuna JSONB olarak kaydedilir
- Minimal form: business_name, sector, location, main_goals, competitors, competitive_advantage, meeting_notes
- template_id ile `intake_form_templates` tablosuna bağlanır
- Esnek yapı: yeni sorular kod değişikliği olmadan eklenebilir

---

### REQ-3: Profesyonel Analiz (🟦)
**WHEN** görüşme formu tamamlandığında,  
**THEN** sistem **SHALL** müşterinin mevcut seviyesini, darboğazlarını, stratejik hatalarını, güçlü/zayıf yanlarını ve büyüme potansiyelini analiz etmeli.

**Kabul Kriterleri:**
- Analiz `professional_analysis` tablosuna kaydedilir
- GPT-4o ile danışman perspektifinden objektif değerlendirme
- 6 ana kategori: current_level_assessment, main_bottlenecks, strategic_mistakes, strengths, weaknesses, realistic_growth_potential
- Her müşteri için tek analiz kaydı (client_id UNIQUE)

---

### REQ-4: AI Profil Kartı (🟩)
**WHEN** profesyonel analiz tamamlandığında,  
**THEN** sistem **SHALL** profil özeti, konumlandırma stratejisi, hedef kitle, içerik stratejisi, fırsatlar/riskler ve 3 aylık yol haritası oluşturmalı.

**Kabul Kriterleri:**
- Profil kartı `ai_profile_card` tablosuna kaydedilir
- GPT-4o ile otomatik strateji üretimi
- 7 ana bileşen: profile_summary, positioning_strategy, target_audience, content_strategy, opportunities, risks, three_month_roadmap
- three_month_roadmap JSONB formatında aylık hedefler

---

### REQ-5: Gelişim Planı (🟧)
**WHEN** AI profil kartı oluşturulduktan sonra,  
**THEN** sistem **SHALL** 30 günlük ve 90 günlük detaylı gelişim planı, video sıklığı, içerik kategorileri, ton rehberi ve performans hedefleri oluşturmalı.

**Kabul Kriterleri:**
- Plan `development_plan` tablosuna kaydedilir
- first_30_days ve first_90_days JSONB formatında haftalık/aylık görevler
- video_frequency, content_categories, tone_guidelines, content_themes, performance_targets
- Uygulanabilir ve ölçülebilir hedefler

---

### REQ-6: Müşteri Sunumu (🟥)
**WHEN** tüm analizler tamamlandığında,  
**THEN** sistem **SHALL** müşteriye sunulacak profesyonel raporu HTML formatında oluşturmalı ve yönetici özeti, durum analizi, öneriler, aksiyon planı ve beklenen sonuçları içermeli.

**Kabul Kriterleri:**
- Sunum `client_presentation` tablosuna kaydedilir
- 5 ana bölüm: executive_summary, current_situation_analysis, strategic_recommendations, action_plan, expected_results
- presentation_html hazır HTML formatında
- Müşteriye hitap eden, profesyonel ve ikna edici ton

---

### REQ-7: Rakip Analizi
**WHEN** görüşme formunda rakip bilgileri sağlandığında,  
**THEN** sistem **SHALL** Selenium ile Instagram profillerini analiz etmeli ve AI ile rakip konumlandırma, içerik yaklaşımı ve pazar durumu analizi yapmalı.

**Kabul Kriterleri:**
- Selenium ile Instagram scraping: followers, bio, posts, verification status
- Analiz `competitor_analysis` tablosuna kaydedilir
- competitors_data JSONB formatında scraping verileri
- AI analizi: market_positioning, content_strategy, audience_analysis, competitive_advantages
- Headless Chrome ile arka planda çalışma

---

### REQ-8: Komple Analiz API
**WHEN** POST /api/clients/[id]/complete-analysis endpoint'ine istek geldiğinde,  
**THEN** sistem **SHALL** tüm 4 aşamalı analizi sırayla çalıştırmalı ve sonuçları kaydetmelidir.

**Kabul Kriterleri:**
- Sıralı işlem: Profesyonel Analiz → AI Profil Kartı → Gelişim Planı → Müşteri Sunumu
- Rakip analizi paralel olarak arka planda çalışır
- Her aşama önceki aşamanın çıktısını kullanır
- Hata durumunda hangi aşamada kaldığı belirtilir
- Toplam süre < 60 saniye

---

### REQ-9: Dinamik Form Sistemi
**WHEN** görüşme formu şablonu güncellendiğinde,  
**THEN** sistem **SHALL** yeni soruları kod değişikliği olmadan formda göstermeli ve cevapları JSONB formatında kaydetmelidir.

**Kabul Kriterleri:**
- intake_form_templates tablosunda questions JSONB formatında
- Form renderer dinamik olarak soruları oluşturur
- Soru tipleri: text, textarea, select, multiselect, number, json
- is_default template otomatik yüklenir
- Geriye uyumluluk korunur

---

## 3. Teknik Gereksinimler

### REQ-10: Veritabanı Şeması
**WHEN** sistem kurulduğunda,  
**THEN** sistem **SHALL** Postgres/Supabase üzerinde danışmanlık sistemi için gerekli tabloları oluşturmalıdır.

**Kabul Kriterleri:**
- Ana tablolar: clients, intake_form_templates, client_intake_forms
- Analiz tabloları: professional_analysis, ai_profile_card, development_plan, client_presentation, competitor_analysis
- Tüm ID'ler uuid (gen_random_uuid())
- JSONB alanları: questions, answers, three_month_roadmap, competitors_data
- Foreign key'ler ON DELETE CASCADE
- RLS politikaları aktif

---

### REQ-11: Veri Bütünlüğü
**WHEN** herhangi bir veri işlemi yapıldığında,  
**THEN** sistem **SHALL** foreign key bağlantılarını, UNIQUE constraint'leri ve CHECK constraint'leri uygulamalıdır.

**Kabul Kriterleri:**
- Her müşteri için tek analiz kaydı (client_id UNIQUE per table)
- Status CHECK (status IN ('lead', 'prospect', 'active', 'inactive', 'completed'))
- Template is_default sadece bir kayıtta true olabilir
- JSONB alanları valid JSON formatında
- Cascade delete: müşteri silindiğinde tüm analizleri silinir

---

## 4. Performans Gereksinimleri

### REQ-12: API Performansı
**WHEN** API endpoint'lerine istek geldiğinde,  
**THEN** sistem **SHALL** belirtilen süre limitleri içinde yanıt vermelidir.

**Kabul Kriterleri:**
- /api/clients/[id]/complete-analysis < 60 saniye (tüm 4 aşama)
- /api/intake-questions < 2 saniye
- /api/clients/[id]/intake < 5 saniye (form kaydetme)
- Selenium scraping < 30 saniye (rakip başına)
- Timeout durumunda uygun hata mesajı ve progress bilgisi

---

## 5. Güvenlik Gereksinimleri

### REQ-13: Veri Güvenliği
**WHEN** API istekleri yapıldığında,  
**THEN** sistem **SHALL** veri güvenliğini ve gizliliğini sağlamalıdır.

**Kabul Kriterleri:**
- Supabase RLS politikaları aktif
- client_id bazlı veri izolasyonu
- Selenium headless mode (gizli tarama)
- LLM API key'leri environment variable'larda
- Rate limiting: dakikada 10 analiz isteği
- SSL/TLS şifreleme zorunlu

---

### REQ-14: UI/UX Gereksinimleri
**WHEN** kullanıcı müşteri yönetimi yaparken,  
**THEN** sistem **SHALL** sezgisel ve kullanıcı dostu arayüz sağlamalıdır.

**Kabul Kriterleri:**
- Müşteri listesi: durum filtreleme, arama, sıralama
- Müşteri detay: analiz butonları, progress göstergesi, sonuç görüntüleme
- Form: dinamik soru rendering, validasyon, otomatik kaydetme
- Rapor: HTML preview, PDF indirme, paylaşım linki
- Responsive tasarım (mobil uyumlu)

---

### REQ-15: Hata Yönetimi
**WHEN** sistem hatası oluştuğunda,  
**THEN** sistem **SHALL** kullanıcıya anlaşılır hata mesajı göstermeli ve loglamalıdır.

**Kabul Kriterleri:**
- LLM API hataları: retry mekanizması (3 deneme)
- Selenium hataları: alternatif scraping yöntemi
- Veritabanı hataları: transaction rollback
- Network hataları: timeout ve retry
- Kullanıcı dostu hata mesajları (Türkçe)
- Console ve Supabase logları
