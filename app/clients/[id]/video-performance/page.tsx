'use client';

import { SafeHtml } from '@/components/SafeHtml';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PerformanceLineChart from '@/components/charts/PerformanceLineChart';
import DashboardWidget from '@/components/charts/DashboardWidget';

export default function VideoPerformancePage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('viral');

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const clientResponse = await fetch(`/api/clients/${clientId}`);
        if (!cancelled && clientResponse.ok) {
          const clientData = await clientResponse.json();
          if (!cancelled) setClient(clientData.client);
        }

        const performanceResponse = await fetch(`/api/clients/${clientId}/video-performance`);
        if (!cancelled && performanceResponse.ok) {
          const performanceData = await performanceResponse.json();
          if (!cancelled) {
            setAnalysis({ summary: performanceData.summary, recent_videos: performanceData.recent_videos });
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

  const startAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/video-performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analiz başarısız');
      }

      const result = await response.json();
      setAnalysis(result);
      
    } catch (error: any) {
      console.error('Video performance analysis error:', error);
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

  const hasFullAnalysis = analysis?.viral_analysis && analysis?.performance_insights;
  const hasVideos = analysis?.summary?.total_videos > 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600">Video Performans Analizi & Viral İçgörüler</p>
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

      {/* Summary Stats */}
      {analysis?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Toplam Video</div>
            <div className="text-3xl font-bold text-gray-900">{analysis.summary.total_videos}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Toplam İzlenme</div>
            <div className="text-3xl font-bold text-gray-900">{analysis.summary.total_views?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Ortalama İzlenme</div>
            <div className="text-3xl font-bold text-gray-900">{analysis.summary.avg_views?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Ortalama Engagement</div>
            <div className="text-3xl font-bold text-gray-900">%{analysis.summary.avg_engagement_rate?.toFixed(2) || '0.00'}</div>
          </div>
        </div>
      )}

      {/* Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Action Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">🎯 Viral Analiz</h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📊 Analiz Kapsamı</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Viral video faktörleri</li>
                  <li>• İçerik kalıpları analizi</li>
                  <li>• Hook ve engagement analizi</li>
                  <li>• Performans optimizasyonu</li>
                  <li>• Büyüme stratejileri</li>
                </ul>
              </div>

              {hasVideos ? (
                <div>
                  <button
                    onClick={startAnalysis}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
                      '🚀 Viral Analiz Başlat'
                    )}
                  </button>
                  
                  {analysis?.recent_videos && analysis.recent_videos.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Son Videolar</h4>
                      <div className="space-y-2">
                        {analysis.recent_videos.slice(0, 3).map((video: any, index: number) => (
                          <div key={video.id} className="text-sm bg-gray-50 p-2 rounded">
                            <div className="font-medium">Video #{index + 1}</div>
                            <div className="text-gray-600">
                              {video.views?.toLocaleString() || 0} izlenme • %{video.engagement_rate?.toFixed(2) || '0.00'} engagement
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Analiz için yeterli video verisi bulunamadı. Önce video analizi yapın.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2">
          {hasFullAnalysis ? (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('viral')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'viral'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🎯 Viral Faktörler
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'performance'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 Performans İçgörüleri
                </button>
              </div>

              {/* Viral Analysis Tab */}
              {activeTab === 'viral' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">🔥 Viral Faktörler</h3>
                    <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={analysis.viral_analysis.viral_factors} />
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">📋 İçerik Kalıpları</h3>
                    <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={analysis.viral_analysis.content_patterns} />
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Hook Analizi</h3>
                    <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={analysis.viral_analysis.hook_analysis} />
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 Tekrarlama Stratejisi</h3>
                    <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={analysis.viral_analysis.replication_strategy} />
                  </div>
                </div>
              )}

              {/* Performance Insights Tab */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 En İyi Performans</h3>
                    <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={analysis.performance_insights.top_performing_content} />
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">🎥 İçerik Türü Analizi</h3>
                    <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={analysis.performance_insights.content_type_analysis} />
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">#️⃣ Hashtag Etkinliği</h3>
                    <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={analysis.performance_insights.hashtag_effectiveness} />
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Büyüme Önerileri</h3>
                    <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={analysis.performance_insights.growth_recommendations} />
                  </div>
                </div>
              )}

              {/* Performance Charts */}
              {analysis.top_videos && analysis.top_videos.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Views vs Engagement Chart */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">📊 İzlenme vs Engagement</h3>
                    <DashboardWidget
                      title=""
                      data={analysis.top_videos.map((video: any, index: number) => ({
                        name: `Video ${index + 1}`,
                        views: video.views,
                        engagement: video.engagement_rate
                      }))}
                      chartType="bar"
                      size="medium"
                      nameKey="name"
                      dataKey="views"
                      color="#3B82F6"
                    />
                  </div>

                  {/* Performance Trend */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">📈 Performans Trendi</h3>
                    <PerformanceLineChart
                      data={analysis.top_videos.map((video: any, index: number) => ({
                        date: video.published_at,
                        views: video.views,
                        likes: 0,
                        comments: 0,
                        shares: 0,
                        saves: 0,
                        engagement_rate: video.engagement_rate,
                        platform: 'instagram'
                      }))}
                      metrics={['views', 'engagement_rate']}
                      height={250}
                    />
                  </div>
                </div>
              )}

              {/* Top Videos */}
              {analysis.top_videos && analysis.top_videos.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                  <h3 className="font-semibold text-gray-800 mb-4">🏆 En İyi Performans Gösteren Videolar</h3>
                  <div className="space-y-3">
                    {analysis.top_videos.map((video: any, index: number) => (
                      <div key={video.video_id} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">#{index + 1} En İyi Video</div>
                            <div className="text-sm text-gray-600">
                              {video.views?.toLocaleString()} izlenme • %{video.engagement_rate?.toFixed(2)} engagement
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(video.published_at).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                          <a 
                            href={video.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            🔗 Görüntüle
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Viral Analiz Bekleniyor</h2>
              <p className="text-gray-600 mb-6">
                Video performansınızı analiz ederek viral faktörleri ve büyüme fırsatlarını keşfedin
              </p>
              <div className="text-sm text-gray-500">
                🔥 Viral faktör analizi<br/>
                📊 Performans insights<br/>
                🎯 Hook optimizasyonu<br/>
                📈 Büyüme stratejileri
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}