'use client';

import { useState } from 'react';
import { FullScriptTimeline } from '@/components/FullScriptTimeline';

type LandScriptResult = {
  title: string;
  content_category: string;
  category_specific_tip: string;
  alternatives: any[][];
};

export default function LandScriptPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<LandScriptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/land-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Arazi senaryosu uretilemedi.');
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Arazi senaryosu uretilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Arazi Senaryo Uretici</h1>
        <p className="text-slate-600 mt-2">
          Arazi ozelliklerini serbest metin olarak gir. Sistem 3 alternatif reji/cekim senaryosu uretecek.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <textarea
          className="w-full min-h-[200px] border border-slate-200 rounded-lg p-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="Orn: Edirne Lalapasa, 2618 m2, mustakil tapu, kadastral yol cephe, OSB 10 km, su var, elektrik yakin..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || input.trim().length < 10}
          className="bg-slate-900 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Uretiliyor...' : '3 Alternatif Uret'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-xl p-4">
            <div className="text-xs uppercase tracking-wide text-slate-300">Onerilen Baslik</div>
            <div className="text-lg font-bold">{result.title}</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Tespit Edilen Icerik Turu</div>
            <div className="text-sm font-bold text-slate-800">{result.content_category}</div>
            <div className="text-sm text-slate-600 mt-2">
              <span className="font-semibold">Kategori Ipucu:</span> {result.category_specific_tip}
            </div>
          </div>

          {result.alternatives.slice(0, 3).map((plan, index) => (
            <div key={index} className="space-y-3">
              <div className="text-sm font-bold text-slate-700">
                Alternatif {index + 1}
              </div>
              <FullScriptTimeline scriptPlan={plan} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
