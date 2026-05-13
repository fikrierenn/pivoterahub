'use client';

import { SafeHtml } from '@/components/SafeHtml';
import { useState } from 'react';

interface BioAnalysisResultsProps {
  analysis: {
    bio_effectiveness: string;
    missing_elements: string;
    improvement_suggestions: string;
    target_audience_alignment: string;
    conversion_optimization?: string;
    seo_keywords?: string;
  };
  profileStats: {
    followers_count: number;
    following_count: number;
    posts_count: number;
    is_verified: boolean;
    is_private: boolean;
  };
  bioText: string;
}

export default function BioAnalysisResults({ 
  analysis, 
  profileStats, 
  bioText 
}: BioAnalysisResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    effectiveness: true,
    missing: false,
    suggestions: false,
    audience: false,
    conversion: false,
    seo: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const sections = [
    {
      id: 'effectiveness',
      title: '✅ Bio Etkinliği',
      content: analysis.bio_effectiveness,
      color: 'border-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800'
    },
    {
      id: 'missing',
      title: '❌ Eksik Elementler',
      content: analysis.missing_elements,
      color: 'border-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800'
    },
    {
      id: 'suggestions',
      title: '💡 İyileştirme Önerileri',
      content: analysis.improvement_suggestions,
      color: 'border-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800'
    },
    {
      id: 'audience',
      title: '🎯 Hedef Kitle Uyumu',
      content: analysis.target_audience_alignment,
      color: 'border-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-800'
    },
    {
      id: 'conversion',
      title: '💰 Dönüşüm Optimizasyonu',
      content: analysis.conversion_optimization,
      color: 'border-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800'
    },
    {
      id: 'seo',
      title: '🔍 SEO & Anahtar Kelimeler',
      content: analysis.seo_keywords,
      color: 'border-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-800'
    }
  ].filter(section => section.content); // Only show sections with content

  return (
    <div className="space-y-6">
      {/* Profile Stats Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
        <h3 className="font-semibold text-gray-800 mb-4">📊 Profil İstatistikleri</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {profileStats.followers_count.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Takipçi</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {profileStats.following_count.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Takip</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {profileStats.posts_count.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Gönderi</div>
          </div>
          <div className="text-center">
            <div className="text-lg">
              {profileStats.is_verified ? '✅' : '❌'}
              {profileStats.is_private ? '🔒' : '🔓'}
            </div>
            <div className="text-sm text-gray-600">Durum</div>
          </div>
        </div>
        
        {/* Current Bio */}
        <div className="mt-4 p-4 bg-white rounded border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Mevcut Bio:</h4>
            <button
              onClick={() => copyToClipboard(bioText)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              📋 Kopyala
            </button>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{bioText}</p>
        </div>
      </div>

      {/* Analysis Results */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className={`border-l-4 ${section.color} bg-white rounded-lg shadow`}>
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
            >
              <h3 className="font-semibold text-gray-800">{section.title}</h3>
              <span className="text-gray-500">
                {expandedSections[section.id] ? '▼' : '▶'}
              </span>
            </button>
            
            {expandedSections[section.id] && (
              <div className="px-6 pb-4">
                <div className={`p-4 ${section.bgColor} rounded-lg`}>
                  <SafeHtml className={`${section.textColor} leading-relaxed prose prose-sm max-w-none`} html={section.content ?? ''} />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => copyToClipboard((section.content ?? '').replace(/<[^>]*>/g, ''))}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      📋 Metni Kopyala
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          🖨️ Yazdır
        </button>
        <button
          onClick={() => {
            const analysisText = sections.map(s =>
              `${s.title}\n${(s.content ?? '').replace(/<[^>]*>/g, '')}\n\n`
            ).join('');
            copyToClipboard(`Instagram Bio Analizi\n\n${analysisText}`);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          📋 Tüm Analizi Kopyala
        </button>
      </div>
    </div>
  );
}