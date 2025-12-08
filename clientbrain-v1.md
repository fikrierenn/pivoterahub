# CLIENTBRAIN – DİJİTAL DANIŞMANLIK AI SİSTEMİ PROJE DÖKÜMANI (V1)

Bu doküman, danışmanlık süreçlerini ölçeklendirilebilir, hafızalı, düşük maliyetli ve video-odaklı gelişim takip sistemiyle birleştiren **OpenAI tabanlı Dijital Danışmanlık Asistanı** projesinin mimarisini içerir.

---

## 1. AMAÇ & VİZYON

ClientBrain; her müşteri için ayrı hafıza tutan, videoları analiz eden, funnel oluşturan ve danışmanlık süreçlerini otomatikleştiren **kişisel danışmanlık beyni** olarak tasarlanmıştır.

Bu sistem, Fikri'nin danışmanlık yaklaşımını ölçeklenebilir, izlenebilir ve yapay zekâ ile güçlendirilmiş bir **müşteri yönetimi işletim sistemine** dönüştürür.

Bu sistemin amacı:

- Her müşteri için **ayrı hafıza**, ayrı funnel ve içerik beyni yaratmak  
- Dijital danışmanlık işini **sistematik, ölçeklenebilir** hale getirmek  
- Video analizleri, gelişim takibi, içerik planlama, funnel akışı gibi tüm danışmanlık işini **tek panelden yönetmek**  
- Düşük maliyetli (OpenAI mini modeller ile) ve yüksek zekâ seviyesine sahip bir **AI danışman** oluşturmak.

Kısaca: **Fikri'nin kişisel dijital danışmanlık beyni** = Müşteri + Hafıza + Funnel + Video analizi + OpenAI zekası.

---

## 2. GENEL MİMARİ

Sistem 3 ana katmandan oluşur:

### 2.1. Zeka Katmanı (LLM)

- Ana model: **OpenAI GPT-4.1-mini**
- Görev: Strateji üretme, video yorumlama, funnel tasarlama, içerik planı çıkarma, müşteri analizlerini yorumlama.
- Yardımcı model: **Whisper** (transkript için)

### 2.2. Hafıza Katmanı

4 ana tür hafıza tutulur:

1. Sabit müşteri bilgileri  
2. Dinamik toplantı özetleri  
3. Strateji & plan kayıtları  
4. Video skor & hata geçmişi

### 2.3. Uygulama Katmanı (Sistem Mantığı)

- Müşteri oluşturma  
- Profil / funnel / içerik şablonları  
- Video inceleme  
- Gelişim grafiklerinin çıkarılması  
- Müşteri kartının otomatik güncellenmesi  

---

## 3. VERİTABANI YAPISI (Supabase / Postgres)

### 3.1. `clients` (Müşteriler)

| Alan                    | Açıklama                              |
| ----------------------- | ------------------------------------- |
| id                      | benzersiz                             |
| name                    | müşteri adı                           |
| sector                  | emlak / gelinlik / homm / zumba / vb. |
| city                    | şehir                                 |
| ig_handle               | Instagram hesabı                      |
| weekly_content_capacity | haftalık video kapasitesi             |
| positioning             | lüks / aile / ekonomik / yatırımcı    |

---

### 3.2. `client_profile_summaries`

| Alan               | Açıklama                              |
| ------------------ | ------------------------------------- |
| client_id          | müşteriye bağlı                       |
| profile_summary    | LLM için kompakt özet (500–800 token) |
| main_goals         | hedefler                              |
| main_problems      | ana sorunlar                          |
| main_opportunities | fırsatlar                             |
| updated_at         | ne zaman güncellendi                  |

Bu kart, **yeni bilgi geldikçe yeniden üretilir**.

---

### 3.3. `client_sessions` (Toplantılar)

| Alan         | Açıklama                          |
| ------------ | --------------------------------- |
| client_id    | müşteri                           |
| date         | görüşme tarihi                    |
| raw_notes    | ham not                           |
| summary      | LLM tarafından "10 maddelik özet" |
| action_items | yapılacaklar                      |

---

### 3.4. `client_plans` (Planlar)

- Haftalık içerik planı  
- Funnel planı  
- WhatsApp dönüş akışı  

| Alan       | Açıklama                              |
| ---------- | ------------------------------------- |
| client_id  | müşteri                               |
| plan_type  | content_plan / funnel / whatsapp_flow |
| content    | json/text                             |
| created_at | tarih                                 |

