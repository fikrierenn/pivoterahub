# PivotaraHub — TODO

## BİRLEŞİK ÖNCELİK SIRASI

1. **[G-01] · Auth Sistemi** — FAZ 1 — next-auth CredentialsProvider, middleware, login sayfası, tüm route'lara auth ekle
2. **[G-02] · Rate Limiting** — FAZ 1 — rateLimit.ts, tüm AI endpoint'lere uygula
3. **[F-01] · Director AI** — FAZ 2 — GPT-4o Vision sinematik analiz, scene_director/script_rewrite/full_rewrite
4. **[F-02] · FrameAgent** — FAZ 3 — Claude chat asistanı, skill sistemi, auto-analysis
5. **[M-01] · Supabase Migration** — FAZ 4 — cinematic_analysis sütunu, agent_analyses tablosu
6. **[T-01] · Sidebar hardcoded istatistikler** — Gerçek Supabase sorgusu

## BACKLOG

- Python scraper error handling güçlendir
- Video sayfası Director + Agent sekmeleri (FAZ 4)
- Zod şemalarını tüm Gemini çıktılarına ekle (şu an kısmi)
- `npm run build` — TypeScript strict mode hataları temizle

## TAMAMLANANLAR

- ✅ `.claude/` workflow sistemi kuruldu (CLAUDE.md, rules, skills, agents, hooks, memory)
- ✅ `plans/01-frameos-merge.md` — merge planı yazıldı
