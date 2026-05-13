# Claude Code Akıllı Geliştirme Sistemi — Kurulum ve Kullanım Rehberi

**Hedef kitle:** Projeye yeni katılan geliştiriciler  
**Amaç:** Claude Code ile nasıl çalıştığımızı, neden bu sistemi kurduğumuzu, günlük kullanımın nasıl göründüğünü anlatmak

---

## 1. Bu Sistem Nedir?

Claude Code, Anthropic'in yapay zeka destekli geliştirici asistanıdır. Terminalde çalışır, kod okur/yazar, komut çalıştırır. Ama kutudan çıktığı haliyle sadece "soru-cevap" yapar — her oturumda sıfırdan başlar, projeyi hatırlamaz, hangi kurallar geçerli bilmez.

Bu sistem, Claude'u **kalıcı hafıza + kurallar + iş akışı** ile donatan bir katmandır. Projeye özel:

- Ne yapılacağını (TODO.md, plans/)
- Nasıl yapılacağını (.claude/rules/)
- Kimin ne uzmanlığı olduğunu (.claude/skills/, .claude/agents/)
- Geçmişte ne kararlar alındığını (memory/, docs/journal/)

…bilen bir asistan haline gelir.

---

## 2. Dizin Yapısı ve Ne İşe Yarar

```
proje/
├── CLAUDE.md                    ← Ana beyin — her oturumda ilk okunan
├── TODO.md                      ← Aktif görev listesi
├── plans/                       ← Büyük iş planları
│   └── 01-frameos-merge.md
├── docs/
│   ├── journal/                 ← Günlük oturum notları (otomatik yazılır)
│   │   └── 2026-05-13.md
│   └── ADR/                     ← Mimari kararlar (Architecture Decision Records)
│
└── .claude/
    ├── rules/                   ← Kod kalite + mimari kurallar
    │   ├── session-protocol.md  ← Oturum başı/sonu ritüeli
    │   ├── architecture.md      ← Katman ayrımı kuralları
    │   ├── security-principles.md ← Güvenlik kuralları
    │   ├── ai-conventions.md    ← Hangi AI modeli ne zaman
    │   ├── commit-discipline.md ← Git commit kuralları
    │   ├── plan-first.md        ← Tier sistemi (küçük iş vs büyük plan)
    │   └── nextjs-conventions.md ← Next.js kod standartları
    │
    ├── skills/                  ← Uzmanlık alanları (domain knowledge)
    │   ├── session-handoff/     ← Oturum kapanış ritüeli
    │   ├── plan-tracker/        ← TODO takibi
    │   ├── social-media-analyst/ ← Sosyal medya analizi
    │   ├── ad-copy-expert/      ← Reklam metni yazımı
    │   ├── video-score-engine/  ← Video kalite skoru
    │   └── real-estate-expert/  ← Gayrimenkul video analizi
    │
    ├── agents/                  ← Özel tarama ajanları
    │   ├── api-auth-auditor.md  ← API güvenlik denetimi
    │   ├── code-reviewer.md     ← Kod kalitesi denetimi
    │   └── commit-splitter.md   ← 15+ dosyayı gruplama
    │
    ├── commands/                ← Slash komutlar (/security-check gibi)
    │   ├── security-check.md
    │   └── cost-check.md
    │
    └── hooks/
        └── session-start.sh     ← Oturum açılışında otomatik çalışır
```

---

## 3. Bileşenler Detaylı

### 3.1 CLAUDE.md — Ana Beyin

Her konuşmada Claude'un ilk okuduğu dosya. Şunları içerir:

- **Platform kimliği:** Bu proje ne, ne için var
- **Stack:** Hangi teknolojiler kullanılıyor
- **Kırılmaz kurallar:** API key'ler client'a gitmez, her route auth kontrolü yapar vb.
- **AI pipeline akışı:** Video → hangi model → hangi sırayla
- **Dizin yapısı:** Neyin nerede olduğu
- **Teknik borçlar:** Şu an kırık olan şeyler

**Neden önemli:** CLAUDE.md olmadan Claude her sohbette projeyi baştan öğrenmek zorunda kalır. 15 dakika gider sadece "bu proje ne" diye sormaya.

---

### 3.2 .claude/rules/ — Kurallar

Her dosya belirli bir konuda davranış kuralı içerir. Claude bu dosyaları otomatik okur ve uygular.

