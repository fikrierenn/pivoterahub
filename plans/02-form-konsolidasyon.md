# Plan 02 — Form ve Analiz Ekran Konsolidasyonu

**Durum:** Taslak — Onay Bekliyor
**Tier:** 3
**Tarih:** 2026-05-13

---

## Problem

PivotaraHub'da aynı veriyi birden fazla form/sayfa üzerinden düzenleme ve görüntüleme mümkün. Aynı işlevin farklı menüden, farklı UI'lerden tetiklenmesi tutarsız UX, çift bakım maliyeti ve veri çakışması riski yaratıyor.

**Tespit edilen 4 ana çakışma:**

### Ç-1: Intake formu çift edit yolu
- `app/clients/[id]/intake/page.tsx` — tam görüşme formu (DynamicFormRenderer)
- `app/clients/[id]/page.tsx` içindeki `ClientInfoEditor` (14-192) — aynı `client_intake_forms.answers` alanlarını (competitors, main_goals, competitive_advantage, meeting_notes) detail sayfada inline edit ediyor
- İkisi de aynı `/api/clients/[id]/intake` PUT endpoint'ini çağırıyor

### Ç-2: Analysis sayfası overlap
- `app/clients/[id]/analysis/page.tsx` (469 satır) — readonly rapor + içinde `instagramAnalysis` ve `competitorAnalysis` sekmeleri (291-456)
- `app/clients/[id]/bio-analysis/page.tsx` — Bio için form + sonuç (interactive)
- `app/clients/[id]/competitor-analysis/page.tsx` — Rakip için form + sonuç (interactive)
- `/analysis` aynı veriyi `GET /api/clients/[id]` cevabından okuyup gösteriyor, diğerleri kendi endpoint'lerinden

### Ç-3: API endpoint isim çoklaması
- `/api/clients/[id]/analyze` — 501 placeholder (boş)
- `/api/clients/[id]/complete-analysis` — gerçek orchestrator (6 analiz türü)

### Ç-4: Menü ve aksiyon dağınıklığı
- Detail page header'da 6 buton (Görüşme/Komple Analiz/Bio/Rakip/Viral/Video/Rapor) — yatay overflow riski
- Sidebar'da müşteri-altı navigation yok

---

## Kapsam

**Etkilenen dosyalar (8):**
- `app/clients/[id]/page.tsx` (556 → ~400 satır beklenir)
- `app/clients/[id]/analysis/page.tsx` (469 → ~280 satır beklenir)
- `app/api/clients/[id]/analyze/route.ts` — silinecek
- `app/api/clients/[id]/complete-analysis/route.ts` → opsiyonel rename (geri uyumluluk için)
- (silinecek) `ClientInfoEditor` component (page.tsx içi)
- (taşınacak) `instagramAnalysis` + `competitorAnalysis` sekmeleri analysis page'den
- Detail page header — 6 buton tek "Analizler" dropdown'a

**Out-of-scope:**
- Video analiz akışı (`/api/video-analysis`, `/api/video-metadata`, `/api/video-production`) — gerçek duplikasyon yok
- Settings ekranları
- Sidebar'a alt-menü ekleme (ayrı bir plan)

---

## Alternatifler (5 Lens)

- 🔴 **Contrarian:** "Kullanıcı `ClientInfoEditor`'ı seviyor olabilir — inline hızlı edit dolayısıyla intake form yerine bunu kullanıyor olabilir." → Riski azaltmak için inline alanlar **readonly görüntüleme + Edit butonu → /intake** pattern'ine çevriliyor, kullanıcı kararı bağımsız test edilebilir.

- 🔵 **First Principles:** "Veri tek yerde yaşıyor mu?" → `client_intake_forms.answers` JSONB. Bu JSONB üzerinde tek bir form (intake), tek bir görüntüleyici (IntakeFormViewer), bir veya birden fazla servis (analizler) çalışmalı. Edit ile rapor karışmamalı.

