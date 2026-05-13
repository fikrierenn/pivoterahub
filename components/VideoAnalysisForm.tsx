'use client';

import { useState, useEffect, useRef } from 'react';

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
    try {
      const response = await fetch('/api/clients');

      if (response.ok) {
        const data = await response.json();
        setClients(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Musteri listesi yuklenemedi: ${response.status} - ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      alert('Musteri listesi yuklenirken hata olustu: ' + error);
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
      console.log('Video analysis result:', result);
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

      onSuccess?.();

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
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Video Analizi</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {analysisResult ? (
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
            <form onSubmit={handleSubmit} className="space-y-6">
            {!clientId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Musteri Secin
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loadingClients}
                >
                  <option value="">
                    {loadingClients ? 'Yukleniyor...' : `Musteri secin (${clients.length} musteri)`}
                  </option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Kaynak Tipi
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="videoSource"
                    value="url"
                    checked={videoSource === 'url'}
                    onChange={() => handleSourceChange('url')}
                  />
                  URL
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="videoSource"
                    value="file"
                    checked={videoSource === 'file'}
                    onChange={() => handleSourceChange('file')}
                  />
                  Lokal Dosya
                </label>
              </div>
            </div>

            {videoSource === 'url' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://instagram.com/p/..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => fetchVideoMetadata(formData.url)}
                    disabled={!formData.url || loadingMetadata}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingMetadata ? 'Yukleniyor...' : 'Otomatik Doldur'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  URL girdikten sonra "Otomatik Doldur" ile video bilgilerini cekebilirsiniz
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Dosyasi
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Buyuk dosyalar yuklenirken zaman alabilir
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sure (saniye)
                </label>
                <input
                  type="number"
                  value={formData.duration_sec}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_sec: parseInt(e.target.value) || 30 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="3600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yayin Tarihi
              </label>
              <input
                type="datetime-local"
                value={formData.published_at}
                onChange={(e) => setFormData(prev => ({ ...prev, published_at: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aciklama/Caption
              </label>
              <textarea
                value={formData.captions}
                onChange={(e) => setFormData(prev => ({ ...prev, captions: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Video aciklamasi..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hashtag'ler
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleHashtagAdd())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#hashtag ekle"
                />
                <button
                  type="button"
                  onClick={handleHashtagAdd}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Ekle
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.hashtags.map((hashtag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    #{hashtag}
                    <button
                      type="button"
                      onClick={() => handleHashtagRemove(hashtag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Performans Metrikleri (Opsiyonel)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Izlenme</label>
                  <input
                    type="number"
                    value={formData.metrics.views}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      metrics: { ...prev.metrics, views: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Begeni</label>
                  <input
                    type="number"
                    value={formData.metrics.likes}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      metrics: { ...prev.metrics, likes: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Yorum</label>
                  <input
                    type="number"
                    value={formData.metrics.comments}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      metrics: { ...prev.metrics, comments: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Paylasim</label>
                  <input
                    type="number"
                    value={formData.metrics.shares}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      metrics: { ...prev.metrics, shares: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Kaydetme</label>
                  <input
                    type="number"
                    value={formData.metrics.saves}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      metrics: { ...prev.metrics, saves: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Iptal
              </button>
              <button
                type="submit"
                disabled={submitDisabled}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Analiz Ediliyor...' : 'Analizi Baslat'}
              </button>
            </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
