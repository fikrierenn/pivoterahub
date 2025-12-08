# ClientBrain – Development Tasks (V1)

## 1. Infrastructure & Setup
- [ ] Create Supabase project
- [ ] Create all tables (clients, videos, video_scores…)
- [ ] Create migrations
- [ ] API routing structure (Next.js /api)

---

## 2. Client Creation Flow
- [ ] UI: Client intake form
- [ ] API: /api/create-client
- [ ] Write intake data to DB
- [ ] Generate profile_summary via OpenAI
- [ ] Save sector templates

---

## 3. Meeting Summary System
- [ ] UI: Add Session screen
- [ ] API: /api/new-session
- [ ] LLM: 10 maddelik özet oluşturma
- [ ] Save session summary and action items
- [ ] Optional: Update profile summary

---

## 4. Video Analysis Pipeline
- [ ] UI: Upload or paste video link
- [ ] Integrate Whisper transcript
- [ ] Extract visual features (duration, tempo)
- [ ] LLM: Score the video
- [ ] Save video_scores
- [ ] Save video_stats (if metrics provided manually)

---

## 5. Growth Analytics
- [ ] API: /api/growth-report
- [ ] Calculate last 10 video metrics
- [ ] Calculate category performance
- [ ] Calculate regression
- [ ] LLM comments + action list

---

## 6. Hashtag Analytics
- [ ] Extract hashtags from video captions
- [ ] Update hashtag_stats table
- [ ] Build hashtag performance queries
- [ ] UI table for performance
- [ ] Top & worst hashtag lists

---

## 7. Content Plan Generator
- [ ] /api/generate-plan
- [ ] LLM prompt for 7-day plan
- [ ] UI to display the plan
- [ ] UI button: regenerate plan

---

## 8. Bio Scraper
- [ ] Selenium headless scraper
- [ ] Instagram/TikTok/YouTube bio extraction
- [ ] Cache in Redis
- [ ] AI bio analysis (/api/ai/bio-analysis)
- [ ] Save to client_profile_summary

---

## 9. Client Dashboard
- [ ] KPI cards
- [ ] Growth charts
- [ ] Hashtag graphs
- [ ] AI comment panel
- [ ] Navigation links

---

## 10. Final Polishing
- [ ] Error handling
- [ ] Loading states
- [ ] UX clean-up
- [ ] Environment variables
- [ ] Deployment (Vercel or Supabase + Edge Functions)

