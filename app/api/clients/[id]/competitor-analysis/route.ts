import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { CompetitorScraper } from '@/lib/scraping/competitor-scraper';
import { analyzeCompetitors } from '@/lib/llm/competitor-analysis';
import { upsertCompetitorAnalysis, getCompetitorAnalysisByClientId } from '@/lib/db/competitor-analysis';
import { enforceRateLimit } from '@/lib/rateLimitGuard';

// Request validation schema
const CompetitorAnalysisRequestSchema = z.object({
  competitor_usernames: z.array(z.string()).min(1, 'At least one competitor is required').max(10, 'Maximum 10 competitors allowed'),
  force_refresh: z.boolean().optional().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await enforceRateLimit(request, 'ANALYZE');
  if (limited) return limited;

  try {
    const { id } = await params;
    const clientId = id;
    const body = await request.json();

    // Validate request data
    const validatedData = CompetitorAnalysisRequestSchema.parse(body);

    // Check if client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get client's Instagram profile for comparison
    const { data: instagramAnalysis } = await supabase
      .from('instagram_bio_analysis')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!instagramAnalysis) {
      return NextResponse.json(
        { error: 'Client Instagram profile not found. Please run Instagram bio analysis first.' },
        { status: 400 }
      );
    }

    // Prepare client context for AI analysis
    const clientData = {
      name: client.name,
      sector: client.sector,
      location: client.city || '',
      goals: 'Instagram growth and engagement' // Default goals
    };

    // Get intake form data for better context
    const { data: intakeForm } = await supabase
      .from('client_intake_forms')
      .select('answers')
      .eq('client_id', clientId)
      .single();

    if (intakeForm?.answers) {
      clientData.goals = intakeForm.answers.main_goals || clientData.goals;
    }

    // Check if we have recent analysis and don't need to refresh
    if (!validatedData.force_refresh) {
      const existingAnalysis = await getCompetitorAnalysisByClientId(clientId);
      if (existingAnalysis) {
        const analysisAge = Date.now() - new Date(existingAnalysis.created_at).getTime();
        const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
        
        if (analysisAge < oneWeekInMs) {
          return NextResponse.json({
            success: true,
            analysis: {
              swot_analysis: existingAnalysis.swot_analysis,
              competitive_positioning: existingAnalysis.competitive_positioning,
              market_opportunities: existingAnalysis.market_opportunities,
              differentiation_strategy: existingAnalysis.differentiation_strategy
            },
            competitors_data: existingAnalysis.competitors_data,
            cached: true,
            message: 'Using cached analysis (less than 1 week old)'
          });
        }
      }
    }

    console.log(`🏆 Starting competitor analysis for ${validatedData.competitor_usernames.length} competitors`);

    // Scrape competitor data
    const competitorScraper = new CompetitorScraper();
    const scrapingResult = await competitorScraper.scrapeCompetitors(validatedData.competitor_usernames);

    if (!scrapingResult || scrapingResult.competitors.length === 0) {
      return NextResponse.json(
        { error: 'Failed to scrape competitor data' },
        { status: 500 }
      );
    }

    // Filter successful competitors
    const validCompetitors = scrapingResult.competitors.filter(c => !c.error);

    if (validCompetitors.length === 0) {
      return NextResponse.json(
        { error: 'No competitors could be analyzed successfully' },
        { status: 400 }
      );
    }

    // Prepare client profile for comparison
    const clientProfile = {
      username: instagramAnalysis.username || client.ig_handle || client.name.toLowerCase().replace(/\s+/g, ''),
      full_name: client.name,
      followers: instagramAnalysis.followers_count || 0,
      following: instagramAnalysis.following_count || 0,
      posts: instagramAnalysis.posts_count || 0,
      bio: instagramAnalysis.bio_text || '',
      is_verified: instagramAnalysis.is_verified || false,
      is_private: instagramAnalysis.is_private || false,
      engagement_rate: 0 // We don't have this data for the client yet
    };

    console.log(`🤖 Running AI competitor analysis for ${validCompetitors.length} competitors`);

    // Run AI analysis
    const analysis = await analyzeCompetitors(clientProfile, validCompetitors, clientData);

    // Save analysis to database
    const savedAnalysis = await upsertCompetitorAnalysis({
      client_id: clientId,
      competitors_data: scrapingResult,
      swot_analysis: analysis.swot_analysis,
      competitive_positioning: analysis.competitive_positioning,
      market_opportunities: analysis.market_opportunities,
      differentiation_strategy: analysis.differentiation_strategy
    });

    if (!savedAnalysis) {
      console.error('Failed to save competitor analysis to database');
      // Continue anyway, return the analysis
    }

    console.log(`✅ Competitor analysis completed: ${validCompetitors.length} competitors analyzed`);

    return NextResponse.json({
      success: true,
      analysis: {
        swot_analysis: analysis.swot_analysis,
        competitive_positioning: analysis.competitive_positioning,
        market_opportunities: analysis.market_opportunities,
        differentiation_strategy: analysis.differentiation_strategy
      },
      competitors_data: scrapingResult,
      client_profile: clientProfile,
      saved_analysis_id: savedAnalysis?.id,
      message: `Successfully analyzed ${validCompetitors.length} competitors`
    });

  } catch (error: any) {
    console.error('Competitor analysis error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = id;

    // Check if client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get existing competitor analysis
    const analysis = await getCompetitorAnalysisByClientId(clientId);

    if (!analysis) {
      return NextResponse.json({
        success: true,
        analysis: null,
        message: 'No competitor analysis found for this client'
      });
    }

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        swot_analysis: analysis.swot_analysis,
        competitive_positioning: analysis.competitive_positioning,
        market_opportunities: analysis.market_opportunities,
        differentiation_strategy: analysis.differentiation_strategy,
        created_at: analysis.created_at,
        updated_at: analysis.updated_at
      },
      competitors_data: analysis.competitors_data
    });

  } catch (error: any) {
    console.error('Error fetching competitor analysis:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
