'use client';

import { SafeHtml } from '@/components/SafeHtml';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.profileCard.strategy} />
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">👥 Hedef Kitle</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.profileCard.target_audience} />
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">📝 İçerik Önerileri</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.profileCard.content_suggestions} />
              </div>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">⚡ Hızlı Kazanımlar</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.profileCard.quick_wins} />
              </div>
            </div>
          )}

          {activeTab === 'profile' && (!data.profileCard || !data.profileCard.strategy) && data.professionalAnalysis && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">🟦 Profesyonel Analiz</h2>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">📊 Mevcut Seviye</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.professionalAnalysis.current_level_assessment} />
              </div>
              
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">⚠️ Ana Darboğazlar</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.professionalAnalysis.main_bottlenecks} />
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">💪 Güçlü Yanlar</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.professionalAnalysis.strengths} />
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">🚀 Büyüme Potansiyeli</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.professionalAnalysis.realistic_growth_potential} />
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
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.developmentPlan.thirty_day_plan} />
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">🚀 90 Günlük Plan</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.developmentPlan.ninety_day_plan} />
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">🎯 Hedefler</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.developmentPlan.goals} />
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">📊 Metrikler</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.developmentPlan.metrics} />
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
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.presentation.executive_summary} />
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">🎯 Öneriler</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.presentation.recommendations} />
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">📈 Beklenen Sonuçlar</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.presentation.expected_results} />
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">💰 Yatırım</h3>
                <SafeHtml className="text-gray-700 leading-relaxed prose prose-sm max-w-none" html={data.presentation.investment_required} />
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
        </div>

        {/* Bio + Rakip analizleri ayrı sayfalarda — link bırakıyoruz */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={`/clients/${clientId}/bio-analysis`}
            className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow border-l-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">İnteraktif analiz</div>
                <div className="text-lg font-semibold text-gray-900">📱 Instagram Bio Analizi</div>
              </div>
              <span className="text-purple-600">→</span>
            </div>
          </Link>
          <Link
            href={`/clients/${clientId}/competitor-analysis`}
            className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow border-l-4 border-orange-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">İnteraktif analiz</div>
                <div className="text-lg font-semibold text-gray-900">🏆 Rakip Analizi & SWOT</div>
              </div>
              <span className="text-orange-600">→</span>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
