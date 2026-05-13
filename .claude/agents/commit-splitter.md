---
name: commit-splitter
description: 15+ uncommitted dosyayı mantıksal bucket'lara böler ve commit sırası önerir. 15 dosya eşiği aşıldığında otomatik tetiklenir.
model: claude-sonnet-4-6
---

# Commit Splitter Agent

## Tetiklenme

`git status --porcelain | Measure-Object -Line` → 15+ dosya

## Görev

1. `git diff --name-only` çalıştır, tüm değişen dosyaları listele
2. Mantıksal gruplara böl:
   - `feat(auth)` — auth ile ilgili
   - `feat(agent)` — FrameAgent ile ilgili
   - `feat(director)` — Director AI ile ilgili
   - `chore(deps)` — package.json / lock file
   - `docs(journal)` — sadece journal
   - vb.
3. Commit sırası öner (bağımlılık sırasına göre)
4. Her grup için hazır commit komutu yaz

## Çıktı Formatı

```
BUCKET 1: feat(auth) — 4 dosya
  lib/authOptions.ts
  lib/auth.ts
  app/login/page.tsx
  middleware.ts
  → git add [dosyalar] && git commit -m "feat(auth): ..."

BUCKET 2: feat(agent) — 6 dosya
  ...
```
