'use client';

import { SafeHtml } from '@/components/SafeHtml';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface CompetitorData {
  username: string;
  full_name?: string;
  followers: number;
  following: number;
  posts: number;
  bio: string;
  is_verified: boolean;
  is_private: boolean;
  engagement_rate?: number;
  category?: string;
  avg_likes?: number;
  avg_comments?: number;
  posting_frequency?: string;
  content_types?: {
    video_ratio: number;
    photo_ratio: number;
  };
  /** Scrape başarısızsa server tarafında doldurulur. */
  error?: string;
}

export default function CompetitorAnalysisPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<any>(null);
  const [competitorUsernames, setCompetitorUsernames] = useState<string>('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [competitorsData, setCompetitorsData] = useState<CompetitorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const clientResponse = await fetch(`/api/clients/${clientId}`);
        if (!cancelled && clientResponse.ok) {
          const clientData = await clientResponse.json();
          if (!cancelled) {
            setClient(clientData.client);
            if (clientData.intakeForm?.answers?.competitors) {
              setCompetitorUsernames(clientData.intakeForm.answers.competitors);
            }
          }
        }

        const analysisResponse = await fetch(`/api/clients/${clientId}/competitor-analysis`);
        if (!cancelled && analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          if (!cancelled && analysisData.analysis) {
            setAnalysis(analysisData.analysis);
            setCompetitorsData(analysisData.competitors_data?.competitors || []);
          }
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [clientId]);

  const extractUsernames = (text: string): string[] => {
    if (!text) return [];
    
    const usernames: string[] = [];
    const lines = text.split(/[,\n]/);
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Instagram URL'den username çıkar
      const urlMatch = trimmed.match(/instagram\.com\/([^\/\?]+)/);
      if (urlMatch) {
        usernames.push(urlMatch[1]);
      } else if (trimmed.startsWith('@')) {
        // @username formatı
        usernames.push(trimmed.substring(1));
      } else if (!trimmed.includes('/') && !trimmed.includes('.')) {
        // Sadece username
        usernames.push(trimmed);
      }
    }
    
    return usernames.filter(u => u && u.length > 0);
  };

  const startAnalysis = async (forceRefresh = false) => {
    const usernames = extractUsernames(competitorUsernames);
    
    if (usernames.length === 0) {
      alert('Lütfen en az bir rakip Instagram kullanıcı adı girin');
      return;
    }

    if (usernames.length > 10) {
      alert('Maksimum 10 rakip analiz edilebilir');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/competitor-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          competitor_usernames: usernames,
          force_refresh: forceRefresh
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analiz başarısız');
      }

      const result = await response.json();
      setAnalysis(result.analysis);
      setCompetitorsData(result.competitors_data?.competitors || []);
      
    } catch (error: any) {
      console.error('Competitor analysis error:', error);
      alert(error.message || 'Analiz sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
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

  const validCompetitors = competitorsData.filter(c => !c.error);
  const failedCompetitors = competitorsData.filter(c => c.error);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600">Rakip Analizi & SWOT</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">🏆 Rakip Analizi</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rakip Instagram Hesapları
                </label>
                <textarea
                  value={competitorUsernames}
                  onChange={(e) => setCompetitorUsernames(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder="@rakip1&#10;@rakip2&#10;https://instagram.com/rakip3&#10;&#10;Her satıra bir rakip yazın"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {extractUsernames(competitorUsernames).length} rakip tespit edildi (max 10)
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => startAnalysis(false)}
                  disabled={loading || extractUsernames(competitorUsernames).length === 0}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analiz Ediliyor...
                    </span>
                  ) : (
                    '🚀 Rakip Analizi Başlat'
                  )}
                </button>
              </div>

              {analysis && (
                <button
                  onClick={() => startAnalysis(true)}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm"
                >
                  🔄 Yeniden Analiz Et
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2">
          {analysis ? (
            <div className="space-y-6">
              {/* Competitor Profiles */}
              {validCompetitors.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
                  <h3 className="font-semibold text-gray-800 mb-4">📊 Rakip Profilleri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {validCompetitors.map((competitor, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">@{competitor.username}</h4>
                          {competitor.is_verified && <span className="text-blue-500">✅</span>}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>👥 {competitor.followers?.toLocaleString() || 0} takipçi</div>
                          <div>📸 {competitor.posts?.toLocaleString() || 0} gönderi</div>
                          <div>📂 {competitor.category || 'Diğer'}</div>
                          {competitor.engagement_rate && (
                            <div>📈 {competitor.engagement_rate}% engagement</div>
                          )}
                        </div>
                        {competitor.bio && (
                          <div className="mt-2 text-xs text-gray-500 truncate">
                            "{competitor.bio.substring(0, 50)}..."
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {failedCompetitors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-800 text-sm">
                        ⚠️ {failedCompetitors.length} rakip analiz edilemedi: {failedCompetitors.map(c => c.username).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SWOT Analysis */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📋 SWOT Analizi</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={analysis.swot_analysis} />
              </div>

              {/* Competitive Positioning */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Rekabetçi Konumlandırma</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={analysis.competitive_positioning} />
              </div>

              {/* Market Opportunities */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 Pazar Fırsatları</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={analysis.market_opportunities} />
              </div>

              {/* Differentiation Strategy */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">💡 Farklılaşma Stratejisi</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={analysis.differentiation_strategy} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Rakip Analizi Bekleniyor</h2>
              <p className="text-gray-600 mb-6">
                Rakip Instagram hesaplarını girin ve AI destekli SWOT analizi başlatın
              </p>
              <div className="text-sm text-gray-500">
                📋 SWOT Analizi<br/>
                🎯 Rekabetçi Konumlandırma<br/>
                🚀 Pazar Fırsatları<br/>
                💡 Farklılaşma Stratejisi
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}