---

### 3.5. `sector_templates` (Sektör Şablonları)

Her sektör için sabit şablonlar:

- Funnel şablonu  
- İçerik kategorileri  
- WhatsApp mesaj şablonları  

| Alan                   | Açıklama               |
| ---------------------- | ---------------------- |
| sector                 | emlak / gelinlik / vb. |
| funnel_template_json   | json                   |
| content_template_json  | json                   |
| whatsapp_template_json | json                   |

---

### 3.6. `videos` (Videolar)

| Alan       | Açıklama    |
| ---------- | ----------- |
| client_id  | müşteri     |
| video_url  | video linki |
| transcript | metin       |
| created_at | tarih       |

---

### 3.7. `video_scores` (Video Skorları)

Her videonun teknik analizi:

| Alan          | Açıklama                              |
| ------------- | ------------------------------------- |
| client_id     | müşteri                               |
| video_id      | video                                 |
| hook_score    | 0–10                                  |
| tempo_score   | 0–10                                  |
| clarity_score | 0–10                                  |
| cta_score     | 0–10                                  |
| visual_score  | 0–10                                  |
| main_errors   | ["hook_zayıf", "monoton", "çok uzun"] |
| funnel_stage  | soğuk / ılık / sıcak                  |

---

## 4. MÜŞTERİ KARTI – GÜNCELLEME MEKANİZMASI

### 4.1. Ne zaman güncellenir?

- Yeni toplantı geldiğinde  
- Strateji değişikliğinde  
- Müşteri segment değiştirdiğinde  
- Video kapasitesi arttığında  
- Yeni hedef geldiğinde  

### 4.2. Nasıl güncellenir?

1. Sistem son toplantı özetlerini toplar  
2. Sabit profil bilgileri ile birleştirir  
3. Son planları ekler  
4. OpenAI'ye tek bir çağrı: “Yeni kompakt profil üret”  
5. Var olan `profile_summary` üzerine yazılır  

Maliyet düşük tutulur çünkü **ham geçmiş değil, özetler** gönderilir.

---

## 5. VIDEO İNCELEME MODÜLÜ

### 5.1. Adımlar

1. Video linki alınır  
2. Whisper ile transkript çıkarılır  
3. Görsel/süre/tempo bilgisi analiz edilir  
4. OpenAI yorumlar → teknik + stratejik analiz

### 5.2. Çıktılar

**Teknik**

- Hook puanı  
- Tempo  
- Mesaj netliği  
- Görsel kalite  
- CTA gücü  
- Virallik tahmini  

**Stratejik**

- Hangi funnel stage’e hitap ediyor?  
- Bu müşterinin hedef kitlesine uygun mu?  
- Önceki videolara göre gelişme var mı?  

**Hatalar**

- `hook_zayıf`  
- `monoton_ses`  
- `cok_uzun`  
- `cta_yok`  

**Öneriler**

- “0–3 saniyeyi şöyle değiştir”  
- “Bu videodan 3 içerik çıkar”  
- “Bu videoyu haftalık plana şu güne koy”  

---

## 6. GELİŞİM ANALİZİ MODÜLÜ

### 6.1. Amaç

“Müşteri gelişiyor mu?” sorusuna **ölçülebilir cevap** vermek.

### 6.2. Ölçüm Mekanizması

Son 10 videonun:

- Hook ortalaması  
- Tempo ortalaması  
- Mesaj netliği ortalaması  
- Tekrarlanan hatalar  
- İyileşen alanlar  
- Kötüleşen alanlar  

### 6.3. Regresyon (gerileme) tespiti

Sistem otomatik söyler:

- “Hook gelişirken mesaj netliği düştü.”  
- “Eskiden olmayan hatalar tekrar etmeye başladı.”  

---

## 7. API AKIŞLARI

### 7.1. `POST /api/create-client`

- Müşteri verileri alınır  
- Sektör şablonu eklenir  
- OpenAI çağrısı ile `profile_summary` + ilk plan oluşturulur  
- DB'ye kaydedilir  

### 7.2. `POST /api/new-session`

- Ham not alınır  
- OpenAI ile "10 maddelik özet + aksiyon" çıkarılır  
- Kaydedilir  
- (Opsiyonel) profil güncelle tetiklenir  

### 7.3. `POST /api/video-analysis`

