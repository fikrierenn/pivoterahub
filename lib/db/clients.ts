import { supabase } from '@/lib/supabase';

export interface Client {
  id: string;
  name: string;
  sector: string;
  city: string | null;
  ig_handle: string | null;
  weekly_content_capacity: number;
  positioning: string | null;
  created_at: string;
  updated_at: string;
}

export async function getClientById(clientId: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    return null;
  }

  return data;
}

export async function getClientProfileSummary(clientId: string) {
  const client = await getClientById(clientId);
  
  if (!client) {
    return null;
  }

  // Compact profile summary for LLM
  return {
    name: client.name,
    sector: client.sector,
    city: client.city,
    positioning: client.positioning,
    weekly_capacity: client.weekly_content_capacity,
  };
}
