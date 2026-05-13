# PivotaraHub — TODO

## BİRLEŞİK ÖNCELİK SIRASI

1. ✅ **[G-01] · Auth Sistemi** — TAMAMLANDI (commit 7aa1e0b) — next-auth v4 + middleware tüm route'ları koruyor (API → 401 JSON, sayfa → /login redirect)
2. ✅ **[G-02] · Rate Limiting** — TEMEL TAMAM (commit pending) — `lib/rateLimitGuard.ts` helper + 5 ana endpoint (video-analysis, growth-report, bio-analysis, competitor-analysis, video-performance) ANALYZE/DEFAULT preset ile korumalı
2b. **[G-02 KALAN]** — Rate limit eklenmemiş AI endpoint'leri (sonradan): analyze (boş dosya), complete-analysis (T-02 sonrası), land-script, video-metadata, video-production/render, video-analysis/regenerate-plans
2c. **[T-02] · complete-analysis tamir** — undefined `profile` değişkeni, eksik `scrapeCompetitors` export, encoding kısmen düzeldi (`5fc0648`) ama fonksiyonel hatalar kaldı
2d. **[T-03] · competitor-analysis tip uyumu** — `CompetitorData.error` yok, `CompetitorData[]` `CompetitorProfile[]`'a atanamıyor (3 dosyada hata)
2e. **[T-04] · video-analysis funnel_stage tip** — `'middle' | 'retention'` değerleri tip dışında
3. **[F-01] · Director AI** — FAZ 2 — GPT-4o Vision sinematik analiz, scene_director/script_rewrite/full_rewrite
4. **[F-02] · FrameAgent** — FAZ 3 — Claude chat asistanı, skill sistemi, auto-analysis
5. **[M-01] · Supabase Migration** — FAZ 4 — cinematic_analysis sütunu, agent_analyses tablosu
6. **[T-01] · Sidebar hardcoded istatistikler** — Gerçek Supabase sorgusu

## BACKLOG

- **Büyük dosya bölme** (file-size-discipline.md, 400+ satır → bölünmeli):
  - `components/VideoAnalysisForm.tsx` (664 satır) — alt component + hook ayır
  - `lib/llm/video-analysis.ts` (613 satır) — prompt'ları ayrı dosyaya çıkar
  - `app/clients/[id]/page.tsx` (556 satır) — client detail view, sekme bazında ayır
  - `app/clients/[id]/analysis/page.tsx` (469 satır) — analiz bölümlerini component'lere böl
  - `app/videos/page.tsx` (411 satır) — filter/list/grid component'leri ayır
- Python scraper error handling güçlendir
- Video sayfası Director + Agent sekmeleri (FAZ 4)
- Zod şemalarını tüm Gemini çıktılarına ekle (şu an kısmi)
- `npm run build` — TypeScript strict mode hataları temizle

## TAMAMLANANLAR

- ✅ `.claude/` workflow sistemi kuruldu (CLAUDE.md, rules, skills, agents, hooks, memory)
- ✅ `plans/01-frameos-merge.md` — merge planı yazıldı
