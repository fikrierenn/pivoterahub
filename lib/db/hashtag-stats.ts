import { supabase } from '@/lib/supabase';

export interface HashtagStats {
  id: string;
  client_id: string;
  hashtag: string;
  usage_count: number;
  total_views: number;
  avg_views: number;
  avg_engagement_rate: number;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

export async function getHashtagStatsByClientId(
  clientId: string
): Promise<HashtagStats[]> {
  const { data, error } = await supabase
    .from('hashtag_stats')
    .select('*')
    .eq('client_id', clientId)
    .order('usage_count', { ascending: false });

  if (error) {
    console.error('Error fetching hashtag stats:', error);
    return [];
  }

  return data || [];
}

export function normalizeHashtags(hashtags: string[]): string[] {
  return hashtags.map(tag => 
    tag.toLowerCase().replace(/^#/, '').trim()
  ).filter(tag => tag.length > 0);
}

export async function updateHashtagStats(
  clientId: string,
  hashtags: string[],
  videoViews: number,
  videoEngagementRate: number
): Promise<void> {
  const normalizedHashtags = normalizeHashtags(hashtags);

  for (const hashtag of normalizedHashtags) {
    // Check if hashtag exists
    const { data: existing } = await supabase
      .from('hashtag_stats')
      .select('*')
      .eq('client_id', clientId)
      .eq('hashtag', hashtag)
      .single();

    if (existing) {
      // Update existing hashtag
      const newUsageCount = existing.usage_count + 1;
      const newTotalViews = existing.total_views + videoViews;
      const newAvgViews = newTotalViews / newUsageCount;
      
      // Calculate new average engagement rate
      const newAvgEngagementRate = 
        (existing.avg_engagement_rate * existing.usage_count + videoEngagementRate) / newUsageCount;

      await supabase
        .from('hashtag_stats')
        .update({
          usage_count: newUsageCount,
          total_views: newTotalViews,
          avg_views: newAvgViews,
          avg_engagement_rate: newAvgEngagementRate,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Insert new hashtag
      await supabase
        .from('hashtag_stats')
        .insert({
          client_id: clientId,
          hashtag,
          usage_count: 1,
          total_views: videoViews,
          avg_views: videoViews,
          avg_engagement_rate: videoEngagementRate,
          last_used_at: new Date().toISOString(),
        });
    }
  }
}

export async function getTopHashtags(
  clientId: string,
  limit: number = 5
): Promise<HashtagStats[]> {
  const { data, error } = await supabase
    .from('hashtag_stats')
    .select('*')
    .eq('client_id', clientId)
    .order('avg_views', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top hashtags:', error);
    return [];
  }

  return data || [];
}

export async function getWeakHashtags(
  clientId: string,
  limit: number = 5
): Promise<HashtagStats[]> {
  const { data, error } = await supabase
    .from('hashtag_stats')
    .select('*')
    .eq('client_id', clientId)
    .gte('usage_count', 3) // Only consider hashtags used at least 3 times
    .order('avg_views', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching weak hashtags:', error);
    return [];
  }

  return data || [];
}
