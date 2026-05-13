'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface VideoAnalysisFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  clientId?: string;
}

type VideoSource = 'url' | 'file';

export default function VideoAnalysisForm({ isOpen, onClose, onSuccess, clientId }: VideoAnalysisFormProps) {
  const submittingRef = useRef(false);
  const [formData, setFormData] = useState({
    client_id: clientId || '',
    url: '',
    platform: 'instagram',
    duration_sec: 30,
    captions: '',
    hashtags: [] as string[],
    published_at: '',
    metrics: {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0
    }
  });

  const [videoSource, setVideoSource] = useState<VideoSource>('url');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [hashtagInput, setHashtagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [clientLoadError, setClientLoadError] = useState(false);

  useEffect(() => {
    if (isOpen && !clientId) {
      loadClients();
    }
  }, [isOpen, clientId]);

  useEffect(() => {
    if (!isOpen) {
      setAnalysisResult(null);
    }
  }, [isOpen]);

  const loadClients = async () => {
    setLoadingClients(true);
    setClientLoadError(false);
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(Array.isArray(data) ? data : []);
      } else {
        setClientLoadError(true);
      }
    } catch {
      setClientLoadError(true);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchVideoMetadata = async (url: string) => {
    if (!url || !url.includes('http')) return;

    setLoadingMetadata(true);
    try {
      const response = await fetch('/api/video-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          client_id: clientId || formData.client_id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const metadata = data.metadata;

        setFormData(prev => ({
          ...prev,
          platform: metadata.platform || prev.platform,
          duration_sec: metadata.duration_sec || prev.duration_sec,
          published_at: metadata.published_at || prev.published_at,
          captions: metadata.captions || prev.captions,
          hashtags: metadata.hashtags || prev.hashtags,
          metrics: {
            views: metadata.metrics?.views || prev.metrics.views,
            likes: metadata.metrics?.likes || prev.metrics.likes,
            comments: metadata.metrics?.comments || prev.metrics.comments,
            shares: metadata.metrics?.shares || prev.metrics.shares,
            saves: metadata.metrics?.saves || prev.metrics.saves,
          }
        }));

        if (data.full_analysis) {
          alert('Video tamamen analiz edildi. Sonuc detayi icin raporu kontrol edin.');
          onSuccess?.();
          onClose();
          return;
        } else if (data.needs_manual_metrics) {
          alert('Video URL analizi tamamlandi. Performans metriklerini manuel girin.');
        } else {
          alert('Video bilgileri otomatik olarak dolduruldu.');
        }
      } else {
        console.error('Failed to fetch metadata:', response.status);
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleHashtagAdd = () => {
    if (hashtagInput.trim() && !formData.hashtags.includes(hashtagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, hashtagInput.trim()]
      }));
      setHashtagInput('');
    }
  };

  const handleHashtagRemove = (hashtag: string) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(h => h !== hashtag)
    }));
  };

  const handleSourceChange = (source: VideoSource) => {
    setVideoSource(source);
    if (source === 'file') {
      setFormData(prev => ({ ...prev, url: '' }));
    } else {
      setVideoFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);

    try {
      let response: Response;

      if (videoSource === 'file') {
        if (!videoFile) {
          throw new Error('Lutfen bir video dosyasi secin');
        }

        const payload = new FormData();
        payload.append('file', videoFile);
        payload.append('client_id', clientId || formData.client_id);
        payload.append('platform', formData.platform);
        payload.append('duration_sec', String(formData.duration_sec));

        if (formData.published_at) {
          payload.append('published_at', formData.published_at);
        }
        if (formData.captions) {
          payload.append('captions', formData.captions);
        }
        if (formData.hashtags.length > 0) {
          payload.append('hashtags', JSON.stringify(formData.hashtags));
        }
        if (formData.metrics.views > 0) {
          payload.append('metrics', JSON.stringify(formData.metrics));
        }

        response = await fetch('/api/video-analysis', {
          method: 'POST',
          body: payload,
        });
      } else {
        response = await fetch('/api/video-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            metrics: formData.metrics.views > 0 ? formData.metrics : undefined
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Video analizi basarisiz');
      }

      const result = await response.json();
      setAnalysisResult(result);

      setFormData({
        client_id: clientId || '',
        url: '',
        platform: 'instagram',
        duration_sec: 30,
        captions: '',
        hashtags: [],
        published_at: '',
        metrics: {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0
        }
      });
      setVideoFile(null);

    } catch (error: any) {
      console.error('Video analysis error:', error);
      alert(error.message || 'Video analizi sirasinda hata olustu');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  if (!isOpen) return null;

  const clientValue = clientId || formData.client_id;
  const submitDisabled = loading || !clientValue || (videoSource === 'url' ? !formData.url : !videoFile);

  const closeReport = () => {
    setAnalysisResult(null);
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Video Analizi</h2>
            {!loading && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="font-medium text-zinc-800">Video analiz ediliyor...</p>
                <p className="text-sm text-zinc-500 mt-1">Gemini transkripsiyon + AI analiz çalışıyor. 1–3 dakika sürebilir.</p>
              </div>
            </div>
          ) : analysisResult ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
                Video analizi tamamlandi. Rapor asagida.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-gray-500">Hook Skoru</div>
                  <div className="text-2xl font-bold">{analysisResult.scores?.hook_score ?? 0}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-gray-500">Tempo Skoru</div>
                  <div className="text-2xl font-bold">{analysisResult.scores?.tempo_score ?? 0}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-gray-500">Netlik Skoru</div>
                  <div className="text-2xl font-bold">{analysisResult.scores?.clarity_score ?? 0}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-gray-500">CTA Skoru</div>
                  <div className="text-2xl font-bold">{analysisResult.scores?.cta_score ?? 0}</div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-sm text-gray-500 mb-2">AI Yorumu</div>
                <div className="text-gray-900">{analysisResult.scores?.ai_comment || 'Yorum yok'}</div>
              </div>

              {(analysisResult.video?.ai_analysis?.video_category || analysisResult.video?.ai_analysis?.category_specific_tip) && (
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-gray-500 mb-2">Kategori</div>
                  <div className="text-gray-900">
                    {analysisResult.video?.ai_analysis?.video_category || 'Bilinmiyor'}
                  </div>
                  {analysisResult.video?.ai_analysis?.category_specific_tip && (
                    <div className="mt-2 text-sm text-gray-700">
                      Ozel Ipucu: {analysisResult.video.ai_analysis.category_specific_tip}
                    </div>
                  )}
                </div>
              )}

              {analysisResult.video?.ai_analysis?.full_script_plan?.length > 0 && (
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-gray-500 mb-3">Tam Cekim Senaryosu</div>
                  <div className="space-y-4">
                    {analysisResult.video.ai_analysis.full_script_plan.map((step: any, index: number) => (
                      <div key={index} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{step.section}</span>
                          <span>{step.timing}</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-900">
                          <div className="font-semibold">Reji</div>
                          <div>{step.visual_action}</div>
                        </div>
                        <div className="mt-2 text-sm text-gray-900">
                          <div className="font-semibold">Metin</div>
                          <div>{step.script_dialogue}</div>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          Psikoloji: {step.psychology_note}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border p-4">
                <div className="text-sm text-gray-500 mb-2">Temel Hatalar</div>
                {analysisResult.scores?.main_errors?.length ? (
                  <ul className="list-disc pl-5 text-gray-900">
                    {analysisResult.scores.main_errors.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">Yok</div>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-sm text-gray-500 mb-2">Iyilestirme Onerileri</div>
                {analysisResult.analysis_details?.improvement_suggestions?.length ? (
                  <ul className="list-disc pl-5 text-gray-900">
                    {analysisResult.analysis_details.improvement_suggestions.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">Yok</div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                {analysisResult?.video?.id && (
                  <Link
                    href={`/videos/${analysisResult.video.id}`}
                    onClick={closeReport}
                    className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 text-center text-sm font-medium"
                  >
                    Tam Rapor &amp; PDF
                  </Link>
                )}
                <button
                  type="button"
                  onClick={closeReport}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Kapat
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Müşteri seçimi */}
              {!clientId && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Müşteri</label>
                  {clientLoadError ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-red-600">Yüklenemedi</span>
                      <button type="button" onClick={loadClients} className="text-sm text-blue-600 hover:underline">
                        Tekrar dene
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formData.client_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={loadingClients}
                    >
                      <option value="">{loadingClients ? 'Yükleniyor...' : 'Müşteri seçin'}</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Video kaynağı */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Video</label>
                <div className="flex gap-3 mb-2">
                  {(['url', 'file'] as const).map((src) => (
                    <label key={src} className="flex items-center gap-1.5 text-sm text-zinc-600 cursor-pointer">
                      <input type="radio" name="videoSource" value={src} checked={videoSource === src} onChange={() => handleSourceChange(src)} />
                      {src === 'url' ? 'URL' : 'Dosya yükle'}
                    </label>
                  ))}
                </div>

                {videoSource === 'url' ? (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://instagram.com/p/..."
                    />
                    <button
                      type="button"
                      onClick={() => fetchVideoMetadata(formData.url)}
                      disabled={!formData.url || loadingMetadata}
                      className="px-3 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMetadata ? '...' : 'Otomatik doldur'}
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="w-full text-sm"
                  />
                )}
              </div>

              {/* Platform + Süre */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Platform</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Süre (sn)</label>
                  <input
                    type="number"
                    value={formData.duration_sec}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_sec: parseInt(e.target.value) || 30 }))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1" max="3600"
                  />
                </div>
              </div>

              {/* Opsiyonel detaylar toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(p => !p)}
                className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
              >
                {showAdvanced ? '▼' : '▶'} Opsiyonel detaylar (caption, hashtag, metrik)
              </button>

              {showAdvanced && (
                <div className="space-y-4 border border-zinc-100 rounded-lg p-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Yayın Tarihi</label>
                    <input
                      type="datetime-local"
                      value={formData.published_at}
                      onChange={(e) => setFormData(prev => ({ ...prev, published_at: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Açıklama / Caption</label>
                    <textarea
                      value={formData.captions}
                      onChange={(e) => setFormData(prev => ({ ...prev, captions: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Video açıklaması..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Hashtag'ler</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={hashtagInput}
                        onChange={(e) => setHashtagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleHashtagAdd())}
                        className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#hashtag ekle"
                      />
                      <button type="button" onClick={handleHashtagAdd} className="px-3 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm hover:bg-zinc-200">
                        Ekle
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.hashtags.map((hashtag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs">
                          #{hashtag}
                          <button type="button" onClick={() => handleHashtagRemove(hashtag)} className="ml-1.5 text-blue-400 hover:text-blue-700">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Performans Metrikleri</label>
                    <div className="grid grid-cols-5 gap-2">
                      {(['views', 'likes', 'comments', 'shares', 'saves'] as const).map((metric) => (
                        <div key={metric}>
                          <label className="block text-xs text-zinc-500 mb-1 capitalize">{metric === 'views' ? 'Görüntü' : metric === 'likes' ? 'Beğeni' : metric === 'comments' ? 'Yorum' : metric === 'shares' ? 'Paylaşım' : 'Kaydet'}</label>
                          <input
                            type="number"
                            value={formData.metrics[metric]}
                            onChange={(e) => setFormData(prev => ({ ...prev, metrics: { ...prev.metrics, [metric]: parseInt(e.target.value) || 0 } }))}
                            className="w-full px-2 py-1.5 border border-zinc-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-zinc-200 text-zinc-700 rounded-lg text-sm hover:bg-zinc-50">
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitDisabled}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Analiz ediliyor...' : 'Analizi Başlat'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
