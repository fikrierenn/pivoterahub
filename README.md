# ClientBrain - Dijital Danismanlik AI Sistemi

ClientBrain, dijital danismanlik sureclerini olceklenebilir, hafizali ve video-odakli bir AI sistemi ile otomatiklestiren bir platformdur. Her musteri icin ayri hafiza tutan, videolari analiz eden, funnel olusturan ve danismanlik sureclerini sistematik hale getiren kisisel danismanlik beyni olarak tasarlanmistir.

## Proje Takibi

Tek kaynak dosya: `PROJECT_TRACKING.md`
Arsivlenen roadmap/analiz dokumanlari: `docs/legacy/`

## Temel Ozellikler

### Musteri Yonetimi
- **Otomatik Profil Karti**: Her musteri icin AI tarafindan olusturulan ve guncellenen kompakt ozet
- **Sektor Sablonlari**: Emlak, gelinlik, homm, zumba gibi sektorler icin onceden tanimlanmis funnel ve icerik sablonlari
- **Toplanti Ozetleme**: Ham notlardan otomatik 10 maddelik ozet ve aksiyon maddeleri cikarma

### Video Analizi
- **AI Skorlama**: Hook, tempo, mesaj netligi, CTA ve gorsel kalite icin 0-10 arasi skorlama
- **Whisper Entegrasyonu**: Otomatik video transkript cikarma
- **Stratejik Oneriler**: Saniye bazli iyilestirme onerileri ve icerik fikirleri
- **Funnel Esleshtirme**: Videonun hangi funnel asamasina (soguk, ilik, sicak) hitap ettigini belirleme

### Performans Takibi
- **Video Performans Metrikleri**: Izlenme, begeni, yorum, paylasim ve kaydetme sayilari
- **Hashtag Analizi**: Hashtag performans istatistikleri ve strateji onerileri
- **Gelisim Grafikleri**: Zaman icinde video kalitesinin olculebilir takibi
- **Regresyon Tespiti**: Kotu lesen alanlarin otomatik tespiti

### Icerik Planlama
- **7 Gunluk Plan**: Musteri profili ve kapasitesine gore otomatik icerik plani
- **Funnel Stratejisi**: Her icerigin hangi funnel asamasina hitap ettigini belirleme
- **WhatsApp Sablonlari**: Sektore ozel hazir mesaj sablonlari

## Kurulum (Kisa)

1. Bagimliliklar: `npm install`
2. Ortam: `cp .env.example .env.local`
3. Dev: `npm run dev`

## Notlar

- Detayli kapsam ve checklist icin `PROJECT_TRACKING.md`
- Legacy dokumanlar `docs/legacy/` altinda