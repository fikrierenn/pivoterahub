'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import '../report-pdf.css';
import { AnalysisReportContent } from '@/components/AnalysisReportContent';
import { PrintPreviewModal } from '@/components/PrintPreviewModal';
import { DirectorPanel } from '@/components/DirectorPanel';

type VideoScore = {
  hook_score: number;
  tempo_score: number;
  clarity_score: number;
  cta_score: number;
  visual_score: number;
  funnel_stage: string;
  main_errors: string[];
  ai_comment: string;
};

type VideoStats = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement_rate: number;
};

type VideoDetail = {
  id: string;
  client_id: string;
  platform: string;
  url: string;
  published_at: string | null;
  duration_sec: number | null;
  captions: string | null;
  hashtags: string[];
  transcript: string | null;
  ai_analysis?: any | null;
  video_scores?: VideoScore[] | null;
  video_stats?: VideoStats[] | null;
};

type CategoryStyle = {
  label: string;
  badgeClass: string;
  panelClass: string;
  textClass: string;
};

const categoryStyles: Record<string, CategoryStyle> = {
  listing: {
    label: 'Portfoy / Ilan',
    badgeClass: 'bg-indigo-600 text-white',
    panelClass: 'bg-indigo-50 border-indigo-100',
    textClass: 'text-indigo-900',
  },
  educational: {
    label: 'Egitim / Bilgi',
    badgeClass: 'bg-sky-600 text-white',
    panelClass: 'bg-sky-50 border-sky-100',
    textClass: 'text-sky-900',
  },
  promotional: {
    label: 'Kampanya / Satis',
    badgeClass: 'bg-orange-600 text-white',
    panelClass: 'bg-orange-50 border-orange-100',
    textClass: 'text-orange-900',
  },
  personal_brand: {
    label: 'Kisisel Marka',
    badgeClass: 'bg-purple-600 text-white',
    panelClass: 'bg-purple-50 border-purple-100',
    textClass: 'text-purple-900',
  },
  viral_trend: {
    label: 'Trend / Viral',
    badgeClass: 'bg-slate-700 text-white',
    panelClass: 'bg-slate-50 border-slate-200',
    textClass: 'text-slate-900',
  },
  default: {
    label: 'Kategori',
    badgeClass: 'bg-slate-700 text-white',
    panelClass: 'bg-slate-50 border-slate-200',
    textClass: 'text-slate-900',
  },
};

