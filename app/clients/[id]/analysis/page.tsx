'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function ClientAnalysisPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (clientId) {
      loadAnalysisData();
    }
  }, [clientId]);

  const loadAnalysisData = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const result = await response.json();
        console.log('Analysis data loaded:', result); // Debug
        console.log('Profile Card:', result.profileCard); // Debug
        setData(result);
      }
    } catch (error) {
      console.error('Error loading analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="text-2xl">Analiz yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!data?.professionalAnalysis) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="text-2xl">Analiz bulunamadı</div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: '🟩 AI Profil Kartı', icon: '🎯' },
    { id: 'plan', label: '🟧 Gelişim Planı', icon: '📈' },
    { id: 'presentation', label: '🟥 Müşteri Sunumu', icon: '📊' },
    { id: 'instagram', label: '📱 Instagram Bio', icon: '📱' },
    { id: 'competitors', label: '🏆 Rakip Analizi', icon: '🏆' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.client.name}</h1>
              <p className="text-gray-600">Detaylı Analiz Raporu</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                🔄 Yenile
              </button>
              <button 
                onClick={() => window.close()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                ✕ Kapat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'profile' && data.profileCard && data.profileCard.strategy && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">🟩 AI Profil Kartı</h2>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">🎯 Strateji</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.profileCard.strategy }}
                />
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">👥 Hedef Kitle</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.profileCard.target_audience }}
                />
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">📝 İçerik Önerileri</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.profileCard.content_suggestions }}
                />
              </div>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">⚡ Hızlı Kazanımlar</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.profileCard.quick_wins }}
                />
              </div>
            </div>
          )}

          {activeTab === 'profile' && (!data.profileCard || !data.profileCard.strategy) && data.professionalAnalysis && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">🟦 Profesyonel Analiz</h2>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">📊 Mevcut Seviye</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.professionalAnalysis.current_level_assessment }}
                />
              </div>
              
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">⚠️ Ana Darboğazlar</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.professionalAnalysis.main_bottlenecks }}
                />
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">💪 Güçlü Yanlar</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.professionalAnalysis.strengths }}
                />
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">🚀 Büyüme Potansiyeli</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.professionalAnalysis.realistic_growth_potential }}
                />
              </div>
            </div>
          )}

          {activeTab === 'profile' && (!data.profileCard || !data.profileCard.strategy) && !data.professionalAnalysis && (
            <div>
              <h2 className="text-xl font-bold mb-4">🟩 AI Profil Kartı</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">AI Profil Kartı henüz oluşturulmamış. Analizi başlatın.</p>
              </div>
            </div>
          )}

          {activeTab === 'plan' && data.developmentPlan && data.developmentPlan.thirty_day_plan && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">🟧 Gelişim Planı</h2>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">📋 30 Günlük Plan</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.developmentPlan.thirty_day_plan }}
                />
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">🚀 90 Günlük Plan</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.developmentPlan.ninety_day_plan }}
                />
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">🎯 Hedefler</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.developmentPlan.goals }}
                />
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">📊 Metrikler</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.developmentPlan.metrics }}
                />
              </div>
            </div>
          )}

          {activeTab === 'plan' && (!data.developmentPlan || !data.developmentPlan.thirty_day_plan) && (
            <div>
              <h2 className="text-xl font-bold mb-4">🟧 Gelişim Planı</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">Gelişim planı henüz oluşturulmamış. Analizi başlatın.</p>
              </div>
            </div>
          )}

          {activeTab === 'presentation' && data.presentation && data.presentation.executive_summary && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">🟥 Müşteri Sunumu</h2>
              
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">📊 Özet</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.presentation.executive_summary }}
                />
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">🎯 Öneriler</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.presentation.recommendations }}
                />
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">📈 Beklenen Sonuçlar</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.presentation.expected_results }}
                />
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">💰 Yatırım</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.presentation.investment_required }}
                />
              </div>
            </div>
          )}

          {activeTab === 'presentation' && (!data.presentation || !data.presentation.executive_summary) && (
            <div>
              <h2 className="text-xl font-bold mb-4">🟥 Müşteri Sunumu</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Müşteri sunumu henüz oluşturulmamış. Analizi başlatın.</p>
              </div>
            </div>
          )}

          {activeTab === 'instagram' && data.instagramAnalysis && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">📱 Instagram Bio Analizi</h2>
              
              {/* Instagram Profil Bilgileri */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                <h3 className="font-semibold text-gray-800 mb-4">📊 Profil İstatistikleri</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{data.instagramAnalysis.followers_count?.toLocaleString() || 0}</div>
                    <div className="text-sm text-gray-600">Takipçi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{data.instagramAnalysis.following_count?.toLocaleString() || 0}</div>
                    <div className="text-sm text-gray-600">Takip</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{data.instagramAnalysis.posts_count?.toLocaleString() || 0}</div>
                    <div className="text-sm text-gray-600">Gönderi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg">
                      {data.instagramAnalysis.is_verified ? '✅' : '❌'}
                      {data.instagramAnalysis.is_private ? '🔒' : '🔓'}
                    </div>
                    <div className="text-sm text-gray-600">Durum</div>
                  </div>
                </div>
                
                {data.instagramAnalysis.bio_text && (
                  <div className="mt-4 p-4 bg-white rounded border">
                    <h4 className="font-semibold mb-2">Mevcut Bio:</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{data.instagramAnalysis.bio_text}</p>
                  </div>
                )}
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">✅ Bio Etkinliği</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.instagramAnalysis.bio_effectiveness }}
                />
              </div>
              
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">❌ Eksik Elementler</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.instagramAnalysis.missing_elements }}
                />
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">💡 İyileştirme Önerileri</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.instagramAnalysis.improvement_suggestions }}
                />
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">🎯 Hedef Kitle Uyumu</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.instagramAnalysis.target_audience_alignment }}
                />
              </div>
              
              {data.instagramAnalysis.conversion_optimization && (
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="font-semibold text-gray-800 mb-2">💰 Dönüşüm Optimizasyonu</h3>
                  <div 
                    className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: data.instagramAnalysis.conversion_optimization }}
                  />
                </div>
              )}
              
              {data.instagramAnalysis.seo_keywords && (
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h3 className="font-semibold text-gray-800 mb-2">🔍 SEO & Anahtar Kelimeler</h3>
                  <div 
                    className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: data.instagramAnalysis.seo_keywords }}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'instagram' && !data.instagramAnalysis && (
            <div>
              <h2 className="text-xl font-bold mb-4">📱 Instagram Bio Analizi</h2>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-purple-800">Instagram bio analizi henüz yapılmamış. Analizi başlatın.</p>
              </div>
            </div>
          )}

          {activeTab === 'competitors' && data.competitorAnalysis && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">🏆 Rakip Analizi & SWOT</h2>
              
              {/* Rakip Profilleri */}
              {data.competitorAnalysis.competitors_data && data.competitorAnalysis.competitors_data.competitors && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
                  <h3 className="font-semibold text-gray-800 mb-4">📊 Rakip Profilleri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.competitorAnalysis.competitors_data.competitors
                      .filter((comp: any) => !comp.error)
                      .map((competitor: any, index: number) => (
                      <div key={index} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">@{competitor.username}</h4>
                          {competitor.is_verified && <span className="text-blue-500">✅</span>}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>👥 {competitor.followers?.toLocaleString() || 0} takipçi</div>
                          <div>📸 {competitor.posts?.toLocaleString() || 0} gönderi</div>
                          <div>📂 {competitor.category || 'Diğer'}</div>
                        </div>
                        {competitor.bio && (
                          <div className="mt-2 text-xs text-gray-500 truncate">
                            "{competitor.bio.substring(0, 50)}..."
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">📋 SWOT Analizi</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.competitorAnalysis.swot_analysis }}
                />
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">🎯 Rekabetçi Konumlandırma</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.competitorAnalysis.competitive_positioning }}
                />
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">🚀 Pazar Fırsatları</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.competitorAnalysis.market_opportunities }}
                />
              </div>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">💡 Farklılaşma Stratejisi</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.competitorAnalysis.differentiation_strategy }}
                />
              </div>
            </div>
          )}

          {activeTab === 'competitors' && !data.competitorAnalysis && (
            <div>
              <h2 className="text-xl font-bold mb-4">🏆 Rakip Analizi</h2>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-orange-800">Rakip analizi henüz yapılmamış. Görüşme formunda rakip bilgilerini ekleyip analizi başlatın.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}