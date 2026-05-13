# Plan 03 — complete-analysis Paralelleştirme

**Durum:** Onay sürecinde (kullanıcı açık talep etti)
**Tier:** 3 (kullanıcı-görünür davranış değişikliği — gecikme + hata yönetimi)
**Tarih:** 2026-05-13

---

## Problem

`/api/clients/[id]/complete-analysis` 6 adımı sıralı çalıştırıyor (~90-180s). Kullanıcı bu süre boyunca tek-buton arkasında bekliyor. Zincir 1 (LLM consulting) ile Zincir 2 (Instagram) birbirinden tamamen bağımsız ama seri çalışıyor.

Ek sorun: herhangi bir adımda hata → tek 500. Şu ana kadar yapılan kısmi başarı raporlanmıyor.

---

## Hedef Akış

```
Zincir 1  ──prof──>──card──>──plan──>──pres──┐
                                              ├──> birleşik response
Zincir 2  ──scrape──>──analyzeBio──┐          │
                                    └──Zincir 3 (varsa)
                                       extract──>──scrape──>──analyzeCompetitors
```

Zincir 1 + Zincir 2 `Promise.all` ile paralel başlatılır.
Zincir 3 sadece Zincir 2 tamamlandıktan sonra koşar (clientProfile için instagramAnalysis lazım).

---

## Kapsam

**Etkilenen:** `app/api/clients/[id]/complete-analysis/route.ts` (353 satır) — tek dosya refactor.

**Yeni yapı:**
- Helper fonksiyonlar dosya içinde: `runConsultingPipeline`, `runInstagramPipeline`, `runCompetitorPipeline`
- Ana `POST` handler: kısa orkestratör (~30 satır), `Promise.all` + sonra zincir 3
- Her zincirin kendi try/catch'i — partial success response

**Out-of-scope:**
- Zincir 1 içinde paralelleştirme (4 LLM bağımlı, dokunmuyoruz)
- Streaming response (SSE) — başka plan
- Helper'ları ayrı dosyaya çıkarma — drive-by refactor değil (dosya 353 satır, hâlâ kabul edilebilir)

---

## Riskler

| Risk | Önlem |
|------|-------|
| Zincir 2 + 3 hata → kullanıcı consulting'i alamadı sanır | Response'da her zincir için `success/error` flag |
| Promise.all içinde biri reject → diğerini iptal etmez ama biz görmezden gelmemeli | Zincirler kendi try/catch'inde, sadece logger.error + null döner |
| Concurrent LLM call rate-limit | Tier-1 ucuz modellerde sorun yok; Vision varsa chunked yap (yok şu an) |
| Existing client `success: true` bekleyebilir | Response'a `success: true` koruyarak `partial_failures` array ekle |

---

## Done Criteria

- [ ] Refactor sonrası `npx tsc --noEmit` → 0 hata
- [ ] Eski response field'ları korundu (`professional_analysis`, `profile_card`, `development_plan`, `presentation`, `instagram_analysis`, `competitor_analysis`, `success`, `message`)
- [ ] Yeni alan: `partial_failures: string[]` (hangi adım başarısız)
- [ ] Manuel test: 1) `ig_handle` yok → Zincir 2 atlanır, Zincir 1 çalışır. 2) `ig_handle` var → ikisi paralel. 3) Zincir 1'in 3. adımı patladığında Zincir 2 sonucu yine response'a yansır.
- [ ] Log: her zincirin start/end timestamp'i (manuel benchmark için)
- [ ] file-size-discipline: 353 → ~360 (hafif artış normal, helper'lar açıkça etiketli)

---

## Adımlar

1. Üç pipeline fonksiyonunu dosya başına ekle, ana POST handler'da çağır
2. `Promise.allSettled` (reject'i tolere et) yerine her pipeline kendi try/catch'inde, `Promise.all` ile başlatılır
3. Response shape'i koru, `partial_failures` ekle
4. Test: dev server'da `curl -X POST /api/clients/<id>/complete-analysis`
5. Tek atomik commit

---

## Rollback

Refactor başarısız → `git revert HEAD`. Tek commit olduğu için temiz.
