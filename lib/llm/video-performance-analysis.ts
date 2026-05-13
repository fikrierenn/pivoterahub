import { z } from 'zod';
import { generateJson } from '@/lib/llm/gemini';

export interface VideoPerformanceData {
  video_id: string;
  title?: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement_rate: number;
  published_at: string;
  duration_sec: number;
  hashtags: string[];
  captions?: string;
  transcript?: string;
  hook_score?: number;
  tempo_score?: number;
  clarity_score?: number;
  cta_score?: number;
  visual_score?: number;
}

export interface ViralAnalysisResult {
  viral_factors: string;
  content_patterns: string;
  timing_insights: string;
  hook_analysis: string;
  engagement_drivers: string;
  replication_strategy: string;
}

export interface PerformanceInsights {
  top_performing_content: string;
  content_type_analysis: string;
  hashtag_effectiveness: string;
  posting_optimization: string;
  audience_behavior: string;
  growth_recommendations: string;
}

const ViralAnalysisSchema = z.object({
  viral_factors: z.string(),
  content_patterns: z.string(),
  timing_insights: z.string(),
  hook_analysis: z.string(),
  engagement_drivers: z.string(),
  replication_strategy: z.string(),
});

const PerformanceInsightsSchema = z.object({
  top_performing_content: z.string(),
  content_type_analysis: z.string(),
  hashtag_effectiveness: z.string(),
  posting_optimization: z.string(),
  audience_behavior: z.string(),
  growth_recommendations: z.string(),
});

const VIRAL_SYSTEM_PROMPT =
  'Sen viral video analizi konusunda uzman bir sosyal medya stratejistisin.';

const PERFORMANCE_SYSTEM_PROMPT =
  'Sen sosyal medya performans analizi uzmanisin.';

export async function analyzeViralVideos(
  videos: VideoPerformanceData[],
  clientData: {
    name: string;
    sector: string;
    location: string;
    goals: string;
  }
): Promise<ViralAnalysisResult> {
  const sortedVideos = videos.sort((a, b) => {
    const scoreA = (a.engagement_rate * 0.6) + (a.views / 1000 * 0.4);
    const scoreB = (b.engagement_rate * 0.6) + (b.views / 1000 * 0.4);
    return scoreB - scoreA;
  });

  const topVideos = sortedVideos.slice(0, Math.min(5, videos.length));
  const averagePerformance = videos.reduce((acc, video) => ({
    views: acc.views + video.views,
    engagement_rate: acc.engagement_rate + video.engagement_rate
  }), { views: 0, engagement_rate: 0 });

  averagePerformance.views = averagePerformance.views / videos.length;
  averagePerformance.engagement_rate = averagePerformance.engagement_rate / videos.length;

  const prompt = `
MUSTERI:
- Isim: ${clientData.name}
- Sektor: ${clientData.sector}
- Lokasyon: ${clientData.location}
- Hedefler: ${clientData.goals}

ORTALAMA PERFORMANS:
- Ortalama Izlenme: ${Math.round(averagePerformance.views).toLocaleString()}
- Ortalama Engagement: %${averagePerformance.engagement_rate.toFixed(2)}

EN IYI PERFORMANS GOSTEREN VIDEOLAR:
${topVideos.map((video, index) => `
${index + 1}. Video (${video.published_at.split('T')[0]})
   Izlenme: ${video.views.toLocaleString()} | Engagement: %${video.engagement_rate.toFixed(2)}
   Sure: ${Math.floor(video.duration_sec / 60)}:${(video.duration_sec % 60).toString().padStart(2, '0')}
   Begeni: ${video.likes.toLocaleString()} | Yorum: ${video.comments.toLocaleString()}
   Paylasim: ${video.shares.toLocaleString()} | Kaydetme: ${video.saves.toLocaleString()}
   Hashtag'ler: ${video.hashtags.join(', ')}
   ${video.captions ? `Aciklama: "${video.captions.substring(0, 100)}..."` : ''}
   ${video.transcript ? `Icerik: "${video.transcript.substring(0, 150)}..."` : ''}
`).join('')}

JSON formatinda dondur:
{
  "viral_factors": "...",
  "content_patterns": "...",
  "timing_insights": "...",
  "hook_analysis": "...",
  "engagement_drivers": "...",
  "replication_strategy": "..."
}

SADECE JSON dondur.
`;

  try {
    const parsed = await generateJson(VIRAL_SYSTEM_PROMPT, prompt);
    return ViralAnalysisSchema.parse(parsed);
  } catch (error) {
    console.error('Error analyzing viral videos:', error);
    throw new Error('Viral video analizi olusturulurken hata olustu');
  }
}

