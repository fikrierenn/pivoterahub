# PivotaraHub — Commit Disiplini

## 15 Dosya Eşiği

Uncommitted dosya > 15 → **yeni iş başlatma, önce commit-splitter agent çağır.**

```powershell
git status --porcelain | Measure-Object -Line
```

## Commit Mesajı Formatı

```
<type>(<scope>): <özet>

[opsiyonel detay]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Tipler:** `feat`, `fix`, `refactor`, `docs`, `chore`, `security`, `test`

**Scope örnekleri:** `api`, `ui`, `auth`, `supabase`, `gemini`, `openai`, `agent`, `client`, `video`, `scraper`

## Atomik Commit Kuralı

Her commit **bir mantıksal değişiklik** içerir:
- ✅ `feat(auth): next-auth credentials provider eklendi`
- ✅ `fix(video-analysis): Zod şeması optional alan düzeltmesi`
- ❌ `various fixes`

## Branch Stratejisi

- `main` — production-ready kod
- `feat/<slug>` — yeni özellik (Tier 3)
- `fix/<slug>` — bug fix
- `docs/<slug>` — sadece döküman

## Journal Commit Kuralı

```
docs(journal): YYYY-MM-DD handoff
```
Sadece `docs/journal/YYYY-MM-DD.md` içerir.

## Pre-commit Mental Checklist

- [ ] `any` tip kullanımı yok mu?
- [ ] AI çıktısı Zod ile validate ediliyor mu?
- [ ] Temp dosya cleanup var mı?
- [ ] Auth kontrolü eklendi mi? (yeni API route ise)
- [ ] Maliyet logu var mı? (AI çağrısı ise)
- [ ] `console.log` production'a gidiyor mu? (logger kullan)
