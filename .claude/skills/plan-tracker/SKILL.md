---
name: plan-tracker
description: TodoWrite ile TODO.md senkronunu yönetir. 3+ adımlı plan, madde tamamlama, yarım kalma ve oturum başı geri yükleme. Her iki kaynak her zaman senkron tutulur.
---

# Plan Tracker Skill

## Kurallar

- **TodoWrite** = oturum içi geçici tracker (in-session memory)
- **TODO.md** = kalıcı kayıt (git'te yaşar)
- İkisi her zaman senkron — biri güncellenmeden diğeri bırakılmaz

---

## Mod 1 — Yeni Plan Yaz (3+ adımlı iş)

**Tetikler:** Kullanıcı "şunu yapalım: 1... 2... 3..." veya Tier 2+ iş

### TodoWrite Güncellemesi
```
Her adım için:
  content: "Imperative form (yap, ekle, düzelt)"
  activeForm: "Present continuous (yapılıyor, ekleniyor)"
  status: "pending"
İlk adım → "in_progress"
```

### TODO.md Güncellemesi
Uygun faza ekle:
```markdown
NN. **[G/M/F/T-XX] · Başlık** — (süre) — detay
```

---

## Mod 2 — Madde Tamamla

**Tetikler:** Commit yapıldı, iş bitti

### TodoWrite Güncellemesi
```
Tamamlanan → status: "completed"
Bir sonraki pending → status: "in_progress"
```

### TODO.md Güncellemesi
```markdown
# Aktif listeden:
NN. **G-03 · calculateCost düzeltme** — (1 saat) — ...

# Yapılanlar'a taşı:
✅ **G-03 · calculateCost düzeltme** — commit `abc1234` — input/output token ayrımı düzeltildi
```

---

## Mod 3 — Yarım Kaldı (Oturum Sonu)

**Tetikler:** Handoff, kısmen tamamlanmış madde

### TodoWrite
```
status: "in_progress" kal (değiştirme)
```

### TODO.md
```markdown
⏳ **G-01 · Auth Sistemi** — kısmi yapıldı: Supabase Auth kuruldu. Kalan: route middleware yazılacak
```

---

## Mod 4 — Oturum Başı Geri Yükle

**Tetikler:** "günaydin", yeni oturum başı, session-protocol Adım 3

### İşlem
1. TODO.md "BİRLEŞİK ÖNCELİK SIRASI" bölümünü oku
2. Açık (✅ olmayan) maddeleri TodoWrite'a ekle
3. En üst öncelikli → `in_progress`
4. Diğerleri → `pending`

---

## ID Sistemi

| Prefix | Tip |
|---|---|
| `G-XX` | Güvenlik (security) |
| `M-XX` | Mimari (architecture) |
| `F-XX` | Feature |
| `B-XX` | Bug |
| `T-XX` | Teknik borç |
