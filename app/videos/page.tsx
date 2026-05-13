'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import VideoAnalysisForm from '@/components/VideoAnalysisForm';
import { FullScriptTimeline } from '@/components/FullScriptTimeline';

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

type VideoItem = {
  id: string;
  client_id: string;
  platform: string;
  url: string;
  published_at: string | null;
  duration_sec: number | null;
  captions: string | null;
  hashtags: string[];
  transcript: string | null;
  ai_analysis?: Record<string, unknown> | null;
  video_scores?: VideoScore[] | null;
  video_stats?: VideoStats[] | null;
};

const categoryLabels: Record<string, string> = {
  listing: 'Portfoy / Ilan',
  educational: 'Egitim / Bilgi',
  promotional: 'Kampanya / Satis',
  personal_brand: 'Kisisel Marka',
  viral_trend: 'Trend / Viral',
};

export default function VideosPage() {
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const loadVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/videos');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Video listesi alinamadi');
      }
      const data = await response.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video listesi alinamadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleAnalysisSuccess = () => {
    loadVideos();
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Bu videoyu silmek istiyor musunuz?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/videos?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Video silinemedi');
      }
      loadVideos();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Video silinemedi';
      alert(message);
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  const filteredVideos = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return videos.filter((video) => {
      const score = video.video_scores?.[0];
      const ai = (video.ai_analysis || {}) as any;
      const category = ai.video_category || 'unknown';

      if (platformFilter !== 'all' && video.platform !== platformFilter) {
        return false;
      }

      if (categoryFilter !== 'all' && category !== categoryFilter) {
        return false;
      }

      if (!lower) return true;

      const haystack = [
        video.platform,
        video.captions || '',
        video.transcript || '',
        (score?.ai_comment || ''),
        (ai.ai_comment || ''),
        (ai.video_title || ''),
        (ai.category_specific_tip || ''),
        (video.hashtags || []).join(' '),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(lower);
    });
  }, [videos, query, platformFilter, categoryFilter]);

  const downloadTextReport = (video: VideoItem) => {
    const score = video.video_scores?.[0];
    const ai = (video.ai_analysis || {}) as any;
    const lines: string[] = [];

    lines.push(`VIDEO RAPORU: ${video.id}`);
    lines.push(`Platform: ${video.platform}`);
    lines.push(`Sure: ${video.duration_sec || 0}s`);
    lines.push(`Yayin: ${formatDate(video.published_at)}`);
    lines.push(`Kategori: ${categoryLabels[ai.video_category] || ai.video_category || 'Bilinmiyor'}`);
    lines.push('');

    lines.push('SKORLAR');
    lines.push(`Hook: ${score?.hook_score ?? '-'}`);
    lines.push(`Tempo: ${score?.tempo_score ?? '-'}`);
    lines.push(`Netlik: ${score?.clarity_score ?? '-'}`);
    lines.push(`CTA: ${score?.cta_score ?? '-'}`);
    lines.push(`Gorsel: ${score?.visual_score ?? '-'}`);
    lines.push('');

    lines.push('AI YORUMU');
    lines.push(ai.ai_comment || score?.ai_comment || 'Yorum yok');
    lines.push('');

    lines.push('HATALAR');
    (ai.main_errors || []).forEach((item: string) => lines.push(`- ${item}`));
    lines.push('');

    lines.push('ONERILER');
    (ai.improvement_suggestions || []).forEach((item: string) => lines.push(`- ${item}`));
    lines.push('');

    if (ai.full_script_plan?.length) {
      lines.push('TAM CEKIM SENARYOSU');
      ai.full_script_plan.forEach((step: any, index: number) => {
        lines.push(`${index + 1}. ${step.section} (${step.timing})`);
        lines.push(`Reji: ${step.visual_action}`);
        lines.push(`Metin: ${step.script_dialogue}`);
        lines.push(`Psikoloji: ${step.psychology_note}`);
        if (Array.isArray(step.key_points) && step.key_points.length > 0) {
          lines.push('Kritik Detaylar:');
          step.key_points.forEach((p: string) => lines.push(`* ${p}`));
        }
        lines.push('');
      });
    }

    if (video.transcript) {
      lines.push('TRANSKRIPT');
      lines.push(video.transcript);
      lines.push('');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pivoterahub-rapor-${video.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Videolar</h1>
          <p className="text-gray-600 mt-1">Tum video analizleri</p>
        </div>
        <button
          onClick={() => setShowAnalysisForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Video Analizi Yap
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Musteri, video veya analiz ara..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={platformFilter}
            onChange={(event) => setPlatformFilter(event.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tum Platformlar</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tum Kategoriler</option>
            <option value="listing">Portfoy / Ilan</option>
            <option value="educational">Egitim / Bilgi</option>
            <option value="promotional">Kampanya / Satis</option>
            <option value="personal_brand">Kisisel Marka</option>
            <option value="viral_trend">Trend / Viral</option>
          </select>
          <div className="text-sm text-gray-500 flex items-center">
            {filteredVideos.length} kayit
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-lg shadow p-6 text-gray-600">
          Video listesi yukleniyor...
        </div>
      )}

      {error && (
        <div className="bg-white rounded-lg shadow p-6 text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && filteredVideos.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">VIDEO</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sonuc bulunamadi</h2>
          <p className="text-gray-600 mb-6">
            Filtreleri degistir veya yeni analiz ekle.
          </p>
          <button
            onClick={() => setShowAnalysisForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ilk Video Analizini Yap
          </button>
        </div>
      )}

      {!loading && !error && filteredVideos.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-semibold text-gray-500 uppercase border-b">
            <div className="col-span-3">Video</div>
            <div className="col-span-3">Skorlar</div>
            <div className="col-span-4">Kisa Not</div>
            <div className="col-span-2 text-right">Islem</div>
          </div>
          {filteredVideos.map((video) => {
            const score = video.video_scores?.[0];
            const ai = (video.ai_analysis || {}) as any;
            const shortNote = score?.ai_comment || 'Not yok';
            const title = ai.video_title || `${video.platform.toUpperCase()} - ${video.duration_sec || 0}s`;
            return (
              <div key={video.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b last:border-b-0">
                <div className="col-span-3">
                  <div className="text-sm font-semibold text-gray-900">
                    {title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Yayin: {formatDate(video.published_at)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {video.hashtags?.length ? `#${video.hashtags.join(' #')}` : 'Hashtag yok'}
                  </div>
                  {ai.video_category && (
                    <div className="mt-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 inline-flex px-2 py-0.5 rounded-full">
                      {categoryLabels[ai.video_category] || ai.video_category}
                    </div>
                  )}
                </div>
                <div className="col-span-3">
                  <div className="text-xs text-gray-500">Hook / Tempo / CTA</div>
                  <div className="text-sm text-gray-900 mt-1">
                    {score ? `${score.hook_score} / ${score.tempo_score} / ${score.cta_score}` : '-'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Gorsel / Netlik</div>
                  <div className="text-sm text-gray-900">
                    {score ? `${score.visual_score} / ${score.clarity_score}` : '-'}
                  </div>
                </div>
                <div className="col-span-4">
                  <div className="text-sm text-gray-700 line-clamp-2">{shortNote}</div>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedVideo(video)}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-blue-200 text-blue-700 text-sm font-medium hover:bg-blue-50"
                  >
                    Detay
                  </button>
                  <Link
                    href={`/videos/${video.id}`}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
                  >
                    Sayfa
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(video.id)}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50"
                  >
                    Sil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <div className="text-sm text-gray-500">Video Raporu</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {(selectedVideo.ai_analysis as any)?.video_title || `${selectedVideo.platform.toUpperCase()} - ${selectedVideo.duration_sec || 0}s`}
                  </div>
                </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadTextReport(selectedVideo)}
                  className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
                >
                  Metin Indir
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  className="px-3 py-1.5 rounded-md border border-red-200 text-red-700 text-sm hover:bg-red-50"
                >
                  Kapat
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {(() => {
                const plan = (selectedVideo.ai_analysis as { full_script_plan?: unknown[] } | null | undefined)?.full_script_plan;
                return Array.isArray(plan) && plan.length > 0 ? (
                  <FullScriptTimeline scriptPlan={plan as any[]} />
                ) : null;
              })()}

              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">AI Ozeti</div>
                <div className="text-sm text-gray-700">
                  {(selectedVideo.ai_analysis as { ai_comment?: string } | null | undefined)?.ai_comment || selectedVideo.video_scores?.[0]?.ai_comment || 'Yorum yok'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <VideoAnalysisForm
        isOpen={showAnalysisForm}
        onClose={() => setShowAnalysisForm(false)}
        onSuccess={handleAnalysisSuccess}
      />
    </div>
  );
}
