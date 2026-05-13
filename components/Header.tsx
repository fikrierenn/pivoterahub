'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Search, Plus } from 'lucide-react';

// Dynamic import — VideoAnalysisForm 664 satır + recharts taşıyor, Header global olduğu için
// First Load JS'i şişiriyordu. Modal davranışı — kullanıcı butona basana kadar yüklenmesin.
const VideoAnalysisForm = dynamic(() => import('./VideoAnalysisForm'), {
  ssr: false,
  loading: () => null,
});

export default function Header() {
  const [showVideoAnalysisForm, setShowVideoAnalysisForm] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 h-14 fixed top-0 right-0 left-56 z-10 shadow-sm">
      <div className="h-full px-4 flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Ara..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-100 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white placeholder-slate-400 transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Yeni Müşteri
          </button>
          <button
            onClick={() => setShowVideoAnalysisForm(true)}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
          >
            Video Analizi
          </button>
        </div>
      </div>

      <VideoAnalysisForm
        isOpen={showVideoAnalysisForm}
        onClose={() => setShowVideoAnalysisForm(false)}
        onSuccess={() => setShowVideoAnalysisForm(false)}
      />
    </header>
  );
}
