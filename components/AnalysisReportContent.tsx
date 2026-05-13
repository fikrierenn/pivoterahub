'use client';

import { useEffect, useMemo, useState } from 'react';
import { FullScriptTimeline } from '@/components/FullScriptTimeline';
import { ScoreGauge } from '@/components/ScoreGauge';

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

type CategoryStyle = {
  label: string;
  badgeClass: string;
  panelClass: string;
  textClass: string;
};

type AnalysisReportContentProps = {
  analysis: any;
  score?: VideoScore;
  stats?: VideoStats;
  categoryStyle: CategoryStyle;
  formatDate: (value: string | null) => string;
  videoMeta: {
    published_at: string | null;
    hashtags: string[];
    url: string;
    captions: string | null;
    transcript: string | null;
  };
  printId?: string;
};

function AnalysisCard({ title, content, subContent, tone }: { title: string; content: string; subContent?: string; tone?: string }) {
  const toneMap: Record<string, { border: string; text: string }> = {
    blue: { border: 'border-blue-100', text: 'text-blue-800' },
    indigo: { border: 'border-indigo-100', text: 'text-indigo-800' },
    purple: { border: 'border-purple-100', text: 'text-purple-800' },
    sky: { border: 'border-sky-100', text: 'text-sky-800' },
    teal: { border: 'border-teal-100', text: 'text-teal-800' },
    orange: { border: 'border-orange-100', text: 'text-orange-800' },
  };
  const toneStyle = toneMap[tone || 'blue'] || toneMap.blue;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm report-card">
      <div className={`text-sm font-bold mb-3 ${toneStyle.text}`}>{title}</div>
      <p className="text-slate-600 text-sm leading-relaxed">{content}</p>
      {subContent && (
        <div className={`mt-3 pt-2 border-t ${toneStyle.border} text-xs font-medium ${toneStyle.text}`}>
          {subContent}
        </div>
      )}
    </div>
  );
}