export default function VideoDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [isProducing, setIsProducing] = useState(false);
  const [productionStatus, setProductionStatus] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [audioTimeline, setAudioTimeline] = useState<Array<{ section: string; start: number; length: number; text: string }>>([]);
  const [renderId, setRenderId] = useState<string | null>(null);
  const [renderUrl, setRenderUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [regeneratingPlans, setRegeneratingPlans] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/videos/${id}`);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Video detayi alinamadi');
        }
        const data = await response.json();
        setVideo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Video detayi alinamadi');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    if (!renderId) return;

    let active = true;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/video-production/render-status?renderId=${encodeURIComponent(renderId)}&videoId=${video?.id || ''}`
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || 'Render durumu alinamadi.');
        }

        if (data.newRenderId) {
          setRenderId(data.newRenderId);
          setProductionStatus('Veo fast denemesi baslatildi...');
          setRenderError(null);
          return;
        }

        if (!active) return;
        setProductionStatus(`Render durumu: ${data.status || 'bekleniyor'}`);

        if (data.status === 'done') {
          setRenderUrl(data.url || null);
          setRenderError(null);
          clearInterval(interval);
        } else if (data.status === 'failed') {
          setRenderError(data.error || 'Render basarisiz.');
          clearInterval(interval);
        }
      } catch (err) {
        if (!active) return;
        setRenderError(err instanceof Error ? err.message : 'Render durumu alinamadi.');
        clearInterval(interval);
      }
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [renderId]);

  const formatDate = (value: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  const analysis = video?.ai_analysis || null;
  const score = video?.video_scores?.[0];
  const stats = video?.video_stats?.[0];

  const categoryKey = analysis?.video_category || 'default';
  const categoryStyle = categoryStyles[categoryKey] || categoryStyles.default;

  const videoMeta = {
    published_at: video?.published_at || null,
    hashtags: video?.hashtags || [],
    url: video?.url || '',
    captions: video?.captions || null,
    transcript: video?.transcript || null,
  };

  const startProduction = async () => {
    if (!video?.id) return;
    alert('Video/SES uretimi su an pasif. Daha sonra aktif edilecek.');
    return;
    setIsProducing(true);
    setProductionStatus('Seslendirme ve render baslatiliyor...');
    setRenderId(null);
    setRenderUrl(null);
    setRenderError(null);
    setAudioUrls([]);
    setAudioTimeline([]);
    if (!video) return;
    const videoId = (video as { id: string }).id;
    try {
      const renderResponse = await fetch('/api/video-production/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });
      const renderPayload = await renderResponse.json().catch(() => ({}));

      if (!renderResponse.ok) {
        throw new Error(renderPayload.error || 'Render baslatilamadi.');
      }

      setRenderId(renderPayload.renderId || null);
      setAudioUrls(Array.isArray(renderPayload.audioUrls) ? renderPayload.audioUrls : []);
      setAudioTimeline(Array.isArray(renderPayload.audioTimeline) ? renderPayload.audioTimeline : []);
      setProductionStatus('Render basladi, durum izleniyor...');
    } catch (err) {
      const e = err as { message?: string } | Error;
      const message = (e instanceof Error ? e.message : e?.message) ?? 'Uretim baslatilamadi.';
      setRenderError(message);
      setProductionStatus(null);
    } finally {
      setIsProducing(false);
    }
  };

  const regeneratePlans = async () => {
    if (!video?.id) return;
    setRegeneratingPlans(true);
    setPlanError(null);
    try {
      const response = await fetch('/api/video-analysis/regenerate-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Alternatifler uretilemedi.');
      }
      setVideo((prev) => (prev ? { ...prev, ai_analysis: data.analysis } : prev));
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Alternatifler uretilemedi.');
    } finally {
      setRegeneratingPlans(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/videos" className="text-sm text-blue-600 hover:text-blue-700">Geri Don</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Video Raporu</h1>
          <p className="text-gray-600 mt-1">Tam analiz detayi</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button
            type="button"
            onClick={() => setShowPrint(true)}
            className="bg-slate-900 text-white px-6 py-2 rounded-full font-bold hover:bg-slate-800 transition-colors"
          >
            Yazdir / PDF Kaydet
          </button>
          <button
            type="button"
            onClick={regeneratePlans}
            disabled={regeneratingPlans}
            className="bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-full font-bold hover:border-slate-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {regeneratingPlans ? 'Alternatifler uretiliyor...' : 'Alternatifleri Yenile'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-lg shadow p-6 text-gray-600">Rapor yukleniyor...</div>
      )}

      {error && (
        <div className="bg-white rounded-lg shadow p-6 text-red-600">{error}</div>
      )}

      {!loading && !error && video && (
        <div className="max-w-5xl mx-auto">
          {planError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {planError}
            </div>
          )}
          {(productionStatus || renderUrl || renderError || audioUrls.length > 0 || audioTimeline.length > 0) && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              {productionStatus && <div>{productionStatus}</div>}
              {audioUrls.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold">Ses Dosyalari:</div>
                  <ul className="mt-1 space-y-1">
                    {audioUrls.map((url) => (
                      <li key={url}>
                        <a className="text-blue-600 underline" href={url} target="_blank" rel="noreferrer">
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {audioTimeline.length > 0 && (
                <div className="mt-3">
                  <div className="font-semibold">Ses Zaman Cizelgesi:</div>
                  <div className="mt-2 grid gap-2">
                    {audioTimeline.map((item, idx) => (
                      <div key={`${item.section}-${idx}`} className="rounded border border-slate-200 p-2 text-xs">
                        <div className="font-semibold text-slate-700">{item.section}</div>
                        <div className="text-slate-500">Baslangic: {item.start}s • Sure: {item.length}s</div>
                        <div className="text-slate-600 mt-1">{item.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {renderUrl && (
                <div className="mt-2">
                  <span className="font-semibold">Video Hazir:</span>{' '}
                  <a className="text-blue-600 underline" href={renderUrl} target="_blank" rel="noreferrer">
                    MP4 linki
                  </a>
                </div>
              )}
              {renderError && (
                <div className="mt-2 text-red-600">
                  {renderError}
                  {renderError.toLowerCase().includes('internal server') && (
                    <div className="mt-1 text-xs text-red-500">Veo yogun olabilir. 5-10 dk sonra tekrar dene.</div>
                  )}
                  {(renderError.toLowerCase().includes('resource_exhausted') || renderError.includes('429')) && (
                    <div className="mt-1 text-xs text-red-500">Veo kotasi dolu. Biraz bekleyip tekrar dene.</div>
                  )}
                  {(renderError.toLowerCase().includes('permission') || renderError.includes('403')) && (
                    <div className="mt-1 text-xs text-red-500">Veo erisimi bu API key icin acik degil.</div>
                  )}
                  {(renderError.toLowerCase().includes('not found') || renderError.includes('404')) && (
                    <div className="mt-1 text-xs text-red-500">Model bulunamadi. Farkli bir Veo modeli deneyin.</div>
                  )}
                </div>
              )}
            </div>
          )}
          <AnalysisReportContent
            analysis={analysis}
            score={score}
            stats={stats}
            categoryStyle={categoryStyle}
            formatDate={formatDate}
            videoMeta={videoMeta}
          />
          <div className="mt-6 no-print">
            <DirectorPanel
              videoId={video.id}
              transcript={video.transcript}
              cinematicSummary={analysis?.cinematic ? JSON.stringify(analysis.cinematic) : null}
            />
          </div>
        </div>
      )}

      {video && (
        <PrintPreviewModal
          analysis={analysis}
          score={score}
          stats={stats}
          categoryStyle={categoryStyle}
          formatDate={formatDate}
          videoMeta={videoMeta}
          isOpen={showPrint}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}
