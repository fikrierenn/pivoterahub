import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateProfessionalAnalysis, generateAIProfileCard } from '@/lib/llm/professional-analysis';
import { generateDevelopmentPlan } from '@/lib/llm/development-plan';
import { generateClientPresentation } from '@/lib/llm/client-presentation';
import { scrapeCompetitors } from '@/lib/scraping/competitor-scraper';
import { analyzeCompetitors } from '@/lib/llm/competitor-analysis';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = id;

    // 1. MÃ¼ÅŸteri ve form verilerini al
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // En son intake form'u al
    const { data: intakeForms } = await supabase
      .from('client_intake_forms')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1);

    const intakeForm = intakeForms && intakeForms.length > 0 ? intakeForms[0] : null;

    if (!intakeForm) {
      return NextResponse.json({ error: 'Intake form not found' }, { status: 404 });
    }

    const answers = intakeForm.answers;
    const clientData = {
      name: client.name,
      sector: client.sector,
      location: client.city || '',
      goals: answers.main_goals || '',
      meeting_notes: answers.meeting_notes || '',
      competitive_advantage: answers.competitive_advantage || ''
    };

    console.log('ğŸŸ¦ 1. Profesyonel Analiz baÅŸlÄ±yor...');
    
    // ğŸŸ¦ 1. Profesyonel Analiz
    const professionalAnalysis = await generateProfessionalAnalysis(clientData);
    
    // Validate required fields
    if (!professionalAnalysis.current_level_assessment) {
      console.warn('Professional analysis missing current_level_assessment');
    }
    
    const { data: savedProfessionalAnalysis, error: profAnalysisError } = await supabase
      .from('professional_analysis')
      .upsert({
        client_id: clientId,
        ...professionalAnalysis,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profAnalysisError) {
      console.error('Error saving professional analysis:', profAnalysisError);
      throw new Error('Profesyonel analiz kaydedilemedi');
    }

    console.log('ğŸŸ© 2. AI Profil KartÄ± oluÅŸturuluyor...');

    // ğŸŸ© 2. AI Profil KartÄ±
    const profileCard = await generateAIProfileCard(professionalAnalysis, clientData);
    
    // Validate required fields
    if (!profileCard.strategy && !profileCard.target_audience) {
      console.warn('AI Profile Card missing key fields');
    }
    
    const { data: savedProfileCard, error: profileCardError } = await supabase
      .from('ai_profile_card')
      .upsert({
        client_id: clientId,
        ...profileCard,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileCardError) {
      console.error('Error saving AI profile card:', profileCardError);
      throw new Error('AI profil kartÄ± kaydedilemedi');
    }

    console.log('ğŸŸ§ 3. GeliÅŸim PlanÄ± oluÅŸturuluyor...');

    // ğŸŸ§ 3. GeliÅŸim PlanÄ±
    const developmentPlan = await generateDevelopmentPlan(profileCard, clientData);
    
    // Validate required fields
    if (!developmentPlan.thirty_day_plan && !developmentPlan.ninety_day_plan) {
      console.warn('Development Plan missing key plans');
    }
    
    const { data: savedDevelopmentPlan, error: devPlanError } = await supabase
      .from('development_plan')
      .upsert({
        client_id: clientId,
        ...developmentPlan,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (devPlanError) {
      console.error('Error saving development plan:', devPlanError);
      throw new Error('GeliÅŸim planÄ± kaydedilemedi');
    }

    console.log('ğŸŸ¥ 4. MÃ¼ÅŸteri Sunumu oluÅŸturuluyor...');

    // ğŸŸ¥ 4. MÃ¼ÅŸteri Sunumu
    const clientPresentation = await generateClientPresentation(
      professionalAnalysis,
      profileCard,
      developmentPlan,
      clientData
    );
    
    // Validate required fields
    if (!clientPresentation.executive_summary) {
      console.warn('Client Presentation missing executive summary');
    }
    
    const { data: savedPresentation, error: presentationError } = await supabase
      .from('client_presentation')
      .upsert({
        client_id: clientId,
        ...clientPresentation,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (presentationError) {
      console.error('Error saving client presentation:', presentationError);
      throw new Error('MÃ¼ÅŸteri sunumu kaydedilemedi');
    }

    // 5. Instagram Bio Analizi
    console.log('ğŸ“± Instagram bio analizi baÅŸlÄ±yor...');
    let instagramAnalysis = null;
    
    try {
      if (client.ig_handle) {
        // Python Instagram Scraper kullan
        const { PythonInstagramScraper } = await import('@/lib/scraping/python-instagram-scraper');
        const pythonScraper = new PythonInstagramScraper();
        
        console.log('Starting Python Instagram scraper...');
        const pythonProfile = await pythonScraper.scrapeProfile(client.ig_handle);
        if (pythonProfile) {
          // Python response'unu eski format'a çevir
          profile = {
            username: pythonProfile.username,
            followers: pythonProfile.followers,
            following: pythonProfile.following,
            posts: pythonProfile.posts,
            bio: pythonProfile.bio,
            isVerified: pythonProfile.is_verified,
            isPrivate: pythonProfile.is_private,
            recentPosts: []
          };
          
          console.log('âœ… Instaloader scraper success:', profile);
        } else {
          console.log('âŒ Instaloader scraper failed, using mock data...');
          // Fallback to mock data
          profile = {
            username: client.ig_handle,
            followers: 26000,
            following: 1200,
            posts: 450,
            bio: "ğŸ¡ Edirne'nin En GÃ¼venilir Emlak DanÄ±ÅŸmanÄ±\nğŸ“ KÃ¼Ã§Ã¼kyoncalÄ± BÃ¶lgesi UzmanÄ±\nğŸš Drone Ã‡ekimi ile Ã–zel TanÄ±tÄ±m\nğŸ’° Ã–nce YatÄ±rÄ±m, Sonra Tavsiye\nğŸ“ Ä°letiÅŸim iÃ§in DM",
            isVerified: false,
            isPrivate: false,
            recentPosts: []
          };
        }

        if (!pythonProfile) {
          throw new Error('Instagram profil verisi alinamadi');
        }

        if (profile) {
          // Bio analizi yap
          const { analyzeInstagramBio } = await import('@/lib/llm/instagram-analysis');
          const bioAnalysis = await analyzeInstagramBio(profile.bio, clientData);
          
          // Database'e kaydet
          const { data: savedBioAnalysis, error: bioError } = await supabase
            .from('instagram_bio_analysis')
            .upsert({
              client_id: clientId,
              username: profile.username,
              bio_text: profile.bio,
              followers_count: profile.followers,
              following_count: profile.following,
              posts_count: profile.posts,
              is_verified: profile.isVerified,
              is_private: profile.isPrivate,
              ...bioAnalysis,
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (bioError) {
            console.error('Error saving Instagram bio analysis:', bioError);
            instagramAnalysis = {
              username: profile.username,
              followers: profile.followers,
              bio: profile.bio,
              error: 'Database save failed'
            };
          } else {
            instagramAnalysis = savedBioAnalysis;
            console.log('âœ… Instagram bio analizi tamamlandÄ± ve kaydedildi');
          }
        } else {
          console.log('âš ï¸ Instagram profili Ã§ekilemedi');
        }
      } else {
        console.log('âš ï¸ Instagram handle bulunamadÄ±');
      }
    } catch (error) {
      console.error('âŒ Instagram analizi hatasÄ±:', error);
    }

    console.log('ğŸ† 6. Rakip Analizi baÅŸlÄ±yor...');

    // 6. Rakip Analizi
    let competitorAnalysis = null;
    
    try {
      // Intake form'dan rakip bilgilerini al
      const competitorUrls = answers.competitors || '';
      
      if (competitorUrls && instagramAnalysis) {
        const { CompetitorScraper } = await import('@/lib/scraping/competitor-scraper');
        const { analyzeCompetitors } = await import('@/lib/llm/competitor-analysis');
        
        const competitorScraper = new CompetitorScraper();
        const competitorUsernames = competitorScraper.extractCompetitorUsernames(competitorUrls);
        
        if (competitorUsernames.length > 0) {
          console.log(`Scraping ${competitorUsernames.length} competitors: ${competitorUsernames.join(', ')}`);
          
          // GeÃ§ici olarak mock data kullan (Instagram rate limited)
        const scrapingResult = await competitorScraper.scrapeCompetitorsWithFallback(competitorUsernames);
          
          if (scrapingResult && scrapingResult.competitors.length > 0) {
            // BaÅŸarÄ±lÄ± rakipleri filtrele
            const validCompetitors = scrapingResult.competitors.filter(c => !c.error);
            
            if (validCompetitors.length > 0) {
              // MÃ¼ÅŸteri profilini rakip formatÄ±na Ã§evir
              const clientProfile = {
                username: instagramAnalysis.username,
                full_name: clientData.name,
                followers: instagramAnalysis.followers_count,
                following: instagramAnalysis.following_count,
                posts: instagramAnalysis.posts_count,
                bio: instagramAnalysis.bio_text,
                is_verified: instagramAnalysis.is_verified,
                is_private: instagramAnalysis.is_private
              };
              
              // AI rakip analizi yap
              const analysis = await analyzeCompetitors(clientProfile, validCompetitors, clientData);
              
              // Database'e kaydet
              const { data: savedCompetitorAnalysis, error: competitorError } = await supabase
                .from('competitor_analysis')
                .upsert({
                  client_id: clientId,
                  competitors_data: scrapingResult,
                  ...analysis,
                  updated_at: new Date().toISOString()
                })
                .select()
                .single();

              if (competitorError) {
                console.error('Error saving competitor analysis:', competitorError);
              } else {
                competitorAnalysis = savedCompetitorAnalysis;
                console.log(`âœ… Rakip analizi tamamlandÄ±: ${validCompetitors.length} rakip analiz edildi`);
              }
            } else {
              console.log('âŒ HiÃ§bir rakip baÅŸarÄ±yla scrape edilemedi');
            }
          } else {
            console.log('âŒ Rakip scraping baÅŸarÄ±sÄ±z');
          }
        } else {
          console.log('âš ï¸ Rakip URL\'leri bulunamadÄ± veya parse edilemedi');
        }
      } else {
        console.log('âš ï¸ Rakip bilgileri veya mÃ¼ÅŸteri profili eksik');
      }
    } catch (error) {
      console.error('âŒ Rakip analizi hatasÄ±:', error);
    }

    console.log('âœ… TÃ¼m analizler tamamlandÄ±!');

    return NextResponse.json({
      success: true,
      professional_analysis: savedProfessionalAnalysis,
      profile_card: savedProfileCard,
      development_plan: savedDevelopmentPlan,
      presentation: savedPresentation,
      instagram_analysis: instagramAnalysis,
      competitor_analysis: competitorAnalysis,
      message: 'TÃ¼m analizler baÅŸarÄ±yla tamamlandÄ±'
    });

  } catch (error: any) {
    console.error('Complete analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Analiz sÄ±rasÄ±nda hata oluÅŸtu' },
      { status: 500 }
    );
  }
}