export async function generatePerformanceInsights(
  videos: VideoPerformanceData[],
  clientData: {
    name: string;
    sector: string;
    location: string;
    goals: string;
  }
): Promise<PerformanceInsights> {
  const contentTypeAnalysis = analyzeContentTypes(videos);
  const hashtagAnalysis = analyzeHashtagPerformance(videos);
  const timingAnalysis = analyzePostingTimes(videos);

  const prompt = `
MUSTERI:
- Isim: ${clientData.name}
- Sektor: ${clientData.sector}
- Lokasyon: ${clientData.location}
- Hedefler: ${clientData.goals}

PERFORMANS VERILERI:
- Toplam Video: ${videos.length}
- Ortalama Izlenme: ${Math.round(videos.reduce((acc, v) => acc + v.views, 0) / videos.length).toLocaleString()}
- Ortalama Engagement: %${(videos.reduce((acc, v) => acc + v.engagement_rate, 0) / videos.length).toFixed(2)}

ICERIK TIPI ANALIZI:
${JSON.stringify(contentTypeAnalysis, null, 2)}

HASHTAG PERFORMANSI:
${JSON.stringify(hashtagAnalysis, null, 2)}

ZAMANLAMA ANALIZI:
${JSON.stringify(timingAnalysis, null, 2)}

JSON formatinda dondur:
{
  "top_performing_content": "...",
  "content_type_analysis": "...",
  "hashtag_effectiveness": "...",
  "posting_optimization": "...",
  "audience_behavior": "...",
  "growth_recommendations": "..."
}

SADECE JSON dondur.
`;

  try {
    const parsed = await generateJson(PERFORMANCE_SYSTEM_PROMPT, prompt);
    return PerformanceInsightsSchema.parse(parsed);
  } catch (error) {
    console.error('Error generating performance insights:', error);
    throw new Error('Performans insights olusturulurken hata olustu');
  }
}

function analyzeContentTypes(videos: VideoPerformanceData[]) {
  const durationRanges = {
    short: videos.filter(v => v.duration_sec <= 30).length,
    medium: videos.filter(v => v.duration_sec > 30 && v.duration_sec <= 60).length,
    long: videos.filter(v => v.duration_sec > 60).length
  };

  return {
    duration_distribution: durationRanges,
    avg_hashtag_count: videos.reduce((acc, v) => acc + v.hashtags.length, 0) / videos.length
  };
}

function analyzeHashtagPerformance(videos: VideoPerformanceData[]) {
  const hashtagPerformance: Record<string, { count: number; totalViews: number; totalEngagement: number }> = {};

  videos.forEach(video => {
    video.hashtags.forEach(hashtag => {
      if (!hashtagPerformance[hashtag]) {
        hashtagPerformance[hashtag] = { count: 0, totalViews: 0, totalEngagement: 0 };
      }
      hashtagPerformance[hashtag].count++;
      hashtagPerformance[hashtag].totalViews += video.views;
      hashtagPerformance[hashtag].totalEngagement += video.engagement_rate;
    });
  });

  const topHashtags = Object.entries(hashtagPerformance)
    .map(([hashtag, data]) => ({
      hashtag,
      avgViews: data.totalViews / data.count,
      avgEngagement: data.totalEngagement / data.count,
      usage: data.count
    }))
    .sort((a, b) => b.avgViews - a.avgViews)
    .slice(0, 10);

  return { top_hashtags: topHashtags };
}

function analyzePostingTimes(videos: VideoPerformanceData[]) {
  const timeAnalysis = videos.map(video => {
    const date = new Date(video.published_at);
    return {
      hour: date.getHours(),
      dayOfWeek: date.getDay(),
      views: video.views,
      engagement: video.engagement_rate
    };
  });

  return {
    best_hours: timeAnalysis.reduce((acc, curr) => {
      acc[curr.hour] = (acc[curr.hour] || 0) + curr.views;
      return acc;
    }, {} as Record<number, number>),
    best_days: timeAnalysis.reduce((acc, curr) => {
      acc[curr.dayOfWeek] = (acc[curr.dayOfWeek] || 0) + curr.views;
      return acc;
    }, {} as Record<number, number>)
  };
}
