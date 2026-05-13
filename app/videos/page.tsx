'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { FullScriptTimeline } from '@/components/FullScriptTimeline';

// Dynamic — VideoAnalysisForm 664 satır, sadece modal açılınca lazım.
const VideoAnalysisForm = dynamic(() => import('@/components/VideoAnalysisForm'), {
  ssr: false,
  loading: () => null,
});

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

  type AiAnalysis = {
    video_title?: string;
    video_category?: string;
    ai_comment?: string;
    main_errors?: string[];
    improvement_suggestions?: string[];
    full_script_plan?: ScriptStep[];
    category_specific_tip?: string;
  };

  type ScriptStep = {
    section: string;
    timing: string;
    visual_action: string;
    script_dialogue: string;
    psychology_note: string;
    key_points?: string[];
  };

  const downloadTextReport = (video: VideoItem) => {
    const score = video.video_scores?.[0];
    const ai = (video.ai_analysis || {}) as AiAnalysis;
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
      ai.full_script_plan.forEach((step: ScriptStep, index: number) => {
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
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Videolar</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Tüm video analizleri</p>
        </div>
        <button
          onClick={() => setShowAnalysisForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Video Analizi Yap
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ara..."
            className="px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-300 bg-zinc-50 placeholder-zinc-400"
          />
          <select
            value={platformFilter}
            onChange={(event) => setPlatformFilter(event.target.value)}
            className="px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-300 bg-zinc-50"
          >
            <option value="all">Tüm Platformlar</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-300 bg-zinc-50"
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="listing">Portfoy / İlan</option>
            <option value="educational">Eğitim / Bilgi</option>
            <option value="promotional">Kampanya / Satış</option>
            <option value="personal_brand">Kişisel Marka</option>
            <option value="viral_trend">Trend / Viral</option>
          </select>
          <div className="text-sm text-zinc-500 flex items-center">
            {filteredVideos.length} kayıt
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 text-sm text-zinc-500">
          Yükleniyor...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && filteredVideos.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
          <p className="text-zinc-500 text-sm mb-4">Sonuç bulunamadı</p>
          <button
            onClick={() => setShowAnalysisForm(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            İlk Video Analizini Yap
          </button>
        </div>
      )}

      {!loading && !error && filteredVideos.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-100 bg-zinc-50">
            <div className="col-span-3">Video</div>
            <div className="col-span-3">Skorlar</div>
            <div className="col-span-4">Kısa Not</div>
            <div className="col-span-2 text-right">İşlem</div>
          </div>
          {filteredVideos.map((video) => {
            const score = video.video_scores?.[0];
            const ai = (video.ai_analysis || {}) as any;
            const shortNote = score?.ai_comment || 'Not yok';
            const title = ai.video_title || `${video.platform.toUpperCase()} - ${video.duration_sec || 0}s`;
            return (
              <div key={video.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors">
                <div className="col-span-3">
                  <div className="text-sm font-medium text-zinc-900 line-clamp-1">{title}</div>
                  <div className="text-xs text-zinc-500 mt-1">{formatDate(video.published_at)}</div>
                  {ai.video_category && (
                    <span className="mt-1.5 inline-block text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                      {categoryLabels[ai.video_category] || ai.video_category}
                    </span>
                  )}
                </div>
                <div className="col-span-3">
                  <div className="text-xs text-zinc-500">Hook / Tempo / CTA</div>
                  <div className="text-sm text-zinc-900 mt-0.5 font-medium">
                    {score ? `${score.hook_score} / ${score.tempo_score} / ${score.cta_score}` : '-'}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Görsel / Netlik</div>
                  <div className="text-sm text-zinc-900">
                    {score ? `${score.visual_score} / ${score.clarity_score}` : '-'}
                  </div>
                </div>
                <div className="col-span-4">
                  <div className="text-sm text-zinc-600 line-clamp-2">{shortNote}</div>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVideo(video)}
                    className="px-2.5 py-1.5 rounded border border-zinc-200 text-zinc-700 text-xs hover:bg-zinc-100 transition-colors"
                  >
                    Detay
                  </button>
                  <Link
                    href={`/videos/${video.id}`}
                    className="px-2.5 py-1.5 rounded border border-zinc-200 text-zinc-700 text-xs hover:bg-zinc-100 transition-colors"
                  >
                    Tam Rapor &amp; PDF
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(video.id)}
                    className="px-2.5 py-1.5 rounded border border-red-200 text-red-600 text-xs hover:bg-red-50 transition-colors"
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div>
                <div className="text-xs text-zinc-500">Video Raporu</div>
                <div className="text-base font-semibold text-zinc-900 mt-0.5">
                  {(selectedVideo.ai_analysis as any)?.video_title || `${selectedVideo.platform.toUpperCase()} - ${selectedVideo.duration_sec || 0}s`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadTextReport(selectedVideo)}
                  className="px-3 py-1.5 rounded border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50 transition-colors"
                >
                  Metin İndir
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  className="px-3 py-1.5 rounded border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50 transition-colors"
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

              <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-4">
                <div className="text-sm font-medium text-zinc-900 mb-2">AI Özeti</div>
                <div className="text-sm text-zinc-600">
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
