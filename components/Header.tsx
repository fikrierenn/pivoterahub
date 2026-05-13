'use client';

import { useState } from 'react';
import VideoAnalysisForm from './VideoAnalysisForm';

export default function Header() {
  const [showVideoAnalysisForm, setShowVideoAnalysisForm] = useState(false);
  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 h-16 fixed top-0 right-0 left-64 z-10 shadow-sm">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <input
              type="text"
              placeholder="Müşteri, video veya analiz ara..."
              className="w-full px-4 py-2.5 pl-12 bg-slate-50/50 border border-slate-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white transition-all duration-200 placeholder-slate-400"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <div className="hidden md:flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
              Yeni Müşteri
            </button>
            <button 
              onClick={() => setShowVideoAnalysisForm(true)}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
            >
              Video Analizi
            </button>
          </div>

          {/* Notifications */}
          <button className="relative p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200 group">
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.07 2.82l3.93 3.93-3.93 3.93-3.93-3.93 3.93-3.93z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
              3
            </span>
          </button>

          {/* Status */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 text-emerald-700 rounded-xl">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Sistem Aktif</span>
          </div>

          {/* AI Status */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 text-blue-700 rounded-xl">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">AI Hazır</span>
          </div>
        </div>
      </div>

      {/* Video Analysis Form Modal */}
      <VideoAnalysisForm
        isOpen={showVideoAnalysisForm}
        onClose={() => setShowVideoAnalysisForm(false)}
        onSuccess={() => {
          setShowVideoAnalysisForm(false);
          // Optionally refresh the page or show success message
        }}
      />
    </header>
  );
}
