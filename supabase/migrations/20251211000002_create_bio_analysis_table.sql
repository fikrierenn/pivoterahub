-- Create bio_analysis table for Instagram bio analysis results
CREATE TABLE IF NOT EXISTS bio_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  bio_text TEXT NOT NULL,
  followers_count INTEGER,
  following_count INTEGER,
  posts_count INTEGER,
  is_verified BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  bio_effectiveness TEXT,
  missing_elements TEXT,
  improvement_suggestions TEXT,
  target_audience_alignment TEXT,
  conversion_optimization TEXT,
  seo_keywords TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bio_analysis_client_id ON bio_analysis(client_id);
CREATE INDEX IF NOT EXISTS idx_bio_analysis_created_at ON bio_analysis(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE bio_analysis ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access bio analysis for their own clients
CREATE POLICY "Users can access their own client bio analysis" ON bio_analysis
  FOR ALL USING (true); -- For now, allow all access. In production, this should be restricted based on user authentication

-- Add trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bio_analysis_updated_at 
  BEFORE UPDATE ON bio_analysis 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();