export function AnalysisReportContent({
  analysis,
  score,
  stats,
  categoryStyle,
  formatDate,
  videoMeta,
  printId,
}: AnalysisReportContentProps) {
  const scoreValue = (value: any) => (typeof value === 'number' ? value : 0);
  const variations = useMemo(() => {
    if (Array.isArray(analysis?.full_script_plan_variations) && analysis.full_script_plan_variations.length > 0) {
      return analysis.full_script_plan_variations;
    }
    if (Array.isArray(analysis?.full_script_plan) && analysis.full_script_plan.length > 0) {
      return [analysis.full_script_plan];
    }
    return [];
  }, [analysis]);
  const [activePlanIndex, setActivePlanIndex] = useState(0);

  useEffect(() => {
    if (activePlanIndex > variations.length - 1) {
      setActivePlanIndex(0);
    }
  }, [variations, activePlanIndex]);

  return (
    <div {...(printId ? { id: printId } : {})} className="space-y-6 bg-slate-50 p-6 rounded-3xl">
      <div className={`rounded-xl border p-4 ${categoryStyle.panelClass} report-card`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${categoryStyle.badgeClass}`}>
                {categoryStyle.label}
              </span>
              <span className={`text-sm font-bold ${categoryStyle.textClass}`}>Tespit Edilen Video Turu</span>
            </div>
            <p className={`text-sm leading-relaxed ${categoryStyle.textClass}`}>
              <span className="font-semibold">Uzman Ipucu:</span> {analysis?.category_specific_tip || 'Yok'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 flex flex-col items-center">
            <span className="text-xs text-slate-500 font-medium uppercase">Basari Ihtimali</span>
            <span className="text-2xl font-black text-slate-800">%{analysis?.success_probability ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 report-card">
        <ScoreGauge score={scoreValue(analysis?.hook_score ?? score?.hook_score)} title="Kanca" icon="H" />
        <ScoreGauge score={scoreValue(analysis?.tempo_score ?? score?.tempo_score)} title="Tempo" icon="T" />
        <ScoreGauge score={scoreValue(analysis?.clarity_score ?? score?.clarity_score)} title="Netlik" icon="N" />
        <ScoreGauge score={scoreValue(analysis?.visual_score ?? score?.visual_score)} title="Gorsel" icon="G" />
        <ScoreGauge score={scoreValue(analysis?.cta_score ?? score?.cta_score)} title="CTA" icon="C" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden report-card">
        <div className="bg-slate-800 px-4 py-3">
          <h3 className="text-white font-bold text-sm">AI Yonetici Ozeti</h3>
        </div>
        <div className="p-5">
          <p className="text-slate-700 text-lg font-medium leading-relaxed italic border-l-4 border-slate-800 pl-4">
            "{analysis?.ai_comment || score?.ai_comment || 'Yorum yok'}"
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 report-card">
        <div className="space-y-6">
          <AnalysisCard title="Kanca Analizi" content={analysis?.hook_analysis || 'Yok'} tone="blue" />
          <AnalysisCard title="Tempo Analizi" content={analysis?.tempo_analysis || 'Yok'} tone="indigo" />
          <AnalysisCard
            title="Pazarlama Gucu"
            content={analysis?.marketing_power?.analysis || 'Yok'}
            subContent={analysis?.funnel_stage ? `Huni Asamasi: ${analysis.funnel_stage}` : undefined}
            tone="purple"
          />
        </div>
        <div className="space-y-6">
          <AnalysisCard title="Netlik Analizi" content={analysis?.clarity_analysis || 'Yok'} tone="sky" />
          <AnalysisCard
            title="Gorsel ve Vucut Dili"
            content={analysis?.visual_analysis || 'Yok'}
            subContent={analysis?.body_language?.analysis || undefined}
            tone="teal"
          />
          <AnalysisCard title="CTA Analizi" content={analysis?.cta_analysis || 'Yok'} tone="orange" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 report-card">
        <div className="bg-red-50 rounded-xl border border-red-100 overflow-hidden">
          <div className="bg-red-100 px-4 py-3 border-b border-red-200 text-red-800 font-bold">
            Kritik Hatalar
          </div>
          <ul className="p-4 space-y-3">
            {(analysis?.main_errors || []).map((item: string, i: number) => (
              <li key={i} className="text-sm text-red-900 bg-white p-3 rounded-lg shadow-sm border border-red-100">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-emerald-50 rounded-xl border border-emerald-100 overflow-hidden">
          <div className="bg-emerald-100 px-4 py-3 border-b border-emerald-200 text-emerald-800 font-bold">
            Iyilestirme Firsatlari
          </div>
          <ul className="p-4 space-y-3">
            {(analysis?.improvement_suggestions || []).map((item: string, i: number) => (
              <li key={i} className="text-sm text-emerald-900 bg-white p-3 rounded-lg shadow-sm border border-emerald-100">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(analysis?.quick_actions?.length || analysis?.hook_variations?.length) && (
        <div className="grid md:grid-cols-2 gap-6 report-card">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-3 font-bold text-sm">
              Hemen Yap (3 Adim)
            </div>
            <ol className="p-4 space-y-3 list-decimal list-inside">
              {(analysis?.quick_actions || []).slice(0, 3).map((item: string, i: number) => (
                <li key={i} className="text-sm text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-3">
                  {item}
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-3 font-bold text-sm">
              A/B Hook Alternatifleri
            </div>
            <div className="p-4 space-y-3">
              {(analysis?.hook_variations || []).slice(0, 3).map((item: string, i: number) => (
                <div key={i} className="text-sm text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-3">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {variations.length > 0 && (
        <div className="space-y-6 report-card">
          {variations.slice(0, 3).map((plan: any[], index: number) => (
            <div key={index} className="space-y-3">
              <div className="text-sm font-bold text-slate-700">
                Reji ve Cekim Senaryosu - Alternatif {index + 1}
              </div>
              <FullScriptTimeline scriptPlan={plan} />
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 report-card">
        <h3 className="text-slate-800 font-bold text-sm mb-4">Paylasim ve Optimizasyon</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Baslik Fikirleri</h4>
            <ul className="space-y-2">
              {(analysis?.optimization_recommendations?.title_ideas || []).map((item: string, i: number) => (
                <li key={i} className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Aciklama Metni</h4>
            <ul className="space-y-2">
              {(analysis?.optimization_recommendations?.caption_ideas || []).map((item: string, i: number) => (
                <li key={i} className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Hashtag</h4>
            <div className="flex flex-wrap gap-2">
              {(analysis?.optimization_recommendations?.hashtags || []).map((item: string, i: number) => (
                <span key={i} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100 font-medium">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {stats && (
        <div className="bg-white rounded-lg shadow p-6 report-card">
          <div className="text-sm font-semibold text-gray-900 mb-4">Performans Metrikleri</div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Izlenme</div>
              <div className="text-lg font-semibold">{stats.views}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Begeni</div>
              <div className="text-lg font-semibold">{stats.likes}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Yorum</div>
              <div className="text-lg font-semibold">{stats.comments}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Paylasim</div>
              <div className="text-lg font-semibold">{stats.shares}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Kaydetme</div>
              <div className="text-lg font-semibold">{stats.saves}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Etkilesim</div>
              <div className="text-lg font-semibold">
                {stats.engagement_rate?.toFixed ? stats.engagement_rate.toFixed(2) : stats.engagement_rate}
              </div>
            </div>
          </div>
        </div>
      )}

      {videoMeta.transcript && (
        <div className="bg-white rounded-lg shadow p-6 report-card">
          <div className="text-sm font-semibold text-gray-900 mb-4">Transkript</div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">{videoMeta.transcript}</div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 report-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500">Yayin Tarihi</div>
            <div className="text-sm text-gray-900">{formatDate(videoMeta.published_at)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Hashtag</div>
            <div className="text-sm text-gray-900">
              {videoMeta.hashtags?.length ? `#${videoMeta.hashtags.join(' #')}` : 'Hashtag yok'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">URL</div>
            <div className="text-sm text-blue-600 break-all">{videoMeta.url}</div>
          </div>
        </div>
        {videoMeta.captions && (
          <div className="mt-4 text-gray-700">{videoMeta.captions}</div>
        )}
      </div>
    </div>
  );
}
