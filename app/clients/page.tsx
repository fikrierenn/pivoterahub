import Link from 'next/link';
import { supabase } from '@/lib/supabase';

async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }

  return data || [];
}

export default async function ClientsPage() {
  const clients = await getClients();
  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Müşteriler</h1>
          <p className="text-gray-600 mt-1">Tüm müşterilerinizi yönetin</p>
        </div>
        <Link
          href="/clients/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          + Yeni Müşteri
        </Link>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filtrele:</span>
          <button className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200">
            Tümü ({clients.length})
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
            🔵 Lead ({clients.filter((c: any) => c.status === 'lead').length})
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
            🟡 Prospect ({clients.filter((c: any) => c.status === 'prospect').length})
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
            🟢 Active ({clients.filter((c: any) => c.status === 'active').length})
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
            ⚪ Inactive ({clients.filter((c: any) => c.status === 'inactive').length})
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
            ✅ Completed ({clients.filter((c: any) => c.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Clients List or Empty State */}
      {clients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Henüz müşteri yok</h2>
          <p className="text-gray-600 mb-6">
            İlk müşterinizi ekleyerek başlayın
          </p>
          <Link
            href="/clients/new"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            İlk Müşteriyi Ekle
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sektör
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Şehir
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instagram
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kapasite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Konumlandırma
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client: any) => {
                const statusConfig = {
                  lead: { emoji: '🔵', label: 'Lead', color: 'bg-blue-100 text-blue-800' },
                  prospect: { emoji: '🟡', label: 'Prospect', color: 'bg-yellow-100 text-yellow-800' },
                  active: { emoji: '🟢', label: 'Active', color: 'bg-green-100 text-green-800' },
                  inactive: { emoji: '⚪', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
                  completed: { emoji: '✅', label: 'Completed', color: 'bg-purple-100 text-purple-800' },
                };
                const status = statusConfig[client.status as keyof typeof statusConfig] || statusConfig.lead;
                
                return (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${status.color}`}>
                      {status.emoji} {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{client.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {client.sector}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {client.city || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {client.ig_handle || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {client.weekly_content_capacity} video/hafta
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      client.positioning === 'luxury' ? 'bg-purple-100 text-purple-800' :
                      client.positioning === 'economic' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {client.positioning || 'mid'}
                    </span>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
