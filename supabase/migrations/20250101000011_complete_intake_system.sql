-- ============================================
-- Müşteri Görüşme Formu Sistemi (Tam Kurulum)
-- ============================================

-- 0. Önce clients tablosuna status kolonu ekle (eğer yoksa)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'lead' 
CHECK (status IN ('lead', 'prospect', 'active', 'inactive', 'completed'));

CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients (status);

COMMENT ON COLUMN public.clients.status IS 'Müşteri durumu: lead, prospect, active, inactive, completed';

-- 1. Cevaplar Tablosu (JSONB)
CREATE TABLE IF NOT EXISTS public.client_intake_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_id uuid, -- Hangi form şablonu kullanıldı (opsiyonel)
  answers jsonb NOT NULL DEFAULT '{}'::jsonb, -- Tüm soru-cevaplar JSON'da
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intake_forms_client ON public.client_intake_forms (client_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_answers ON public.client_intake_forms USING gin (answers);

COMMENT ON TABLE public.client_intake_forms IS 'Müşteri görüşme formu cevapları - tüm cevaplar JSONB formatında';

-- 2. Form Şablonları Tablosu (Sorular JSON'da)
CREATE TABLE IF NOT EXISTS public.intake_form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  questions jsonb NOT NULL,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.intake_form_templates IS 'Görüşme formu şablonları - sorular JSONB formatında';

-- 3. Foreign Key Ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_intake_forms_template'
  ) THEN
    ALTER TABLE public.client_intake_forms 
    ADD CONSTRAINT fk_intake_forms_template 
    FOREIGN KEY (template_id) REFERENCES public.intake_form_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.client_intake_forms.template_id IS 'Hangi form şablonu kullanıldı';

-- 4. Varsayılan Form Şablonu Ekle
INSERT INTO public.intake_form_templates (name, description, is_default, questions)
SELECT 
  'Standart Görüşme Formu',
  'Müşteri analizi için kapsamlı görüşme formu',
  true,
  '[
    {
      "category": "temel_bilgiler",
      "category_label": "📋 Temel Bilgiler",
      "questions": [
        {"key": "business_name", "text": "İş / Marka adı nedir?", "type": "text", "required": true, "placeholder": "Örn: Bursa Lüks Emlak", "example": "Bursa''da lüks konut odaklı emlak danışmanıyım"},
        {"key": "location", "text": "Hangi şehir/bölgede hizmet veriyorsunuz?", "type": "text", "required": true, "placeholder": "Örn: Nilüfer, Bursa", "example": "Nilüfer – Konak Mahallesi ağırlıklı çalışıyorum"},
        {"key": "sector", "text": "Sektörünüz nedir?", "type": "text", "required": true, "placeholder": "Örn: Emlak, Gelinlik, Wellness", "example": "Lüks konut emlak danışmanlığı"},
        {"key": "target_audience", "text": "Hedef kitlenizi nasıl tanımlarsınız?", "type": "textarea", "required": false, "placeholder": "Örn: Ev alırken güven arayan aileler", "example": "Ev alırken güven arayan aileler ve yatırımcılar"},
        {"key": "price_segment", "text": "Fiyat segmentiniz nedir?", "type": "select", "required": true, "options": ["luxury", "mid", "economic"]},
        {"key": "social_media_accounts", "text": "Sosyal medya hesaplarınız", "type": "json", "required": false, "placeholder": "{\"instagram\": \"@hesap\", \"tiktok\": \"\", \"youtube\": \"\"}", "example": "{\"instagram\": \"@emlakmert\", \"tiktok\": \"\", \"youtube\": \"\"}"}
      ]
    },
    {
      "category": "hedefler",
      "category_label": "🎯 Hedefler",
      "questions": [
        {"key": "three_month_goals", "text": "Önümüzdeki 3 ay için 2-3 temel hedefiniz nedir?", "type": "textarea", "required": true, "placeholder": "Örn: Takipçiyi 3.000''den 10.000''e çıkarmak", "example": "Takipçiyi 3.000''den 10.000''e çıkarmak ve ayda 2 satış yapmak"},
        {"key": "one_year_goals", "text": "1 yıl içinde nerede olmak istiyorsunuz?", "type": "textarea", "required": false, "placeholder": "Örn: Ayda 3-5 satış seviyesine çıkmak", "example": "Ayda 3–5 satış seviyesine çıkmak ve ekip kurmak"}
      ]
    },
    {
      "category": "sorunlar",
      "category_label": "⚠️ Ana Sorunlar",
      "questions": [
        {"key": "main_challenges", "text": "Şu anda sosyal medyada en çok zorlandığınız 2-3 konu nedir?", "type": "textarea", "required": true, "placeholder": "Örn: Düzenli video atamıyorum", "example": "Düzenli video atamıyorum, kamerada doğal olamıyorum"},
        {"key": "previous_agency_experience", "text": "Daha önce reklam/ajans/danışmanlık ile çalıştınız mı? Sonuç nasıldı?", "type": "textarea", "required": false, "placeholder": "Örn: Ajansla çalıştım ama...", "example": "Ajansla çalıştım ama sonuç alamadım, içerikler yapaydı"}
      ]
    },
    {
      "category": "icerik",
      "category_label": "🎬 İçerik Alışkanlıkları",
      "questions": [
        {"key": "active_platforms", "text": "Hangi platformlarda aktifsiniz?", "type": "multiselect", "required": true, "options": ["Instagram", "TikTok", "YouTube", "Facebook", "LinkedIn"]},
        {"key": "camera_comfort_level", "text": "Kamera karşısında rahatlık seviyeniz nedir?", "type": "select", "required": true, "options": ["low", "medium", "high"]},
        {"key": "weekly_content_capacity", "text": "Haftalık içerik üretim kapasiteniz kaç video?", "type": "number", "required": true, "placeholder": "Örn: 3", "example": "3-4 video çekebilirim"},
        {"key": "best_performing_video_link", "text": "En iyi performans gösteren videonuzun linki", "type": "text", "required": false, "placeholder": "Video URL"},
        {"key": "best_performing_video_reason", "text": "Bu video neden tuttuğunu düşünüyorsunuz?", "type": "textarea", "required": false, "placeholder": "Örn: Görüntü güzel ve netti", "example": "Balkon manzaralı kısa video çok izlendi; görüntü güzel ve netti"},
        {"key": "content_production_bottleneck", "text": "İçerik üretirken en çok ne sizi yavaşlatıyor?", "type": "textarea", "required": false, "placeholder": "Örn: Ne çekeceğimi planlamakta zorlanıyorum"}
      ]
    },
    {
      "category": "konumlandirma",
      "category_label": "🎭 Konumlandırma",
      "questions": [
        {"key": "desired_persona", "text": "İnsanlar sizi nasıl bir uzman/persona olarak görsün istiyorsunuz?", "type": "textarea", "required": false, "placeholder": "Örn: Güven veren, sakin ama bilgili", "example": "Güven veren, sakin ama bilgili bir bölge uzmanı"},
        {"key": "competitive_advantage", "text": "Rakiplerinize göre en büyük farkınız nedir?", "type": "textarea", "required": false, "placeholder": "Örn: Bölgeyi derinlemesine biliyorum"},
        {"key": "desired_tone", "text": "İçeriklerinizde hangi duygu/tone öne çıkmalı?", "type": "text", "required": false, "placeholder": "Örn: Premium, Samimi, Enerjik", "example": "Güven verici ve premium bir ton"}
      ]
    },
    {
      "category": "operasyonel",
      "category_label": "⚙️ Operasyonel Kısıtlar",
      "questions": [
        {"key": "daily_time_commitment", "text": "Günde bu işe gerçekçi olarak ne kadar zaman ayırabilirsiniz?", "type": "text", "required": false, "placeholder": "Örn: Günde 1 saat"},
        {"key": "team_support", "text": "Bir ekip/yardımcı var mı? Roller neler?", "type": "textarea", "required": false, "placeholder": "Örn: Şu an yalnızım"},
        {"key": "budget", "text": "Reklam bütçesi veya danışmanlık için ayırdığınız bütçe var mı?", "type": "textarea", "required": false, "placeholder": "Örn: Aylık küçük bir reklam bütçesi"}
      ]
    },
    {
      "category": "mevcut_durum",
      "category_label": "📊 Mevcut Durum",
      "questions": [
        {"key": "current_followers", "text": "Takipçi sayıları (Platform bazında)", "type": "json", "required": false, "placeholder": "{\"instagram\": 0, \"tiktok\": 0, \"youtube\": 0}", "example": "{\"instagram\": 2430, \"tiktok\": 0, \"youtube\": 120}"},
        {"key": "last_30_days_performance", "text": "Son 30 gündeki içerik performansı", "type": "textarea", "required": false, "placeholder": "Örn: 6 video attım, en iyisi 12K"},
        {"key": "content_frequency", "text": "İçerik düzeni / frekansı", "type": "text", "required": false, "placeholder": "Örn: Haftada 1-2 video"},
        {"key": "used_hashtags", "text": "Kullandığı hashtag''ler", "type": "json", "required": false, "placeholder": "[\"#hashtag1\", \"#hashtag2\"]", "example": "[\"#bursaemlak\", \"#satilikev\", \"#evgezmesi\"]"},
        {"key": "competitors", "text": "Rakipler (İsim isim)", "type": "json", "required": false, "placeholder": "[\"Rakip 1\", \"Rakip 2\"]", "example": "[\"Ahmet Emlak\", \"Balat Realty\", \"Nilüfer Home\"]"},
        {"key": "self_positioning", "text": "Kendini konumlandırma (Müşteri cümlesiyle)", "type": "textarea", "required": false, "placeholder": "Örn: Sakin, güven veren..."}
      ]
    }
  ]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.intake_form_templates WHERE is_default = true
);
