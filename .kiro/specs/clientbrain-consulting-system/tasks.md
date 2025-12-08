# ClientBrain – Video Modülü Görevler (V1)

## 1. Altyapı Kurulumu
- [ ] 1.1 Supabase projesi oluştur
- [ ] 1.2 Migration dosyalarını çalıştır (clients, videos, video_scores, video_stats, hashtag_stats)
- [ ] 1.3 Next.js projesi kur
- [ ] 1.4 API routing yapısını oluştur (/api/video-analysis, /api/growth-report)
- [ ] 1.5 Supabase client bağlantısını yapılandır
- [ ] 1.6 Environment variables ayarla (SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY)

---

## 2. Video Analiz API (/api/video-analysis)
- [ ] 2.1 API endpoint'i oluştur
- [ ] 2.2 Request validation (client_id, platform, url, vb.)
- [ ] 2.3 Video URL'den indirme fonksiyonu
- [ ] 2.4 Whisper API entegrasyonu (transcript üretimi)
- [ ] 2.5 LLM prompt hazırlama (client_profile, video_meta, transcript, previous_scores)
- [ ] 2.6 OpenAI API çağrısı (video skorlama)
- [ ] 2.7 videos tablosuna kayıt
- [ ] 2.8 video_scores tablosuna kayıt
- [ ] 2.9 video_stats tablosuna kayıt (metrics varsa)
- [ ] 2.10 hashtag_stats güncelleme fonksiyonu
- [ ] 2.11 Response JSON oluşturma
- [ ] 2.12 Error handling

---

## 3. Hashtag Stats Güncelleme
- [ ] 3.1 Hashtag extraction fonksiyonu (videos.hashtags'den)
- [ ] 3.2 Her hashtag için UPSERT logic
  - Kayıt yoksa INSERT
  - Varsa: usage_count +1, total_views güncelle, avg_views hesapla, last_used_at güncelle
- [ ] 3.3 avg_engagement_rate hesaplama (ilgili videoların ortalaması)
- [ ] 3.4 Transaction yönetimi

---

## 4. Gelişim Raporu API (/api/growth-report)
- [ ] 4.1 API endpoint'i oluştur
- [ ] 4.2 Request validation (client_id, date_from, date_to, limit_last_videos)
- [ ] 4.3 Current period metrik toplama
  - total_videos
  - total_views
  - avg_views_per_video
  - avg_engagement_rate
- [ ] 4.4 Previous period metrik toplama (karşılaştırma için)
- [ ] 4.5 change_vs_previous_period hesaplama
- [ ] 4.6 Son X video performansı (last_videos array)
- [ ] 4.7 Kategori performansı hesaplama (category_performance)
- [ ] 4.8 Hashtag performansı (top_hashtags, weak_hashtags)
- [ ] 4.9 LLM prompt hazırlama (period, current_period, previous_period, vb.)
- [ ] 4.10 OpenAI API çağrısı (Türkçe değerlendirme)
- [ ] 4.11 Response JSON oluşturma
- [ ] 4.12 Error handling

---

## 5. Database Helper Functions
- [ ] 5.1 getClientById fonksiyonu
- [ ] 5.2 getVideosByClientId fonksiyonu
- [ ] 5.3 getVideoScoresByClientId fonksiyonu
- [ ] 5.4 getVideoStatsByClientId fonksiyonu
- [ ] 5.5 getHashtagStatsByClientId fonksiyonu
- [ ] 5.6 getPreviousScores fonksiyonu (LLM için)

---

## 6. LLM Integration
- [ ] 6.1 OpenAI client yapılandırması
- [ ] 6.2 Video analizi system prompt
- [ ] 6.3 Video analizi user input formatter
- [ ] 6.4 Video analizi response parser
- [ ] 6.5 Growth report system prompt
- [ ] 6.6 Growth report user input formatter
- [ ] 6.7 Growth report response parser (Türkçe)
- [ ] 6.8 JSON validation ve error handling

---

## 7. Testing
- [ ] 7.1 Video analiz API unit testleri
- [ ] 7.2 Growth report API unit testleri
- [ ] 7.3 Hashtag güncelleme logic testleri
- [ ] 7.4 Database helper function testleri
- [ ] 7.5 Integration testleri (end-to-end)

---

## 8. Deployment
- [ ] 8.1 Supabase production setup
- [ ] 8.2 Migration'ları production'a uygula
- [ ] 8.3 Vercel deployment
- [ ] 8.4 Environment variables production'da ayarla
- [ ] 8.5 API rate limiting
- [ ] 8.6 Monitoring ve logging
