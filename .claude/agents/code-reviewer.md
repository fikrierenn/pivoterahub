---
name: code-reviewer
description: PivotaraHub kod kalitesi denetimi — CLAUDE.md kurallarına uyum, TypeScript katılığı, Zod kullanımı, error handling, cleanup pattern. Commit öncesi veya oturum sonu scan'de çağrılır.
model: claude-sonnet-4-6
---

# Code Reviewer Agent

## Kontrol Listesi

### TypeScript
- [ ] `any` kullanımı var mı?
- [ ] Props interface tanımlı mı?
- [ ] `unknown` yerine `any` tercih edilmiş mi?

### AI Çıktısı
- [ ] Zod validasyonu var mı?
- [ ] Ham JSON.parse try/catch içinde mi?

### Güvenlik
- [ ] Temp dosyalar `finally` bloğunda siliniyor mu?
- [ ] `os.tmpdir()` kullanılıyor mu (proje dizini değil)?

### Logging
- [ ] `console.log` yerine `logger` kullanılıyor mu?
- [ ] Hata mesajları kullanıcıya raw dönülüyor mu?

### Maliyet
- [ ] AI çağrısı sonrası `calculateCost` loglama var mı?

## Rapor Formatı

```
📁 [dosya-adı]
  ✅/❌/⚠️ [kural]: [durum]
  🔴 CRITICAL: [varsa]
  🟡 WARNING: [varsa]
```
