-- Create Instagram bio analysis table
CREATE TABLE IF NOT EXISTS public.instagram_bio_analysis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Bio data
  bio_text text NOT NULL,
  followers_count integer,
  following_count integer,
  posts_count integer,
  is_verified boolean DEFAULT false,
  is_private boolean DEFAULT false,
  
  -- Analysis results
  bio_effectiveness text,
  missing_elements text,
  improvement_suggestions text,
  target_audience_alignment text,
  conversion_optimization text,
  seo_keywords text,
  
  -- Meta
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_instagram_bio_analysis_client ON public.instagram_bio_analysis (client_id);
CREATE INDEX IF NOT EXISTS idx_instagram_bio_analysis_created ON public.instagram_bio_analysis (created_at);

-- Enable RLS
ALTER TABLE public.instagram_bio_analysis ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable all operations" ON public.instagram_bio_analysis FOR ALL USING (true);