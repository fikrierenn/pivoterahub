import { supabase } from '@/lib/supabase';
import { CompetitorScrapingResult } from '@/lib/scraping/competitor-scraper';

export interface CompetitorAnalysis {
  id: string;
  client_id: string;
  competitors_data: CompetitorScrapingResult;
  swot_analysis?: string;
  competitive_positioning?: string;
  market_opportunities?: string;
  differentiation_strategy?: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitorAnalysisInsert {
  client_id: string;
  competitors_data: CompetitorScrapingResult;
  swot_analysis?: string;
  competitive_positioning?: string;
  market_opportunities?: string;
  differentiation_strategy?: string;
}

export interface CompetitorAnalysisUpdate {
  competitors_data?: CompetitorScrapingResult;
  swot_analysis?: string;
  competitive_positioning?: string;
  market_opportunities?: string;
  differentiation_strategy?: string;
}

/**
 * Insert a new competitor analysis record
 */
export async function insertCompetitorAnalysis(data: CompetitorAnalysisInsert): Promise<CompetitorAnalysis | null> {
  try {
    const { data: result, error } = await supabase
      .from('competitor_analysis')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error inserting competitor analysis:', error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error('Error in insertCompetitorAnalysis:', error);
    return null;
  }
}

/**
 * Get competitor analysis by client ID (most recent)
 */
export async function getCompetitorAnalysisByClientId(clientId: string): Promise<CompetitorAnalysis | null> {
  try {
    const { data, error } = await supabase
      .from('competitor_analysis')
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
      console.error('Error fetching competitor analysis:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getCompetitorAnalysisByClientId:', error);
    return null;
  }
}

/**
 * Get all competitor analyses for a client (with pagination)
 */
export async function getCompetitorAnalysesByClientId(
  clientId: string,
  limit: number = 10,
  offset: number = 0
): Promise<CompetitorAnalysis[]> {
  try {
    const { data, error } = await supabase
      .from('competitor_analysis')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching competitor analyses:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCompetitorAnalysesByClientId:', error);
    return [];
  }
}

/**
 * Update an existing competitor analysis
 */
export async function updateCompetitorAnalysis(
  id: string,
  data: CompetitorAnalysisUpdate
): Promise<CompetitorAnalysis | null> {
  try {
    const { data: result, error } = await supabase
      .from('competitor_analysis')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating competitor analysis:', error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error('Error in updateCompetitorAnalysis:', error);
    return null;
  }
}

/**
 * Upsert competitor analysis (insert or update based on client_id)
 */
export async function upsertCompetitorAnalysis(data: CompetitorAnalysisInsert): Promise<CompetitorAnalysis | null> {
  try {
    const { data: result, error } = await supabase
      .from('competitor_analysis')
      .upsert(
        {
          ...data,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'client_id'
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting competitor analysis:', error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error('Error in upsertCompetitorAnalysis:', error);
    return null;
  }
}

/**
 * Delete a competitor analysis record
 */
export async function deleteCompetitorAnalysis(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('competitor_analysis')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting competitor analysis:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteCompetitorAnalysis:', error);
    return false;
  }
}

/**
 * Get competitor analysis count for a client
 */
export async function getCompetitorAnalysisCount(clientId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('competitor_analysis')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId);

    if (error) {
      console.error('Error counting competitor analyses:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getCompetitorAnalysisCount:', error);
    return 0;
  }
}