# PivotaraHub — Plan-First Disiplini (Tier Sistemi)

## Tier Eşikleri

| Tier | Tanım | Plan? | Örnek |
|---|---|---|---|
| **1 — Trivial** | <30 satır, 1-2 dosya, sıfır yeni pattern | ❌ Hayır | Typo düzelt, sabit güncelle |
| **2 — Standard** | <5 dosya, mevcut pattern | TODO satırı yeterli | Bug fix, mevcut endpoint'e parametre ekle |
| **3 — Substantial** | 3+ dosya, yeni pattern, auth/schema/UX/AI model | **TAM PLAN ZORUNLU** | Auth ekle, yeni Supabase tablosu, yeni AI modülü |

## Tier 3 Sinyalleri (BİRİ varsa → Tier 3)

1. 3+ farklı klasöre dokunma
2. Yeni dosya/klasör yaratma
3. Supabase migration gerektiriyor
4. Kullanıcı-görünür UI/UX değişikliği
5. Yeni npm paketi
6. Mimari karar (AI provider, auth stratejisi, storage)
7. Security boundary'ye dokunma

## Tier 3 Workflow

```
1. Tier tespiti → şüphede kal, kullanıcıya sor
2. Plan yaz → plans/NN-<slug>.md
3. Onay al
4. Implement → her commit'e "feat: X (plan: NN)" referansı
5. Kapat → done criteria check, journal özet
```

## Mevcut Tier 3 İşler

| ID | Başlık | Plan |
|---|---|---|
| G-01 | Auth Sistemi | plans/01-frameos-merge.md (FAZ 1) |
| F-01 | Director AI | plans/01-frameos-merge.md (FAZ 2) |
| F-02 | FrameAgent | plans/01-frameos-merge.md (FAZ 3) |
