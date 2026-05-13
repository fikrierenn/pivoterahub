import Link from 'next/link';
import { supabase } from '@/lib/supabase';

async function getTemplates() {
  const { data, error } = await supabase
    .from('intake_form_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching templates:', error);
    return [];
  }

  return data || [];
}

export default async function QuestionsManagementPage() {
  const templates = await getTemplates();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Görüşme Formu Şablonları</h1>
          <p className="text-gray-600 mt-1">Form şablonlarını ve sorularını yönetin</p>
        </div>
        <Link
          href="/settings/questions/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Yeni Şablon
        </Link>
      </div>

      <div className="space-y-6">
        {templates.map((template: any) => {
          const categories = template.questions || [];
          const totalQuestions = categories.reduce(
            (sum: number, cat: any) => sum + (cat.questions?.length || 0),
            0
          );

          return (
            <div key={template.id} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900">{template.name}</h2>
                    {template.is_default && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        Varsayılan
                      </span>
                    )}
                    {!template.is_active && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                        Pasif
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {categories.length} kategori • {totalQuestions} soru
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/settings/questions/${template.id}/edit`}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    Düzenle
                  </Link>
                  <Link
                    href={`/settings/questions/${template.id}/preview`}
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
                  >
                    Önizle
                  </Link>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categories.map((cat: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {cat.category_label}
                      </div>
                      <div className="text-xs text-gray-600">
                        {cat.questions?.length || 0} soru
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Henüz şablon yok</h2>
          <p className="text-gray-600 mb-6">İlk form şablonunu oluşturun</p>
          <Link
            href="/settings/questions/new"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            İlk Şablonu Oluştur
          </Link>
        </div>
      )}
    </div>
  );
}
