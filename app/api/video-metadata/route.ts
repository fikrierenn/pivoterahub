import { NextRequest, NextResponse } from 'next/server';
import { scrapeVideoWithPython } from '@/lib/scraping/python-scraper';

interface VideoMetadata {
  platform: 'instagram' | 'tiktok' | 'youtube';
  duration_sec?: number;
  published_at?: string;
  captions?: string;
  hashtags?: string[];
  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
  };
}

// Instagram URL'sinden metadata çekme (basit parsing + mock data)
function parseInstagramUrl(url: string): Partial<VideoMetadata> {
  const metadata: Partial<VideoMetadata> = {
    platform: 'instagram'
  };

  // Instagram post ID'sini çıkar
  const postIdMatch = url.match(/\/p\/([A-Za-z0-9_-]+)/);
  if (postIdMatch) {
    // Mock data - gerçek uygulamada Python scraper kullanılacak
    metadata.duration_sec = 30;
    metadata.published_at = new Date().toISOString().slice(0, 16); // datetime-local format
    metadata.captions = "🌟 Harika bir Instagram videosu! #motivation #lifestyle #success";
    metadata.hashtags = ['motivation', 'lifestyle', 'success', 'inspiration'];
    metadata.metrics = {
      views: Math.floor(Math.random() * 10000) + 1000,
      likes: Math.floor(Math.random() * 500) + 50,
      comments: Math.floor(Math.random() * 50) + 5,
      shares: Math.floor(Math.random() * 20) + 2,
      saves: Math.floor(Math.random() * 30) + 3
    };
  }

  return metadata;
}

// TikTok URL'sinden metadata çekme
function parseTikTokUrl(url: string): Partial<VideoMetadata> {
  const metadata: Partial<VideoMetadata> = {
    platform: 'tiktok'
  };

  // TikTok video ID'sini çıkar
  const videoIdMatch = url.match(/\/video\/(\d+)/);
  if (videoIdMatch) {
    metadata.duration_sec = 15; // TikTok default
    metadata.published_at = new Date().toISOString().slice(0, 16);
    metadata.captions = "🔥 Viral TikTok içeriği! #fyp #viral #trending";
    metadata.hashtags = ['fyp', 'viral', 'trending', 'tiktok'];
    metadata.metrics = {
      views: Math.floor(Math.random() * 50000) + 5000,
      likes: Math.floor(Math.random() * 2000) + 200,
      comments: Math.floor(Math.random() * 100) + 10,
      shares: Math.floor(Math.random() * 50) + 5,
      saves: Math.floor(Math.random() * 100) + 10
    };
  }

  return metadata;
}

// YouTube URL'sinden metadata çekme
function parseYouTubeUrl(url: string): Partial<VideoMetadata> {
  const metadata: Partial<VideoMetadata> = {
    platform: 'youtube'
  };

  // YouTube video ID'sini çıkar
  const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (videoIdMatch) {
    metadata.duration_sec = 120; // YouTube default
    metadata.published_at = new Date().toISOString().slice(0, 16);
    metadata.captions = "📺 Harika YouTube video içeriği! Abone olmayı unutmayın!";
    metadata.hashtags = ['youtube', 'subscribe', 'content', 'amazing'];
    metadata.metrics = {
      views: Math.floor(Math.random() * 100000) + 10000,
      likes: Math.floor(Math.random() * 5000) + 500,
      comments: Math.floor(Math.random() * 200) + 20,
      shares: Math.floor(Math.random() * 100) + 10,
      saves: 0 // YouTube doesn't have saves
    };
  }

  return metadata;
}

// URL'den platform tespit etme
function detectPlatform(url: string): 'instagram' | 'tiktok' | 'youtube' | null {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { url, client_id } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    console.log('🎥 Starting comprehensive video analysis from URL:', url);

    // 1. Python scraper ile gerçek metadata çek
    let scrapedData;
    try {
      scrapedData = await scrapeVideoWithPython(url);
      console.log('✅ Python scraper successful - real data extracted');
    } catch (scrapeError) {
      console.error('❌ Python scraper failed:', scrapeError);
      const msg = scrapeError instanceof Error ? scrapeError.message : String(scrapeError);
      return NextResponse.json(
        { error: `Video analizi başarısız: ${msg}` },
        { status: 400 }
      );
    }

    // 2. Eğer client_id varsa, gerçek video analizi yap
    let fullAnalysis = null;
    if (client_id) {
      try {
        console.log('🤖 Starting full video analysis with AI...');
        
        // Video analysis API'sini çağır
        const analysisResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/video-analysis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id,
            url,
            platform: scrapedData.platform,
            duration_sec: scrapedData.duration_sec,
            captions: scrapedData.description,
            hashtags: scrapedData.hashtags,
            metrics: scrapedData.metrics.views > 0 ? scrapedData.metrics : undefined
          }),
        });

        if (analysisResponse.ok) {
          fullAnalysis = await analysisResponse.json();
          console.log('✅ Full video analysis completed');
        }
      } catch (analysisError) {
        console.warn('⚠️ Full analysis failed:', analysisError);
      }
    }

    // Form için uygun formata çevir
    const metadata: VideoMetadata = {
      platform: scrapedData.platform,
      duration_sec: scrapedData.duration_sec,
      published_at: scrapedData.published_at.slice(0, 16), // datetime-local format
      captions: scrapedData.description,
      hashtags: scrapedData.hashtags,
      metrics: {
        views: scrapedData.metrics.views,
        likes: scrapedData.metrics.likes,
        comments: scrapedData.metrics.comments,
        shares: scrapedData.metrics.shares,
        saves: scrapedData.metrics.saves || 0
      }
    };

    console.log('✅ Successfully processed video:', {
      platform: metadata.platform,
      hashtags_count: metadata.hashtags?.length || 0,
      views: metadata.metrics?.views || 0,
      has_full_analysis: !!fullAnalysis,
      engagement_rate: scrapedData.engagement_rate
    });

    return NextResponse.json({
      success: true,
      metadata,
      scraped_with_python: !!scrapedData.author?.username && scrapedData.author.username !== 'unknown',
      author: scrapedData.author,
      engagement_rate: scrapedData.engagement_rate,
      full_analysis: fullAnalysis, // AI analizi varsa dahil et
      needs_manual_metrics: scrapedData.metrics.views === 0
    });

  } catch (error: any) {
    console.error('❌ Error processing video:', error);
    return NextResponse.json(
      { error: 'Failed to process video: ' + error.message },
      { status: 500 }
    );
  }
}