import { NextRequest, NextResponse } from 'next/server';
import { GrowthReportRequestSchema } from '@/lib/validation/growth-report';
import { getClientById } from '@/lib/db/clients';
import { getVideosByClientId } from '@/lib/db/videos';
import { getVideoStatsByClientId } from '@/lib/db/video-stats';
import { getVideoScoresByClientId } from '@/lib/db/video-scores';
import { getTopHashtags, getWeakHashtags } from '@/lib/db/hashtag-stats';
import { generateGrowthReport } from '@/lib/llm/growth-report';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validatedData = GrowthReportRequestSchema.parse(body);

    // Check if client exists
    const client = await getClientById(validatedData.client_id);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Calculate previous period dates
    const dateFrom = new Date(validatedData.date_from);
    const dateTo = new Date(validatedData.date_to);
    const periodLength = dateTo.getTime() - dateFrom.getTime();
    
    const prevDateTo = new Date(dateFrom.getTime() - 1);
    const prevDateFrom = new Date(prevDateTo.getTime() - periodLength);

    // Get current period data
    const currentVideos = await getVideosByClientId(
      validatedData.client_id,
      validatedData.date_from,
      validatedData.date_to
    );

    const currentStats = await getVideoStatsByClientId(
      validatedData.client_id,
      validatedData.date_from,
      validatedData.date_to
    );

    const currentScores = await getVideoScoresByClientId(
      validatedData.client_id,
      validatedData.date_from,
      validatedData.date_to
    );

    // Get previous period data
    const prevVideos = await getVideosByClientId(
      validatedData.client_id,
      prevDateFrom.toISOString().split('T')[0],
      prevDateTo.toISOString().split('T')[0]
    );

    const prevStats = await getVideoStatsByClientId(
      validatedData.client_id,
      prevDateFrom.toISOString().split('T')[0],
      prevDateTo.toISOString().split('T')[0]
    );

    // Calculate current period metrics
    const totalVideos = currentVideos.length;
    const totalViews = currentStats.reduce((sum, stat) => sum + Number(stat.views), 0);
    const avgViewsPerVideo = totalVideos > 0 ? totalViews / totalVideos : 0;
    const avgEngagementRate = currentStats.length > 0
      ? currentStats.reduce((sum, stat) => sum + Number(stat.engagement_rate), 0) / currentStats.length
      : 0;

    // Calculate previous period metrics
    const prevTotalVideos = prevVideos.length;
    const prevTotalViews = prevStats.reduce((sum, stat) => sum + Number(stat.views), 0);
    const prevAvgViewsPerVideo = prevTotalVideos > 0 ? prevTotalViews / prevTotalVideos : 0;
    const prevAvgEngagementRate = prevStats.length > 0
      ? prevStats.reduce((sum, stat) => sum + Number(stat.engagement_rate), 0) / prevStats.length
      : 0;

    // Calculate changes
    const videosPercent = prevTotalVideos > 0
      ? (totalVideos - prevTotalVideos) / prevTotalVideos
      : 0;
    const avgViewsPercent = prevAvgViewsPerVideo > 0
      ? (avgViewsPerVideo - prevAvgViewsPerVideo) / prevAvgViewsPerVideo
      : 0;
    const engagementRatePercent = prevAvgEngagementRate > 0
      ? (avgEngagementRate - prevAvgEngagementRate) / prevAvgEngagementRate
      : 0;

    // Get last videos with stats and scores
    const lastVideos = currentVideos
      .slice(0, validatedData.limit_last_videos)
      .map(video => {
        const stat = currentStats.find(s => s.video_id === video.id);
        const score = currentScores.find(s => s.video_id === video.id);

        const combinedScore = score
          ? (score.hook_score + score.tempo_score + score.clarity_score + score.cta_score + score.visual_score) / 5
          : 0;

        const label = combinedScore >= 7 ? 'good' : combinedScore >= 5 ? 'average' : 'poor';

        return {
          video_id: video.id,
          published_at: video.published_at || '',
          platform: video.platform,
          views: stat ? Number(stat.views) : 0,
          likes: stat ? Number(stat.likes) : 0,
          comments: stat ? Number(stat.comments) : 0,
          shares: stat ? Number(stat.shares) : 0,
          saves: stat ? Number(stat.saves) : 0,
          engagement_rate: stat ? Number(stat.engagement_rate) : 0,
          combined_score: combinedScore,
          label,
        };
      });

    // Get hashtag performance
    const topHashtags = await getTopHashtags(validatedData.client_id, 5);
    const weakHashtags = await getWeakHashtags(validatedData.client_id, 5);

    // Generate AI evaluation
    const aiEvaluation = await generateGrowthReport({
      period: {
        date_from: validatedData.date_from,
        date_to: validatedData.date_to,
      },
      current_period: {
        total_videos: totalVideos,
        total_views: totalViews,
        avg_views_per_video: avgViewsPerVideo,
        avg_engagement_rate: avgEngagementRate,
      },
      previous_period: {
        total_videos: prevTotalVideos,
        total_views: prevTotalViews,
        avg_views_per_video: prevAvgViewsPerVideo,
        avg_engagement_rate: prevAvgEngagementRate,
      },
      last_videos: lastVideos,
      hashtag_performance: {
        top_hashtags: topHashtags.map(h => ({
          hashtag: h.hashtag,
          usage_count: h.usage_count,
          avg_views: Number(h.avg_views),
          avg_engagement_rate: Number(h.avg_engagement_rate),
        })),
        weak_hashtags: weakHashtags.map(h => ({
          hashtag: h.hashtag,
          usage_count: h.usage_count,
          avg_views: Number(h.avg_views),
          avg_engagement_rate: Number(h.avg_engagement_rate),
        })),
      },
    });

    // Return response
    return NextResponse.json({
      summary: {
        total_videos: totalVideos,
        total_views: totalViews,
        avg_views_per_video: avgViewsPerVideo,
        avg_engagement_rate: avgEngagementRate,
        change_vs_previous_period: {
          videos_percent: videosPercent,
          avg_views_percent: avgViewsPercent,
          engagement_rate_percent: engagementRatePercent,
        },
      },
      last_videos: lastVideos,
      category_performance: [], // TODO: Implement category logic
      hashtag_performance: {
        top_hashtags: topHashtags.map(h => ({
          hashtag: h.hashtag,
          usage_count: h.usage_count,
          avg_views: Number(h.avg_views),
          avg_engagement_rate: Number(h.avg_engagement_rate),
        })),
        weak_hashtags: weakHashtags.map(h => ({
          hashtag: h.hashtag,
          usage_count: h.usage_count,
          avg_views: Number(h.avg_views),
          avg_engagement_rate: Number(h.avg_engagement_rate),
        })),
      },
      ai_evaluation: aiEvaluation,
    });

  } catch (error: any) {
    console.error('Growth report error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
