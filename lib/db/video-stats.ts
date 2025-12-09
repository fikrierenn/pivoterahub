import { supabase } from '@/lib/supabase';

export interface VideoStats {
  id: string;
  client_id: string;
  video_id: string;
  snapshot_date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement_rate: number;
  created_at: string;
}

export async function getVideoStatsByClientId(
  clientId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<VideoStats[]> {
  let query = supabase
    .from('video_stats')
    .select('*')
    .eq('client_id', clientId)
    .order('snapshot_date', { ascending: false });

  if (dateFrom) {
    query = query.gte('snapshot_date', dateFrom);
  }

  if (dateTo) {
    query = query.lte('snapshot_date', dateTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching video stats:', error);
    return [];
  }

  return data || [];
}

export function calculateEngagementRate(
  likes: number,
  comments: number,
  shares: number,
  saves: number,
  views: number
): number {
  if (views === 0) return 0;
  return (likes + comments + shares + saves) / views;
}

export async function insertVideoStats(
  stats: Omit<VideoStats, 'id' | 'created_at'>
): Promise<VideoStats | null> {
  const { data, error } = await supabase
    .from('video_stats')
    .insert(stats)
    .select()
    .single();

  if (error) {
    console.error('Error inserting video stats:', error);
    throw error;
  }

  return data;
}
