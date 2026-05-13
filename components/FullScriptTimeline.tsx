'use client';

'use client';

import React from 'react';

type ScriptStep = {
  section: string;
  timing: string;
  visual_action: string;
  overlay_text?: string;
  scene_description?: string;
  emotion_tone?: string;
  tts_scene?: {
    text?: string;
    style_instruction?: string;
    voice_name?: string;
  };
  video_generation?: {
    prompt?: string;
    negative_prompt?: string;
    aspect_ratio?: string;
  };
  script_dialogue: string;
  psychology_note: string;
  key_points?: string[];
};

function getSectionStyle(section: string) {
  const value = section.toUpperCase();
  if (value.includes('GIRIS') || value.includes('HOOK')) {
    return {
      badge: 'KANCA',
      border: 'border-blue-400',
      bg: 'bg-blue-50',
      title: 'text-blue-900',
      accent: 'ring-2 ring-blue-200',
    };
  }
  if (value.includes('GELISME') || value.includes('BODY')) {
    return {
      badge: 'ICERIK',
      border: 'border-slate-300',
      bg: 'bg-white',
      title: 'text-slate-800',
    };
  }
  if (value.includes('SONUC') || value.includes('CTA')) {
    return {
      badge: 'SATIS',
      border: 'border-orange-400',
      bg: 'bg-orange-50',
      title: 'text-orange-900',
      accent: 'ring-2 ring-orange-200',
    };
  }
    return {
      badge: 'BOLUM',
      border: 'border-slate-200',
      bg: 'bg-slate-50',
      title: 'text-slate-700',
      accent: '',
    };
}

export function FullScriptTimeline({ scriptPlan }: { scriptPlan: ScriptStep[] }) {
  if (!scriptPlan || scriptPlan.length === 0) return null;

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold tracking-wide">REJI VE CEKIM SENARYOSU</h3>
          <p className="text-xs text-slate-400">Yapay zeka tarafindan optimize edilmis akisim.</p>
        </div>
        <div className="text-xs bg-slate-800 px-3 py-1 rounded-full text-yellow-300 font-mono border border-slate-700">
          Director Cut
        </div>
      </div>

      <div className="p-6 bg-slate-50 relative">
        <div className="absolute left-[3.25rem] top-8 bottom-8 w-0.5 bg-slate-200 md:block hidden"></div>

        <div className="space-y-8">
          {scriptPlan.map((step, index) => {
            const style = getSectionStyle(step.section);
            return (
              <div key={index} className="timeline-item relative flex flex-col md:flex-row gap-5 z-10">
                <div className="flex md:flex-col items-center md:w-24 shrink-0 gap-2 relative">
                  <span className="text-[10px] font-black text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md font-mono w-full text-center">
                    {step.timing}
                  </span>
                  <div className={`w-12 h-12 rounded-full border-4 ${style.border} bg-white shadow-md flex items-center justify-center text-xs font-bold text-slate-600`}>
                    {index + 1}
                  </div>
                </div>

                <div className={`flex-1 rounded-xl border shadow-sm p-0 overflow-hidden bg-white ${style.accent || ''}`}>
                  <div className={`px-4 py-2 border-b flex justify-between items-center ${style.bg}`}>
                    <h4 className={`font-bold text-sm uppercase ${style.title} flex items-center gap-2`}>
                      <span className="opacity-70">#{index + 1}</span>
                      {step.section}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 uppercase tracking-wider border border-slate-200">
                      {style.badge}
                    </span>
                  </div>

                  <div className="p-5 grid gap-5">
                    {(step.section.toUpperCase().includes('GIRIS') || step.section.toUpperCase().includes('HOOK')) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-900">
                        <div className="font-semibold">KANCA (Hook)</div>
                        <div className="text-sm text-blue-900/90">
                          {step.overlay_text || step.script_dialogue}
                        </div>
                      </div>
                    )}
                    {(step.section.toUpperCase().includes('SONUC') || step.section.toUpperCase().includes('CTA')) && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm text-orange-900">
                        <div className="font-semibold">CTA (Kapanis)</div>
                        <div className="text-sm text-orange-900/90">
                          {step.overlay_text || step.script_dialogue}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <div className="mt-1 shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold">
                          V
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-indigo-800 uppercase mb-1">Gorsel / Reji</p>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                          {step.visual_action}
                        </p>
                      </div>
                    </div>

                    {(step.overlay_text || step.scene_description || step.emotion_tone) && (
                      <div className="grid md:grid-cols-3 gap-3">
                        {step.overlay_text && (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <p className="text-[11px] font-bold text-slate-600 uppercase mb-1">Overlay Metni</p>
                            <p className="text-sm font-semibold text-slate-800">{step.overlay_text}</p>
                          </div>
                        )}
                        {step.scene_description && (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <p className="text-[11px] font-bold text-slate-600 uppercase mb-1">Sahne Tanimi</p>
                            <p className="text-sm text-slate-700">{step.scene_description}</p>
                          </div>
                        )}
                        {step.emotion_tone && (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <p className="text-[11px] font-bold text-slate-600 uppercase mb-1">Duygu Tonu</p>
                            <p className="text-sm text-slate-700">{step.emotion_tone}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <div className="mt-1 shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-xs font-bold">
                          S
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-emerald-800 uppercase mb-1">Konusmaci Metni</p>
                        <div className="text-base text-slate-800 font-serif italic border-l-4 border-emerald-400 pl-3 py-1">
                          "{step.script_dialogue}"
                        </div>
                        {step.key_points && step.key_points.length > 0 && (
                          <div className="mt-4 bg-amber-50 rounded-lg p-3 border-l-4 border-amber-400 shadow-sm">
                            <p className="text-[11px] font-black text-amber-900 uppercase mb-2 tracking-widest">
                              BU BOLUMDEKI SATIS NOKTALARI (KRITIK):
                            </p>
                            <ul className="space-y-1">
                              {step.key_points.map((point, i) => (
                                <li key={i} className="text-sm text-slate-800 font-bold flex items-center gap-2">
                                  <span className="text-amber-600">*</span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-1 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500">
                        <span className="font-bold text-amber-600">Neden calisir:</span> {step.psychology_note}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}






