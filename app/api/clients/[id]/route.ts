import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { enforceRateLimit } from '@/lib/rateLimitGuard';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const limited = await enforceRateLimit(request, 'DEFAULT');
    if (limited) return limited;

    try {
        const { id } = await params;
        const clientId = id;

        // Müşteri bilgilerini al
        const { data: client } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Görüşme formu var mı? (En son kaydı al)
        const { data: intakeForms } = await supabase
            .from('client_intake_forms')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1);

        const intakeForm = intakeForms && intakeForms.length > 0 ? intakeForms[0] : null;

        // Analiz var mı?
        const { data: analysis } = await supabase
            .from('client_analysis')
            .select('*')
            .eq('client_id', clientId)
            .single();

        // Video sayısı
        const { count: videosCount } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', clientId);

        // Tüm analizleri al (En son kayıtları)
        const { data: professionalAnalysisList } = await supabase
            .from('professional_analysis')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1);

        const { data: profileCardList } = await supabase
            .from('ai_profile_card')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1);

        const { data: developmentPlanList } = await supabase
            .from('development_plan')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1);

        const { data: presentationList } = await supabase
            .from('client_presentation')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1);

        const professionalAnalysis = professionalAnalysisList && professionalAnalysisList.length > 0 ? professionalAnalysisList[0] : null;
        const profileCard = profileCardList && profileCardList.length > 0 ? profileCardList[0] : null;
        const developmentPlan = developmentPlanList && developmentPlanList.length > 0 ? developmentPlanList[0] : null;
        const presentation = presentationList && presentationList.length > 0 ? presentationList[0] : null;

        // Instagram bio analizi al (En son kaydı)
        const { data: instagramAnalysisList } = await supabase
            .from('instagram_bio_analysis')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1);

        const instagramAnalysis = instagramAnalysisList && instagramAnalysisList.length > 0 ? instagramAnalysisList[0] : null;

        // Rakip analizi al (En son kaydı)
        const { data: competitorAnalysisList } = await supabase
            .from('competitor_analysis')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1);

        const competitorAnalysis = competitorAnalysisList && competitorAnalysisList.length > 0 ? competitorAnalysisList[0] : null;

        return NextResponse.json({
            client,
            intakeForm,
            analysis,
            videosCount: videosCount || 0,
            professionalAnalysis,
            profileCard,
            developmentPlan,
            presentation,
            instagramAnalysis,
            competitorAnalysis
        });

    } catch (error: any) {
        console.error('Error fetching client details:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}