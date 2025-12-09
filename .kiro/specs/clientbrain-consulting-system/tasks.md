# ClientBrain – Video Modülü Görevler (V1)

> Odak: DB + API + LLM entegrasyonu. UI başka bir dokümanda ele alınacak.

---

## 1. Altyapı Kurulumu

- [ ] 1.1 Supabase projesi oluştur
- [ ] 1.2 `video-module` için migration dosyalarını OLUŞTUR  
      - `clients`
      - `videos`
      - `video_scores`
      - `video_stats`
      - `hashtag_stats`
- [ ] 1.3 Migration dosyalarını local’de çalıştır (supabase CLI veya SQL)
- [ ] 1.4 Next.js (App Router, TypeScript) projesi kur
- [ ] 1.5 API routing yapısını oluştur  
      - `/api/video-analysis`  
      - `/api/growth-report`
- [ ] 1.6 Supabase client bağlantısını yapılandır (server-side)
- [ ] 1.7 Environment variables ayarla  
      - `SUPABASE_URL`  
      - `SUPABASE_SERVICE_ROLE_KEY`  
      - `OPENAI_API_KEY`
- [ ] 1.8 Basit auth middleware (token / key check) ekle

---

## 2. Video Analiz API (`/api/video-analysis`)

- [ ] 2.1 API endpoint dosyasını oluştur (`app/api/video-analysis/route.ts`)
- [ ] 2.2 Request validation (Zod tms.)  
      - `client_id` (uuid)  
      - `platform` (union: instagram/tiktok/youtube)  
      - `url`  
      - `duration_sec`  
      - `hashtags` (string[])  
      - `metrics` (opsiyonel)
- [ ] 2.3 `client_id` için **müşteri var mı?** kontrolü (yoksa 404)
- [ ] 2.4 Video URL’den indirme fonksiyonu  
      - İlk sürümde sadece public URL → file buffer
- [ ] 2.5 Whisper API entegrasyonu (transcript üretimi)
- [ ] 2.6 `getPreviousScores(client_id, limit)` helper’ı ile son skorları çek
- [ ] 2.7 LLM input hazırlama (client_profile, video_meta, transcript, previous_scores)
- [ ] 2.8 OpenAI API çağrısı (video skorlama)
- [ ] 2.9 `videos` tablosuna kayıt (INSERT)
- [ ] 2.10 `video_scores` tablosuna kayıt (INSERT – UNIQUE video_id)
- [ ] 2.11 `video_stats` tablosuna kayıt (metrics varsa)  
       - `engagement_rate` hesapla
- [ ] 2.12 `hashtag_stats` güncelleme fonksiyonu çağrısı
- [ ] 2.13 Response JSON oluşturma (video + scores + stats)
- [ ] 2.14 Error handling ve anlamlı HTTP status kodları  
       - 400 (validation), 404 (client), 500 (Whisper/LLM/DB)

---

## 3. Hashtag Stats Güncelleme

- [ ] 3.1 Hashtag extraction fonksiyonu (`normalizeHashtags`)  
      - `#` işareti varsa temizle, lower-case’e çevir
- [ ] 3.2 Her hashtag için UPSERT logic
  - Kayıt yoksa: `INSERT`
  - Varsa:  
    - `usage_count += 1`  
    - `total_views += video_views`  
    - `avg_views = total_views / usage_count`  
    - `last_used_at = now()`
- [ ] 3.3 `avg_engagement_rate` hesaplama  
      - İlgili videolar için yeni ortalamayı hesapla (veya incremental yaklaşım)
- [ ] 3.4 Supabase transaction yönetimi  
      - Video + stats + hashtag güncellemesini tek transaction’da çalıştır

---

## 4. Gelişim Raporu API (`/api/growth-report`)

- [ ] 4.1 API endpoint dosyasını oluştur (`app/api/growth-report/route.ts`)
- [ ] 4.2 Request validation  
      - `client_id` (uuid)  
      - `date_from`, `date_to` (ISO tarih)  
      - `limit_last_videos` (default 10)
