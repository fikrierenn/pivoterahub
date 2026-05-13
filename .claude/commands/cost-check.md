# /cost-check

PivotaraHub AI maliyet analizi. Tüm AI çağrılarını tara.

## Taranan Provider'lar
- Gemini (video analiz, transkripsiyon, müşteri analizi)
- OpenAI (GPT-4o Director, TTS)
- Claude (FrameAgent chat + auto-analysis)
- ElevenLabs (TTS)

## Kontrol Listesi

Her AI çağrısı için:
- [ ] `calculateCost` / maliyet loglama var mı?
- [ ] Doğru model seçilmiş mi? (ucuz alternatif var mı?)
- [ ] Token limiti uygun mu?
- [ ] Gereksiz tekrar çağrı var mı?

## Çıktı

```
💰 Maliyet Analizi — [Tarih]

Provider bazlı kullanım:
- Gemini: [model, tahminî maliyet/çağrı]
- OpenAI: [model, tahminî maliyet/çağrı]
- Claude: [model, tahminî maliyet/çağrı]

Optimizasyon fırsatları:
1. [öneride dosya:satır]
```
