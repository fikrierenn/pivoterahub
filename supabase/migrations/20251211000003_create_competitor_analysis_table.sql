-- Create competitor_analysis table for competitor analysis results
CREATE TABLE IF NOT EXISTS competitor_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  competitors_data JSONB NOT NULL,
  swot_analysis TEXT,
  competitive_positioning TEXT,
  market_opportunities TEXT,
  differentiation_strategy TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_client_id ON competitor_analysis(client_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_created_at ON competitor_analysis(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access competitor analysis for their own clients
CREATE POLICY "Users can access their own client competitor analysis" ON competitor_analysis
  FOR ALL USING (true); -- For now, allow all access. In production, this should be restricted based on user authentication

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_competitor_analysis_updated_at 
  BEFORE UPDATE ON competitor_analysis 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();