- 🟢 **Expansionist:** "Eğer 5 farklı analiz türü varsa, hepsi tek `/clients/[id]/analyze?type=bio` query ile yönetilebilir." → Reddedildi: type-specific UI (form alanları) farklı, query-paramlı sayfada lazy render karmaşası getirir.

- ⚪ **Outsider:** "Detail page'de 6 yatay buton ürkütücü, mobile'da kaybolur." → Tek "Analizler ▾" dropdown menüsü çözüm — header sade kalır.

- 🟡 **Executor:** "Bugün başla → 4 saat sürer:" 1. ClientInfoEditor sil, 2. analysis page sekme temizle, 3. /analyze route sil, 4. header dropdown.

---

## Riskler

| Risk | Önlem |
|------|-------|
| Mevcut bookmark `/analysis` kullanıyor | Tutuyoruz, sadece içerik sadeleşiyor — URL bozulmuyor |
| `/api/clients/[id]/analyze` çağrılıyorsa | grep doğrulaması (`grep -r "clients/.*analyze[^-]"`) → boş ise silebiliriz |
| `ClientInfoEditor` aktif düzenleme akışı | Önce readonly'e çevir, sonra commit. 2-3 oturum sonra silinir. Aşamalı geçiş. |
| Header dropdown component eksikliği | Basit `<details>` veya inline state yeterli — yeni paket yok |

---

## Done Criteria

- [ ] `ClientInfoEditor` kaldırıldı, yerine "Görüşme bilgilerini düzenle → /intake" butonu kondu
- [ ] `app/clients/[id]/analysis/page.tsx` — `instagramAnalysis` + `competitorAnalysis` sekmeleri kaldırıldı, sadece readonly rapor görünümü (profesyonel + plan + presentation)
- [ ] `app/api/clients/[id]/analyze/route.ts` — silindi (501 placeholder yerine)
- [ ] Header'daki 6 buton → 1 "Analizler ▾" dropdown + sabit "Görüşme Formu", "Video Analizi Yap" butonları
- [ ] `npx tsc --noEmit` → 0 hata
- [ ] Manuel akış testi: müşteri oluştur → intake doldur → her analiz türünü çalıştır → rapor görüntüle
- [ ] file-size-discipline snapshot güncellendi (556 ve 469 satırlık dosyalar azaldı)

---

## Adımlar

### Faz A — ClientInfoEditor temizliği (1 commit)
1. `app/clients/[id]/page.tsx` içinde `ClientInfoEditor` import + JSX kaldır
2. Yerine `IntakeFormViewer` (mevcut) + "Görüşme bilgilerini düzenle → /intake" link
3. Component dosyası in-file ise sil

### Faz B — Analysis sayfası readonly'leşmesi (1 commit)
1. `app/clients/[id]/analysis/page.tsx` — `Instagram Bio` ve `Rakip Analizi` sekmelerini kaldır
2. Üstte "Bio analizi için → /bio-analysis" link ekle (kullanıcı yönlendirilsin)
3. 469 → ~280 satır beklenir

### Faz C — /analyze placeholder kaldır (1 commit)
1. `grep -rn "/api/clients/.*/analyze[^-]"` ile referans tara
2. Referans yoksa `app/api/clients/[id]/analyze/route.ts` ve klasör sil
3. Varsa `complete-analysis`'e redirect veya kullanım güncellemesi

### Faz D — Header dropdown (1 commit)
1. `app/clients/[id]/page.tsx` header'da 4 analiz butonu (Bio/Rakip/Viral/Komple) → tek "Analizler ▾" dropdown
2. Sabit kalan: Görüşme Formu, Video Analizi Yap, Raporu Görüntüle

---

## Rollback

Her faz ayrı commit — herhangi biri sorun yaratırsa `git revert <hash>`.
ClientInfoEditor için yedek (`docs/legacy/ClientInfoEditor.tsx.bak`) tutulabilir 1 oturum.
