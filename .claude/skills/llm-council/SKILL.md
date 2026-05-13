---
name: llm-council
description: Karpathy LLM Council metodolojisi. Gerçek belirsizlik + yüksek maliyet kararlar için 5 paralel danışman + peer review + chairman sentezi.
triggers:
  - "council this"
  - "war room"
  - "pressure-test"
  - "stress-test"
  - "debate this"
  - "hangi seçenek"
  - "doğru hamle mi"
  - "validate et"
  - "kararsız kaldım"
---

# LLM Council Skill

_Karpathy'nin LLM Council metodolojisi. Gerçek belirsizlik + yüksek maliyet kararlar için._

## Ne Zaman Kullan

- Mimari kararlar: "PostgreSQL mi, MongoDB mi?"
- Önceliklendirme: "Hangi modülü önce bitirelim?"
- Scope kararları: "Bu servisi bu sprint mi ayıralım?"
- Teknoloji seçimi: "Alpine.js mi, React mi?"

**KULLANMA:** Basit evet/hayır, tek doğru cevabı olan, ya da stakes'siz sorularda.
**KULLANMA:** Zaten scopelanmış, onaylanmış planlarda — Plan-First sistemi onları yönetir.

---

## Süreç (4 Adım)

### Adım 1 — Soruyu Çerçevele

CLAUDE.md / journal / aktif plan bağlamını okuyarak **tarafsız, net bir karar çerçevesi** yaz. Yönlendirme yok, kendi görüşünü ekleme.

### Adım 2 — 5 Danışmanı Paralel Çalıştır

**Hepsini aynı anda** spawn et. Her biri 150-300 kelime, kendi lensinden — hedge etmeden.

| Danışman | Lens |
|---|---|
| **Contrarian** | Fatal flaw'u bul. Plan başarısız olursa neden olur? |
| **First Principles** | Yanlış soru mu soruyoruz? Gerçek problem ne? |
| **Expansionist** | Kaçırılan upside ne? Scope çok mu dar? |
| **Outsider** | Koda/projeye yabancı biri ne garip bulur? |
| **Executor** | İlk somut adım ne? Yarın ne yapılır? |

**Her danışmana prompt:**
```
Sen bir LLM Council'da [Danışman Adı] rolündesin.
Düşünce lensin: [yukarıdaki lens]

Karar sorusu:
---
[çerçevelenmiş soru]
---

Perspektifinden doğrudan yaz. Hedge etme. 150-300 kelime.
```

### Adım 3 — Anonim Peer Review (Paralel)

5 yanıtı A-E olarak anonim et. 5 reviewer'ı aynı anda spawn et:

1. En güçlü yanıt hangisi ve neden?
2. En büyük blind spot nerede?
3. Hepsinin kaçırdığı nedir?

### Adım 4 — Chairman Sentezi

```markdown
## Council Verdict: {konu}

### Konseyin Uzlaştığı Noktalar
[Birden fazla danışmanın bağımsız ulaştığı sonuçlar — yüksek güven]

### Konseyin Çatıştığı Noktalar
[Gerçek anlaşmazlıklar — neden ayrıştılar]

### Yakalanan Blind Spot'lar
[Sadece peer review'da ortaya çıkanlar]

### Öneri
[Net, eyleme geçirilebilir. "Bağlıdır" değil.]

### İlk Adım
[Tek bir somut adım.]
```

Chairman: Çoğunluk 4-1 "yap" dese bile 1'in gerekçesi güçlüyse 1'e taraf ol ve açıkla.

---

## Bağlam Hazırlığı

Council öncesi şu dosyaları oku:
- `CLAUDE.md` — proje kimliği + kısıtlar
- `TODO.md` — aktif sprint + backlog
- Son journal: `docs/journal/YYYY-MM-DD.md`
- Varsa ilgili plan: `plans/NN-*.md`

Bu bağlam olmadan danışmanlar genelgeçer tavsiye üretir.

## Sonucu Kaydet

Transcript istenirse `docs/journal/YYYY-MM-DD.md`'ye append et.
