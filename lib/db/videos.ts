import { supabase } from '@/lib/supabase';

export interface Video {
  id: string;
  client_id: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  external_id: string | null;
  url: string;
  published_at: string | null;
  duration_sec: number | null;
  captions: string | null;
  hashtags: string[];
  transcript: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoWithStats extends Video {
  video_stats?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    engagement_rate: number;
  };
  video_scores?: {
    hook_score: number;
    tempo_score: number;
    clarity_score: number;
    cta_score: number;
    visual_score: number;
    funnel_stage: string;
    main_errors: string[];
    ai_comment: string;
  };
}

export async function getVideosByClientId(
  clientId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<Video[]> {
  let query = supabase
    .from('videos')
    .select('*')
    .eq('client_id', clientId)
    .order('published_at', { ascending: false });

  if (dateFrom) {
    query = query.gte('published_at', dateFrom);
  }

  if (dateTo) {
    query = query.lte('published_at', dateTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching videos:', error);
    return [];
  }

  return data || [];
}

export async function insertVideo(video: Omit<Video, 'id' | 'created_at' | 'updated_at'>): Promise<Video | null> {
  const { data, error } = await supabase
    .from('videos')
    .insert(video)
    .select()
    .single();

  if (error) {
    console.error('Error inserting video:', error);
    throw error;
  }

  return data;
}
