# Requirements Document

## Introduction

ClientBrain, dijital danışmanlık süreçlerini ölçeklenebilir, hafızalı ve video-odaklı bir AI sistemi ile otomatikleştiren bir platformdur. Her müşteri için ayrı hafıza tutan, videoları analiz eden, funnel oluşturan ve danışmanlık süreçlerini sistematik hale getiren kişisel danışmanlık beyni olarak tasarlanmıştır. Sistem, OpenAI GPT-4.1-mini ve Whisper modellerini kullanarak düşük maliyetli ve yüksek zekâ seviyesine sahip bir dijital danışman oluşturur.

## Glossary

- **ClientBrain Sistemi**: Dijital danışmanlık süreçlerini yöneten ana uygulama platformu
- **Müşteri Profil Kartı**: Her müşteri için AI tarafından oluşturulan ve güncellenen kompakt özet bilgi
- **Funnel**: Müşteri yolculuğunun soğuk, ılık, sıcak ve satış aşamalarını içeren pazarlama hunisi
- **Video Skoru**: Hook, tempo, mesaj netliği, CTA ve görsel kalite gibi parametrelerin 0-10 arası değerlendirilmesi
- **Sektör Şablonu**: Her sektör için önceden tanımlanmış funnel, içerik ve mesaj şablonları
- **Toplantı Özeti**: AI tarafından ham notlardan üretilen yapılandırılmış özet ve aksiyon maddeleri
- **İçerik Planı**: Müşteri için oluşturulan haftalık video içerik takvimi
- **Gelişim Analizi**: Müşterinin video performansının zaman içindeki değişiminin ölçümü
- **LLM**: Large Language Model - OpenAI GPT-4.1-mini modeli
- **Whisper**: OpenAI'nin video transkript çıkarma modeli
- **Hafıza Katmanı**: Müşteri bilgileri, toplantı özetleri, planlar ve video skorlarının saklandığı veri katmanı

## Requirements

### Requirement 1

**User Story:** Danışman olarak, yeni bir müşteri eklediğimde sistem otomatik olarak müşteri profil kartı ve ilk planları oluşturmalı, böylece hemen danışmanlık sürecine başlayabilirim.

#### Acceptance Criteria

1. WHEN danışman yeni müşteri bilgilerini (ad, sektör, şehir, Instagram hesabı, haftalık içerik kapasitesi, pozisyonlama) girdiğinde THEN ClientBrain Sistemi SHALL müşteri kaydını veritabanına eklemeli
2. WHEN müşteri kaydı oluşturulduğunda THEN ClientBrain Sistemi SHALL müşterinin sektörüne uygun şablonu (funnel, içerik kategorileri, WhatsApp mesajları) otomatik olarak müşteriye atamalı
3. WHEN sektör şablonu atandığında THEN ClientBrain Sistemi SHALL LLM kullanarak müşteri için ilk Müşteri Profil Kartı oluşturmalı
4. WHEN Müşteri Profil Kartı oluşturulduğunda THEN ClientBrain Sistemi SHALL profil özetini, ana hedefleri, ana sorunları ve ana fırsatları içermeli
5. WHEN müşteri oluşturma işlemi tamamlandığında THEN ClientBrain Sistemi SHALL işlemin başarılı olduğunu danışmana bildirmeli

### Requirement 2

**User Story:** Danışman olarak, müşteri ile yaptığım toplantı notlarını sisteme girdiğimde otomatik olarak özetlenmesini ve aksiyon maddelerinin çıkarılmasını istiyorum, böylece manuel özet çıkarma işinden kurtulabilirim.

#### Acceptance Criteria

1. WHEN danışman ham toplantı notlarını ve toplantı tarihini girdiğinde THEN ClientBrain Sistemi SHALL notları veritabanına kaydetmeli
2. WHEN ham notlar kaydedildiğinde THEN ClientBrain Sistemi SHALL LLM kullanarak notlardan 10 maddelik yapılandırılmış özet oluşturmalı
3. WHEN özet oluşturulduğunda THEN ClientBrain Sistemi SHALL notlardan aksiyon maddelerini çıkarmalı
4. WHEN toplantı özeti ve aksiyon maddeleri oluşturulduğunda THEN ClientBrain Sistemi SHALL bunları müşterinin toplantı geçmişine eklemelidir
5. WHEN yeni toplantı kaydedildiğinde THEN ClientBrain Sistemi SHALL danışmana Müşteri Profil Kartını güncelleme seçeneği sunmalı

### Requirement 3

