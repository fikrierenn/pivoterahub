# ClientBrain – UI/UX Design Specification (V1)

## 1. Design Philosophy
- Tek bakışta karar verdiren bir danışmanlık arayüzü
- KPI kartları + grafikler + AI yorumları
- Müşterinin gelişim yolculuğunu açıkça gösteren dashboard
- Her müşterinin ayrı “beyni” olacak şekilde bilgi yoğun ama sade ekranlar

## 2. Global Layout

### Sol Menü
- Dashboard
- Clients
- Videos
- Analytics
- Hashtags
- Content Plan
- Settings

### Üst Bar
- Tarih filtresi
- Platform filtresi
- Profil menüsü

---

## 3. Key Screens

### 3.1 Client List Screen
Kolonlar:
- Client name
- Sector
- City
- Last plan date
- Avg video score (last 5)
- Status

Actions:
- Add new client
- Click row → Client Detail

---

### 3.2 Client Detail Screen

#### Left Column (Main)
**Profile Summary Card**
- profile_summary (LLM output)
- goals
- problems
- opportunities

**Weekly Content Plan**
- 7-day list
- “Generate New Plan” button

**Last Session Summary**
- Bullet list summary
- Action items

#### Right Column
**Client Info Card**
- Name, sector, city, IG handle
- Weekly capacity
- Positioning
- Update Profile button

**Quick Actions**
- Add session
- Analyze new video
- Generate growth report

---

## 3.3 Video Analysis Screen

### Upper Section
- Video player (embed)
- Video meta: duration, platform, date

### Tabs

#### Tab: Scores
- Hook score
- Tempo score
- Clarity score
- CTA score
- Visual score
(0–10)

#### Tab: Errors
- List of repeated issues
- Visual tags (hook_zayıf, cta_yok, çok uzun)

#### Tab: Recommendations
- 3 critical improvements
- 3 derivative content ideas
- Minute-based suggestions

---

## 3.4 Growth Dashboard

### Upper: Filters
- Date range
- Platform
- Content type

### KPI Row (4 cards)
- Total videos
- Avg views
- Engagement rate
- Best video score

### Left Side (Performance Graphs)
- Line chart: average views over time
- Line chart: average score over time
- Bar chart: category performance

### Right Side (Hashtag Analytics)
- Table: most used hashtags + avg performance
- List: top 5 performing hashtags
- List: weakest hashtags (“çöp listesi”)

### Bottom: AI Evaluation
- 1–2 paragraf gelişim özeti
- 5 maddelik aksiyon planı

---

## 3.5 Hashtag Analytics Screen
- Hashtag table
- Usage trends
- Engagement heatmap
- Suggested hashtag sets

---

## 3.6 Bio Analysis Screen
- Scraped bio
- Clarity score
- Missing elements
- Suggested bios (short/medium/long)

