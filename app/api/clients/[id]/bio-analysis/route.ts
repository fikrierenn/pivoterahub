import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { analyzeInstagramBio } from '@/lib/llm/instagram-analysis';

// Request validation schema
const BioAnalysisRequestSchema = z.object({
  bio_text: z.string().min(1, 'Bio text is required').max(500, 'Bio text too long'),
  followers_count: z.number().int().min(0).optional(),
  following_count: z.number().int().min(0).optional(),
  posts_count: z.number().int().min(0).optional(),
  is_verified: z.boolean().optional().default(false),
  is_private: z.boolean().optional().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = id;
    const body = await request.json();

    // Validate request data
    const validatedData = BioAnalysisRequestSchema.parse(body);

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

    // Analyze bio with AI
    const analysis = await analyzeInstagramBio(validatedData.bio_text, clientData);

    // Check if analysis already exists for this client
    const { data: existingAnalysis } = await supabase
      .from('instagram_bio_analysis')
      .select('*')
      .eq('client_id', clientId)
      .single();

    let savedAnalysis;

    if (existingAnalysis) {
      // Update existing analysis
      const { data: updatedAnalysis, error: updateError } = await supabase
        .from('instagram_bio_analysis')
        .update({
          bio_text: validatedData.bio_text,
          followers_count: validatedData.followers_count,
          following_count: validatedData.following_count,
          posts_count: validatedData.posts_count,
          is_verified: validatedData.is_verified,
          is_private: validatedData.is_private,
          bio_effectiveness: analysis.bio_effectiveness,
          missing_elements: analysis.missing_elements,
          improvement_suggestions: analysis.improvement_suggestions,
          target_audience_alignment: analysis.target_audience_alignment,
          conversion_optimization: analysis.conversion_optimization,
          seo_keywords: analysis.seo_keywords,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating bio analysis:', updateError);
        return NextResponse.json(
          { error: 'Failed to update bio analysis' },
          { status: 500 }
        );
      }

      savedAnalysis = updatedAnalysis;
    } else {
      // Create new analysis
      const { data: newAnalysis, error: insertError } = await supabase
        .from('instagram_bio_analysis')
        .insert({
          client_id: clientId,
          bio_text: validatedData.bio_text,
          followers_count: validatedData.followers_count,
          following_count: validatedData.following_count,
          posts_count: validatedData.posts_count,
          is_verified: validatedData.is_verified,
          is_private: validatedData.is_private,
          bio_effectiveness: analysis.bio_effectiveness,
          missing_elements: analysis.missing_elements,
          improvement_suggestions: analysis.improvement_suggestions,
          target_audience_alignment: analysis.target_audience_alignment,
          conversion_optimization: analysis.conversion_optimization,
          seo_keywords: analysis.seo_keywords
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting bio analysis:', insertError);
        return NextResponse.json(
          { error: 'Failed to save bio analysis' },
          { status: 500 }
        );
      }

      savedAnalysis = newAnalysis;
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      analysis: {
        bio_effectiveness: analysis.bio_effectiveness,
        missing_elements: analysis.missing_elements,
        improvement_suggestions: analysis.improvement_suggestions,
        target_audience_alignment: analysis.target_audience_alignment,
        conversion_optimization: analysis.conversion_optimization,
        seo_keywords: analysis.seo_keywords
      },
      profile_stats: {
        followers_count: validatedData.followers_count || 0,
        following_count: validatedData.following_count || 0,
        posts_count: validatedData.posts_count || 0,
        is_verified: validatedData.is_verified,
        is_private: validatedData.is_private
      },
      saved_analysis_id: savedAnalysis.id
    });

  } catch (error: any) {
    console.error('Bio analysis error:', error);

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

    // Get existing bio analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('instagram_bio_analysis')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (analysisError) {
      if (analysisError.code === 'PGRST116') {
        // No analysis found
        return NextResponse.json({
          success: true,
          analysis: null,
          message: 'No bio analysis found for this client'
        });
      }

      console.error('Error fetching bio analysis:', analysisError);
      return NextResponse.json(
        { error: 'Failed to fetch bio analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        bio_text: analysis.bio_text,
        followers_count: analysis.followers_count,
        following_count: analysis.following_count,
        posts_count: analysis.posts_count,
        is_verified: analysis.is_verified,
        is_private: analysis.is_private,
        bio_effectiveness: analysis.bio_effectiveness,
        missing_elements: analysis.missing_elements,
        improvement_suggestions: analysis.improvement_suggestions,
        target_audience_alignment: analysis.target_audience_alignment,
        conversion_optimization: analysis.conversion_optimization,
        seo_keywords: analysis.seo_keywords,
        created_at: analysis.created_at,
        updated_at: analysis.updated_at
      }
    });

  } catch (error: any) {
    console.error('Error fetching bio analysis:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}