**session-protocol.md:**
```
OTURUM BAŞINDA:
1. Son 5 commit'i oku
2. Son journal dosyasını oku
3. TODO.md'nin ilk 5 maddesini oku
4. Uncommitted dosya varsa güvenlik taraması yap

OTURUM SONUNDA:
1. Compliance scan
2. Journal yaz
3. Journal'ı commit et
4. Memory güncelle
```

**plan-first.md — Tier Sistemi:**

| Tier | Ne zaman | Ne yapılır |
|------|---------|-----------|
| 1 — Trivial | 1-2 dosya, çok küçük değişiklik | Direkt yap |
| 2 — Standard | 5 dosyaya kadar, bilinen pattern | TODO'ya ekle, yap |
| 3 — Substantial | 3+ klasör, yeni pattern, schema değişikliği | **Plan yaz, onay al, sonra yap** |

Bu kural "büyük işi planlamadan yapmayı" önler.

**commit-discipline.md:**
- Her commit bir mantıksal değişiklik
- `feat(auth): next-auth kurulumu` gibi format
- 15+ dosya uncommitted olursa `commit-splitter` agent tetiklenir
- Journal commit'i sadece journal dosyasını içerir

---

### 3.3 .claude/skills/ — Uzmanlık Alanları

Her skill bir `SKILL.md` dosyasıdır. İçerisinde:
- **Frontmatter:** `name`, `description`, `triggers` (hangi kelimeler bu skill'i aktive eder)
- **Domain knowledge:** O konuda nasıl düşünülür, hangi framework'ler kullanılır
- **FrameAgent Kullanım Senaryosu:** AI chat asistanının bu skill'i ne zaman ve nasıl kullanacağı

**Örnek — social-media-analyst:**
```yaml
---
name: frameos-social-media-analyst
description: Sosyal medya viral içerik analizi
triggers:
  - "viral"
  - "tiktok"
  - "sosyal medya"
  - "hook"
---
```

Kullanıcı "bu video viral olur mu?" dediğinde → trigger eşleşmesi → bu skill system prompt'a eklenir → Claude sosyal medya uzmanı gibi yanıt verir.

**Skill kategorileri:**

| Kategori | Skill'ler | Ne İçin |
|----------|-----------|---------|
| Oturum yönetimi | session-handoff, plan-tracker | Geliştirici iş akışı |
| Video analiz | social-media-analyst, video-score-engine, ad-copy-expert | Video içerik optimizasyonu |
| Platform | platform-optimizer, content-optimizer | Platforma özel tavsiyeler |
| Sektör | real-estate-expert | Gayrimenkul video analizi |
| Dev tools | frameos-ts-expert, frameos-supabase-expert vb. | Kod yazarken yardım |

---

### 3.4 .claude/agents/ — Özel Tarama Ajanları

Agents, belirli bir görevi yapmak üzere spawn edilen alt Claude örnekleridir. Ana konuşmayı meşgul etmez, paralel çalışabilir.

**api-auth-auditor:**
Tüm `app/api/` route'larını tarar:
- Auth kontrolü var mı?
- API key client-side'a sızıyor mu?
- Input validasyonu (Zod) var mı?
- Rate limiting uygulanmış mı?

Ne zaman tetiklenir: Oturum başında uncommitted dosya varsa, yeni route yazıldığında, `/security-check` komutunda.

**code-reviewer:**
Kod kalite denetimi:
- `any` tip kullanımı var mı?
- AI çıktısı Zod ile validate ediliyor mu?
- Temp dosyalar `finally` bloğunda siliniyor mu?
- `console.log` var mı? (logger kullanılmalı)

**commit-splitter:**
15+ uncommitted dosya olduğunda çalışır. Dosyaları mantıksal gruplara böler ve commit sırası önerir. Örnek:
```
BUCKET 1: feat(auth) — 4 dosya
  lib/authOptions.ts, lib/auth.ts, app/login/page.tsx, middleware.ts

BUCKET 2: feat(agent) — 6 dosya
  lib/frameAgent.ts, lib/skillLoader.ts ...
```

---

### 3.5 .claude/commands/ — Slash Komutlar

Terminal'de `/komut-adı` yazarak çalıştırılır.

**/security-check:**
3 agent'ı paralel çalıştırır: api-auth-auditor + code-reviewer + cost-guardian. Birleşik rapor üretir:
```
🔴 CRITICAL — hemen fix
🟡 WARNING — bu sprint
🟢 INFO — backlog
💰 MALİYET BULGULARI
```

**/cost-check:**
Tüm AI çağrılarını tarar. Maliyet loglaması yapılıyor mu, yanlış model mi kullanılıyor?

---

### 3.6 .claude/hooks/ — Otomatik Çalışan Betikler

**session-start.sh:**
Claude Code açıldığında otomatik çalışır. Ekrana yazdırır:
- Son 5 commit
- Uncommitted dosya sayısı (15+ ise uyarı)
- Son journal dosyasının özeti
- Aktif TODO listesi (ilk 5)
- Kritik borç hatırlatmaları

---

### 3.7 Memory Sistemi

**Konum:** `C:\Users\[kullanıcı]\.claude\projects\[proje-slug]\memory\`

Bu, Claude'un **oturumlar arası** hafızasıdır. Dosya tabanlı çalışır.

**MEMORY.md** — Index dosyası. Her memory dosyasına pointer:
```markdown
- [Project Overview](project_overview.md) — stack, aktif planlar
- [User Profile](user_profile.md) — geliştirici profili
- [Feedback: Testing](feedback_testing.md) — test yaklaşımı kuralları
```

**Memory türleri:**

| Tür | Ne zaman yazılır | Örnek |
|-----|-----------------|-------|
| `user` | Geliştirici hakkında bir şey öğrenilince | "Türkçe konuşuyor, Next.js biliyor" |
| `feedback` | Bir yaklaşım düzeltilince veya onaylanınca | "Mock DB kullanma, gerçek DB'ye bağlan" |
| `project` | Önemli proje kararı alınınca | "Auth için next-auth seçildi, Supabase Auth değil" |
| `reference` | Dış sisteme pointer | "Buglar Linear'da PIVT projesinde" |

**Neden önemli:** Memory olmadan Claude her sohbette aynı hataları tekrarlayabilir. "DB mock'lama" dedikten sonra 3 gün sonra yeni oturumda yine mock'lar. Memory ile hatırlar.

---

### 3.8 docs/journal/ — Oturum Notları

Her oturum sonunda `session-handoff` skill'i tetiklendiğinde `docs/journal/YYYY-MM-DD.md` dosyası oluşturulur:

```markdown
# 2026-05-13 — Auth sistemi kurulumu

## Tamamlananlar
- lib/authOptions.ts oluşturuldu
- middleware.ts eklendi (tüm route'lar korumalı)

## Yarım Kalanlar
- Login sayfası tasarımı bitmedi → app/login/page.tsx:45

## Kararlar
- next-auth v4 seçildi (v5 beta kararsız)

## Bilinen Borçlar
- Rate limiting henüz yok (G-02)

## Yarına Başlangıç
1. Login sayfasını bitir
2. Tüm API route'larına auth ekle
```

Bu dosya git'e commit edilir. Yani her oturumun geçmişi kalıcıdır.

---

### 3.9 plans/ — Büyük İş Planları

Tier 3 işler (büyük değişiklikler) için yazılır. Onay alındıktan sonra uygulanır.

**Şablon:**
```markdown
# Plan 01 — [Başlık]

**Durum:** Taslak | Onaylı | Tamamlandı

## Problem
## Kapsam (etkilenen dosyalar + out-of-scope)
## Alternatifler (5 farklı bakış açısı)
## Riskler
## Done Criteria (kontrol edilebilir maddeler)
## Adım Sırası
## Rollback (nasıl geri alınır)
```

---

## 4. Günlük Kullanım Akışı

### Sabah — Oturum Açılışı

Claude Code projeyi açtığında `session-start.sh` hook'u çalışır. Claude şunları yapar:
1. Son journal'ı okur → dün ne bıraktın
2. TODO.md'yi okur → bugün ne yapılacak
3. Uncommitted dosya varsa güvenlik taraması başlatır

Sen sadece "günaydın" yazabilirsin, gerisini yapar.

### Gün İçi

**Küçük iş (Tier 1-2):**
```
Sen: "Sidebar'daki hardcoded müşteri sayısını gerçek Supabase sorgusuna çevir"
Claude: Direkt yapar, commit atar
```

**Büyük iş (Tier 3):**
```
Sen: "Auth sistemi ekleyelim"
Claude: "Bu Tier 3, önce plan yazayım" → plans/01-auth.md → "Onaylıyor musun?"
Sen: "Evet" → Claude uygulamaya başlar
```

**Güvenlik kontrolü:**
```
Sen: /security-check
Claude: 3 agent paralel çalışır → rapor gelir
```

### Akşam — Oturum Kapanışı

```
Sen: "iyi geceler" veya "handoff"
Claude:
  1. Compliance scan (yeni yazılan kod güvenli mi?)
  2. Journal yazar (docs/journal/2026-05-13.md)
  3. Journal'ı commit eder
  4. Memory günceller
  5. Özet gösterir: "3 madde tamamlandı, 1 yarım kaldı"
```

---

## 5. Yeni Projeye Kurulum

### Adım 1 — Klasörleri Oluştur

```powershell
mkdir .claude\rules, .claude\skills, .claude\agents, .claude\commands, .claude\hooks
mkdir docs\journal, docs\ADR, plans
```

### Adım 2 — CLAUDE.md Yaz

Şablonu doldur:
```markdown
# [Proje Adı] — Claude Çalışma Rehberi

## 1. Platform Kimliği
## 2. Stack
## 3. Değişmez Kurallar
## 4. Dizin Yapısı
## 5. Teknik Borçlar
```

### Adım 3 — Temel Rules Kopyala

Bu projeden (`.claude/rules/`) kopyala ve projeye göre düzenle:
- `session-protocol.md` — memory path'i güncelle
- `architecture.md` — kendi dizin yapınla güncelle
- `security-principles.md` — kullandığın API key'leri belirt
- `commit-discipline.md` — scope'ları güncelle
- `plan-first.md` — neredeyse değişmez

### Adım 4 — session-start.sh Güncelle

```bash
# Kritik borçlar kısmını projeye göre değiştir:
echo "  G-01: [projenizin kritik borcu]"
```

### Adım 5 — Memory Klasörü Oluştur

```powershell
# Windows'ta:
$project = "D--Dev-YeniProje"  # path'teki \ yerine -- kullan
New-Item -Path "C:\Users\[kullanıcı]\.claude\projects\$project\memory" -ItemType Directory -Force
```

İçine `MEMORY.md` ve `project_overview.md` yaz.

### Adım 6 — TODO.md Başlat

```markdown
# [Proje] — TODO

## BİRLEŞİK ÖNCELİK SIRASI

1. **[G-01] · [İlk Kritik Borç]** — ...

## TAMAMLANANLAR
```

### Adım 7 — İlk Oturumu Test Et

Claude Code'u aç, "oturum başı kontrol yap" de. Şunları yapmalı:
- Son commit'leri listelemeli
- TODO.md'yi okumalı
- Journal klasörünü kontrol etmeli

---

## 6. Sık Yapılan Hatalar

**❌ "CLAUDE.md'yi güncel tutmadık"**  
Proje değiştikçe CLAUDE.md güncellenmezse Claude eski bilgilerle çalışır.  
✅ Her büyük mimari değişiklikte CLAUDE.md'yi güncelle.

**❌ "Session handoff'u atladık"**  
Handoff olmadan journal yazılmaz, memory güncellenmez, yarım işler kaybolur.  
✅ Her gün kapanışta "iyi geceler" veya "handoff" yaz.

**❌ "Tier 3 işi plansız başladık"**  
Büyük iş doğrudan yaptırıldı, ortada bırakıldı veya yanlış gitti.  
✅ 3+ klasöre dokunan her iş için önce plan → onay → uygulama.

**❌ "Memory path'i yanlış girdik"**  
Farklı bilgisayarda veya farklı kullanıcıda memory çalışmaz.  
✅ `session-protocol.md`'deki memory path'i her kurulumda güncelle.

**❌ "15 dosya kuralını görmezden geldik"**  
Çok fazla uncommitted dosya birikti, ne neyin commit'i belli değil.  
✅ 15 dosya eşiği görünce dur, `commit-splitter` agent'ı çalıştır.

---

## 7. Özet — Neden Bu Sistemi Kullanıyoruz?

| Problem | Çözüm |
|---------|-------|
| Claude her sohbette sıfırdan başlıyor | CLAUDE.md + Memory sistemi |
| "Bunu nasıl yapmalıyız" her seferinde tartışılıyor | .claude/rules/ — bir kez karar, hep geçerli |
| Oturum kapandığında ne yapıldığı unutuluyor | docs/journal/ + session-handoff |
| Büyük işler planlanmadan başlanıyor | plan-first.md + plans/ |
| Güvenlik açıkları fark edilmeden geçiyor | api-auth-auditor agent |
| Farklı geliştiriciler farklı standartlar uyguluyor | .claude/rules/ herkese aynı kuralı uygular |
| AI model seçimi rastgele yapılıyor | ai-conventions.md — görev başına model tablosu |

---

*Bu döküman `docs/CLAUDE_WORKFLOW_GUIDE.md` konumundadır. Güncel tutmak için her büyük sistem değişikliğinde güncelle.*
