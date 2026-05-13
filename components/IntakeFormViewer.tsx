'use client';

import { useState } from 'react';

interface FormAnswer {
  [key: string]: any;
}

interface IntakeFormViewerProps {
  answers: FormAnswer;
  template?: any[];
  onEdit?: () => void;
  showEditButton?: boolean;
}

export default function IntakeFormViewer({
  answers,
  template,
  onEdit,
  showEditButton = true
}: IntakeFormViewerProps) {

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    temel_bilgiler: true,
    hedefler: true,
    rakipler: false,
    notlar: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Default categories if template is not provided
  const defaultCategories = [
    {
      category: 'temel_bilgiler',
      category_label: '📋 Temel Bilgiler',
      fields: ['business_name', 'sector', 'location']
    },
    {
      category: 'hedefler',
      category_label: '🎯 Hedefler',
      fields: ['main_goals']
    },
    {
      category: 'rakipler',
      category_label: '🏆 Rakipler',
      fields: ['competitors', 'competitive_advantage']
    },
    {
      category: 'notlar',
      category_label: '📝 Notlar',
      fields: ['meeting_notes']
    }
  ];

  const categories = template || defaultCategories;

  const getFieldLabel = (key: string): string => {
    const labels: Record<string, string> = {
      business_name: 'İş/Marka Adı',
      sector: 'Sektör',
      location: 'Lokasyon',
      main_goals: 'Ana Hedefler',
      competitors: 'Rakipler',
      competitive_advantage: 'Rekabet Avantajı',
      meeting_notes: 'Görüşme Notları'
    };
    return labels[key] || key;
  };

  const formatValue = (key: string, value: any): string => {
    if (!value) return 'Belirtilmemiş';
    
    if (typeof value === 'string') {
      return value;
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  };

  const getCompetitorCount = (): number => {
    const competitors = answers.competitors || '';
    if (!competitors) return 0;
    return competitors.split(/[,\n]/).filter((c: string) => c.trim()).length;
  };

  const getCompetitorList = (): string[] => {
    const competitors = answers.competitors || '';
    if (!competitors) return [];
    return competitors.split(/[,\n]/).filter((c: string) => c.trim()).map((c: string) => c.trim());
  };

  if (!answers || Object.keys(answers).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Henüz form doldurulmamış</h2>
        <p className="text-gray-600 mb-6">
          Müşteri görüşme formunu doldurmak için aşağıdaki butona tıklayın
        </p>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📋 Görüşme Formu Doldur
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">📋 Müşteri Görüşme Formu</h2>
          <p className="text-gray-600 text-sm mt-1">
            Form doldurulma tarihi: {new Date().toLocaleDateString('tr-TR')}
          </p>
        </div>
        {showEditButton && onEdit && (
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            ✏️ Düzenle
          </button>
        )}
      </div>

      {/* Form Content */}
      <div className="p-6 space-y-6">
        {categories.map((category) => {
          const hasData = category.fields?.some((field: string) => answers[field]);
          
          return (
            <div key={category.category} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection(category.category)}
                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 rounded-t-lg"
              >
                <h3 className="font-semibold text-gray-800">{category.category_label}</h3>
                <div className="flex items-center gap-2">
                  {hasData && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      ✓ Dolduruldu
                    </span>
                  )}
                  <span className="text-gray-500">
                    {expandedSections[category.category] ? '▼' : '▶'}
                  </span>
                </div>
              </button>
              
              {expandedSections[category.category] && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  {category.fields?.map((field: string) => {
                    const value = answers[field];
                    
                    return (
                      <div key={field} className="py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 mb-1">
                              {getFieldLabel(field)}
                            </h4>
                            
                            {field === 'competitors' && value ? (
                              <div>
                                <div className="text-sm text-green-600 mb-2">
                                  ✅ {getCompetitorCount()} rakip tanımlanmış
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {getCompetitorList().map((comp, index) => (
                                    <span 
                                      key={index}
                                      className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                                    >
                                      {comp}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-700 text-sm whitespace-pre-wrap">
                                {formatValue(field, value)}
                              </div>
                            )}
                          </div>
                          
                          {value && (
                            <button
                              onClick={() => navigator.clipboard.writeText(formatValue(field, value))}
                              className="ml-2 text-gray-400 hover:text-gray-600 text-xs"
                              title="Kopyala"
                            >
                              📋
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            Form Durumu: {Object.keys(answers).length > 0 ? (
              <span className="text-green-600 font-medium">✅ Tamamlandı</span>
            ) : (
              <span className="text-red-600 font-medium">❌ Eksik</span>
            )}
          </div>
          <div className="text-gray-500">
            {Object.keys(answers).length} alan dolduruldu
          </div>
        </div>
      </div>
    </div>
  );
}