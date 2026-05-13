# /security-check [kapsam]

PivotaraHub güvenlik denetimi. 3 paralel agent ile kapsamlı tarama.

## Kullanım
```
/security-check                    # Tüm API route'ları
/security-check app/api/clients/   # Belirli klasör
/security-check HEAD~1..HEAD       # Son commit
```

## Adım 1 — Kapsam

Kapsam verilmediyse: `app/api/**` + `lib/**`

## Adım 2 — 3 Paralel Agent

**Agent 1: api-auth-auditor**
- Auth, key güvenliği, Zod validasyon

**Agent 2: code-reviewer**
- TypeScript katılığı, cleanup, logging

**Agent 3: openai-cost-guardian** (AI çağrısı olan dosyalarda)
- Maliyet loglama, model seçimi

## Adım 3 — Rapor

```
🔒 PivotaraHub Güvenlik Raporu — [Tarih]

🔴 CRITICAL (hemen fix)
[dosya:satır — sorun — öneri]

🟡 WARNING (bu sprint)
[bulgular]

🟢 INFO (backlog)
[bulgular]

💰 MALİYET BULGULARI
[cost-guardian bulguları]

ÖZET: X critical, Y warning, Z info
```

## Adım 4 — Karar

CRITICAL var mı → "Şimdi fix edelim mi?" sor.