- Video URL → transkript  
- Görsel/tempo parametreleri çıkarılır  
- OpenAI yorumlar → skor + öneriler  
- DB’ye yazılır  

### 7.4. `POST /api/generate-plan`

- Profil summary + son toplantılar + son plan → context  
- Yeni 7 günlük içerik planı üretilir  
- DB’ye kaydedilir  

---

## 8. PANEL EKRANLARI (GENEL)

### 8.1. Müşteri Listesi

- Müşteri adı  
- Son içerik planı tarihi  
- Son video analiz skoru ortalaması  

### 8.2. Müşteri Detay Ekranı

- Profil kartı (AI summary)  
- Hedefler  
- Sorunlar  
- Fırsatlar  
- Son plan  
- Son toplantı özeti  

### 8.3. Video Analiz Ekranı

- Video player  
- Tekil skorlar  
- Hatalar  
- Öneriler  
- Eski videolarla karşılaştırma  

### 8.4. Gelişim Grafik Ekranı (Basit V1)

- Hook gelişim grafiği  
- Tempo grafiği  
- Mesaj netliği  
- Hata trendleri  

---

## 9. MALİYET OPTİMİZASYONU

1. **Tüm geçmişi gönderme → sadece özet gönder**  
2. **Video transkriptleri Whisper ile ucuz**  
3. **LLM ana modeli GPT-4.1-mini**  
4. **İçerik şablonlarını statik tut, sadece müşteri verisi doldurulsun**  
5. **Profil güncellemesini elle tetikleyerek maliyeti kontrol et (V1)**  

---

## 10. V1 – MVP ÇIKTI LİSTESİ

- Müşteri oluşturma  
- Profil summary oluşturma  
- Toplantı özetleme  
- Profil güncelleme (manuel tetiklemeli)  
- Video analizi + skor + öneri  
- 7 günlük plan oluşturma  
- Gelişim değerlendirmesi (basit sürüm)  
- LLM entegrasyonu  
- Basit panel  

---

## 11. SONUÇ

Bu proje (**ClientBrain**) dijital danışmanlık işini tamamen sistematik, ölçülebilir, hafızalı ve ölçeklenebilir hale getirir. Minimum maliyet, maksimum zeka, profesyonel çıktı.

---

## 12. V1 EKRAN TASARIMLARI (WIREFRAME TARİFLERİ)

Bu bölüm, Cursor içinde hızlıca Next.js + Tailwind ile ekranları kodlayabilmen için "tasarım metni" gibi düşünülmüştür.

### 12.1. Müşteri Listesi Ekranı

**Amaç:** Tüm müşterileri tek bakışta görmek, hızlıca bir müşterinin detayına veya video analizine girmek.

**Bileşenler:**

- Üst bar:  
  - Sol: Logo / Proje adı (örn: ClientBrain)  
  - Sağ: Kullanıcı menüsü (profil, logout)
- Ana tablo:  
  - Kolonlar:
    - Müşteri adı  
    - Sektör  
    - Şehir  
    - Son plan tarihi  
    - Son video skor ortalaması  
    - Durum (aktif / pasif)
  - Satıra tıklayınca → Müşteri Detay ekranına gider.
- Sağ üstte buton: **"Yeni Müşteri"**

### 12.2. Müşteri Detay Ekranı

**Amaç:** Seçili müşteri ile ilgili tüm kritik bilgiyi tek ekranda görmek.

**Layout:** 2 sütunlu yapı (desktop):

- **Sol kolon (geniş):**
  - Kart: **Profil Özeti (AI)**
    - Profil summary (kısa metin blok)
    - Hedefler
    - Sorunlar
    - Fırsatlar
  - Kart: **Son 7 Günlük Plan**
    - Gün – İçerik tipi – Kısa açıklama
    - Altında buton: "Yeni Plan Üret"
  - Kart: **Son Toplantı Özeti**
    - Madde madde bullet list

- **Sağ kolon (dar):**
  - Kart: **Müşteri Bilgileri**
    - Ad, sektör, şehir, IG
    - Haftalık içerik kapasitesi
    - Pozisyonlama
    - "Profil Kartını Güncelle" butonu
  - Kart: **Hızlı Aksiyonlar**
    - "Yeni Toplantı Notu Ekle"
    - "Yeni Video Analizi Yap"
    - "Gelişim Raporu Oluştur"

### 12.3. Video Analiz Ekranı

