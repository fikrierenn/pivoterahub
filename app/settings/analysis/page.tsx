'use client';

import { useState, useEffect } from 'react';

export default function AnalysisManagementPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const response = await fetch('/api/settings/analysis');
      if (response.ok) {
        const data = await response.json();
        setAnalyses(data);
      }
    } catch (error) {
      console.error('Error loading analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (clientId: string) => {
    if (!confirm('Bu müşterinin tüm analizlerini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/analysis`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Analizler silindi');
        loadAnalyses();
      } else {
        alert('Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Error deleting analysis:', error);
      alert('Hata oluştu');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analiz Yönetimi</h1>
        <p className="text-gray-600 mt-1">Tüm müşteri analizlerini görüntüleyin ve yönetin</p>
      </div>

      {loading ? (
        <div className="text-center">Yükleniyor...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Analiz Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analyses.map((analysis: any) => (
                <tr key={analysis.client_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{analysis.client_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(analysis.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      analysis.has_content ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {analysis.has_content ? '✅ Tamamlandı' : '❌ Boş'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => deleteAnalysis(analysis.client_id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      🗑️ Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}