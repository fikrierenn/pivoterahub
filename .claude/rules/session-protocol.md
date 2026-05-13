# PivotaraHub — Oturum Protokolü

## OTURUM BAŞI (İlk Yanıttan Önce — ZORUNLU)

Her oturum başında şu 4 adım atlanmaz:

### Adım 1 — Git Durumu Oku
```powershell
git log --oneline -5
git status --porcelain | measure-object -line  # kaç dosya uncommitted
```

### Adım 2 — Son Journal'ı Oku
`docs/journal/` altındaki en son dosyayı oku. Yarım kalan işleri tespit et.

### Adım 3 — TODO.md Aktif Kısım Oku
`TODO.md` → "BİRLEŞİK ÖNCELİK SIRASI" bölümü, ilk 5 madde.

### Adım 4 — Pre-session Scan (uncommitted > 0 ise)
Uncommitted dosya varsa → `api-auth-auditor` + `code-reviewer` agent'larını paralel çalıştır.
Bulgu varsa önce fix → commit, sonra devam.

---

## OTURUM ORTASI

- **15 dosya eşiği:** uncommitted > 15 → yeni iş yasak, önce `commit-splitter` agent
- **Kural değişikliği:** Konuşmada kalmasın → hemen `.claude/rules/*.md`'ye yaz
- **Mimari karar:** `docs/ADR/NNN-*.md` yaz
- **3+ adımlı plan:** TodoWrite + TODO.md senkron (bkz. `plan-first.md`)
- **Yeni API route:** Hemen `pivoterahub-security` skill tetikle

---

## OTURUM SONU — Handoff Ritüeli

**Tetikler:** "iyi geceler", "handoff", "bitti", "yarın devam", "kapanıyor"

### Adım 1 — Compliance Scan
Bu oturumda değiştirilen dosyalara → `api-auth-auditor` + `code-reviewer` paralel.
Bulgu varsa: CRITICAL/HIGH → fix + commit. MEDIUM/LOW → journal'a "bilinen borç" kaydı.

### Adım 2 — Journal Yaz
`session-handoff` skill ile `docs/journal/YYYY-MM-DD.md` yarat/append:

```markdown
# YYYY-MM-DD — [Ana konu başlığı]

## Tamamlananlar
- [dosya:satır referanslı]

## Yarım Kalanlar
- [nereden devam, hangi dosya]

## Kararlar
- [ADR'ye gidecek mi?]

## Bilinen Borçlar
- [MEDIUM/LOW bulgular]

## Yarına Başlangıç
1. [Somut ilk adım]
2. [İkinci adım]
```

### Adım 3 — Auto-commit Journal
```powershell
git add docs/journal/$(Get-Date -Format 'yyyy-MM-dd').md
git commit -m "docs(journal): $(Get-Date -Format 'yyyy-MM-dd') handoff"
```
Sadece journal dosyası commit edilir. Diğer dosyalara dokunma.

### Adım 4 — Memory Güncelle
`C:\Users\fikri.eren\.claude\projects\D--Dev-pivoterahub\memory\` altına:
- Düzeltilen yaklaşımlar → `feedback_*.md`
- Devam eden iş hedefleri → `project_overview.md` güncelle
- Yeni referanslar → `reference_*.md`

### Adım 5 — Özet Göster
5-10 satır: tamamlanan sayı, yarım kalan, commit durumu, yarına başlangıç noktası.

---

## BAĞLAM YÖNETİMİ

| Operasyon | Ne zaman | Dikkat |
|---|---|---|
| `/compact` | %60+ context, aynı task | Focus instructions ekle |
| `/clear` | Task tamamen değişti | Yeni oturum kuralları aktar |

**Compact sonrası hayatta kalan:**
- ✅ `CLAUDE.md` (re-inject)
- ✅ `.claude/rules/*.md` (`paths:` olmayan)
- ✅ Memory (ilk 200 satır)
- ❌ Konuşma geçmişi (özetlenir)

**Kritik kural:** `.claude/rules/` dosyaları `paths:` scopelamadan yaz — compact sonrası kaybolmasın.

---

## SUBAGENT KULLANIM KURALI

Manuel iş → subagent/skill **istisnai**, subagent/skill → **default**.

| İş | Yöntem |
|---|---|
| 5+ dosya okuma | Explore subagent |
| Güvenlik tarama | `api-auth-auditor` agent |
| Maliyet analizi | `openai-cost-guardian` agent |
| 15+ dosya commit | `commit-splitter` agent |
| Tek dosya edit | Doğrudan Edit tool |