**Amaç:** Tek bir videoyu hem izlemek hem de AI analizini görmek.

**Layout:** Üstte video, altta / yanda analiz.

- Üst: Video player (embed / iframe / upload preview)
  - Yanında: Video meta bilgileri (tarih, süre, platform, izlenme sayısı – opsiyonel)
- Alt: Sekmeli yapı:
  - Tab 1: **Skorlar**
    - Hook (0–10)
    - Tempo
    - Mesaj netliği
    - CTA
    - Görsel kalite
  - Tab 2: **Hatalar & Özet**
    - Etiketler: `hook_zayıf`, `cta_yok`, `cok_uzun` vb.
    - Kısa metinsel özet: "Bu videoda şunlar iyi, şunlar kötü"
  - Tab 3: **Öneriler**
    - Saniye bazlı öneriler listesi
    - "Bu videodan türetilebilecek 3 içerik" listesi

Altında butonlar:

- "Bu video ile gelişimi karşılaştır" (önceki videolarla)  
- "Benzer yeni video fikri üret"  

### 12.4. Gelişim Grafiği Ekranı (Basit)

**Amaç:** Zaman içinde gelişimi sayısallaştırmak.

**Bileşenler:**

- Tarih aralığı seçici (örn: Son 30 gün, Son 3 ay)  
- Çizgi grafikler:
  - Hook skoru (zaman serisi)
  - Mesaj netliği skoru
  - CTA skoru
- Bar chart:
  - Hata etiketlerinin frekansı (örneğin `hook_zayıf` son 10 videoda kaç kez görülmüş)
- Alt bölüm: **AI Yorumu**
  - "Hook tarafında belirgin gelişme var, mesaj netliği son dönemde düşüşte" gibi kısa metin.

---

## 13. JSON ŞABLONLARI

Bu bölüm Cursor içinde direkt `types` / `schema` / `seed` olarak kullanabileceğin JSON taslaklarını içerir.

### 13.1. `sector_templates` – Emlak Örneği