**User Story:** Danışman olarak, müşteri profil kartının güncel kalmasını istiyorum, böylece her zaman en son durumu görebilirim ve AI'nin doğru bağlamda çalışmasını sağlayabilirim.

#### Acceptance Criteria

1. WHEN danışman profil güncelleme talebinde bulunduğunda THEN ClientBrain Sistemi SHALL müşterinin son toplantı özetlerini toplamalı
2. WHEN toplantı özetleri toplandığında THEN ClientBrain Sistemi SHALL sabit profil bilgilerini (sektör, şehir, pozisyonlama) ve son planları birleştirmeli
3. WHEN tüm bilgiler birleştirildiğinde THEN ClientBrain Sistemi SHALL LLM'e tek bir çağrı yaparak yeni kompakt profil özeti oluşturmalı
4. WHEN yeni profil özeti oluşturulduğunda THEN ClientBrain Sistemi SHALL mevcut Müşteri Profil Kartını yeni özetle güncellemelidir
5. WHEN profil güncellemesi tamamlandığında THEN ClientBrain Sistemi SHALL güncelleme tarihini kaydetmeli ve danışmana bildirimde bulunmalı


### Requirement 4

**User Story:** Danışman olarak, müşterinin videolarını sisteme yüklediğimde otomatik analiz ve skorlama yapılmasını istiyorum, böylece video kalitesini objektif olarak değerlendirebilirim.

#### Acceptance Criteria

1. WHEN danışman video URL'sini sisteme girdiğinde THEN ClientBrain Sistemi SHALL video kaydını müşteriye bağlı olarak veritabanına eklemelidir
2. WHEN video kaydedildiğinde THEN ClientBrain Sistemi SHALL Whisper modelini kullanarak videodan transkript çıkarmalı
3. WHEN transkript çıkarıldığında THEN ClientBrain Sistemi SHALL videonun görsel, süre ve tempo bilgilerini analiz etmeli
4. WHEN video parametreleri analiz edildiğinde THEN ClientBrain Sistemi SHALL LLM kullanarak hook skoru (0-10), tempo skoru (0-10), mesaj netliği skoru (0-10), CTA skoru (0-10) ve görsel kalite skoru (0-10) oluşturmalı
5. WHEN skorlar oluşturulduğunda THEN ClientBrain Sistemi SHALL videonun ana hatalarını (hook_zayıf, monoton_ses, cok_uzun, cta_yok gibi) etiketlemeli
6. WHEN hatalar etiketlendiğinde THEN ClientBrain Sistemi SHALL videonun hangi Funnel aşamasına (soğuk, ılık, sıcak) hitap ettiğini belirlemeli
7. WHEN tüm analiz tamamlandığında THEN ClientBrain Sistemi SHALL video skorlarını ve analiz sonuçlarını veritabanına kaydetmeli

### Requirement 5

**User Story:** Danışman olarak, video analizi sonuçlarını görüntülediğimde teknik skorların yanında stratejik öneriler ve iyileştirme tavsiyeleri almak istiyorum, böylece müşteriye somut geri bildirim verebilirim.

#### Acceptance Criteria

1. WHEN video analizi tamamlandığında THEN ClientBrain Sistemi SHALL LLM kullanarak videonun stratejik analizini oluşturmalı
2. WHEN stratejik analiz oluşturulduğunda THEN ClientBrain Sistemi SHALL videonun müşterinin hedef kitlesine uygunluğunu değerlendirmeli
3. WHEN hedef kitle uygunluğu değerlendirildiğinde THEN ClientBrain Sistemi SHALL videonun önceki videolara göre gelişim durumunu karşılaştırmalı
4. WHEN karşılaştırma yapıldığında THEN ClientBrain Sistemi SHALL saniye bazlı iyileştirme önerileri (örn: "0-3 saniyeyi şöyle değiştir") oluşturmalı
5. WHEN iyileştirme önerileri oluşturulduğunda THEN ClientBrain Sistemi SHALL videodan türetilebilecek içerik fikirlerini (en az 3 adet) önermelidir
6. WHEN tüm öneriler hazırlandığında THEN ClientBrain Sistemi SHALL bunları danışmana sunmalı

### Requirement 6

**User Story:** Danışman olarak, müşteri için haftalık içerik planı oluşturulmasını istiyorum, böylece müşteriye sistematik bir içerik stratejisi sunabilirim.

#### Acceptance Criteria

