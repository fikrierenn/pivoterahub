'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import IntakeFormViewer from '@/components/IntakeFormViewer';
import VideoAnalysisForm from '@/components/VideoAnalysisForm';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showVideoAnalysisForm, setShowVideoAnalysisForm] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  // Sayfa focus olduğunda veriyi yenile (form'dan dönüldüğünde)
  useEffect(() => {
    const handleFocus = () => {
      if (clientId) {
        loadClientData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [clientId]);

  const loadClientData = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data); // Debug için
        setClientData(data);
      } else {
        console.error('Failed to load client data');
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCompleteAnalysis = async () => {
    if (!clientId) return;
    
    setAnalyzing(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/complete-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        alert('Analiz başarıyla tamamlandı! Sayfa yenileniyor...');
        loadClientData(); // Sayfayı yenile
      } else {
        const error = await response.json();
        alert(`Analiz hatası: ${error.error}`);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analiz sırasında hata oluştu');
    } finally {
      setAnalyzing(false);
    }
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

  const { client, intakeForm, analysis, videosCount } = clientData;

  if (!client) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Müşteri bulunamadı</h1>
          <Link href="/clients" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Müşteri listesine dön
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = {
    lead: { emoji: '🔵', label: 'Lead', color: 'bg-blue-100 text-blue-800' },
    prospect: { emoji: '🟡', label: 'Prospect', color: 'bg-yellow-100 text-yellow-800' },
    active: { emoji: '🟢', label: 'Active', color: 'bg-green-100 text-green-800' },
    inactive: { emoji: '⚪', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
    completed: { emoji: '✅', label: 'Completed', color: 'bg-purple-100 text-purple-800' },
  };
  const status = statusConfig[client.status as keyof typeof statusConfig] || statusConfig.lead;

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Client Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl text-white">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {client.name}
                </h1>
                <span className={`px-4 py-2 text-sm font-semibold rounded-xl border ${
                  client.status === 'lead' ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200/50' :
                  client.status === 'prospect' ? 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200/50' :
                  client.status === 'active' ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200/50' :
                  client.status === 'inactive' ? 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border-slate-200/50' :
                  'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200/50'
                }`}>
                  {status.emoji} {status.label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏢</span>
                  <span className="font-medium">{client.sector}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <span className="font-medium">{client.city || 'Şehir belirtilmemiş'}</span>
                </div>
                {client.ig_handle && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    <span className="font-medium text-pink-600">@{client.ig_handle}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {!intakeForm ? (
              <Link
                href={`/clients/${client.id}/intake`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                📋 Görüşme Formu Doldur
              </Link>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={startCompleteAnalysis}
                  disabled={analyzing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {analyzing ? '🔄 Analiz Ediliyor...' : '🚀 Komple Analiz Başlat'}
                </button>
                <Link
                  href={`/clients/${clientId}/bio-analysis`}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  📱 Bio Analizi
                </Link>
                <Link
                  href={`/clients/${clientId}/competitor-analysis`}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  🏆 Rakip Analizi
                </Link>
                <Link
                  href={`/clients/${clientId}/video-performance`}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  🎯 Viral Analiz
                </Link>
                <button
                  onClick={() => setShowVideoAnalysisForm(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  🎥 Video Analizi Yap
                </button>
                {clientData?.professionalAnalysis && (
                  <button 
                    onClick={() => window.open(`/clients/${clientId}/analysis`, '_blank')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    📊 Raporu Görüntüle
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Toplam Video</div>
          <div className="text-3xl font-bold text-gray-900">{videosCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Haftalık Kapasite</div>
          <div className="text-3xl font-bold text-gray-900">{client.weekly_content_capacity}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Konumlandırma</div>
          <div className="text-lg font-bold text-gray-900 capitalize">{client.positioning || 'mid'}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Instagram</div>
          <div className="text-lg font-bold text-gray-900">{client.ig_handle || '-'}</div>
        </div>
      </div>

      {/* Müşteri Bilgileri */}
      {intakeForm ? (
        <IntakeFormViewer
          answers={intakeForm.answers}
          onEdit={() => router.push(`/clients/${clientId}/intake`)}
          showEditButton={true}
        />
      ) : (
        <div className="bg-white rounded-lg shadow p-8 mb-8 text-center">
          <div className="text-5xl mb-3">📋</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Görüşme formu henüz doldurulmadı</h2>
          <p className="text-sm text-gray-600 mb-4">
            Müşteri için tüm analizleri başlatmadan önce görüşme formunu doldurun.
          </p>
          <Link
            href={`/clients/${clientId}/intake`}
            className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            ✏️ Görüşme Formunu Doldur
          </Link>
        </div>
      )}

      {/* Debug: Analiz Durumu */}
      <div className="bg-yellow-100 rounded-lg p-4 mb-6">
        <h3 className="font-bold mb-2">⚠️ Analiz Durumu:</h3>
        <p className="text-sm">
          {clientData?.professionalAnalysis ? 
            (clientData.professionalAnalysis.current_level_assessment ? 
              '✅ Analiz tamamlandı ve veri var' : 
              '❌ Analiz kaydı var ama içerik boş - AI analizi başarısız') 
            : '❌ Analiz kaydı yok'}
        </p>
      </div>

      {clientData?.professionalAnalysis && clientData.professionalAnalysis.current_level_assessment ? (
        <div className="space-y-6">
          {/* Profesyonel Analiz */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-3">🟦</span>
              Profesyonel Analiz
            </h2>
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">📊 Mevcut Seviye</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: clientData.professionalAnalysis.current_level_assessment || 'Veri yok' 
                  }}
                />
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">⚠️ Ana Darboğazlar</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: clientData.professionalAnalysis.main_bottlenecks || 'Veri yok' 
                  }}
                />
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">💪 Güçlü Yanlar</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: clientData.professionalAnalysis.strengths || 'Veri yok' 
                  }}
                />
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">🚀 Büyüme Potansiyeli</h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: clientData.professionalAnalysis.realistic_growth_potential || 'Veri yok' 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Detaylı Analiz Butonu */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow p-6 text-center border border-green-200">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Detaylı Analiz Raporu Hazır!</h3>
            <p className="text-gray-600 mb-4">
              🟩 AI Profil Kartı • 🟧 Gelişim Planı • 🟥 Müşteri Sunumu
            </p>
            <button 
              onClick={() => window.open(`/clients/${clientId}/analysis`, '_blank')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              📊 Detaylı Raporu Görüntüle
            </button>
          </div>
        </div>
      ) : clientData?.professionalAnalysis ? (
        <div className="bg-orange-100 rounded-lg shadow p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Analiz Tamamlanamadı</h2>
          <p className="text-gray-600 mb-4">
            AI analizi çalıştırıldı ama boş sonuç döndü. Tekrar deneyin.
          </p>
          <button 
            onClick={startCompleteAnalysis}
            disabled={analyzing}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {analyzing ? '🔄 Tekrar Analiz Ediliyor...' : '🔄 Analizi Tekrar Çalıştır'}
          </button>
        </div>
      ) : analysis ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Profil Özeti (Eski)</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{analysis.profile_summary}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Henüz analiz yapılmamış</h2>
          <p className="text-gray-600 mb-6">
            Müşteri görüşme formunu doldurarak AI destekli analiz oluşturun
          </p>
          <Link
            href={`/clients/${client.id}/intake`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Görüşme Formu Doldur
          </Link>
        </div>
      )}

      {/* Video Analysis Form Modal */}
      <VideoAnalysisForm
        isOpen={showVideoAnalysisForm}
        onClose={() => setShowVideoAnalysisForm(false)}
        onSuccess={() => {
          setShowVideoAnalysisForm(false);
          loadClientData(); // Refresh client data
        }}
        clientId={clientId}
      />
    </div>
  );
}
