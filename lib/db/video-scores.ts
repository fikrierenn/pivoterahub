import { supabase } from '@/lib/supabase';

export interface VideoScore {
  id: string;
  client_id: string;
  video_id: string;
  hook_score: number;
  tempo_score: number;
  clarity_score: number;
  cta_score: number;
  visual_score: number;
  funnel_stage: 'cold' | 'warm' | 'hot' | 'sale';
  main_errors: string[];
  ai_comment: string;
  created_at: string;
}

export async function getVideoScoresByClientId(
  clientId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<VideoScore[]> {
  let query = supabase
    .from('video_scores')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (dateFrom || dateTo) {
    // Join with videos to filter by published_at
    query = supabase
      .from('video_scores')
      .select(`
        *,
        videos!inner(published_at)
      `)
      .eq('client_id', clientId);

    if (dateFrom) {
      query = query.gte('videos.published_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('videos.published_at', dateTo);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching video scores:', error);
    return [];
  }

  return data || [];
}

export async function getPreviousScores(
  clientId: string,
  limit: number = 5
): Promise<Array<{
  hook_score: number;
  clarity_score: number;
  cta_score: number;
  created_at: string;
}>> {
  const { data, error } = await supabase
    .from('video_scores')
    .select('hook_score, clarity_score, cta_score, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching previous scores:', error);
    return [];
  }

  return data || [];
}

export async function insertVideoScore(
  score: Omit<VideoScore, 'id' | 'created_at'>
): Promise<VideoScore | null> {
  const { data, error } = await supabase
    .from('video_scores')
    .insert(score)
    .select()
    .single();

  if (error) {
    console.error('Error inserting video score:', error);
    throw error;
  }

  return data;
}