1. WHEN danışman içerik planı oluşturma talebinde bulunduğunda THEN ClientBrain Sistemi SHALL müşterinin Müşteri Profil Kartını, son toplantı özetlerini ve mevcut planları toplamalı
2. WHEN bağlam bilgileri toplandığında THEN ClientBrain Sistemi SHALL müşterinin haftalık içerik kapasitesini dikkate almalı
3. WHEN kapasite belirlendikten sonra THEN ClientBrain Sistemi SHALL LLM kullanarak 7 günlük içerik planı oluşturmalı
4. WHEN içerik planı oluşturulduğunda THEN ClientBrain Sistemi SHALL her gün için içerik tipini, kısa açıklamayı ve hangi Funnel aşamasına hitap ettiğini belirtmeli
5. WHEN plan detayları hazırlandığında THEN ClientBrain Sistemi SHALL planı veritabanına kaydetmeli ve danışmana sunmalı

### Requirement 7

**User Story:** Danışman olarak, müşterinin zaman içindeki gelişimini ölçülebilir şekilde görmek istiyorum, böylece danışmanlık hizmetimin etkisini objektif olarak değerlendirebilirim.

#### Acceptance Criteria

1. WHEN danışman gelişim analizi talebinde bulunduğunda THEN ClientBrain Sistemi SHALL müşterinin son 10 videosunun skorlarını toplamalı
2. WHEN skorlar toplandığında THEN ClientBrain Sistemi SHALL hook ortalamasını, tempo ortalamasını ve mesaj netliği ortalamasını hesaplamalı
3. WHEN ortalamalar hesaplandığında THEN ClientBrain Sistemi SHALL tekrarlanan hataları ve iyileşen alanları tespit etmeli
4. WHEN hata analizi tamamlandığında THEN ClientBrain Sistemi SHALL kötüleşen alanları (regresyon) otomatik olarak belirlemeli
5. WHEN tüm analiz tamamlandığında THEN ClientBrain Sistemi SHALL LLM kullanarak gelişim yorumu oluşturmalı (örn: "Hook gelişirken mesaj netliği düştü")
6. WHEN gelişim yorumu oluşturulduğunda THEN ClientBrain Sistemi SHALL sonuçları grafiksel ve metinsel olarak danışmana sunmalı

### Requirement 8

**User Story:** Danışman olarak, tüm müşterilerimi tek bir listede görmek ve hızlıca detaylarına erişmek istiyorum, böylece müşteri yönetimimi verimli şekilde yapabilirim.

#### Acceptance Criteria

1. WHEN danışman müşteri listesi ekranını açtığında THEN ClientBrain Sistemi SHALL tüm müşterileri tablo formatında göstermeli
2. WHEN müşteri listesi görüntülendiğinde THEN ClientBrain Sistemi SHALL her müşteri için adı, sektörü, şehri, son plan tarihini, son video skor ortalamasını ve durumunu (aktif/pasif) göstermeli
3. WHEN danışman bir müşteri satırına tıkladığında THEN ClientBrain Sistemi SHALL müşteri detay ekranına yönlendirmeli
4. WHEN danışman yeni müşteri butonu tıkladığında THEN ClientBrain Sistemi SHALL müşteri oluşturma formunu açmalı

### Requirement 9

**User Story:** Danışman olarak, bir müşterinin tüm kritik bilgilerini tek ekranda görmek istiyorum, böylece müşteri ile ilgili hızlı kararlar alabilirim.

#### Acceptance Criteria

1. WHEN danışman müşteri detay ekranını açtığında THEN ClientBrain Sistemi SHALL müşterinin Müşteri Profil Kartını (profil özeti, hedefler, sorunlar, fırsatlar) göstermeli
2. WHEN profil kartı görüntülendiğinde THEN ClientBrain Sistemi SHALL müşterinin son 7 günlük içerik planını (gün, içerik tipi, açıklama) göstermeli
3. WHEN içerik planı görüntülendiğinde THEN ClientBrain Sistemi SHALL müşterinin son toplantı özetini madde madde göstermeli
4. WHEN toplantı özeti görüntülendiğinde THEN ClientBrain Sistemi SHALL müşterinin sabit bilgilerini (ad, sektör, şehir, Instagram, kapasite, pozisyonlama) göstermeli
5. WHEN detay ekranı görüntülendiğinde THEN ClientBrain Sistemi SHALL hızlı aksiyonlar için butonlar (yeni toplantı notu ekle, yeni video analizi yap, gelişim raporu oluştur, profil kartını güncelle, yeni plan üret) sunmalı

### Requirement 10

**User Story:** Danışman olarak, video analiz sonuçlarını videoyu izlerken görmek istiyorum, böylece analizi video ile birlikte değerlendirebilirim.

#### Acceptance Criteria

