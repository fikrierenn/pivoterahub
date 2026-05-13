import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeViralVideos, generatePerformanceInsights } from '@/lib/llm/video-performance-analysis';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = id;

    // Check if client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get client's videos with stats and scores
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select(`
        *,
        video_stats(*),
        video_scores(*)
      `)
      .eq('client_id', clientId)
      .order('published_at', { ascending: false });

    if (videosError) {
      console.error('Error fetching videos:', videosError);
      return NextResponse.json(
        { error: 'Failed to fetch videos' },
        { status: 500 }
      );
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json(
        { error: 'No videos found for analysis' },
        { status: 400 }
      );
    }

    // Transform data for analysis
    const videoData = videos
      .filter(video => video.video_stats && video.video_stats.length > 0)
      .map(video => {
        const stats = video.video_stats[0]; // Get latest stats
        const scores = video.video_scores && video.video_scores.length > 0 ? video.video_scores[0] : null;

        return {
          video_id: video.id,
          url: video.url,
          views: stats.views || 0,
          likes: stats.likes || 0,
          comments: stats.comments || 0,
          shares: stats.shares || 0,
          saves: stats.saves || 0,
          engagement_rate: stats.engagement_rate || 0,
          published_at: video.published_at || video.created_at,
          duration_sec: video.duration_sec || 60,
          hashtags: video.hashtags || [],
          captions: video.captions,
          transcript: video.transcript,
          hook_score: scores?.hook_score,
          tempo_score: scores?.tempo_score,
          clarity_score: scores?.clarity_score,
          cta_score: scores?.cta_score,
          visual_score: scores?.visual_score
        };
      });

    if (videoData.length === 0) {
      return NextResponse.json(
        { error: 'No video performance data available' },
        { status: 400 }
      );
    }

    // Prepare client context
    const clientData = {
      name: client.name,
      sector: client.sector,
      location: client.city || '',
      goals: 'Instagram growth and engagement'
    };

    // Get intake form data for better context
    const { data: intakeForm } = await supabase
      .from('client_intake_forms')
      .select('answers')
      .eq('client_id', clientId)
      .single();

    if (intakeForm?.answers) {
      clientData.goals = intakeForm.answers.main_goals || clientData.goals;
    }

    console.log(`🎯 Analyzing ${videoData.length} videos for viral patterns and performance insights`);

    // Run both analyses
    const [viralAnalysis, performanceInsights] = await Promise.all([
      analyzeViralVideos(videoData, clientData),
      generatePerformanceInsights(videoData, clientData)
    ]);

    // Calculate summary statistics
    const totalViews = videoData.reduce((sum, video) => sum + video.views, 0);
    const avgViews = totalViews / videoData.length;
    const avgEngagement = videoData.reduce((sum, video) => sum + video.engagement_rate, 0) / videoData.length;
    
    // Find top performing videos
    const topVideos = videoData
      .sort((a, b) => {
        const scoreA = (a.engagement_rate * 0.6) + (a.views / 1000 * 0.4);
        const scoreB = (b.engagement_rate * 0.6) + (b.views / 1000 * 0.4);
        return scoreB - scoreA;
      })
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      summary: {
        total_videos: videoData.length,
        total_views: totalViews,
        avg_views: Math.round(avgViews),
        avg_engagement_rate: Math.round(avgEngagement * 100) / 100,
        top_video_views: topVideos[0]?.views || 0,
        analysis_date: new Date().toISOString()
      },
      viral_analysis: viralAnalysis,
      performance_insights: performanceInsights,
      top_videos: topVideos.map(video => ({
        video_id: video.video_id,
        url: video.url,
        views: video.views,
        engagement_rate: video.engagement_rate,
        published_at: video.published_at,
        hashtags: video.hashtags
      }))
    });

  } catch (error: any) {
    console.error('Video performance analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = id;

    // Check if client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get basic video statistics
    const { data: videos } = await supabase
      .from('videos')
      .select(`
        id,
        url,
        published_at,
        duration_sec,
        hashtags,
        video_stats(views, likes, comments, shares, saves, engagement_rate),
        video_scores(hook_score, tempo_score, clarity_score, cta_score, visual_score)
      `)
      .eq('client_id', clientId)
      .order('published_at', { ascending: false })
      .limit(20);

    const videoCount = videos?.length || 0;
    const totalViews = videos?.reduce((sum, video) => {
      const stats = video.video_stats?.[0];
      return sum + (stats?.views || 0);
    }, 0) || 0;

    return NextResponse.json({
      success: true,
      summary: {
        total_videos: videoCount,
        total_views: totalViews,
        avg_views: videoCount > 0 ? Math.round(totalViews / videoCount) : 0,
        has_performance_data: videoCount > 0
      },
      recent_videos: videos?.slice(0, 5).map(video => ({
        id: video.id,
        url: video.url,
        published_at: video.published_at,
        views: video.video_stats?.[0]?.views || 0,
        engagement_rate: video.video_stats?.[0]?.engagement_rate || 0
      })) || []
    });

  } catch (error: any) {
    console.error('Error fetching video performance data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}