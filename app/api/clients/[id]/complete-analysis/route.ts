import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateProfessionalAnalysis, generateAIProfileCard } from '@/lib/llm/professional-analysis';
import { generateDevelopmentPlan } from '@/lib/llm/development-plan';
import { generateClientPresentation } from '@/lib/llm/client-presentation';
import { analyzeCompetitors } from '@/lib/llm/competitor-analysis';
import { CompetitorScraper } from '@/lib/scraping/competitor-scraper';
import { PythonInstagramScraper } from '@/lib/scraping/python-instagram-scraper';
import { analyzeInstagramBio } from '@/lib/llm/instagram-analysis';
import { enforceRateLimit } from '@/lib/rateLimitGuard';
import { logger } from '@/lib/logger';

interface ClientData {
  name: string;
  sector: string;
  location: string;
  goals: string;
  meeting_notes: string;
  competitive_advantage: string;
}

interface PartialFailure {
  step: string;
  message: string;
}

// ── Zincir 1: Consulting (LLM sıralı, 4 adım — paralelleştirilemez) ─────
async function runConsultingPipeline(
  clientId: string,
  clientData: ClientData,
  failures: PartialFailure[],
) {
  const start = Date.now();
  logger.info('consulting:start', { clientId });

  try {
    // 1. Profesyonel Analiz
    const professionalAnalysis = await generateProfessionalAnalysis(clientData);
    const { data: savedProf, error: profErr } = await supabase
      .from('professional_analysis')
      .upsert({ client_id: clientId, ...professionalAnalysis, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (profErr) throw new Error('Profesyonel analiz kaydedilemedi: ' + profErr.message);

    // 2. AI Profil Kartı
    const profileCard = await generateAIProfileCard(professionalAnalysis, clientData);
    const { data: savedCard, error: cardErr } = await supabase
      .from('ai_profile_card')
      .upsert({ client_id: clientId, ...profileCard, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (cardErr) throw new Error('AI profil kartı kaydedilemedi: ' + cardErr.message);

    // 3. Gelişim Planı
    const developmentPlan = await generateDevelopmentPlan(profileCard, clientData);
    const { data: savedPlan, error: planErr } = await supabase
      .from('development_plan')
      .upsert({ client_id: clientId, ...developmentPlan, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (planErr) throw new Error('Gelişim planı kaydedilemedi: ' + planErr.message);

    // 4. Müşteri Sunumu
    const presentation = await generateClientPresentation(
      professionalAnalysis,
      profileCard,
      developmentPlan,
      clientData,
    );
    const { data: savedPres, error: presErr } = await supabase
      .from('client_presentation')
      .upsert({ client_id: clientId, ...presentation, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (presErr) throw new Error('Müşteri sunumu kaydedilemedi: ' + presErr.message);

    logger.info('consulting:done', { clientId, ms: Date.now() - start });
    return { savedProf, savedCard, savedPlan, savedPres };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('consulting:fail', err, { clientId, ms: Date.now() - start });
    failures.push({ step: 'consulting', message: msg });
    return { savedProf: null, savedCard: null, savedPlan: null, savedPres: null };
  }
}

// ── Zincir 2: Instagram (scrape + bio analysis) ──────────────────────────
async function runInstagramPipeline(
  clientId: string,
  igHandle: string | null,
  clientData: ClientData,
  failures: PartialFailure[],
) {
  if (!igHandle) {
    logger.info('instagram:skip', { clientId, reason: 'no ig_handle' });
    return null;
  }

  const start = Date.now();
  logger.info('instagram:start', { clientId, igHandle });

  try {
    const scraper = new PythonInstagramScraper();
    const pythonProfile = await scraper.scrapeProfile(igHandle);
    if (!pythonProfile) {
      throw new Error('Instagram profil verisi alınamadı (scraper null döndü)');
    }

    const bioAnalysis = await analyzeInstagramBio(pythonProfile.bio, clientData);

    const { data: saved, error } = await supabase
      .from('instagram_bio_analysis')
      .upsert({
        client_id: clientId,
        username: pythonProfile.username,
        bio_text: pythonProfile.bio,
        followers_count: pythonProfile.followers,
        following_count: pythonProfile.following,
        posts_count: pythonProfile.posts,
        is_verified: pythonProfile.is_verified,
        is_private: pythonProfile.is_private,
        ...bioAnalysis,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error('Instagram bio kaydedilemedi: ' + error.message);

    logger.info('instagram:done', { clientId, ms: Date.now() - start });
    return saved;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('instagram:fail', err, { clientId, ms: Date.now() - start });
    failures.push({ step: 'instagram', message: msg });
    return null;
  }
}

// ── Zincir 3: Competitor (Instagram'a bağımlı — clientProfile için) ─────
async function runCompetitorPipeline(
  clientId: string,
  competitorUrls: string,
  instagramAnalysis: { username?: string; followers_count?: number; following_count?: number; posts_count?: number; bio_text?: string; is_verified?: boolean; is_private?: boolean } | null,
  clientData: ClientData,
  failures: PartialFailure[],
) {
  if (!competitorUrls) {
    logger.info('competitor:skip', { clientId, reason: 'no competitor urls' });
    return null;
  }
  if (!instagramAnalysis) {
    logger.info('competitor:skip', { clientId, reason: 'instagram pipeline başarısız' });
    return null;
  }

  const start = Date.now();
  logger.info('competitor:start', { clientId });

  try {
    const scraper = new CompetitorScraper();
    const usernames = scraper.extractCompetitorUsernames(competitorUrls);
    if (usernames.length === 0) {
      logger.info('competitor:skip', { clientId, reason: 'no usernames parsed' });
      return null;
    }

    const scrapingResult = await scraper.scrapeCompetitorsWithFallback(usernames);
    const validCompetitors = scrapingResult.competitors.filter((c) => !c.error);
    if (validCompetitors.length === 0) {
      throw new Error('Hiçbir rakip başarıyla scrape edilemedi');
    }

    const clientProfile = {
      username: instagramAnalysis.username ?? '',
      full_name: clientData.name,
      followers: instagramAnalysis.followers_count ?? 0,
      following: instagramAnalysis.following_count ?? 0,
      posts: instagramAnalysis.posts_count ?? 0,
      bio: instagramAnalysis.bio_text ?? '',
      is_verified: instagramAnalysis.is_verified ?? false,
      is_private: instagramAnalysis.is_private ?? false,
    };

    const analysis = await analyzeCompetitors(clientProfile, validCompetitors, clientData);

    const { data: saved, error } = await supabase
      .from('competitor_analysis')
      .upsert({
        client_id: clientId,
        competitors_data: scrapingResult,
        ...analysis,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error('Rakip analizi kaydedilemedi: ' + error.message);

    logger.info('competitor:done', { clientId, validCount: validCompetitors.length, ms: Date.now() - start });
    return saved;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('competitor:fail', err, { clientId, ms: Date.now() - start });
    failures.push({ step: 'competitor', message: msg });
    return null;
  }
}

// ── Ana Orkestratör ──────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await enforceRateLimit(request, 'ANALYZE');
  if (limited) return limited;

  const overallStart = Date.now();
  const { id: clientId } = await params;

  // Hazırlık: client + intake form yükle
  const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const { data: intakeForms } = await supabase
    .from('client_intake_forms')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1);

  const intakeForm = intakeForms && intakeForms.length > 0 ? intakeForms[0] : null;
  if (!intakeForm) return NextResponse.json({ error: 'Intake form not found' }, { status: 404 });

  const answers = intakeForm.answers ?? {};
  const clientData: ClientData = {
    name: client.name,
    sector: client.sector,
    location: client.city || '',
    goals: answers.main_goals || '',
    meeting_notes: answers.meeting_notes || '',
    competitive_advantage: answers.competitive_advantage || '',
  };

  const failures: PartialFailure[] = [];

  logger.info('complete-analysis:start', { clientId });

  // Zincir 1 + Zincir 2 paralel — bağımsız
  const [consulting, instagram] = await Promise.all([
    runConsultingPipeline(clientId, clientData, failures),
    runInstagramPipeline(clientId, client.ig_handle ?? null, clientData, failures),
  ]);

  // Zincir 3 — Instagram'a bağımlı, paralel başlatılamaz
  const competitor = await runCompetitorPipeline(
    clientId,
    answers.competitors ?? '',
    instagram,
    clientData,
    failures,
  );

  const totalMs = Date.now() - overallStart;
  logger.info('complete-analysis:done', {
    clientId,
    ms: totalMs,
    failures: failures.map((f) => f.step),
  });

  return NextResponse.json({
    success: failures.length === 0,
    professional_analysis: consulting.savedProf,
    profile_card: consulting.savedCard,
    development_plan: consulting.savedPlan,
    presentation: consulting.savedPres,
    instagram_analysis: instagram,
    competitor_analysis: competitor,
    partial_failures: failures,
    duration_ms: totalMs,
    message: failures.length === 0 ? 'Tüm analizler tamamlandı' : 'Bazı adımlar başarısız oldu — detay partial_failures alanında',
  });
}
