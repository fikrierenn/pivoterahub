---
name: session-handoff
description: PivotaraHub oturum sonu ritüeli — journal yazar, compliance scan yapar, memory günceller, auto-commit atar. "iyi geceler", "handoff", "bitti", "yarın devam" tetikler.
triggers:
  - "iyi geceler"
  - "handoff"
  - "bitti"
  - "yarın devam"
  - "kapanıyor"
---

# Session Handoff Skill

## Adım 1 — Oturum Özeti

```powershell
git diff --name-only HEAD
```

- Hangi dosyalar değiştirildi?
- Hangi TODO maddeleri tamamlandı?
- Yarım ne kaldı?

## Adım 2 — Compliance Scan

`api-auth-auditor` + `code-reviewer` paralel çalıştır.
- CRITICAL/HIGH → hemen fix, commit
- MEDIUM/LOW → journal'a "Bilinen Borçlar" yaz

## Adım 3 — Journal Dosyası

`docs/journal/YYYY-MM-DD.md`:

```markdown
# YYYY-MM-DD — [Bu oturumun ana konusu]

## Tamamlananlar
- [dosya:satır referanslı]

## Yarım Kalanlar
- [nereden devam, hangi dosya]

## Kararlar
- [ADR'ye gidecek mi?]

## Bilinen Borçlar (MEDIUM/LOW)
- ...

## Yarına Başlangıç
1. [Somut ilk adım]
2. [İkinci adım]
```

## Adım 4 — Auto-commit Journal

```powershell
$date = Get-Date -Format 'yyyy-MM-dd'
git add "docs/journal/$date.md"
git commit -m "docs(journal): $date handoff"
```

## Adım 5 — Memory Güncelle

`C:\Users\fikri.eren\.claude\projects\D--Dev-pivoterahub\memory\`
- Yeni feedback → `feedback_<konu>.md`
- Proje durumu → `project_overview.md` güncelle

## Adım 6 — Özet

```
✅ HANDOFF TAMAMLANDI — YYYY-MM-DD

📋 Bu Oturum:
  - Tamamlanan: X madde
  - Commit: Y commit
  - Yarım kalan: N madde

📓 Journal: docs/journal/YYYY-MM-DD.md

⏭️ Yarına:
  1. [İlk adım]
  2. [İkinci adım]
```
