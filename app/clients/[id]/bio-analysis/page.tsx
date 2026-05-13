'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import BioAnalysisForm from '@/components/BioAnalysisForm';
import BioAnalysisResults from '@/components/BioAnalysisResults';

export default function ClientBioAnalysisPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<any>(null);
  const [existingAnalysis, setExistingAnalysis] = useState<any>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const cancelledRef = useRef(false);

  const loadData = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    try {
      const clientResponse = await fetch(`/api/clients/${clientId}`);
      if (!cancelledRef.current && clientResponse.ok) {
        const clientData = await clientResponse.json();
        if (!cancelledRef.current) setClient(clientData.client);
      }

      const analysisResponse = await fetch(`/api/clients/${clientId}/bio-analysis`);
      if (!cancelledRef.current && analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        if (!cancelledRef.current && analysisData.analysis) {
          setExistingAnalysis(analysisData.analysis);
          setCurrentAnalysis(analysisData.analysis);
        }
      }
    } catch {
      // silent
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    loadData();
    return () => { cancelledRef.current = true; };
  }, [clientId, loadData]);

  const handleAnalysisComplete = (result: any) => {
    setCurrentAnalysis({
      ...result.analysis,
      bio_text: result.profile_stats.bio_text,
      followers_count: result.profile_stats.followers_count,
      following_count: result.profile_stats.following_count,
      posts_count: result.profile_stats.posts_count,
      is_verified: result.profile_stats.is_verified,
      is_private: result.profile_stats.is_private,
    });
    // Reload existing analysis to get the saved version
    loadData();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="text-2xl">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="text-2xl">Müşteri bulunamadı</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600">Instagram Bio Analizi</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ← Geri Dön
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div>
          <BioAnalysisForm
            clientId={clientId}
            onAnalysisComplete={handleAnalysisComplete}
            initialData={existingAnalysis ? {
              bio_text: existingAnalysis.bio_text,
              followers_count: existingAnalysis.followers_count,
              following_count: existingAnalysis.following_count,
              posts_count: existingAnalysis.posts_count,
              is_verified: existingAnalysis.is_verified,
              is_private: existingAnalysis.is_private,
            } : undefined}
          />
        </div>

        {/* Right Column - Results */}
        <div>
          {currentAnalysis ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">📊 Analiz Sonuçları</h2>
              <BioAnalysisResults
                analysis={{
                  bio_effectiveness: currentAnalysis.bio_effectiveness,
                  missing_elements: currentAnalysis.missing_elements,
                  improvement_suggestions: currentAnalysis.improvement_suggestions,
                  target_audience_alignment: currentAnalysis.target_audience_alignment,
                  conversion_optimization: currentAnalysis.conversion_optimization,
                  seo_keywords: currentAnalysis.seo_keywords,
                }}
                profileStats={{
                  followers_count: currentAnalysis.followers_count || 0,
                  following_count: currentAnalysis.following_count || 0,
                  posts_count: currentAnalysis.posts_count || 0,
                  is_verified: currentAnalysis.is_verified || false,
                  is_private: currentAnalysis.is_private || false,
                }}
                bioText={currentAnalysis.bio_text || ''}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📱</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bio Analizi Bekleniyor</h2>
              <p className="text-gray-600 mb-6">
                Instagram bio metnini girin ve AI destekli analiz başlatın
              </p>
              <div className="text-sm text-gray-500">
                ✅ Bio etkinliği analizi<br/>
                💡 İyileştirme önerileri<br/>
                🎯 Hedef kitle uyumu<br/>
                🔍 SEO optimizasyonu
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}