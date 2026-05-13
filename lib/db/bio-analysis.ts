import { supabase } from '@/lib/supabase';

export interface BioAnalysis {
  id: string;
  client_id: string;
  bio_text: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_verified: boolean;
  is_private: boolean;
  bio_effectiveness?: string;
  missing_elements?: string;
  improvement_suggestions?: string;
  target_audience_alignment?: string;
  conversion_optimization?: string;
  seo_keywords?: string;
  created_at: string;
  updated_at: string;
}

export interface BioAnalysisInsert {
  client_id: string;
  bio_text: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_verified?: boolean;
  is_private?: boolean;
  bio_effectiveness?: string;
  missing_elements?: string;
  improvement_suggestions?: string;
  target_audience_alignment?: string;
  conversion_optimization?: string;
  seo_keywords?: string;
}

export interface BioAnalysisUpdate {
  bio_text?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_verified?: boolean;
  is_private?: boolean;
  bio_effectiveness?: string;
  missing_elements?: string;
  improvement_suggestions?: string;
  target_audience_alignment?: string;
  conversion_optimization?: string;
  seo_keywords?: string;
}

/**
 * Insert a new bio analysis record
 */
export async function insertBioAnalysis(data: BioAnalysisInsert): Promise<BioAnalysis | null> {
  try {
    const { data: result, error } = await supabase
      .from('instagram_bio_analysis')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error inserting bio analysis:', error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error('Error in insertBioAnalysis:', error);
    return null;
  }
}

/**
 * Get bio analysis by client ID (most recent)
 */
export async function getBioAnalysisByClientId(clientId: string): Promise<BioAnalysis | null> {
  try {
    const { data, error } = await supabase
      .from('instagram_bio_analysis')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching bio analysis:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getBioAnalysisByClientId:', error);
    return null;
  }
}

/**
 * Get all bio analyses for a client (with pagination)
 */
export async function getBioAnalysesByClientId(
  clientId: string,
  limit: number = 10,
  offset: number = 0
): Promise<BioAnalysis[]> {
  try {
    const { data, error } = await supabase
      .from('instagram_bio_analysis')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching bio analyses:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getBioAnalysesByClientId:', error);
    return [];
  }
}

/**
 * Update an existing bio analysis
 */
export async function updateBioAnalysis(
  id: string,
  data: BioAnalysisUpdate
): Promise<BioAnalysis | null> {
  try {
    const { data: result, error } = await supabase
      .from('instagram_bio_analysis')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating bio analysis:', error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error('Error in updateBioAnalysis:', error);
    return null;
  }
}

/**
 * Delete a bio analysis record
 */
export async function deleteBioAnalysis(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('instagram_bio_analysis')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting bio analysis:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteBioAnalysis:', error);
    return false;
  }
}

/**
 * Get bio analysis count for a client
 */
export async function getBioAnalysisCount(clientId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('instagram_bio_analysis')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId);

    if (error) {
      console.error('Error counting bio analyses:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getBioAnalysisCount:', error);
    return 0;
  }
}