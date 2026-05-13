# PivotaraHub — TODO

## BİRLEŞİK ÖNCELİK SIRASI

1. ✅ **[G-01] · Auth Sistemi** — TAMAMLANDI (commit 7aa1e0b) — next-auth v4 + middleware tüm route'ları koruyor (API → 401 JSON, sayfa → /login redirect)
2. **[G-02] · Rate Limiting** — FAZ 1 — `lib/rateLimit.ts` hazır, AI endpoint'lere uygulama bekliyor (analyze, bio-analysis, competitor-analysis, complete-analysis, video-performance, video-analysis, growth-report, land-script, video-metadata, video-production/render)
2b. **[T-02] · `complete-analysis/route.ts` encoding fix** — TS1127 Invalid character hataları, dosya UTF-8 BOM/karakter sorunu
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
