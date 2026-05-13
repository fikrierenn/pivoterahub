# Design Document

## Overview

AI analiz sistemi şu anda 4 aşamalı analiz üretiyor ancak HTML response'u doğru şekilde parse edilmiyor. Sadece ilk bölüm kaydediliyor, diğer bölümler kaybolmakta. Bu tasarım, AI'dan dönen HTML response'unu doğru bölümlere ayırarak her analiz türünü ayrı ayrı kaydetmeyi sağlayacak.

## Architecture

### Current Flow (Problematic)
```
AI Analysis → Single HTML String → Only First Section Saved → Other Sections Lost
```

### New Flow (Solution - Option 1: Structured AI Response)
```
AI Analysis → Structured JSON Response → Direct Database Mapping → Individual Records
```

### Alternative Flow (Option 2: HTML Parsing)
```
AI Analysis → HTML Response → HTML Parser → Section Extraction → Individual Database Records
```

**Recommended Approach:** Option 1 - Request structured response from AI directly

## Components and Interfaces

### 1. HTML Parser Service
**Location:** `lib/parsers/analysis-parser.ts`

```typescript
interface AnalysisSection {
  title: string;
  content: string;
  htmlContent: string;
}

interface ParsedAnalysis {
  professionalAnalysis: {
    current_level_assessment: string;
    main_bottlenecks: string;
    strategic_mistakes: string;
    strengths: string;
    weaknesses: string;
    realistic_growth_potential: string;
  };
  profileCard: {
    strategy: string;
    target_audience: string;
    content_suggestions: string;
    quick_wins: string;
  };
  developmentPlan: {
    thirty_day_plan: string;
    ninety_day_plan: string;
    goals: string;
    metrics: string;
  };
  presentation: {
    executive_summary: string;
    recommendations: string;
    expected_results: string;
    investment_required: string;
  };
}

class AnalysisParser {
  static parseHTML(htmlContent: string): ParsedAnalysis
  static extractSection(html: string, sectionTitle: string): string
  static cleanHTML(content: string): string
}
```

### 2. Updated LLM Services (Preferred Approach)
**Files to modify:**
- `lib/llm/professional-analysis.ts`
- `lib/llm/development-plan.ts` 
- `lib/llm/client-presentation.ts`

**Strategy:** Modify AI prompts to return structured JSON instead of single HTML block.

```typescript
// Example: Professional Analysis Response
interface ProfessionalAnalysisResponse {
  current_level_assessment: string; // HTML content
  main_bottlenecks: string; // HTML content  
  strategic_mistakes: string; // HTML content
  strengths: string; // HTML content
  weaknesses: string; // HTML content
  realistic_growth_potential: string; // HTML content
}
```

**AI Prompt Update:**
```
Return response as JSON with these exact fields:
{
  "current_level_assessment": "<h3>Mevcut Seviye</h3><p>...</p>",
  "main_bottlenecks": "<h3>Ana Darboğazlar</h3><ul>...</ul>",
  "strengths": "<h3>Güçlü Yanlar</h3><ul>...</ul>",
  // etc...
}
```

### 3. Database Schema Updates
Current tables are correct, but we need to ensure proper field mapping:

**professional_analysis table:**
- `current_level_assessment` (HTML)
- `main_bottlenecks` (HTML)
- `strategic_mistakes` (HTML)
- `strengths` (HTML)
- `weaknesses` (HTML)
- `realistic_growth_potential` (HTML)

**ai_profile_card table:**
- `strategy` (HTML)
- `target_audience` (HTML)
- `content_suggestions` (HTML)
- `quick_wins` (HTML)

**development_plan table:**
- `thirty_day_plan` (HTML)
- `ninety_day_plan` (HTML)
- `goals` (HTML)
- `metrics` (HTML)

**client_presentation table:**
- `executive_summary` (HTML)
- `recommendations` (HTML)
- `expected_results` (HTML)
- `investment_required` (HTML)

## Data Models

### HTML Section Patterns
AI generates HTML with these patterns:

```html
<h3>Mevcut Seviye Değerlendirmesi</h3>
<p>Content...</p>

<h3>Ana Darboğazlar</h3>
<ul><li>Content...</li></ul>

<h3>Güçlü Yanlar</h3>
<ul><li>Content...</li></ul>
```

### Parsing Strategy
1. **Split by H3 tags** - Each `<h3>` indicates a new section
2. **Map section titles to database fields** - Turkish titles to English field names
3. **Preserve HTML formatting** - Keep HTML tags for proper rendering
4. **Handle missing sections** - Default to empty string if section not found

### Section Mapping
```typescript
const SECTION_MAPPINGS = {
  // Professional Analysis
  'Mevcut Seviye Değerlendirmesi': 'current_level_assessment',
  'Ana Darboğazlar': 'main_bottlenecks', 
  'Stratejik Hatalar': 'strategic_mistakes',
  'Güçlü Yanlar': 'strengths',
  'Zayıf Yanlar': 'weaknesses',
  'Gerçekçi Büyüme Potansiyeli': 'realistic_growth_potential',
  
  // AI Profile Card  
  'Strateji': 'strategy',
  'Hedef Kitle': 'target_audience',
  'İçerik Önerileri': 'content_suggestions',
  'Hızlı Kazanımlar': 'quick_wins',
  
  // Development Plan
  '30 Günlük Plan': 'thirty_day_plan',
  '90 Günlük Plan': 'ninety_day_plan',
  'Hedefler': 'goals',
  'Metrikler': 'metrics',
  
  // Client Presentation
  'Özet': 'executive_summary',
  'Öneriler': 'recommendations', 
  'Beklenen Sonuçlar': 'expected_results',
  'Yatırım': 'investment_required'
};
```

## Error Handling

### Parsing Failures
- **Fallback to raw HTML** - If parsing fails, save entire HTML to first field
- **Log parsing errors** - Track which sections failed to parse
- **Graceful degradation** - Continue processing even if some sections fail

### Missing Sections
- **Default empty strings** - If expected section not found
- **Validation warnings** - Log when expected sections are missing
- **UI fallbacks** - Show "Content not available" messages

## Testing Strategy

### Unit Tests
- Test HTML parsing with various input formats
- Test section extraction accuracy
- Test error handling scenarios
- Test Turkish character handling

### Integration Tests  
- Test complete analysis flow with real AI responses
- Test database saving with parsed sections
- Test UI rendering with parsed content

### Test Data
```html
const TEST_HTML = `
<h3>Mevcut Seviye Değerlendirmesi</h3>
<p>Test content for current level...</p>

<h3>Ana Darboğazlar</h3>
<ul>
  <li>Test bottleneck 1</li>
  <li>Test bottleneck 2</li>
</ul>
`;
```

## Implementation Plan

### Phase 1: Parser Development
1. Create `AnalysisParser` class
2. Implement section extraction logic
3. Add Turkish character support
4. Write unit tests

### Phase 2: LLM Service Updates
1. Update each LLM service to use parser
2. Modify response handling in complete-analysis API
3. Test with real AI responses

### Phase 3: UI Updates
1. Update analysis display components
2. Add fallback handling for missing sections
3. Test rendering with new data structure

### Phase 4: Error Handling & Monitoring
1. Add comprehensive error logging
2. Implement parsing failure recovery
3. Add monitoring for parsing success rates