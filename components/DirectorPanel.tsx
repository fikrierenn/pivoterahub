'use client';

import { useState } from 'react';

type DirectorMode = 'scene_director' | 'script_rewrite' | 'full_rewrite';

interface DirectorPanelProps {
  videoId: string;
  transcript?: string | null;
  cinematicSummary?: string | null;
}

const MODE_LABELS: Record<DirectorMode, string> = {
  scene_director: 'Sahne Yonetmeni',
  script_rewrite: 'Script Guclendir',
  full_rewrite: 'Sifirdan Yaz',
};

const MODE_DESC: Record<DirectorMode, string> = {
  scene_director: 'Sinematik analiz + mevcut script baz alinarak sahne yonetim onerileri',
  script_rewrite: 'Mevcut scripti hook/CTA odakli yeniden yaz',
  full_rewrite: 'Konu ve sektore gore tamamen yeni script',
};

export function DirectorPanel({ videoId: _videoId, transcript, cinematicSummary }: DirectorPanelProps) {
  const [mode, setMode] = useState<DirectorMode>('scene_director');
  const [originalScript, setOriginalScript] = useState(transcript ?? '');
  const [hookGoal, setHookGoal] = useState('');
  const [topic, setTopic] = useState('');
  const [sector, setSector] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setModelUsed(null);

    const body: Record<string, string | undefined> = { mode };
    if (mode === 'scene_director') {
      body.cinematicSummary = cinematicSummary ?? undefined;
      body.originalScript = originalScript || undefined;
    } else if (mode === 'script_rewrite') {
      body.originalScript = originalScript || undefined;
      body.hookGoal = hookGoal || undefined;
    } else {
      body.topic = topic || undefined;
      body.sector = sector || undefined;
      body.targetAudience = targetAudience || undefined;
    }

    try {
      const response = await fetch('/api/director', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error?.message || 'Director AI cagirisi basarisiz');
      }
      setResult(data.data);
      setModelUsed(data.modelUsed ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Director AI</h2>

      {/* Mod Secici */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(MODE_LABELS) as DirectorMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setResult(null); setError(null); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{MODE_DESC[mode]}</p>

      {/* Mod'a Ozgu Inputlar */}
      {mode === 'scene_director' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Mevcut Script (opsiyonel)
          </label>
          <textarea
            className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
            rows={4}
            value={originalScript}
            onChange={(e) => setOriginalScript(e.target.value)}
            placeholder="Transkript otomatik dolduruldu, duzenleyebilirsin..."
          />
        </div>
      )}

      {mode === 'script_rewrite' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mevcut Script</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
              rows={4}
              value={originalScript}
              onChange={(e) => setOriginalScript(e.target.value)}
              placeholder="Guclendirilecek script..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hook Hedefi (opsiyonel)</label>
            <input
              className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
              value={hookGoal}
              onChange={(e) => setHookGoal(e.target.value)}
              placeholder="Ornek: ev satisini vurgula, 3 saniyede dikkat cek"
            />
          </div>
        </div>
      )}

      {mode === 'full_rewrite' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Konu</label>
            <input
              className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ornek: Bahcelievler'de 3+1 daire satisi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sektor</label>
            <input
              className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Ornek: Gayrimenkul, E-ticaret, Saglik"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hedef Kitle (opsiyonel)</label>
            <input
              className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Ornek: 30-45 yas, aile sahibi, Istanbul"
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Uretiliyor...' : 'Uret'}
      </button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {result !== null && (
        <div className="space-y-2">
          {modelUsed && (
            <p className="text-xs text-slate-400">Model: {modelUsed}</p>
          )}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 whitespace-pre-wrap overflow-auto max-h-96">
            {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}