```json
{
  "sector": "emlak",
  "funnel_template_json": {
    "stages": [
      {
        "id": "cold",
        "name": "Soğuk Kitle",
        "goal": "Dikkat çekmek ve görünür olmak",
        "content_types": ["viral_reel", "eğitici_kısa_video"],
        "primary_cta": "Profili ziyaret et"
      },
      {
        "id": "warm",
        "name": "Ilık Kitle",
        "goal": "Güven ve uzmanlık inşa etmek",
        "content_types": ["bölge_analizi", "sık_sorulan_soru", "mini_eğitim"],
        "primary_cta": "DM / WhatsApp ile soru sor"
      },
      {
        "id": "hot",
        "name": "Sıcak Kitle",
        "goal": "Portföyü gösterip karar aldırmak",
        "content_types": ["portföy_turu", "karşılaştırma_videosu"],
        "primary_cta": "Randevu al"
      },
      {
        "id": "sale",
        "name": "Satış / Kapatma",
        "goal": "Randevuyu satışa çevirmek",
        "content_types": ["referans_hikayesi", "satış_sonrası_memnuniyet"],
        "primary_cta": "Teklif ve sözleşme"
      }
    ]
  },
  "content_template_json": {
    "categories": [
      {
        "id": "education",
        "label": "Eğitici İçerik",
        "examples": [
          "Bursa'da ev alırken yapılan 3 kritik hata",
          "Site aidatlarını doğru okuma rehberi"
        ]
      },
      {
        "id": "portfolio",
        "label": "Portföy İçeriği",
        "examples": [
          "15 saniyelik salon turu",
          "2 daire karşılaştırma: Neden fiyat farkı var?"
        ]
      },
      {
        "id": "viral",
        "label": "Viral / Eğlenceli",
        "examples": [
          "Emlakçıların müşterilerden duyduğu 3 ilginç cümle",
          "POV: İlk defa ev gezen müşteri"
        ]
      },
      {
        "id": "trust",
        "label": "Güven İçeriği",
        "examples": [
          "Müşteri hikayesi",
          "Emlakçının bir günü vlog"
        ]
      }
    ]
  },
  "whatsapp_template_json": {
    "welcome": "Merhaba, hoş geldiniz! Size en doğru bilgiyi verebilmem için ilanın linkini veya ilginizi çeken bölgeyi yazabilir misiniz?",
    "book_visit": "Harika, evi yerinde görmeniz en doğrusu olur. Bugün 17.00 veya yarın 11.30 uygun. Hangisi sizin için daha rahat olur?",
    "follow_up": "Karar sürecinizde isterseniz bölge ve alternatif ev karşılaştırmasını da çıkarabilirim. Böylece daha risksiz karar vermiş olursunuz."
  }
}
13.2. client_profile_summary Formatı (LLM için)
json
Kodu kopyala
{
  "client_id": "uuid",
  "profile_summary": "Bu müşteri Bursa/Nilüfer bölgesinde lüks konut odaklı çalışan, kamera karşısında özgüveni yeni yeni artan, haftalık 3 içerik üretebilen bir emlak danışmanıdır...",
  "main_goals": [
    "3 ay içinde 10K takipçiye ulaşmak",
    "Aylık 3 satışa çıkmak"
  ],
  "main_problems": [
    "Hook'lar zayıf",
    "Portföy anlatımı çok teknik olmuş",
    "WhatsApp dönüşleri amatör"
  ],
  "main_opportunities": [
    "Lüks segmentte rakip sayısı düşük",
    "Portföy kalitesi yüksek",
    "Bölge hakkında derin bilgiye sahip"
  ],
  "style": {
    "tone": "güvenilir_sakin",
    "positioning": "lüks_konut_uzmanı"
  },
  "updated_at": "2025-12-08T12:00:00Z"
}
13.3. 7 Günlük İçerik Planı Şeması (client_plans.content)
json
Kodu kopyala
{
  "plan_type": "content_plan_7_days",
  "days": [
    {
      "day": "Pazartesi",
      "category": "education",
      "title": "Bursa'da ev alırken yapılan 3 kritik hata",
      "hook_suggestion": "Bursa'da ev alacaksan bu 3 hatayı sakın yapma...",
      "cta_suggestion": "Profilimdeki diğer eğitim videolarını da izle."
    },
    {
      "day": "Salı",
      "category": "portfolio",
      "title": "15 saniyede salon turu",
      "hook_suggestion": "Bu salonun fiyatını tahmin edebilir misin?",
      "cta_suggestion": "Detaylar için DM/WhatsApp yaz."
    }
  ]
}
13.4. video_scores Şeması
json
Kodu kopyala
{
  "client_id": "uuid",
  "video_id": "uuid",
  "hook_score": 7,
  "tempo_score": 6,
  "clarity_score": 8,
  "cta_score": 5,
  "visual_score": 7,
  "main_errors": ["cta_yok", "hook_zayıf"],
  "funnel_stage": "warm",
  "ai_comment": "Hook ortalama ama CTA çok zayıf. Videonun son 3 saniyesine net bir çağrı eklemen gerekiyor.",
  "created_at": "2025-12-08T12:00:00Z"
}
14. İLK GÖRÜŞME SİHİRBIZI (MÜŞTERİ TANIMA FORMU)
ClientBrain’in doğru çalışması için ilk görüşmede müşteriyle yapılacak soru–cevap süreci sistematik bir forma dönüştürülmüştür. Bu form hem UI’da hem de API tarafında standartlaştırılmış bir client_intake_form yapısına sahiptir.

14.1. İlk Görüşme Soru Seti (Zorunlu + Opsiyonel)
A) Temel Bilgiler
İş / marka adı

Şehir / bölge

Faaliyet alanı (ör: emlak – lüks konut / kiralık / yatırımcı odaklı)

Hedef kitle

Fiyat segmenti

Instagram / TikTok / YouTube kullanıcı adları

B) Hedefler
3 aylık hedef(ler)

1 yıllık hedef(ler)

C) Ana Sorunlar
Şu anki 2–3 temel engel

Daha önce reklam/ajans/çalışma deneyimi (varsa) ve sonuçlar

D) İçerik Alışkanlıkları
Aktif olduğu platformlar

Kamerada rahatlık düzeyi

Haftalık üretim kapasitesi

En iyi performans gösteren video linki + neden tuttuğu düşüncesi

E) Konumlandırma
Müşterinin olmak istediği profil/tip

Rakiplerine göre farkı

F) Operasyonel Kısıtlar
Günlük ayırabileceği zaman

Ekip var mı?

14.2. client_intake_form JSON Şeması
json
Kodu kopyala
{
  "client_id": "uuid",
  "brand_name": "string",
  "city": "string",
  "sector_detail": "string",
  "target_audience": "string",
  "price_segment": "luxury | mid | economic",
  "social_accounts": {
    "instagram": "string",
    "tiktok": "string",
    "youtube": "string"
  },
  "goals": {
    "quarter_goal": "string",
    "year_goal": "string"
  },
  "problems": ["string"],
  "content_info": {
    "active_platforms": ["instagram", "tiktok", "youtube"],
    "camera_comfort": "low | medium | high",
    "weekly_capacity": 1,
    "best_video_link": "string",
    "best_video_reason": "string"
  },
  "positioning": {
    "persona": "string",
    "difference": "string"
  },
  "constraints": {
    "daily_time": "string",
    "team": "string"
  },
  "created_at": "timestamp"
}
15. OTOMATİK SOSYAL MEDYA BIO ANALİZİ (SELENIUM + AI)
Bu özellik ClientBrain'in müşteriyi hızlı anlaması için kritik bir güç sağlar. Instagram, TikTok ve YouTube bio/metin alanları otomatik olarak taranır ve AI tarafından analiz edilir.

15.1. Amaç
Yeni müşteri eklerken sosyal medya bio’sunu otomatik çekmek

Bio’yu AI ile analiz edip: pozisyonlama, hedef, avantaj, güven unsurlarını çıkarmak

“Bio gelişim önerisi” üretmek

Bu analiz ilk görüşme kalitesini artırır ve profil kartını otomatik doldurur.

15.2. Teknik Akış (Selenium Kullanımı)
Kullanıcı müşteri eklerken IG/TikTok/YouTube kullanıcı adını girer.

Sistem arka planda Selenium’a şu komutu gönderir:

IG profil linkine gider: https://instagram.com/{{username}}

Bio alanını DOM’dan çeker (JS ile)

Çekilen raw bio metni ai_bio_analysis endpoint’ine gönderilir.

AI şu çıktıları üretir:

Bio'nun netliği (0–10)

Mesaj tonu

Hedef kitle tahmini

Uzmanlık iddiası

Güven unsurları

Eksik unsurlar

Yeni bio metni önerisi (kısa / orta / uzun)

Bu analiz client_profile_summary içine entegre edilir.

15.3. ai_bio_analysis JSON Çıktısı
json
Kodu kopyala
{
  "raw_bio": "string",
  "clarity_score": 7,
  "tone": "profesyonel | agresif | sakin | premium",
  "target_audience_detected": "yatırımcı | aile | güzellik danışanı | spor odaklı",
  "unique_value_points": ["bölge uzmanı", "müşteri memnuniyeti yüksek"],
  "missing_elements": ["güven unsuru eksik", "net hizmet belirtilmemiş"],
  "bio_suggestions": {
    "short": "string",
    "medium": "string",
    "long": "string"
  }
}
15.4. Selenium Scraper Taslağı (Backend İş Akışı)
Selenium Headless Chrome (Puppeteer alternatifi opsiyonel)

IG / TikTok bio çekimi → Worker / Background Job

Çıktı 5 dk Redis Cache’de tutulur

API → /api/ai/bio-analysis

Sonuç → Müşteri kartına yazılır

16. İLERİ AI ENTEGRASYONU – Bio + Video + İçerik Uyum Analizi
Bio analizini tek başına kullanmak yerine, ClientBrain şu kontrolü yapabilir:

Bio’da “lüks konut” yazıyor ama videolar sıradan → uyumsuzluk uyarısı

Bio’da “uzman” diyor ama içerikler amatör → gelişim önerisi

Bio’da “bölge uzmanı” var ama bölge analizi videosu yok → plan eklemesi

Bu uyum analizi, danışmanlık kalitesini birkaç kat yükseltir.

17. VIDEO PERFORMANS ANALİTİĞİ & HASHTAG ANALİZİ
ClientBrain sadece tekil videoları içerik kalitesi açısından analiz etmekle kalmaz, aynı zamanda hesap seviyesi performans takibi yapar. Böylece danışman olarak şu sorulara net cevap verilebilir:

En çok izlenen videolar hangileri?

Son 10 videonun ortalama performansı nedir?

Aylık kaç video yükleniyor, düzen var mı?

Hashtag kullanımı nasıl, gerçekten işe yarıyor mu?

17.1. video_stats Tablosu (Hesap Seviyesi Performans)
Her video için platformdan (mümkünse API ile, değilse manuel girişle) çekilen metrikler saklanır.

json
Kodu kopyala
{
  "client_id": "uuid",
  "video_id": "uuid",
  "platform": "instagram | tiktok | youtube",
  "external_id": "string",
  "url": "string",
  "published_at": "timestamp",
  "views": 1234,
  "likes": 210,
  "comments": 15,
  "shares": 9,
  "saves": 32,
  "duration_sec": 17,
  "is_reel": true,
  "captions": "string",
  "hashtags": ["bursaemlak", "satılıkev"],
  "created_at": "timestamp"
}
Bu tablo üzerinden:

Son 10 videonun ortalama izlenmesi

Aylık toplam video sayısı

Aylık ortalama izlenme / like / comment

En çok izlenen ilk N video

kolayca hesaplanabilir.

17.2. hashtag_stats Tablosu (Hashtag Performansı)
Her videodaki hashtag’ler parse edilerek ayrı bir istatistik tablosuna işlenir.

json
Kodu kopyala
{
  "client_id": "uuid",
  "hashtag": "string",
  "usage_count": 24,
  "total_views": 12340,
  "avg_views": 514,
  "avg_engagement_rate": 0.078,
  "last_used_at": "timestamp"
}
Bu sayede AI şu soruları cevaplayabilir:

En çok kullanılan ama performansı düşük hashtag’ler hangileri?

Az kullanılan ama performansı yüksek “gizli güçlü” hashtag’ler hangileri?

Müşterinin kitlesine uygun yeni hashtag önerileri neler?

17.3. Otomatik Video Performans Raporu
ClientBrain düzenli aralıklarla (veya sen talep ettiğinde) şu tarz bir rapor üretebilir:

Son 10 Video Özeti

Ortalama izlenme

Ortalama beğeni / yorum / kaydetme

En iyi performans gösteren 2 video

En kötü performans gösteren 2 video

Aylık Aktivite Özeti

Bu ay kaç video yüklenmiş?

Geçen aya göre artış / azalış yüzdesi

Aylık toplam izlenme & ortalama izlenme

Hashtag Analizi

En sık kullanılan 10 hashtag

En iyi çalışan 5 hashtag (avg_views’e göre)

Kullanımı bırakılması gereken hashtag önerileri

Yeni önerilen hashtag kombinasyonları

AI Yorum Bölümü

"Bu ay içerik sayısı artmış ama ortalama izlenme düşmüş; muhtemelen kalite yerine sayıya oynamaya başladın."

"Şu 2 hashtag, kullandığın diğerlerine göre belirgin şekilde daha iyi çalışıyor; yeni videoların %70’inde bunları kullan."

17.4. AI Tabanlı Trend & Pattern Analizi
Video + hashtag + zaman serisi verisi bir araya getirilerek ClientBrain şunları tespit eder:

Hangi gün/saat yayınlanan videolar daha çok izleniyor?

Hangi içerik türü (eğitim / portföy / güven / viral) daha iyi çalışıyor?

Hangi hashtag kombinasyonları performansı yükseltiyor veya düşürüyor?

"İyileşme var mı, yoksa aynı hatalar mı devam ediyor?" sorusuna sayısal cevap.

Bu analiz sonuçları Growth / Gelişim Grafiği ekranında grafik ve AI yorumuyla birlikte gösterilir.

17.5. Platform Entegrasyonu (Opsiyonel V2)
Müsait API’ler üzerinden (Instagram Graph API, TikTok, YouTube Data API) otomatik veri çekimi

API yoksa veya kısıtlıysa, manuel input + Excel import desteği

Bu yapı sayesinde danışman:

“Son 30 günde kaç video atmışsın, ortalama izlenme ne, hangi hashtag’ler çalışmış?”

sorusuna ClientBrain üzerinden tek ekran ile cevap verebilir.

18. GELECEK ADIMLAR (V2 GELİŞİM ALANLARI)
Veritabanı şemasının detaylandırılması

API mimarisinin eklenmesi

AI beyin akış diyagramının entegrasyonu

Bio & video uyum skorlamasının sistemleştirilmesi

Selenium scraper’ın production-ready hale getirilmesi

Video performans analitiği ve hashtag istatistik ekranlarının geliştirilmesi

19. GELİŞİM DASHBOARD EKRANI (UI TASARIMI)
Bu ekranın amacı:
“Bu müşteri gelişiyor mu, neresi iyi, neresi çöp?” sorusuna 10 saniyede cevap vermek.

19.1. Genel Layout
4 katmanlı yapı:

Üst bar → Filtreler + Özet KPI kartları

Orta sol → Performans grafikleri (video metrikleri)

Orta sağ → Hashtag analitiği

Alt → AI yorum & aksiyon önerileri

19.2. Üst Bar – Filtreler & KPI Kartları
Filtreler:

Tarih aralığı: Son 7 gün / 30 gün / 90 gün / Custom

Platform: Hepsi / Instagram / TikTok / YouTube

İçerik tipi (opsiyonel): Hepsi / Eğitim / Portföy / Viral / Güven

Bu filtreler alttaki tüm grafik ve tabloları yeniden çizer.

KPI Kartları:

Toplam Video Sayısı (seçilen aralıkta)

Alt: “Önceki döneme göre +%X / -%Y”

Ortalama İzlenme / Video

Alt: “Önceki döneme göre +%X / -%Y”

Ortalama Etkileşim Oranı

Formül: (likes + comments + shares + saves) / views

En İyi Video Skoru (Son 10 Video)

combined_score

“Video: [kısa başlık] – Skor: 8.7/10”

19.3. Performans Grafikleri (Sol Orta)
Zaman Serisi Grafiği:

X: tarih

Y1: Ortalama izlenme

Y2: Ortalama video skoru

Sorular:

Daha çok video atınca izlenme artıyor mu?

Skorlar yükselirken izlenme düşüyor mu?

Son 10 Video Tablosu:

Kolonlar:

Tarih

Video thumb

Views / Likes / Comments / Shares

combined_score

Etiket: İyi / Orta / Zayıf

Satıra tıklayınca → Video Analiz ekranı.

İçerik Türü Bazlı Performans:

Bar chart:

X: içerik kategorisi (education / portfolio / trust / viral vs.)

Y: Ortalama izlenme

İkinci bar:

Y: Ortalama etkileşim oranı

19.4. Hashtag Analitiği (Sağ Orta)
En Sık Kullanılan Hashtag’ler Tablosu:

Hashtag

Kullanım sayısı

Toplam izlenme

Ortalama izlenme

Ortalama etkileşim oranı

Etiket: iyi / nötr / çöp

En İyi Hashtag’ler (Performansa Göre):

Top 5 liste:

#bursaemlak – avg_views: 2.3K – etkileşim: %8.1

#satılıkev – avg_views: 1.9K – etkileşim: %9.4

Çöp Hashtag Listesi:

Çok kullanılan ama düşük performanslı 5–10 hashtag

Yanında öneri: “Kullanımı azalt” / “Alternatif üret”

19.5. AI Yorum & Aksiyon Önerileri (Alt Blok)
AI Özet Kutusu:

Başlık: “ClientBrain Gelişim Değerlendirmesi”

Örnek:

“Son 30 günde video sayını %40 artırmışsın (12 → 17), fakat ortalama izlenme %25 düşmüş.
Bu, niceliği artırırken kaliteyi kaybettiğini gösteriyor.
Eğitici içeriklerde performans iyi, portföy videoları zayıf kalmış.
Hashtag tarafında 3 güçlü etiketin var ama onları tutarlı kullanmıyorsun.”

Aksiyon Listesi:

Haftalık minimum 3 video: 2 eğitim, 1 portföy

Şu 3 hashtag’i standartlaştır: #bursaemlak #satılıkev #bölgeuzmanı

Kötü çalışan şu 2 hashtag’i bırak

En iyi videonu referans al, benzer formatta 2 video daha üret

Her aksiyonun yanında “Plan’a ekle” butonu → içerik planına push.

19.6. Data Kaynakları
Dashboard veriyi şuralardan çeker:

video_stats

video_scores

hashtag_stats

(Opsiyonel) client_plans

Backend, seçilen tarih aralığı için özet JSON çıkarır ve LLM’e:

“Bu verileri analiz et, gelişim var mı yok mu, 5 maddelik aksiyon öner.”

şeklinde gönderir.

20. NOTLAR
Bu doküman V1 için yeterli mimariyi ve veri yapısını içerir.

Cursor içinde:

types.ts için bu JSON'lar TypeScript interface’lerine dönüştürülebilir,

seed dosyası için sector_templates örnekleri kullanılabilir,

API route’ları için /api/create-client, /api/new-session, /api/video-analysis, /api/generate-plan akışları buradan kodlanabilir.