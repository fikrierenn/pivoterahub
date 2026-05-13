# Dosya Boyutu Disiplini

## Eşikler

| Dosya tipi | UYARI eşiği | BÖLME zorunlu |
|------------|-------------|---------------|
| Component / View (tsx, cshtml, vue) | 250 satır | 400 satır |
| Servis / İş mantığı (.ts, .cs, .py) | 300 satır | 500 satır |
| API route / Controller | 200 satır | 350 satır |
| Util / helper | 150 satır | 250 satır |
| Config / template (JSON) | — | 1000 satır |
| Migration | — | (eşiksiz, atomik kalmalı) |

> Eşik **gerekçeli istisnası** olabilir — kural dosyasına not düş (örn: `lib/llm/prompts.ts` 800 satır → "prompt sabit, bölmek anlam taşımaz").

## Bölme Stratejileri

### Component dosyası büyüdüyse
1. **Alt component çıkar** — UI parçası tekrar kullanılıyor mu? Kullanılmıyorsa bile okunabilirlik için ayır.
2. **Custom hook** — state mantığını `useFeatureName.ts`'ye taşı.
3. **Type'ları ayır** — `Component.types.ts` dosyası.
4. **Constants ayır** — `Component.constants.ts`.

### Servis dosyası büyüdüyse
1. **Tek sorumluluk başına dosya** — `userService.ts` 600 satırsa → `userQueries.ts`, `userMutations.ts`, `userValidation.ts`.
2. **Pure fonksiyonları utils'e çıkar**.
3. **Class büyükse** → composition pattern, alt servislere böl.

### API route büyüdüyse
1. **Handler logic'i servise taşı** — route sadece auth/validation/response.
2. **Validation şemalarını ayır** — `schemas/[route].ts`.

## Tetikleyici Pattern

Dosya 400 satıra yaklaştığında Claude şunu yapar:
1. Mevcut dosyada **logical groupings** belirle (yorumlardan, fonksiyon kümelerinden)
2. Bölme planını **kullanıcıya sun** — onaysız bölmez
3. Onay sonrası: yeni dosyaları yarat, eski dosyayı re-export hub'ı yap (backwards compat)

## Anti-Pattern

- ❌ Tek satır eklemek için "zaten 800 satır, sorun değil"
- ❌ Plan yapmadan dosyayı parçala (referans kırılır)
- ❌ "Bölmeye gerek yok" gerekçesiz savunma
- ❌ İstenmedikçe drive-by refactor

## Ölçüm

Periyodik tarama:
```bash
# 400+ satır dosyalar
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.cs" -o -name "*.py" \) \
  -not -path "./node_modules/*" -not -path "./.next/*" \
  -exec wc -l {} \; | awk '$1 > 400' | sort -rn | head -20
```

Çıktı periyodik olarak `TODO.md` backlog'a yazılır — bölünmesi gereken dosyalar listesi.