- [ ] 4.3 Current period metrik toplama  
      - `total_videos`  
      - `total_views`  
      - `avg_views_per_video`  
      - `avg_engagement_rate`
- [ ] 4.4 Previous period tarih aralığını hesapla (aynı uzunlukta eski dönem)
- [ ] 4.5 Previous period metrik toplama
- [ ] 4.6 `change_vs_previous_period` hesaplama  
      - Yüzdelik değişimler
- [ ] 4.7 Son X video performansı (`last_videos` array)  
      - `views, likes, comments, ... combined_score, label`
- [ ] 4.8 Kategori performansı hesaplama (`category_performance`)  
      - İlk sürümde: içerik kategorisi `videos.captions` veya `manual` tag ile basit tutulabilir
- [ ] 4.9 Hashtag performansı (`top_hashtags`, `weak_hashtags`)  
      - `hashtag_stats` üzerinden
- [ ] 4.10 LLM prompt hazırlama (period, current_period, previous_period, last_videos, hashtag_performance)
- [ ] 4.11 OpenAI API çağrısı (Türkçe değerlendirme)
- [ ] 4.12 Response JSON oluşturma (summary + arrays + ai_evaluation)
- [ ] 4.13 Error handling

---

## 5. Database Helper Functions

- [ ] 5.1 `getClientById(client_id)` – tek müşteri
- [ ] 5.2 `getClientProfileSummary(client_id)` – profil özetini çeken helper
- [ ] 5.3 `getVideosByClientId(client_id, date_from?, date_to?)`
- [ ] 5.4 `getVideoScoresByClientId(client_id, date_from?, date_to?)`
- [ ] 5.5 `getVideoStatsByClientId(client_id, date_from?, date_to?)`
- [ ] 5.6 `getHashtagStatsByClientId(client_id)`
- [ ] 5.7 `getPreviousScores(client_id, limit)` – LLM için son N skor

---

## 6. LLM Integration

- [ ] 6.1 OpenAI client yapılandırması (model: `gpt-4.1-mini`)
- [ ] 6.2 Video analizi system prompt tanımı
- [ ] 6.3 Video analizi user input formatter (TS tipi + builder fonksiyon)
- [ ] 6.4 Video analizi response parser  
      - JSON parse + schema check (Zod)
- [ ] 6.5 Growth report system prompt tanımı
- [ ] 6.6 Growth report user input formatter
- [ ] 6.7 Growth report response parser (Türkçe)  
      - `summary_text` + `action_items[]`
- [ ] 6.8 LLM hatalarında fallback strategy  
      - Logla, kullanıcıya “AI değerlendirme alınamadı” şeklinde graceful mesaj
- [ ] 6.9 JSON validation ve error handling

---

## 7. Testing

- [ ] 7.1 Video analiz API unit testleri  
      - Valid / invalid request  
      - Client yok → 404  
      - LLM/Whisper mock ile success case
- [ ] 7.2 Growth report API unit testleri  
      - Metrik agregasyonları doğru mu  
      - LLM çağrısı mock
- [ ] 7.3 Hashtag güncelleme logic testleri  
      - İlk kez kullanılan hashtag  
      - Var olan hashtag (usage_count & avg_views)
- [ ] 7.4 Database helper function testleri
- [ ] 7.5 Integration testleri (end-to-end happy path)  
      - “Video ekle → skorla → growth-report çek”
- [ ] 7.6 OpenAI ve Whisper için mock/fixture seti oluştur

---

## 8. Deployment

- [ ] 8.1 Supabase production setup
- [ ] 8.2 Migration’ları production’a uygula
- [ ] 8.3 Vercel deployment
- [ ] 8.4 Environment variables production’da ayarla
- [ ] 8.5 API rate limiting (Vercel Edge / middleware)
- [ ] 8.6 Monitoring ve logging (Sentry / Logflare / benzeri)
- [ ] 8.7 Basit health-check endpoint’i ekle