1. WHEN danışman video analiz ekranını açtığında THEN ClientBrain Sistemi SHALL video oynatıcıyı ve video meta bilgilerini (tarih, süre, platform) göstermeli
2. WHEN video görüntülendiğinde THEN ClientBrain Sistemi SHALL skorlar sekmesinde tüm teknik skorları (hook, tempo, mesaj netliği, CTA, görsel kalite) göstermeli
3. WHEN skorlar görüntülendiğinde THEN ClientBrain Sistemi SHALL hatalar sekmesinde hata etiketlerini ve kısa metinsel özeti göstermeli
4. WHEN hatalar görüntülendiğinde THEN ClientBrain Sistemi SHALL öneriler sekmesinde saniye bazlı önerileri ve türetilebilecek içerik fikirlerini göstermeli
5. WHEN analiz ekranı görüntülendiğinde THEN ClientBrain Sistemi SHALL önceki videolarla karşılaştırma ve yeni video fikri üretme butonları sunmalı



### Requirement 11

**User Story:** Danışman olarak, müşterinin videolarının sosyal medya performansını (izlenme, beğeni, yorum) takip etmek istiyorum, böylece hangi içeriklerin daha iyi çalıştığını görebilirim.

#### Acceptance Criteria

1. WHEN danışman video performans verilerini (izlenme, beğeni, yorum, paylaşım, kaydetme) girdiğinde THEN ClientBrain Sistemi SHALL bu verileri video ile ilişkilendirerek veritabanına kaydetmeli
2. WHEN performans verileri kaydedildiğinde THEN ClientBrain Sistemi SHALL videonun yayınlanma tarihini, süresini ve platform bilgisini kaydetmeli
3. WHEN video caption ve hashtag bilgileri girildiğinde THEN ClientBrain Sistemi SHALL hashtag'leri parse ederek ayrı bir hashtag istatistik tablosuna işlemeli
4. WHEN hashtag'ler işlendiğinde THEN ClientBrain Sistemi SHALL her hashtag için kullanım sayısını, toplam izlenmeyi ve ortalama etkileşim oranını hesaplamalı
5. WHEN danışman video performans listesini görüntülediğinde THEN ClientBrain Sistemi SHALL videoları performans metriklerine göre sıralayabilmeli

### Requirement 12

**User Story:** Danışman olarak, hangi hashtag'lerin daha iyi performans gösterdiğini görmek istiyorum, böylece müşteriye etkili hashtag stratejisi önerebilirim.

#### Acceptance Criteria

1. WHEN danışman hashtag analizi talebinde bulunduğunda THEN ClientBrain Sistemi SHALL tüm hashtag'lerin kullanım istatistiklerini toplamalı
2. WHEN hashtag istatistikleri toplandığında THEN ClientBrain Sistemi SHALL her hashtag için ortalama izlenme, ortalama etkileşim oranı ve kullanım sıklığını hesaplamalı
3. WHEN hesaplamalar tamamlandığında THEN ClientBrain Sistemi SHALL hashtag'leri performansa göre sıralamalı (en iyi, orta, zayıf)
4. WHEN hashtag'ler sıralandığında THEN ClientBrain Sistemi SHALL LLM kullanarak hashtag stratejisi önerileri oluşturmalı
5. WHEN öneriler hazırlandığında THEN ClientBrain Sistemi SHALL kullanılması gereken ve bırakılması gereken hashtag'leri danışmana sunmalı

### Requirement 13

**User Story:** Danışman olarak, müşterinin genel sosyal medya performansını (aylık video sayısı, ortalama izlenme, trend) görmek istiyorum, böylece danışmanlık stratejisini buna göre ayarlayabilirim.

#### Acceptance Criteria

1. WHEN danışman performans dashboard'unu açtığında THEN ClientBrain Sistemi SHALL seçilen tarih aralığındaki tüm video performans verilerini toplamalı
2. WHEN veriler toplandığında THEN ClientBrain Sistemi SHALL toplam video sayısını, ortalama izlenmeyi ve ortalama etkileşim oranını hesaplamalı
3. WHEN hesaplamalar tamamlandığında THEN ClientBrain Sistemi SHALL önceki döneme göre değişim yüzdesini hesaplamalı
4. WHEN değişim hesaplandığında THEN ClientBrain Sistemi SHALL içerik tipi bazında performans karşılaştırması yapmalı
5. WHEN karşılaştırma tamamlandığında THEN ClientBrain Sistemi SHALL LLM kullanarak performans yorumu ve aksiyon önerileri oluşturmalı
6. WHEN yorum hazırlandığında THEN ClientBrain Sistemi SHALL sonuçları grafiksel ve metinsel olarak danışmana sunmalı
