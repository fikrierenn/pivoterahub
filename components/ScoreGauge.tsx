'use client';

import React from 'react';

interface ScoreGaugeProps {
  score: number;
  title: string;
  icon: string;
}

export function ScoreGauge({ score, title, icon }: ScoreGaugeProps) {
  const getColor = (value: number) => {
    if (value >= 8) {
      return { text: 'text-emerald-600', ring: 'text-emerald-500', bg: 'bg-emerald-50' };
    }
    if (value >= 5) {
      return { text: 'text-amber-500', ring: 'text-amber-400', bg: 'bg-amber-50' };
    }
    return { text: 'text-red-500', ring: 'text-red-400', bg: 'bg-red-50' };
  };

  const colors = getColor(score);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const percentage = (score / 10) * 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="score-gauge bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 ${colors.bg}`}></div>
      <div className="flex items-center gap-2 mb-3 text-slate-600 font-semibold uppercase text-xs tracking-wider">
        <span>{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
          <circle
            className="text-slate-100"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="40"
            cy="40"
          />
          <circle
            className={colors.ring}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="40"
            cy="40"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-2xl font-black ${colors.text}`}>{score}</span>
          <span className="text-[10px] text-slate-400 font-medium">/ 10</span>
        </div>
      </div>
    </div>
  );
}
